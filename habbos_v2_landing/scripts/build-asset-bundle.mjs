import { promises as fs } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { zipSync } from 'fflate';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, '..');
const assetsDir = join(projectRoot, 'assets');
const distDir = join(projectRoot, 'dist');

await fs.mkdir(assetsDir, { recursive: true });

const files = await collectFiles(assetsDir);
const archiveEntries = {};

for (const filePath of files) {
  const relativePath = relative(assetsDir, filePath).replace(/\\/g, '/');
  archiveEntries[relativePath] = new Uint8Array(await fs.readFile(filePath));
}

const archive = zipSync(archiveEntries, { level: 9 });
await fs.writeFile(join(assetsDir, 'assets.zip'), Buffer.from(archive));

try {
  await fs.mkdir(distDir, { recursive: true });
  await fs.writeFile(join(distDir, 'assets.zip'), Buffer.from(archive));
} catch (error) {
  if (error?.code !== 'ENOENT') {
    throw error;
  }
}

const archiveSizeKb = (archive.byteLength / 1024).toFixed(1);
console.log(`[asset-bundle] Wrote assets.zip (${archiveSizeKb} KB)`);

async function collectFiles(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectFiles(fullPath));
    } else if (entry.isFile() && !entry.name.endsWith('.zip')) {
      files.push(fullPath);
    }
  }

  return files;
}
