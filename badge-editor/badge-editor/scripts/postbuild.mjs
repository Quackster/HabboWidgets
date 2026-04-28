import { promises as fs } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { zipSync } from 'fflate';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, '..');
const assetsDir = join(projectRoot, 'assets');
const distDir = join(projectRoot, 'dist');
const demoSourceDir = join(projectRoot, 'demo');
const demoDistDir = join(distDir, 'demo');

async function getFilesRecursively(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...await getFilesRecursively(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

async function createAssetsZip() {
  const files = await getFilesRecursively(assetsDir);
  const archiveEntries = {};

  for (const filePath of files) {
    const relativePath = relative(assetsDir, filePath).replace(/\\/g, '/');
    archiveEntries[relativePath] = new Uint8Array(await fs.readFile(filePath));
  }

  const archive = zipSync(archiveEntries, { level: 9 });
  const archivePath = join(distDir, 'assets.zip');
  await fs.writeFile(archivePath, archive);
  return archivePath;
}

async function copyDirectory(sourceDir, targetDir) {
  await fs.rm(targetDir, { recursive: true, force: true });
  await fs.cp(sourceDir, targetDir, { recursive: true });
}

async function buildDemoPackage() {
  const bundlePath = await createAssetsZip();

  await fs.rm(demoDistDir, { recursive: true, force: true });
  await fs.mkdir(demoDistDir, { recursive: true });

  await fs.copyFile(join(distDir, 'badge-editor.js'), join(demoDistDir, 'badge-editor.js'));
  await fs.copyFile(bundlePath, join(demoDistDir, 'assets.zip'));
  await fs.copyFile(join(demoSourceDir, 'index.html'), join(demoDistDir, 'index.html'));
  await copyDirectory(join(distDir, 'data'), join(demoDistDir, 'data'));
  await copyDirectory(join(distDir, 'sprites'), join(demoDistDir, 'sprites'));
}

await buildDemoPackage();
