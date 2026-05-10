import './style.css';
import { Player } from './core/Player';
import { SongLoader } from './core/SongLoader';
import { TraxPlayerConfig, readConfig } from './config';
import { TraxPlayerUi } from './ui/TraxPlayerUi';
import { resolveSongUrl } from './utils/assetPaths';

export class HabboTraxPlayer {
  private config: TraxPlayerConfig;
  private player: Player;
  private ui: TraxPlayerUi;

  constructor(container: HTMLElement, options?: Partial<TraxPlayerConfig>) {
    this.config = readConfig(options);
    this.config.songUrl = resolveSongUrl(this.config.songUrl);
    this.player = new Player();
    this.ui = new TraxPlayerUi({
      container,
      player: this.player,
      assetsPath: this.config.assetsPath,
      songUrl: this.config.songUrl,
      sampleUrl: this.config.sampleUrl,
      onLoadRequested: (songUrl, sampleUrl) => {
        this.config.songUrl = resolveSongUrl(songUrl);
        this.config.sampleUrl = sampleUrl;
        void this.loadSong();
      },
    });
    this.player.setPlayerListener(this.ui);
    void this.loadSong();
  }

  async loadSong(): Promise<void> {
    this.ui.setLoading('Loading song data...');

    try {
      const audioContext = this.player.createAudio();
      const loader = new SongLoader(this.config.sampleUrl, this.config.allowSampleFallback);
      const song = await loader.load(this.config.songUrl, audioContext);
      await this.player.setSong(song);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.ui.setError(message);
      if (this.config.debug) {
        console.error('[HabboTraxPlayer] Load failed', error);
      }
    }
  }

  async load(songUrl: string, sampleUrl = this.config.sampleUrl): Promise<void> {
    this.config.songUrl = resolveSongUrl(songUrl);
    this.config.sampleUrl = sampleUrl;
    await this.loadSong();
  }

  async play(): Promise<void> {
    await this.player.startPlaying();
  }

  stop(): void {
    this.player.stopPlaying();
  }

  setVolume(value: number): void {
    this.player.setVolume(value);
  }
}

declare global {
  interface Window {
    HabboTraxPlayer: typeof HabboTraxPlayer;
    HabboTraxPlayerConfig?: Partial<TraxPlayerConfig>;
  }
}

window.HabboTraxPlayer = HabboTraxPlayer;

const container = document.getElementById('trax-player-container');
if (container) {
  new HabboTraxPlayer(container);
}
