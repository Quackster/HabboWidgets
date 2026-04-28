import { getConfig } from '../api/Bridge';
import { loadRuntimeTextAsset } from '../runtime/RuntimeAssetLoader';

const strings: Map<string, string> = new Map();

export async function loadLocalization(): Promise<void> {
  const cfg = getConfig();
  const text = await loadRuntimeTextAsset(cfg.localization_url ?? 'data/badge_editor.xml');
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'text/xml');
  const keys = doc.querySelectorAll('keys > key');

  keys.forEach((node) => {
    const name = node.getAttribute('name');
    const value = node.textContent ?? '';
    if (name) strings.set(name, value);
  });
}

export function getText(key: string): string {
  return strings.get(key) ?? key;
}
