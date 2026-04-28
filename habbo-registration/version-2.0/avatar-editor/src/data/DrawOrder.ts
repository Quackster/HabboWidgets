export class DrawOrder {
  private static instance: DrawOrder | null = null;
  private drawOrderData: Record<string, Record<string, string[]>> = {};
  private loaded = false;

  static getInstance(): DrawOrder {
    if (!DrawOrder.instance) {
      DrawOrder.instance = new DrawOrder();
    }
    return DrawOrder.instance;
  }

  async loadFromUrl(url: string): Promise<void> {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`[DrawOrder] Failed to load: ${url} (${response.status})`);
      return;
    }
    const text = await response.text();
    this.loadFromText(text);
  }

  loadFromText(text: string): void {
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    this.parseXml(xml);
    const actionCount = Object.keys(this.drawOrderData).length;
    console.log(`[DrawOrder] Loaded ${actionCount} actions`);
  }

  parseXml(xml: Document): void {
    const actions = xml.querySelectorAll('action');
    for (const actionNode of actions) {
      const actionId = actionNode.getAttribute('id') || 'std';
      this.drawOrderData[actionId] = {};

      const directions = actionNode.querySelectorAll('direction');
      for (const dirNode of directions) {
        const dirId = dirNode.getAttribute('id') || '0';
        const parts: string[] = [];
        const partNodes = dirNode.querySelectorAll('part');
        for (const partNode of partNodes) {
          const setType = partNode.getAttribute('set-type') || '';
          parts.push(setType);
        }
        this.drawOrderData[actionId][dirId] = parts;
      }
    }
    this.loaded = true;
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  // Original AS2 hardcodes action to "std"
  getOrderArray(direction: number, _action?: string): string[] {
    const action = 'std';
    const actionData = this.drawOrderData[action];
    if (!actionData) return [];
    const dirArr = actionData[String(direction)];
    if (!dirArr) return [];
    return dirArr;
  }
}
