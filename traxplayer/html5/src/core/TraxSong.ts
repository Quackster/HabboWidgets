import { TrackToken, TraxSongModel } from './types';

const BEAT_SECONDS = 2;

interface ScheduledSample {
  buffer: AudioBuffer;
  beat: number;
}

interface TraxSongOptions {
  name: string;
  author: string;
  sampleBaseUrl: string;
  tracks: TrackToken[][];
  allowSampleFallback: boolean;
}

export interface ActivePlayback {
  startAt: number;
  sources: AudioBufferSourceNode[];
  timer: number;
}

export interface RenderedPcm {
  left: Float32Array;
  right: Float32Array;
  sampleRate: number;
}

export class TraxSong implements TraxSongModel {
  readonly name: string;
  readonly author: string;
  lengthSeconds = 0;
  private tracks: TraxTrack[];

  constructor(options: TraxSongOptions) {
    this.name = options.name;
    this.author = options.author;
    this.tracks = options.tracks.map((track) =>
      new TraxTrack(track, options.sampleBaseUrl, options.allowSampleFallback)
    );
    this.lengthSeconds = Math.max(0, ...this.tracks.map((track) => track.lengthSeconds));
  }

  async load(audioContext: AudioContext): Promise<void> {
    await Promise.all(this.tracks.map((track) => track.load(audioContext)));
    this.lengthSeconds = Math.max(0, ...this.tracks.map((track) => track.lengthSeconds));
  }

  schedule(audioContext: AudioContext, gainNode: GainNode, onEnded: () => void): ActivePlayback {
    const startAt = audioContext.currentTime + 0.08;
    const sources: AudioBufferSourceNode[] = [];

    this.tracks.forEach((track) => {
      track.samples.forEach((sample) => {
        const source = audioContext.createBufferSource();
        source.buffer = sample.buffer;
        source.connect(gainNode);
        source.start(startAt + sample.beat * BEAT_SECONDS);
        sources.push(source);
      });
    });

    const timer = window.setTimeout(onEnded, Math.ceil(this.lengthSeconds * 1000) + 120);
    return { startAt, sources, timer };
  }

  renderToPcm(): RenderedPcm {
    const sampleRate = this.getExportSampleRate();
    const frameCount = Math.max(1, Math.ceil(this.lengthSeconds * sampleRate));
    const left = new Float32Array(frameCount);
    const right = new Float32Array(frameCount);

    this.tracks.forEach((track) => {
      track.samples.forEach((sample) => {
        mixSample(left, right, sample, sampleRate);
      });
    });

    return { left, right, sampleRate };
  }

  private getExportSampleRate(): number {
    for (const track of this.tracks) {
      const firstSample = track.samples[0];
      if (firstSample) {
        return firstSample.buffer.sampleRate;
      }
    }

    return 44100;
  }
}

class TraxTrack {
  readonly items: TrackToken[];
  readonly sampleBaseUrl: string;
  samples: ScheduledSample[] = [];
  lengthSeconds = 0;

  constructor(
    items: TrackToken[],
    sampleBaseUrl: string,
    private allowSampleFallback: boolean
  ) {
    this.items = items;
    this.sampleBaseUrl = sampleBaseUrl;
    this.lengthSeconds = items.reduce((total, item) => total + item.length * BEAT_SECONDS, 0);
  }

  async load(audioContext: AudioContext): Promise<void> {
    const decoded = await Promise.all(
      this.items.map(async (item) => ({
        item,
        buffer: await loadSampleBuffer(
          audioContext,
          sampleUrl(this.sampleBaseUrl, item.id),
          this.allowSampleFallback
        ),
      }))
    );

    let beat = 0;
    this.samples = [];

    decoded.forEach(({ item, buffer }) => {
      const sampleBeats = durationToBeats(buffer.duration);
      const repeats = Math.max(1, Math.round(item.length / sampleBeats));

      for (let i = 0; i < repeats; i += 1) {
        this.samples.push({ buffer, beat });
        beat += sampleBeats;
      }
    });

    this.lengthSeconds = beat * BEAT_SECONDS;
  }
}

const sampleCache = new Map<string, Promise<AudioBuffer>>();

async function loadSampleBuffer(
  audioContext: AudioContext,
  url: string,
  allowFallback: boolean
): Promise<AudioBuffer> {
  const cacheKey = `${allowFallback ? 'fallback' : 'strict'}:${url}`;

  if (allowFallback && isDemoSampleUrl(url)) {
    if (!sampleCache.has(cacheKey)) {
      sampleCache.set(cacheKey, Promise.resolve(createSilentBuffer(audioContext)));
    }

    return sampleCache.get(cacheKey)!;
  }

  if (!sampleCache.has(cacheKey)) {
    const promise = fetch(url, { mode: 'cors' })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Could not fetch ${url} (${response.status})`);
        }
        return response.arrayBuffer();
      })
      .then((arrayBuffer) => audioContext.decodeAudioData(arrayBuffer))
      .catch((error) => {
        if (!allowFallback) {
          throw error;
        }

        return createSilentBuffer(audioContext);
      });

    sampleCache.set(cacheKey, promise);
  }

  return sampleCache.get(cacheKey)!;
}

function createSilentBuffer(audioContext: AudioContext): AudioBuffer {
  return audioContext.createBuffer(
    1,
    Math.ceil(audioContext.sampleRate * BEAT_SECONDS),
    audioContext.sampleRate
  );
}

function isDemoSampleUrl(url: string): boolean {
  return /(^|\/)demo\/samples\//.test(url);
}

function sampleUrl(baseUrl: string, id: string): string {
  return baseUrl.replace(/\/?$/, '/') + `sound_machine_sample_${id}.mp3`;
}

function durationToBeats(durationSeconds: number): number {
  if (durationSeconds < 2.1) {
    return 1;
  }
  if (durationSeconds < 4.1) {
    return 2;
  }
  if (durationSeconds < 6.1) {
    return 3;
  }
  return 4;
}

function mixSample(
  left: Float32Array,
  right: Float32Array,
  sample: ScheduledSample,
  outputSampleRate: number
): void {
  const buffer = sample.buffer;
  const startFrame = Math.round(sample.beat * BEAT_SECONDS * outputSampleRate);
  const leftSource = buffer.getChannelData(0);
  const rightSource = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : leftSource;
  const rateRatio = buffer.sampleRate / outputSampleRate;
  const outputFrames = Math.ceil(buffer.length / rateRatio);

  for (let i = 0; i < outputFrames; i += 1) {
    const outputIndex = startFrame + i;
    if (outputIndex >= left.length) {
      break;
    }

    const sourceIndex = Math.min(buffer.length - 1, Math.floor(i * rateRatio));
    left[outputIndex] += leftSource[sourceIndex];
    right[outputIndex] += rightSource[sourceIndex];
  }
}
