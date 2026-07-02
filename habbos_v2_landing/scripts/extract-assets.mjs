import { promises as fs } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';
import { PNG } from 'pngjs';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, '..');
const swfPath = join(projectRoot, 'habbos_v2.swf');
const assetsDir = join(projectRoot, 'assets');
const uiDir = join(assetsDir, 'ui');

const bitmapNames = new Map([
  [1, 'loading-3.png'],
  [2, 'bg-top.png'],
  [3, 'button-bg.png'],
  [4, 'bg-bottom.png'],
  [5, 'loading-2.png'],
  [6, 'loading-4.png'],
  [7, 'loading-1.png'],
  [8, 'button-arrow.png'],
]);

await fs.mkdir(uiDir, { recursive: true });
await fs.rm(join(assetsDir, 'avatars'), { recursive: true, force: true });
await fs.rm(join(assetsDir, 'promo_habbos.xml'), { force: true });

const swf = await fs.readFile(swfPath);
if (swf.subarray(0, 3).toString('latin1') !== 'CWS') {
  throw new Error('Expected compressed CWS SWF.');
}

const body = inflateSync(swf.subarray(8));
let offset = getFirstTagOffset(body);

while (offset < body.length) {
  const record = body.readUInt16LE(offset);
  offset += 2;
  const code = record >> 6;
  let length = record & 0x3f;
  if (length === 0x3f) {
    length = body.readUInt32LE(offset);
    offset += 4;
  }

  const data = body.subarray(offset, offset + length);
  offset += length;

  if (code === 36) {
    await extractLosslessBitmap(data);
  }

  if (code === 0) {
    break;
  }
}

console.log('[extract-assets] Wrote assets/');

function getFirstTagOffset(data) {
  let bit = 0;
  const readBits = (count) => {
    let value = 0;
    for (let i = 0; i < count; i += 1) {
      const byte = data[Math.floor(bit / 8)];
      const shift = 7 - (bit % 8);
      value = (value << 1) | ((byte >> shift) & 1);
      bit += 1;
    }
    return value;
  };

  const nbits = readBits(5);
  readBits(nbits);
  readBits(nbits);
  readBits(nbits);
  readBits(nbits);
  if (bit % 8) {
    bit += 8 - (bit % 8);
  }

  return Math.floor(bit / 8) + 4;
}

async function extractLosslessBitmap(data) {
  const characterId = data.readUInt16LE(0);
  const format = data[2];
  const width = data.readUInt16LE(3);
  const height = data.readUInt16LE(5);
  const filename = bitmapNames.get(characterId);
  if (!filename || format !== 5) {
    return;
  }

  const raw = inflateSync(data.subarray(7));
  const png = new PNG({ width, height });

  for (let source = 0, target = 0; source < raw.length; source += 4, target += 4) {
    png.data[target] = raw[source + 1];
    png.data[target + 1] = raw[source + 2];
    png.data[target + 2] = raw[source + 3];
    png.data[target + 3] = raw[source];
  }

  await fs.writeFile(join(uiDir, filename), PNG.sync.write(png));
}
