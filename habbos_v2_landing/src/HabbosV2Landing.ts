import { FRAME_RATE, ResolvedConfig, STAGE_HEIGHT, STAGE_WIDTH } from './config';
import { RuntimeAssetLoader } from './RuntimeAssetLoader';
import { resolveAssetPath } from './assetPaths';

interface PromoHabbo {
  figure: string;
  gender: string;
  hash: string;
}

interface PromoData {
  avatarUrlPrefix: string;
  habbos: PromoHabbo[];
  directImages: Map<string, string>;
}

interface Point {
  x: number;
  y: number;
}

class Avatar {
  x = STAGE_WIDTH;
  y = 20;
  width = 0;
  height = 0;
  alpha = 1;
  ready = false;

  constructor(
    readonly figure: string,
    readonly gender: string,
    readonly hash: string,
    private readonly image: HTMLImageElement,
  ) {
    this.ready = image.complete && image.naturalWidth > 0;
    this.width = image.naturalWidth * 2;
    this.height = image.naturalHeight * 2;
  }

  draw(ctx: CanvasRenderingContext2D, selected: boolean): void {
    ctx.save();
    ctx.globalAlpha = selected ? 1 : this.alpha;
    ctx.imageSmoothingEnabled = false;

    const drawWidth = this.image.naturalWidth * 2;
    const drawHeight = this.image.naturalHeight * 2;
    this.width = drawWidth;
    this.height = drawHeight;

    ctx.drawImage(this.image, this.x, this.y, drawWidth, drawHeight);

    ctx.save();
    ctx.globalAlpha *= 0.2;
    ctx.translate(this.x, this.y + 200 + drawHeight);
    ctx.scale(1, -1);
    ctx.drawImage(this.image, 0, 0, drawWidth, drawHeight);
    ctx.restore();

    ctx.restore();
  }

  contains(point: Point): boolean {
    return point.x >= this.x && point.x <= this.x + this.width && point.y >= this.y && point.y <= this.y + this.height;
  }
}

export class HabbosV2Landing {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly loader: RuntimeAssetLoader;
  private readonly assets = new Map<string, HTMLImageElement>();
  private readonly avatars: Avatar[] = [];
  private readonly avatarsOnScreen: Avatar[] = [];
  private selectedAvatar: Avatar | null = null;
  private errorMessage = '';
  private running = false;
  private isActive = false;
  private allowClicks = false;
  private scrollSpeed = 0;
  private scrollSpeedTarget = 0;
  private avatarLimitLeft = 0;
  private loadingFrame = 0;
  private loadingAccumulator = 0;
  private lastTime = 0;
  private buttonBounds = { x: 0, y: 0, width: 0, height: 0 };

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly config: ResolvedConfig,
  ) {
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas 2D context is unavailable.');
    }

    this.ctx = context;
    this.ctx.imageSmoothingEnabled = false;
    this.loader = new RuntimeAssetLoader(config);
    this.canvas.width = STAGE_WIDTH;
    this.canvas.height = STAGE_HEIGHT;
    this.canvas.style.width = `${STAGE_WIDTH}px`;
    this.canvas.style.height = `${STAGE_HEIGHT}px`;
    this.canvas.style.display = 'block';

    this.canvas.addEventListener('mousemove', (event) => this.onMouseWithin(event));
    this.canvas.addEventListener('mouseenter', (event) => this.onMouseWithin(event));
    this.canvas.addEventListener('mouseleave', () => this.onMouseOut());
    this.canvas.addEventListener('click', (event) => this.onClick(event));
  }

  async start(): Promise<void> {
    this.running = true;
    requestAnimationFrame((time) => this.tick(time));

    try {
      await this.loader.prepare();
      await this.loadUiAssets();
      const promoData = await this.loadPromoHabboData();
      await this.loadAvatars(promoData);
      this.layoutInitialAvatars();
      this.isActive = true;
      this.allowClicks = true;
      this.scrollSpeed = Math.random() * -50 - 20;
      if (Math.random() < 0.5) {
        this.scrollSpeed *= -1;
      }
    } catch (error) {
      this.showError(error instanceof Error ? error.message : String(error));
      if (this.config.debug) {
        console.error('[HabbosV2Landing] Startup failed', error);
      }
    }
  }

  stop(): void {
    this.running = false;
  }

  private async loadUiAssets(): Promise<void> {
    await Promise.all([
      this.loadAssetImage('ui/bg-top.png'),
      this.loadAssetImage('ui/bg-bottom.png'),
      this.loadAssetImage('ui/button-bg.png'),
      this.loadAssetImage('ui/button-arrow.png'),
      this.loadAssetImage('ui/loading-1.png'),
      this.loadAssetImage('ui/loading-2.png'),
      this.loadAssetImage('ui/loading-3.png'),
      this.loadAssetImage('ui/loading-4.png'),
    ]);
  }

  private async loadPromoHabboData(): Promise<PromoData> {
    if (!this.config.habbos_url) {
      throw new Error('No promo data URL');
    }

    const xmlText = await this.loadPromoXmlText(this.config.habbos_url);
    const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
      throw new Error('Promo data XML could not be parsed.');
    }

    const root = doc.documentElement;
    const avatarUrlPrefix = root.getAttribute('url')?.trim() || root.querySelector('url')?.textContent?.trim() || '';
    const directImages = new Map<string, string>();
    const habbos = [...doc.querySelectorAll('habbo')]
      .map((node, index) => {
        const image = node.getAttribute('image')?.trim() || node.querySelector('image')?.textContent?.trim() || '';
        const figure = node.getAttribute('figure')?.trim() || node.querySelector('figure')?.textContent?.trim() || getFigureFromImageUrl(image);
        const gender = node.getAttribute('gender')?.trim() || node.querySelector('gender')?.textContent?.trim() || '';
        const hash = node.getAttribute('hash')?.trim() || node.querySelector('hash')?.textContent?.trim() || figure || '';
        const key = hash || `${figure}:${index}`;
        if (image) {
          directImages.set(key, image);
        }
        return { figure, gender, hash: key };
      })
      .filter((habbo) => habbo.figure);

    if (habbos.length === 0) {
      throw new Error('Promo data did not include any habbos.');
    }

    if (!avatarUrlPrefix && directImages.size === 0) {
      throw new Error('No avatar image URL in promo data.');
    }

    return { avatarUrlPrefix, habbos, directImages };
  }

  private async loadPromoXmlText(url: string): Promise<string> {
    let text: string;
    try {
      text = await this.loader.loadText(url);
    } catch (error) {
      if (!this.config.fallbackHabbosUrl || url === this.config.fallbackHabbosUrl) {
        throw error;
      }

      return this.loader.loadText(this.config.fallbackHabbosUrl);
    }

    if (!looksLikeXml(text)) {
      if (!this.config.fallbackHabbosUrl || url === this.config.fallbackHabbosUrl) {
        return text;
      }

      return this.loader.loadText(this.config.fallbackHabbosUrl);
    }

    return text;
  }

  private async loadAvatars(promoData: PromoData): Promise<void> {
    const gesture = 's-0.g-1.d-3.h-3.a-0';

    for (const habbo of promoData.habbos) {
      const directImage = promoData.directImages.get(habbo.hash);
      const fileName = `%figure%,%gesture%,%hash%.gif`
        .split('%figure%').join(habbo.figure)
        .split('%gesture%').join(gesture)
        .split('%hash%').join(habbo.hash);
      const assetPath = directImage || resolveAssetPath(promoData.avatarUrlPrefix, fileName);
      const image = await this.loadImage(assetPath);
      this.avatars.push(new Avatar(habbo.figure, habbo.gender, habbo.hash, image));
    }
  }

  private layoutInitialAvatars(): void {
    let x = STAGE_WIDTH;
    for (const avatar of [...this.avatars].reverse()) {
      x -= avatar.width + 5;
      avatar.x = x;
      avatar.y = 20;
      this.avatarsOnScreen.unshift(avatar);
    }

    this.avatarLimitLeft = x;
    this.selectMostCenterAvatar();
  }

  private tick(time: number): void {
    if (!this.running) {
      return;
    }

    const delta = this.lastTime ? (time - this.lastTime) / 1000 : 1 / FRAME_RATE;
    this.lastTime = time;
    this.update(delta);
    this.render();
    requestAnimationFrame((nextTime) => this.tick(nextTime));
  }

  private update(delta: number): void {
    this.loadingAccumulator += delta;
    if (this.loadingAccumulator >= 0.04) {
      this.loadingAccumulator = 0;
      this.loadingFrame = (this.loadingFrame + 1) % 4;
    }

    if (this.scrollSpeedTarget < this.scrollSpeed) {
      this.scrollSpeed -= 1;
    } else if (this.scrollSpeedTarget > this.scrollSpeed) {
      this.scrollSpeed += 1;
    }

    if (!this.isActive || this.scrollSpeed === 0 || this.avatarsOnScreen.length === 0) {
      return;
    }

    const moveOffset = this.scrollSpeed * delta * 1.5;
    for (const avatar of this.avatarsOnScreen) {
      avatar.x += moveOffset;
    }

    this.wrapAvatars(moveOffset);
    this.selectMostCenterAvatar();
  }

  private wrapAvatars(moveOffset: number): void {
    if (this.avatarsOnScreen.length < 2) {
      return;
    }

    if (moveOffset < 0) {
      const first = this.avatarsOnScreen[0];
      if (first.x < this.avatarLimitLeft) {
        const moved = this.avatarsOnScreen.shift();
        if (moved) {
          const last = this.avatarsOnScreen[this.avatarsOnScreen.length - 1];
          moved.x = last.x + last.width + 5;
          this.avatarsOnScreen.push(moved);
        }
      }
    } else {
      const last = this.avatarsOnScreen[this.avatarsOnScreen.length - 1];
      if (last.x > STAGE_WIDTH + 12) {
        const moved = this.avatarsOnScreen.pop();
        if (moved) {
          const first = this.avatarsOnScreen[0];
          moved.x = first.x - moved.width - 5;
          this.avatarsOnScreen.unshift(moved);
        }
      }
    }
  }

  private render(): void {
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.clearRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);

    const bgTop = this.assets.get('ui/bg-top.png');
    const bgBottom = this.assets.get('ui/bg-bottom.png');
    if (bgTop) {
      this.ctx.drawImage(bgTop, 0, 0);
    }

    for (const avatar of this.avatarsOnScreen) {
      avatar.draw(this.ctx, avatar === this.selectedAvatar);
    }

    if (bgBottom) {
      this.ctx.drawImage(bgBottom, 0, 301);
    }

    this.drawTexts();
    this.drawButton();

    if (!this.allowClicks && !this.errorMessage) {
      this.drawLoadingBar();
    }

    if (this.errorMessage) {
      this.drawError();
    }
  }

  private drawTexts(): void {
    this.ctx.save();
    this.ctx.fillStyle = '#ffffff';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    this.ctx.font = 'bold 18px Verdana, Arial, sans-serif';
    this.ctx.fillText(this.config.header_text, STAGE_WIDTH / 2, 10);

    this.ctx.font = 'bold 18px Verdana, Arial, sans-serif';
    this.drawWrappedCenteredText(this.config.slogan, STAGE_WIDTH / 2, 317, STAGE_WIDTH - 10, 22);
    this.ctx.restore();
  }

  private drawButton(): void {
    const buttonBg = this.assets.get('ui/button-bg.png');
    const arrow = this.assets.get('ui/button-arrow.png');
    this.ctx.font = 'bold 18px Verdana, Arial, sans-serif';
    const metrics = this.ctx.measureText(this.config.select_button_text);
    const width = Math.ceil(metrics.width) + 54;
    const height = 40;
    const x = Math.round((STAGE_WIDTH - width) / 2);
    const y = 259;
    this.buttonBounds = { x, y, width, height };

    this.ctx.save();
    if (buttonBg) {
      this.ctx.drawImage(buttonBg, 0, 0, buttonBg.width - 17, buttonBg.height, x, y, width - 17, height);
    } else {
      this.ctx.fillStyle = '#45aa00';
      this.ctx.fillRect(x, y, width, height);
    }

    if (arrow) {
      this.ctx.drawImage(arrow, x + width - arrow.width, y);
    }

    this.ctx.fillStyle = '#ffffff';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(this.config.select_button_text, x + 24, y + height / 2 - 2);
    this.ctx.restore();
  }

  private drawLoadingBar(): void {
    const key = `ui/loading-${this.loadingFrame + 1}.png`;
    const frame = this.assets.get(key);
    if (!frame) {
      return;
    }

    this.ctx.drawImage(frame, Math.round((STAGE_WIDTH - frame.width) / 2), Math.round((STAGE_HEIGHT - frame.height) / 2));
  }

  private drawError(): void {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    this.ctx.fillRect(14, 136, STAGE_WIDTH - 28, 72);
    this.ctx.fillStyle = '#9a1b1b';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.font = '13px Verdana, Arial, sans-serif';
    this.drawWrappedCenteredText(this.errorMessage, STAGE_WIDTH / 2, 152, STAGE_WIDTH - 44, 18);
    this.ctx.restore();
  }

  private drawWrappedCenteredText(text: string, x: number, y: number, maxWidth: number, lineHeight: number): void {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let line = '';

    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (this.ctx.measureText(candidate).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }

    if (line) {
      lines.push(line);
    }

    lines.forEach((lineText, index) => {
      this.ctx.fillText(lineText, x, y + index * lineHeight);
    });
  }

  private selectMostCenterAvatar(): void {
    let closest: Avatar | null = null;
    let closestDistance = STAGE_WIDTH;

    for (const avatar of this.avatarsOnScreen) {
      avatar.alpha = 0.5;
      const distance = Math.abs(STAGE_WIDTH / 2 - (avatar.x + avatar.width / 2));
      if (distance < closestDistance) {
        closestDistance = distance;
        closest = avatar;
      }
    }

    this.selectedAvatar = closest;
    if (this.selectedAvatar) {
      this.selectedAvatar.alpha = 1;
    }
  }

  private onMouseWithin(event: MouseEvent): void {
    const point = this.getCanvasPoint(event);
    const center = STAGE_WIDTH / 2;
    this.scrollSpeedTarget = Math.max(-35, Math.min(35, (center - point.x) / 3));
  }

  private onMouseOut(): void {
    this.scrollSpeedTarget = 0;
  }

  private onClick(event: MouseEvent): void {
    if (!this.allowClicks) {
      return;
    }

    const point = this.getCanvasPoint(event);
    for (const avatar of this.avatarsOnScreen) {
      if (avatar.contains(point)) {
        this.selectedAvatar = avatar;
        this.selectMostCenterAvatar();
        break;
      }
    }

    if (
      point.x >= this.buttonBounds.x &&
      point.x <= this.buttonBounds.x + this.buttonBounds.width &&
      point.y >= this.buttonBounds.y &&
      point.y <= this.buttonBounds.y + this.buttonBounds.height
    ) {
      this.chooseSelectedAvatar();
    }
  }

  private chooseSelectedAvatar(): void {
    if (!this.config.button_link || !this.selectedAvatar) {
      return;
    }

    const url = `${this.config.button_link}?gender=${encodeURIComponent(this.selectedAvatar.gender)}&figure=${encodeURIComponent(this.selectedAvatar.figure)}`;
    window.location.href = url;
  }

  private getCanvasPoint(event: MouseEvent): Point {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (this.canvas.width / rect.width),
      y: (event.clientY - rect.top) * (this.canvas.height / rect.height),
    };
  }

  private showError(message: string): void {
    this.errorMessage = message;
  }

  private async loadAssetImage(assetPath: string): Promise<HTMLImageElement> {
    const image = await this.loadImage(assetPath);
    this.assets.set(assetPath, image);
    return image;
  }

  private async loadImage(assetPath: string): Promise<HTMLImageElement> {
    const src = await this.loader.resolveImageSource(assetPath);
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Failed to load image: ${assetPath}`));
      image.src = src;
    });
  }
}

function getFigureFromImageUrl(imageUrl: string): string {
  if (!imageUrl) {
    return '';
  }

  try {
    const url = new URL(imageUrl, window.location.href);
    return url.searchParams.get('figure') ?? '';
  } catch {
    const match = /[?&]figure=([^&]+)/.exec(imageUrl);
    return match ? decodeURIComponent(match[1]) : '';
  }
}

function looksLikeXml(text: string): boolean {
  const trimmed = text.trimStart();
  return trimmed.startsWith('<habbos') || trimmed.startsWith('<promo') || trimmed.startsWith('<?xml');
}
