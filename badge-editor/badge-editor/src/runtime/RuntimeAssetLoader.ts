import { unzipSync } from 'fflate';
import { getConfig, resolveConfigAssetPath } from '../api/Bridge';
import { isAbsoluteAssetPath } from '../utils/assetPaths';

const textDecoder = new TextDecoder();
const objectUrls: Map<string, string> = new Map();

let assetBundlePromise: Promise<Map<string, Uint8Array> | null> | null = null;
let cleanupRegistered = false;

function normalizeBundleEntryPath(assetPath: string): string {
  return assetPath
    .replace(/\\/g, '/')
    .replace(/^\.\//, '')
    .replace(/^\/+/, '');
}

function shouldUseBundle(assetPath: string): boolean {
  return Boolean(assetPath) && !isAbsoluteAssetPath(assetPath);
}

function registerCleanup(): void {
  if (cleanupRegistered || typeof window === 'undefined') {
    return;
  }

  cleanupRegistered = true;
  window.addEventListener('pagehide', () => {
    for (const url of objectUrls.values()) {
      URL.revokeObjectURL(url);
    }
    objectUrls.clear();
  }, { once: true });
}

function getMimeType(assetPath: string): string {
  const ext = assetPath.split('.').pop()?.toLowerCase();

  switch (ext) {
    case 'png':
      return 'image/png';
    case 'xml':
      return 'application/xml';
    case 'json':
      return 'application/json';
    case 'csv':
      return 'text/csv';
    default:
      return 'application/octet-stream';
  }
}

async function fetchRequiredText(url: string): Promise<string> {
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Failed to load: ${url}`);
  }
  return resp.text();
}

async function loadAssetBundle(): Promise<Map<string, Uint8Array> | null> {
  const bundlePath = getConfig().assetBundlePath;
  if (!bundlePath) {
    return null;
  }

  const bundleUrl = resolveConfigAssetPath(bundlePath);
  const resp = await fetch(bundleUrl);
  if (!resp.ok) {
    throw new Error(`Failed to load asset bundle: ${bundleUrl}`);
  }

  const archive = unzipSync(new Uint8Array(await resp.arrayBuffer()));
  const entries = new Map<string, Uint8Array>();

  for (const [entryPath, data] of Object.entries(archive)) {
    entries.set(normalizeBundleEntryPath(entryPath), data);
  }

  return entries;
}

async function getAssetBundle(): Promise<Map<string, Uint8Array> | null> {
  if (!assetBundlePromise) {
    assetBundlePromise = loadAssetBundle().catch((error) => {
      console.warn('Badge editor: asset bundle unavailable, falling back to individual asset requests.', error);
      return null;
    });
  }

  return assetBundlePromise;
}

async function getBundledAsset(assetPath: string): Promise<Uint8Array | null> {
  if (!shouldUseBundle(assetPath)) {
    return null;
  }

  const bundle = await getAssetBundle();
  if (!bundle) {
    return null;
  }

  return bundle.get(normalizeBundleEntryPath(assetPath)) ?? null;
}

function getObjectUrl(assetPath: string, data: Uint8Array): string {
  const key = normalizeBundleEntryPath(assetPath);
  const existing = objectUrls.get(key);
  if (existing) {
    return existing;
  }

  registerCleanup();
  const blobBytes = new Uint8Array(data.length);
  blobBytes.set(data);
  const url = URL.createObjectURL(new Blob([blobBytes], { type: getMimeType(key) }));
  objectUrls.set(key, url);
  return url;
}

export async function prepareRuntimeAssets(): Promise<void> {
  await getAssetBundle();
}

export async function loadRuntimeTextAsset(assetPath: string): Promise<string> {
  const bundledAsset = await getBundledAsset(assetPath);
  if (bundledAsset) {
    return textDecoder.decode(bundledAsset);
  }

  return fetchRequiredText(resolveConfigAssetPath(assetPath));
}

export async function resolveRuntimeImageSource(assetPath: string): Promise<string> {
  const bundledAsset = await getBundledAsset(assetPath);
  if (bundledAsset) {
    return getObjectUrl(assetPath, bundledAsset);
  }

  return resolveConfigAssetPath(assetPath);
}
