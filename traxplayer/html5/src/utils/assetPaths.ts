export function resolveAssetPath(basePath: string, assetPath: string): string {
  if (/^(https?:)?\/\//.test(assetPath) || assetPath.startsWith('data:')) {
    return assetPath;
  }

  const cleanBase = basePath.trim();
  if (!cleanBase) {
    return assetPath;
  }

  return cleanBase.replace(/\/?$/, '/') + assetPath.replace(/^\//, '');
}

export function resolveSongUrl(configuredUrl: string): string {
  if (/^(https?:)?\/\//.test(configuredUrl) || configuredUrl.startsWith('data:')) {
    return configuredUrl;
  }

  return new URL(configuredUrl, window.location.href).href;
}
