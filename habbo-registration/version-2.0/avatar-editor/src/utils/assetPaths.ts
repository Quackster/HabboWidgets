export function resolveAssetPath(basePath: string, assetPath: string): string {
  if (!assetPath) return '';

  if (/^(?:[a-z]+:)?\/\//i.test(assetPath) || assetPath.startsWith('/') || assetPath.startsWith('data:')) {
    return assetPath;
  }

  if (!basePath) {
    return assetPath;
  }

  const normalizedBase = basePath.endsWith('/') ? basePath : `${basePath}/`;
  return `${normalizedBase}${assetPath}`;
}
