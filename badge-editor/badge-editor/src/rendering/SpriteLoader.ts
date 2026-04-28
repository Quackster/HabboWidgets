import { SYMBOL_COUNT, BASE_COUNT } from '../config';
import { resolveRuntimeImageSource } from '../runtime/RuntimeAssetLoader';

export interface SpriteBounds {
  xMin: number;
  yMin: number;
  xMax: number;
  yMax: number;
}

const symbols: HTMLImageElement[] = [];
const bases: HTMLImageElement[] = [];
const uiSprites: Map<string, HTMLImageElement> = new Map();
const symbolBounds: SpriteBounds[] = [];
const baseBounds: SpriteBounds[] = [];

// All UI sprite files extracted from the decompiled SWF
const UI_SPRITE_NAMES = [
  'background',          // 418: 300x375 main background
  'savebutton',          // 346: 100x18 save button
  'cancelbutton',        // 406: 100x18 cancel button
  'preview_set',         // 365: 87x49 preview set composite
  'preview_center',      // 354: 49x49 preview center background
  'preview_layer',       // 350: 40x40 preview layer frame
  'preview_screen',      // 351: 40x40 preview screen (used for combined preview)
  'arrow_left',          // 357: 18x21 left arrow
  'arrow_right',         // 359: 18x21 right arrow
  'tick_on',             // 364 frame 1: 12x13 checkbox checked
  'tick_off',            // 364 frame 2: 12x13 checkbox unchecked
  'color_selector_single', // 374: 15x15 single color button frame
  'color_selector_set',  // 378: 129x32 color selector set background
  'color_mask',          // 370: 11x11 color mask overlay
  'color_dot',           // 373: 3x3 color dot
  'color_pointer',       // 377: 17x17 color selection pointer
  'position_selector',   // 386: 48x48 position grid background
  'position_slot',       // 381: 16x16 individual position slot
];

async function loadImage(assetPath: string): Promise<HTMLImageElement> {
  const src = await resolveRuntimeImageSource(assetPath);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load: ${src}`));
    img.src = src;
  });
}

function computeVisualBounds(img: HTMLImageElement): SpriteBounds {
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, c.width, c.height).data;
  let xMin = c.width, yMin = c.height, xMax = 0, yMax = 0;
  for (let y = 0; y < c.height; y++) {
    for (let x = 0; x < c.width; x++) {
      if (data[(y * c.width + x) * 4 + 3] > 0) {
        if (x < xMin) xMin = x;
        if (x > xMax) xMax = x;
        if (y < yMin) yMin = y;
        if (y > yMax) yMax = y;
      }
    }
  }
  if (xMax < xMin) return { xMin: 0, yMin: 0, xMax: c.width, yMax: c.height };
  return { xMin, yMin, xMax: xMax + 1, yMax: yMax + 1 };
}

export async function preloadSprites(): Promise<void> {
  const promises: Promise<void>[] = [];

  // Symbol sprites (1-67)
  for (let i = 1; i <= SYMBOL_COUNT; i++) {
    const idx = i;
    promises.push(
      loadImage(`sprites/symbols/${idx}.png`).then((img) => {
        symbols[idx] = img;
      })
    );
  }

  // Base sprites (1-24)
  for (let i = 1; i <= BASE_COUNT; i++) {
    const idx = i;
    promises.push(
      loadImage(`sprites/bases/${idx}.png`).then((img) => {
        bases[idx] = img;
      })
    );
  }

  // UI sprites
  for (const name of UI_SPRITE_NAMES) {
    promises.push(
      loadImage(`sprites/ui/${name}.png`).then((img) => {
        uiSprites.set(name, img);
      })
    );
  }

  await Promise.all(promises);

  // Compute visual bounds for all symbols and bases
  for (let i = 1; i <= SYMBOL_COUNT; i++) {
    if (symbols[i]) symbolBounds[i] = computeVisualBounds(symbols[i]);
  }
  for (let i = 1; i <= BASE_COUNT; i++) {
    if (bases[i]) baseBounds[i] = computeVisualBounds(bases[i]);
  }
}

export function getSymbol(frameNum: number): HTMLImageElement | null {
  return symbols[frameNum] ?? null;
}

export function getBase(frameNum: number): HTMLImageElement | null {
  return bases[frameNum] ?? null;
}

export function getUI(name: string): HTMLImageElement {
  const img = uiSprites.get(name);
  if (!img) throw new Error(`UI sprite not found: ${name}`);
  return img;
}

export function getSymbolBounds(frameNum: number): SpriteBounds | null {
  return symbolBounds[frameNum] ?? null;
}

export function getBaseBounds(frameNum: number): SpriteBounds | null {
  return baseBounds[frameNum] ?? null;
}
