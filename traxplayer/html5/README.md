# Habbo Trax Player HTML5

Vite + TypeScript port of the extracted AS3 Trax Player widget.

The rendered widget follows the original SWF stage size and coordinates:

```text
209 x 66 px
```

The transport button is a single original-position button: it shows Play while stopped and Stop while playing.

## Install

```powershell
cd C:\SourceControl\HabboWidgets\traxplayer\html5
npm install
```

## Debug

```powershell
npm run dev
```

Open the Vite URL printed by the command, usually:

```text
http://localhost:5173/
```

The debug config in `index.html` loads the local fake/demo song from `assets/demo/song.txt`, served by Vite as:

```text
http://localhost:5173/demo/song.txt
```

The song uses the old Trax LoadVars format and points to sample ids loaded as:

```text
{sampleUrl}/sound_machine_sample_{id}.mp3
```

For debugging, `allowSampleFallback: true` lets the widget load and click even if the sample host is missing or blocked. Missing samples are replaced with silent buffers.

The bundled debug page intentionally uses `sampleUrl: 'demo/samples/'`, which does not need real MP3 files because fallback samples are enabled.

## Build

```powershell
npm run build
```

The build writes:

```text
dist/habbo-trax-player.iife.js
dist/habbo-trax-player.css
dist/flash/
dist/demo/song.txt
demo/index.html
demo/habbo-trax-player.iife.js
demo/habbo-trax-player.css
demo/flash/
demo/demo/song.txt
```

## Install The Built Widget

Copy the generated `demo/` folder or copy these build outputs into your target web root:

```text
habbo-trax-player.iife.js
habbo-trax-player.css
flash/
demo/song.txt
```

Include a container and configure the player before loading the script:

```html
<link rel="stylesheet" href="./habbo-trax-player.css">
<div id="trax-player-container"></div>
<script>
  window.HabboTraxPlayerConfig = {
    assetsPath: '',
    songUrl: 'demo/song.txt',
    sampleUrl: 'http://localhost/dcr/hof_furni/mp3/',
    debug: false,
    allowSampleFallback: false
  };
</script>
<script src="./habbo-trax-player.iife.js"></script>
```

For a real Trax song, replace `songUrl` with a URL that returns LoadVars data containing `status=0` and one or more `track1` through `track4` fields.

## Runtime API

The IIFE exposes `window.HabboTraxPlayer`.

```js
const container = document.getElementById('trax-player-container');
const player = new window.HabboTraxPlayer(container, {
  assetsPath: '',
  songUrl: 'demo/song.txt',
  sampleUrl: 'http://localhost/dcr/hof_furni/mp3/',
  allowSampleFallback: true
});

player.play();
player.stop();
player.setVolume(50);
player.load('demo/song.txt', 'http://localhost/dcr/hof_furni/mp3/');
```
