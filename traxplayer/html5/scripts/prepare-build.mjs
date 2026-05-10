import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

async function main() {
  await fs.rm(path.join(projectRoot, 'dist'), { recursive: true, force: true });
  await fs.rm(path.join(projectRoot, 'demo'), { recursive: true, force: true });
}

main().catch((error) => {
  console.error('[prepare-build] Failed to clean output folders');
  console.error(error);
  process.exitCode = 1;
});
