import type { AssetBundle } from '../assets/AssetBundle';
import { resolveAssetPath } from '../utils/assetPaths';

export class SpriteLoader {
  private spriteCache: Map<string, HTMLImageElement> = new Map();
  private uiCache: Map<string, HTMLImageElement> = new Map();
  private assetsPath: string;
  private assetBundle: AssetBundle | null = null;

  constructor(assetsPath: string) {
    this.assetsPath = assetsPath;
  }

  setAssetBundle(assetBundle: AssetBundle | null): void {
    this.assetBundle = assetBundle;
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load: ${src}`));
      img.src = src;
    });
  }

  private async loadAssetImage(assetPath: string): Promise<HTMLImageElement> {
    if (this.assetBundle) {
      return this.assetBundle.loadImage(assetPath);
    }

    return this.loadImage(resolveAssetPath(this.assetsPath, assetPath));
  }

  async loadSprite(filename: string): Promise<HTMLImageElement> {
    if (this.spriteCache.has(filename)) {
      return this.spriteCache.get(filename)!;
    }
    const img = await this.loadAssetImage(`sprites/${filename}`);
    this.spriteCache.set(filename, img);
    return img;
  }

  async loadUIAsset(filename: string): Promise<HTMLImageElement> {
    if (this.uiCache.has(filename)) {
      return this.uiCache.get(filename)!;
    }
    const img = await this.loadAssetImage(`ui/${filename}`);
    this.uiCache.set(filename, img);
    return img;
  }

  getSprite(filename: string): HTMLImageElement | null {
    return this.spriteCache.get(filename) || null;
  }

  getUIAsset(filename: string): HTMLImageElement | null {
    return this.uiCache.get(filename) || null;
  }

  async preloadAllSprites(filenames: string[], onProgress?: (loaded: number, total: number) => void): Promise<void> {
    let loaded = 0;
    const total = filenames.length;
    const promises = filenames.map(async (filename) => {
      try {
        await this.loadSprite(filename);
      } catch {
        // Skip missing sprites silently
      }
      loaded++;
      onProgress?.(loaded, total);
    });
    await Promise.all(promises);
  }

  async preloadUIAssets(filenames: string[], onProgress?: (loaded: number, total: number) => void): Promise<void> {
    let loaded = 0;
    const total = filenames.length;
    const promises = filenames.map(async (filename) => {
      try {
        await this.loadUIAsset(filename);
      } catch {
        // Skip missing UI assets silently
      }
      loaded++;
      onProgress?.(loaded, total);
    });
    await Promise.all(promises);
  }
}
