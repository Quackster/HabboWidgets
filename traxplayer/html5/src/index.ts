import './style.css';
import { Player } from './core/Player';
import { SongLoader } from './core/SongLoader';
import { TraxPlayerConfig, readConfig } from './config';
import { exportSongAsMp3 } from './core/Mp3Exporter';
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
      onExportRequested: () => void this.exportMp3(),
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

  async exportMp3(): Promise<void> {
    const song = this.player.getLoadedSong();
    if (!song) {
      this.ui.setStatus('No song loaded.');
      return;
    }

    const filename = `${sanitizeFilename(song.name)}.mp3`;
    try {
      const fileHandle = await chooseMp3SaveFile(filename);
      this.ui.setExporting(true);

      const blob = await exportSongAsMp3(song);
      if (fileHandle) {
        await writeBlobToFile(fileHandle, blob);
      } else {
        downloadBlob(blob, filename);
      }
      this.ui.setStatus('Exported MP3.');
    } catch (error) {
      if (isAbortError(error)) {
        this.ui.setStatus('Export cancelled.');
        return;
      }

      const message = error instanceof Error ? error.message : String(error);
      this.ui.setStatus(`Export failed: ${message}`);
      if (this.config.debug) {
        console.error('[HabboTraxPlayer] MP3 export failed', error);
      }
    } finally {
      this.ui.setExporting(false);
    }
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

async function chooseMp3SaveFile(filename: string): Promise<FileSystemFileHandle | null> {
  if (!('showSaveFilePicker' in window)) {
    return null;
  }

  return window.showSaveFilePicker({
    suggestedName: filename,
    types: [
      {
        description: 'MP3 audio',
        accept: {
          'audio/mpeg': ['.mp3'],
        },
      },
    ],
  });
}

async function writeBlobToFile(fileHandle: FileSystemFileHandle, blob: Blob): Promise<void> {
  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function sanitizeFilename(value: string): string {
  const cleaned = value.trim().replace(/[<>:"/\\|?*\x00-\x1f]/g, '_');
  return cleaned || 'trax-song';
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}
