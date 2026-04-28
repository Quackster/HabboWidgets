import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { zipSync } from 'fflate';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const assetSourceDir = path.join(projectRoot, 'assets');
const distDir = path.join(projectRoot, 'dist');
const demoDir = path.join(projectRoot, 'demo');
const bundlePath = path.join(distDir, 'assets.zip');
const copiedAssetDirs = ['data', 'sprites', 'ui'];

function getDemoHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Habbo Avatar Editor Demo</title>
  <style>
    body {
      margin: 0;
      background: #333;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      font-family: Verdana, sans-serif;
    }

    #editor-container {
      background: #fff;
      padding: 10px;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div id="editor-container"></div>
  <script>
    window.HabboEditor = {
      setGenderAndFigure: function(gender, figure) {
        console.log('HabboEditor.setGenderAndFigure:', gender, figure);
      },
      setAllowedToProceed: function(allowed) {
        console.log('HabboEditor.setAllowedToProceed:', allowed);
      },
      setEditorState: function(state) {
        console.log('HabboEditor.setEditorState:', state);
      },
      showHabboClubNotice: function() {
        console.log('HabboEditor.showHabboClubNotice');
      },
      hideHabboClubNotice: function() {
        console.log('HabboEditor.hideHabboClubNotice');
      },
      showOldFigureNotice: function() {
        console.log('HabboEditor.showOldFigureNotice');
      }
    };

    window.HabboEditorConfig = {
      userHasClub: false,
      showClubSelections: true,
      assetsPath: '',
      assetBundlePath: 'assets.zip'
    };
  </script>
  <script src="./habbo-editor.iife.js"></script>
</body>
</html>
`;
}

async function collectFiles(dir, baseDir = dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...await collectFiles(fullPath, baseDir));
      continue;
    }

    const relativePath = path.relative(baseDir, fullPath).split(path.sep).join('/');
    files.push({ fullPath, relativePath });
  }

  return files;
}

async function main() {
  const files = await collectFiles(assetSourceDir);
  const archiveEntries = {};

  for (const file of files) {
    if (file.relativePath.startsWith('frames/')) {
      continue;
    }

    const bytes = await fs.readFile(file.fullPath);
    archiveEntries[file.relativePath] = new Uint8Array(bytes);
  }

  const archive = zipSync(archiveEntries, { level: 9 });
  await fs.writeFile(bundlePath, Buffer.from(archive));

  for (const dirName of copiedAssetDirs) {
    await fs.rm(path.join(distDir, dirName), { recursive: true, force: true });
  }

  await fs.rm(demoDir, { recursive: true, force: true });
  await fs.mkdir(demoDir, { recursive: true });
  await fs.copyFile(path.join(distDir, 'habbo-editor.iife.js'), path.join(demoDir, 'habbo-editor.iife.js'));
  await fs.copyFile(bundlePath, path.join(demoDir, 'assets.zip'));
  await fs.cp(path.join(distDir, 'frames'), path.join(demoDir, 'frames'), { recursive: true });
  await fs.writeFile(path.join(demoDir, 'index.html'), getDemoHtml(), 'utf8');

  const archiveSizeKb = (archive.byteLength / 1024).toFixed(1);
  console.log(`[asset-bundle] Wrote dist/assets.zip (${archiveSizeKb} KB)`);
  console.log('[asset-bundle] Created demo/');
}

main().catch((error) => {
  console.error('[asset-bundle] Failed to build asset bundle');
  console.error(error);
  process.exitCode = 1;
});
