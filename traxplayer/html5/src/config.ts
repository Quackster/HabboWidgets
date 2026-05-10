export interface TraxPlayerConfig {
  assetsPath: string;
  songUrl: string;
  sampleUrl: string;
  debug: boolean;
  allowSampleFallback: boolean;
}

export const DEFAULT_CONFIG: TraxPlayerConfig = {
  assetsPath: '',
  songUrl: 'demo/song.txt',
  sampleUrl: 'http://images.habbogroup.com/dcr/hof_furni/mp3/',
  debug: false,
  allowSampleFallback: false,
};

export function readConfig(options?: Partial<TraxPlayerConfig>): TraxPlayerConfig {
  const globalConfig = (window as any).HabboTraxPlayerConfig || {};
  return {
    ...DEFAULT_CONFIG,
    ...globalConfig,
    ...options,
  };
}
