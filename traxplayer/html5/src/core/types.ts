export interface TrackToken {
  id: string;
  length: number;
}

export interface SongLoadVars {
  status?: string;
  name?: string;
  author?: string;
  track1?: string;
  track2?: string;
  track3?: string;
  track4?: string;
}

export interface PlayerListener {
  onSongLoad(success: boolean, song: TraxSongModel, player: TraxAudioPlayer): void;
  onSongPlaying(success: boolean, song: TraxSongModel): void;
  onTick(seconds: number): void;
  onStop(): void;
}

export interface TraxSongModel {
  name: string;
  author: string;
  lengthSeconds: number;
}

export interface TraxAudioPlayer {
  startPlaying(): Promise<void>;
  stopPlaying(): void;
  setVolume(value: number): void;
  toggleMute(): void;
  setPlayerListener(listener: PlayerListener): void;
  getCurrentSong(): TraxSongModel | null;
}
