const ABSOLUTE_ASSET_PATH_RE = /^(?:[a-z][a-z\d+\-.]*:|\/\/|\/)/i;

export function isAbsoluteAssetPath(path: string): boolean {
  return ABSOLUTE_ASSET_PATH_RE.test(path);
}

export function normalizeAssetBasePath(basePath?: string): string {
  if (!basePath) {
    return '';
  }

  return basePath.endsWith('/') ? basePath : `${basePath}/`;
}

export function resolveAssetPath(basePath: string | undefined, assetPath: string): string {
  if (!assetPath || isAbsoluteAssetPath(assetPath)) {
    return assetPath;
  }

  const normalizedBasePath = normalizeAssetBasePath(basePath);
  return normalizedBasePath ? `${normalizedBasePath}${assetPath}` : assetPath;
}
