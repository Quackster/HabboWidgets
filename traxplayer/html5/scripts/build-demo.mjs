import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const demoDir = path.join(projectRoot, 'demo');

function getDemoHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Habbo Trax Player Demo</title>
  <link rel="stylesheet" href="./habbo-trax-player.css">
  <script>
    window.HabboTraxPlayerConfig = {
      assetsPath: '',
      songUrl: 'demo/song.txt',
      sampleUrl: 'demo/samples/',
      debug: true,
      allowSampleFallback: true
    };
  </script>
</head>
<body>
  <div id="trax-player-container"></div>
  <script src="./habbo-trax-player.iife.js"></script>
</body>
</html>
`;
}

async function main() {
  await fs.mkdir(demoDir, { recursive: true });
  await fs.copyFile(
    path.join(distDir, 'habbo-trax-player.iife.js'),
    path.join(demoDir, 'habbo-trax-player.iife.js')
  );
  await fs.copyFile(
    path.join(distDir, 'habbo-trax-player.css'),
    path.join(demoDir, 'habbo-trax-player.css')
  );
  await fs.cp(path.join(distDir, 'flash'), path.join(demoDir, 'flash'), { recursive: true });
  await fs.cp(path.join(distDir, 'demo'), path.join(demoDir, 'demo'), { recursive: true });
  await fs.writeFile(path.join(demoDir, 'index.html'), getDemoHtml(), 'utf8');
  console.log('[build-demo] Created demo/');
}

main().catch((error) => {
  console.error('[build-demo] Failed to build demo output');
  console.error(error);
  process.exitCode = 1;
});
