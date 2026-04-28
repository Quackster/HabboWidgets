import { resolveAssetPath } from '../utils/assetPaths';

const TOTAL_FRAMES = 14;
const FRAME_INTERVAL = 83; // ~12fps, matching original Flash frame rate

let frames: HTMLImageElement[] = [];
let currentFrame = 0;
let timerId: number | null = null;

export function loadFrames(assetsPath: string): Promise<void> {
  const promises: Promise<void>[] = [];

  for (let i = 1; i <= TOTAL_FRAMES; i++) {
    const img = new Image();
    promises.push(
      new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      })
    );
    img.src = resolveAssetPath(assetsPath, `frames/${i}.png`);
    frames[i - 1] = img;
  }

  return Promise.all(promises).then(() => {});
}

export function startLoadingAnimation(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  currentFrame = 0;
  drawFrame(ctx, canvas.width, canvas.height);
  timerId = window.setInterval(() => {
    currentFrame = (currentFrame + 1) % TOTAL_FRAMES;
    drawFrame(ctx, canvas.width, canvas.height);
  }, FRAME_INTERVAL);
}

export function stopLoadingAnimation(): void {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
}

function drawFrame(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, w, h);

  const img = frames[currentFrame];
  if (img && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, 0, 0);
  }
}
