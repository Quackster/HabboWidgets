export const STAGE_WIDTH = 396;
export const STAGE_HEIGHT = 377;
export const FRAME_RATE = 24;

export interface HabbosLandingConfig {
  container?: string;
  assetsPath?: string;
  assetBundlePath?: string;
  assetsZipUrl?: string;
  habbos_url?: string;
  habbosUrl?: string;
  fallbackHabbosUrl?: string;
  button_link?: string;
  buttonLink?: string;
  header_text?: string;
  headerText?: string;
  slogan?: string;
  select_button_text?: string;
  selectButtonText?: string;
  createButtonText?: string;
  debug?: boolean;
}

export interface ResolvedConfig {
  container: string;
  assetsPath: string;
  assetBundlePath: string;
  habbos_url: string;
  fallbackHabbosUrl: string;
  button_link: string;
  header_text: string;
  slogan: string;
  select_button_text: string;
  debug: boolean;
}

export const DEFAULT_CONFIG: ResolvedConfig = {
  container: 'habbos-v2-container',
  assetsPath: '',
  assetBundlePath: 'assets.zip',
  habbos_url: '',
  fallbackHabbosUrl: 'demo/foobar/promo_habbos.xml',
  button_link: '',
  header_text: "Join now, it's free!",
  slogan: 'Habbo is a virtual world, where you can meet and make friends!',
  select_button_text: 'Choose your habbo',
  debug: false,
};

declare global {
  interface Window {
    HabbosV2LandingConfig?: HabbosLandingConfig;
    HabbosLandingConfig?: HabbosLandingConfig;
  }
}

export function readConfig(options?: HabbosLandingConfig): ResolvedConfig {
  const raw = {
    ...DEFAULT_CONFIG,
    ...window.HabbosV2LandingConfig,
    ...window.HabbosLandingConfig,
    ...options,
  };

  return {
    ...raw,
    assetBundlePath: raw.assetsZipUrl ?? raw.assetBundlePath,
    habbos_url: raw.habbosUrl ?? raw.habbos_url,
    button_link: raw.buttonLink ?? raw.button_link,
    header_text: raw.headerText ?? raw.header_text,
    select_button_text: raw.createButtonText ?? raw.selectButtonText ?? raw.select_button_text,
  };
}
