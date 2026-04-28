import { resolveAssetPath } from '../utils/assetPaths';

export interface HabboBadgeEditorConfig {
  badge_data?: string;
  assetsPath?: string;
  assetBundlePath?: string;
  badge_data_url?: string;
  localization_url?: string;
  groupId?: string;
}

declare global {
  interface Window {
    HabboBadgeEditorConfig?: HabboBadgeEditorConfig;
    HabboBadgeEditor?: {
      onSave?: (code: string, groupId: string) => void;
      onCancel?: () => void;
    };
  }
}

export function getConfig(): HabboBadgeEditorConfig {
  return window.HabboBadgeEditorConfig ?? {};
}

export function resolveConfigAssetPath(assetPath: string): string {
  return resolveAssetPath(getConfig().assetsPath, assetPath);
}

export function fireSave(code: string): void {
  const groupId = getConfig().groupId ?? '0';
  window.HabboBadgeEditor?.onSave?.(code, groupId);
}

export function fireCancel(): void {
  window.HabboBadgeEditor?.onCancel?.();
}
