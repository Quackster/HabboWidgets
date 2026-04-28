export interface SpriteOffset {
  x: number;
  y: number;
}

export class SymbolMap {
  private static instance: SymbolMap | null = null;
  private nameToFileId: Map<string, number> = new Map();
  private imageOffsets: Map<number, SpriteOffset> = new Map();
  private loaded = false;

  static getInstance(): SymbolMap {
    if (!SymbolMap.instance) {
      SymbolMap.instance = new SymbolMap();
    }
    return SymbolMap.instance;
  }

  async loadFromUrl(url: string): Promise<void> {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`[SymbolMap] Failed to load symbols CSV: ${url} (${response.status})`);
      return;
    }
    const text = await response.text();
    this.loadFromText(text);
  }

  loadFromText(text: string): void {
    this.parseCsv(text);
    console.log(`[SymbolMap] Loaded ${this.nameToFileId.size} symbol entries`);
  }

  async loadOffsetsFromUrl(url: string): Promise<void> {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`[SymbolMap] Failed to load offsets CSV: ${url} (${response.status})`);
      return;
    }
    const text = await response.text();
    this.loadOffsetsFromText(text);
  }

  loadOffsetsFromText(text: string): void {
    this.parseOffsets(text);
    console.log(`[SymbolMap] Loaded ${this.imageOffsets.size} sprite offsets`);
  }

  parseCsv(csv: string): void {
    const lines = csv.trim().split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const [idStr, name] = trimmed.split(';');
      if (!name) continue;
      const spriteId = parseInt(idStr, 10);
      // Image filename = (csvSpriteId - 2).png
      const fileId = spriteId - 2;
      this.nameToFileId.set(name.trim(), fileId);
    }
    this.loaded = true;
  }

  parseOffsets(csv: string): void {
    const lines = csv.trim().split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const parts = trimmed.split(';');
      if (parts.length < 3) continue;
      const imageId = parseInt(parts[0], 10);
      const x = parseFloat(parts[1]);
      const y = parseFloat(parts[2]);
      this.imageOffsets.set(imageId, { x, y });
    }
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  getFileIdForName(name: string): number | null {
    return this.nameToFileId.get(name) ?? null;
  }

  getFilenameForName(name: string): string | null {
    const fileId = this.getFileIdForName(name);
    if (fileId === null) return null;
    return `${fileId}.png`;
  }

  /**
   * Get the MC-local position offset for a sprite image.
   * These are extracted from the SVG shape path coordinates.
   * When drawing to the 64x106 avatar bitmap with translate(0, 98),
   * the final bitmap position is (offset.x, offset.y + 98).
   */
  getOffsetForImageId(imageId: number): SpriteOffset {
    return this.imageOffsets.get(imageId) ?? { x: 0, y: 0 };
  }

  getOffsetForName(name: string): SpriteOffset {
    const fileId = this.getFileIdForName(name);
    if (fileId === null) return { x: 0, y: 0 };
    return this.getOffsetForImageId(fileId);
  }

  getAllNames(): string[] {
    return Array.from(this.nameToFileId.keys());
  }
}
