import { getConfig } from '../api/Bridge';
import { loadRuntimeTextAsset } from '../runtime/RuntimeAssetLoader';

let colors: string[] = [];

export async function loadExternalData(): Promise<void> {
  const cfg = getConfig();
  const text = await loadRuntimeTextAsset(cfg.badge_data_url ?? 'data/badge_data.xml');
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'text/xml');
  const cNodes = doc.querySelectorAll('badge > c');

  colors = [];
  cNodes.forEach((node) => {
    const hex = (node.textContent ?? '').trim();
    if (hex) colors.push(hex);
  });
}

export function getColorCount(): number {
  return colors.length;
}

export function getColorHex(index: number): string {
  // 1-based index matching the original AS2
  if (index >= 1 && index <= colors.length) {
    return '#' + colors[index - 1];
  }
  return '#ffffff';
}

export function getAllColors(): string[] {
  return colors.map((c) => '#' + c);
}
