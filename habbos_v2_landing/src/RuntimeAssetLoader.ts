import { unzipSync } from 'fflate';
import { ResolvedConfig } from './config';
import { isAbsoluteAssetPath, resolveAssetPath } from './assetPaths';

const textDecoder = new TextDecoder();

export class RuntimeAssetLoader {
  private readonly objectUrls = new Map<string, string>();
  private readonly bundlePromise: Promise<Map<string, Uint8Array> | null>;
  private cleanupRegistered = false;

  constructor(private readonly config: ResolvedConfig) {
    this.bundlePromise = this.loadAssetBundle().catch((error) => {
      if (this.config.debug) {
        console.warn('[HabbosV2Landing] Asset bundle unavailable, falling back to individual files.', error);
      }
      return null;
    });
  }

  async prepare(): Promise<void> {
    await this.bundlePromise;
  }

  async loadText(assetPath: string): Promise<string> {
    const bundledAsset = await this.getBundledAsset(assetPath);
    if (bundledAsset) {
      return textDecoder.decode(bundledAsset);
    }

    const url = this.resolve(assetPath);
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`Failed to load text asset: ${url}`);
    }

    return resp.text();
  }

  async resolveImageSource(assetPath: string): Promise<string> {
    const bundledAsset = await this.getBundledAsset(assetPath);
    if (bundledAsset) {
      return this.getObjectUrl(assetPath, bundledAsset);
    }

    return this.resolve(assetPath);
  }

  resolve(assetPath: string): string {
    return resolveAssetPath(this.config.assetsPath, assetPath);
  }

  private async loadAssetBundle(): Promise<Map<string, Uint8Array> | null> {
    if (!this.config.assetBundlePath) {
      return null;
    }

    const bundleUrl = this.resolve(this.config.assetBundlePath);
    const resp = await fetch(bundleUrl);
    if (!resp.ok) {
      throw new Error(`Failed to load asset bundle: ${bundleUrl}`);
    }

    const bytes = new Uint8Array(await resp.arrayBuffer());
    if (!looksLikeZip(bytes)) {
      throw new Error(`Asset bundle response was not a zip file: ${bundleUrl}`);
    }

    const archive = unzipSync(bytes);
    const entries = new Map<string, Uint8Array>();

    for (const [entryPath, data] of Object.entries(archive)) {
      entries.set(normalizeBundleEntryPath(entryPath), data);
    }

    return entries;
  }

  private async getBundledAsset(assetPath: string): Promise<Uint8Array | null> {
    if (!shouldUseBundle(assetPath)) {
      return null;
    }

    const bundle = await this.bundlePromise;
    if (!bundle) {
      return null;
    }

    return bundle.get(normalizeBundleEntryPath(assetPath)) ?? null;
  }

  private getObjectUrl(assetPath: string, data: Uint8Array): string {
    const key = normalizeBundleEntryPath(assetPath);
    const existing = this.objectUrls.get(key);
    if (existing) {
      return existing;
    }

    this.registerCleanup();
    const bytes = new Uint8Array(data.length);
    bytes.set(data);
    const url = URL.createObjectURL(new Blob([bytes], { type: getMimeType(key) }));
    this.objectUrls.set(key, url);
    return url;
  }

  private registerCleanup(): void {
    if (this.cleanupRegistered || typeof window === 'undefined') {
      return;
    }

    this.cleanupRegistered = true;
    window.addEventListener('pagehide', () => {
      for (const url of this.objectUrls.values()) {
        URL.revokeObjectURL(url);
      }
      this.objectUrls.clear();
    }, { once: true });
  }
}

function normalizeBundleEntryPath(assetPath: string): string {
  return assetPath
    .replace(/\\/g, '/')
    .replace(/^\.\//, '')
    .replace(/^\/+/, '');
}

function shouldUseBundle(assetPath: string): boolean {
  return Boolean(assetPath) && !isAbsoluteAssetPath(assetPath);
}

function getMimeType(assetPath: string): string {
  const ext = assetPath.split('.').pop()?.toLowerCase();

  switch (ext) {
    case 'gif':
      return 'image/gif';
    case 'png':
      return 'image/png';
    case 'xml':
      return 'application/xml';
    default:
      return 'application/octet-stream';
  }
}

function looksLikeZip(bytes: Uint8Array): boolean {
  return bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b;
}
