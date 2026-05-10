import { parseLoadVars, parseTrack } from './LoadVars';
import { TraxSong } from './TraxSong';

export class SongLoader {
  constructor(
    private sampleUrl: string,
    private allowSampleFallback = false
  ) {}

  async load(songUrl: string, audioContext: AudioContext): Promise<TraxSong> {
    const response = await fetch(songUrl, { mode: 'cors' });
    if (!response.ok) {
      throw new Error(`Could not fetch ${songUrl} (${response.status})`);
    }

    const loadVars = parseLoadVars(await response.text());
    if (String(loadVars.status) !== '0') {
      throw new Error(`Song service returned status ${loadVars.status ?? 'missing'}`);
    }

    const tracks = [
      parseTrack(loadVars.track1),
      parseTrack(loadVars.track2),
      parseTrack(loadVars.track3),
      parseTrack(loadVars.track4),
    ];

    if (!tracks.some((track) => track.length > 0)) {
      throw new Error('Song data did not contain any track fields.');
    }

    const song = new TraxSong({
      name: loadVars.name || 'unknown',
      author: loadVars.author || 'unknown',
      sampleBaseUrl: this.sampleUrl,
      tracks,
      allowSampleFallback: this.allowSampleFallback,
    });

    await song.load(audioContext);
    return song;
  }
}
