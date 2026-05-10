import { PlayerListener, TraxAudioPlayer, TraxSongModel } from './types';
import { ActivePlayback, TraxSong } from './TraxSong';

class NullListener implements PlayerListener {
  onSongLoad(): void {}
  onSongPlaying(): void {}
  onTick(): void {}
  onStop(): void {}
}

export class Player implements TraxAudioPlayer {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private song: TraxSong | null = null;
  private active: ActivePlayback | null = null;
  private tickTimer = 0;
  private tick = 0;
  private volume = 50;
  private previousVolume = 50;
  private repeat = true;
  private listener: PlayerListener = new NullListener();

  setPlayerListener(listener: PlayerListener): void {
    this.listener = listener;
  }

  createAudio(): AudioContext {
    if (!this.audioContext) {
      const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextCtor();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.setVolume(this.volume);
    }

    return this.audioContext;
  }

  async setSong(song: TraxSong): Promise<void> {
    this.stopPlaying();
    this.song = song;
    this.listener.onSongLoad(true, song, this);
  }

  getCurrentSong(): TraxSongModel | null {
    return this.song;
  }

  async startPlaying(): Promise<void> {
    if (!this.song || !this.gainNode) {
      return;
    }

    const audioContext = this.createAudio();
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    this.stopPlaying(false);
    this.active = this.song.schedule(audioContext, this.gainNode, () => {
      this.stopPlaying(false);
      if (this.repeat) {
        void this.startPlaying();
      }
    });

    this.tick = 0;
    this.listener.onSongPlaying(true, this.song);
    this.listener.onTick(0);
    this.tickTimer = window.setInterval(() => {
      this.tick += 1;
      this.listener.onTick(this.tick);
    }, 1000);
  }

  stopPlaying(resetTick = true): void {
    if (this.active) {
      this.active.sources.forEach((source) => {
        try {
          source.stop();
        } catch (_error) {
          // Buffer sources can only be stopped once.
        }
      });
      window.clearTimeout(this.active.timer);
      this.active = null;
    }

    window.clearInterval(this.tickTimer);
    this.tickTimer = 0;
    if (resetTick) {
      this.tick = 0;
      this.listener.onTick(0);
    }
    this.listener.onStop();
  }

  setVolume(value: number): void {
    this.volume = Math.min(100, Math.max(0, Math.round(value)));
    if (this.gainNode) {
      this.gainNode.gain.value = this.volume / 100;
    }
  }

  getVolume(): number {
    return this.volume;
  }

  toggleMute(): void {
    if (this.volume > 0) {
      this.previousVolume = this.volume;
      this.setVolume(0);
      return;
    }

    this.setVolume(this.previousVolume || 50);
  }
}
