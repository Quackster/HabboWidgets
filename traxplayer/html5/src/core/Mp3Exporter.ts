import lamejs from '@breezystack/lamejs';
import { TraxSong } from './TraxSong';

const MP3_FRAME_SIZE = 1152;
const DEFAULT_BITRATE_KBPS = 128;

export async function exportSongAsMp3(song: TraxSong): Promise<Blob> {
  const rendered = song.renderToPcm();
  const encoder = new lamejs.Mp3Encoder(2, rendered.sampleRate, DEFAULT_BITRATE_KBPS);
  const chunks: Uint8Array[] = [];

  for (let offset = 0; offset < rendered.left.length; offset += MP3_FRAME_SIZE) {
    const left = rendered.left.subarray(offset, offset + MP3_FRAME_SIZE);
    const right = rendered.right.subarray(offset, offset + MP3_FRAME_SIZE);
    const encoded = encoder.encodeBuffer(floatToInt16(left), floatToInt16(right));

    if (encoded.length > 0) {
      chunks.push(toUint8Array(encoded));
    }
  }

  const finalChunk = encoder.flush();
  if (finalChunk.length > 0) {
    chunks.push(toUint8Array(finalChunk));
  }

  return new Blob(chunks.map(toArrayBuffer), { type: 'audio/mpeg' });
}

function floatToInt16(input: Float32Array): Int16Array {
  const output = new Int16Array(input.length);

  for (let i = 0; i < input.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, input[i]));
    output[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }

  return output;
}

function toUint8Array(input: Int8Array | Uint8Array): Uint8Array {
  return new Uint8Array(input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength));
}

function toArrayBuffer(input: Uint8Array): ArrayBuffer {
  const output = new ArrayBuffer(input.byteLength);
  new Uint8Array(output).set(input);
  return output;
}
