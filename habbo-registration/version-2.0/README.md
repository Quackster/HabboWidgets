# Habbo Avatar Editor

TypeScript and HTML Canvas replacement for the Flash-based `HabboRegistration.swf` (v0.916) avatar editor. Renders entirely on a `<canvas>` element with no Flash dependency.

## Screenshot

<img width="573" height="464" alt="chrome_izNUc7FTHe" src="https://github.com/user-attachments/assets/b4d6cfdc-4943-43c6-884e-d3e04ee8488b" />


## Requirements

- Node.js 18+
- npm

## Building

```
cd avatar-editor
npm install
npm run build
```

This runs the TypeScript compiler followed by a Vite IIFE build. Output goes to `avatar-editor/dist/habbo-editor.iife.js`.

The build also creates:

- `avatar-editor/dist/assets.zip` - bundled runtime data, sprites, and UI assets
- `avatar-editor/demo/` - self-contained static demo (`index.html`, `habbo-editor.iife.js`, `assets.zip`, `frames/`)

To serve the built demo locally:

```
cd avatar-editor
npm run serve
```

For local development with hot reload:

```
cd avatar-editor
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

## Assets

Source assets live in `avatar-editor/assets/`. The build compresses the runtime data, sprite, and UI files into `dist/assets.zip`, containing:

- `data/figuredata.xml` - part/set/colour definitions (originally from Habbo)
- `data/draworder.xml` - layer draw ordering per direction
- `data/symbols.csv` - sprite name to filename mapping
- `data/spriteoffsets.csv` - sprite x/y offsets extracted from the decompiled SWF
- `sprites/` - individual avatar part PNGs
- `ui/` - UI element PNGs (tabs, buttons, borders, icons)
The original `frames/` loading animation stays as regular static files so the existing loading screen can start immediately while the editor downloads and extracts `assets.zip`.

At runtime the editor prefers `assets.zip`, extracts it in-browser, and keeps the original frame-based loading animation active until extraction and asset preloading finish. During local Vite dev it can still fall back to raw asset files.

## Usage

### Replacing the Flash object

Remove the Flash `<object>`/`<embed>` tag and replace it with a container div and two script blocks.

The first script defines `window.HabboEditor`, which is the callback interface the editor uses to communicate state changes back to your page. The second script loads the built JS file.

```html
<div id="editor-container"></div>

<script>
  // Callback interface - the editor calls these as the user makes changes.
  // In the original SWF these were ExternalInterface calls.
  window.HabboEditor = {
    setGenderAndFigure: function(gender, figure) {
      // Called whenever the figure or gender changes.
      // gender: 'M' or 'F'
      // figure: Habbo figure string, e.g. 'hd-180-1.ch-215-82.lg-270-82'
    },
    setAllowedToProceed: function(allowed) {
      // Called to indicate whether the current figure is valid for submission.
      // allowed: true/false
    },
    setEditorState: function(state) {
      // Called with a serialised menu state string for save/restore.
    },
    showHabboClubNotice: function() {
      // Called when the user selects a Habbo Club item they don't own.
    },
    hideHabboClubNotice: function() {
      // Called when the user deselects the Habbo Club item.
    },
    showOldFigureNotice: function() {
      // Called when the provided figure string can't be fully parsed.
    }
  };

  // Editor config
  window.HabboEditorConfig = {
    // figure: 'hd-180-1.ch-215-82.lg-270-82',
    // gender: 'M',
    userHasClub: false,
    showClubSelections: true,
    assetsPath: '',
    assetBundlePath: 'assets.zip',
  };
</script>

<script src="habbo-editor.iife.js"></script>
```

The editor attaches itself to the `#editor-container` div automatically.

### Config options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `figure` | string | `''` | Habbo figure string to load. If empty, the editor picks a random figure on startup. |
| `gender` | string | `'U'` | `'M'`, `'F'`, or `'U'` (unset). If unset with no figure, gender is also randomised. |
| `userHasClub` | boolean | `false` | Whether the user has a Habbo Club membership. When false, selecting HC items triggers `showHabboClubNotice`. |
| `showClubSelections` | boolean | `true` | Whether HC items appear in the menus at all. Set to false to hide them entirely. |
| `assetsPath` | string | `''` | Base path for the `data/`, `sprites/`, and `ui/` asset folders. Relative to the page. |
| `assetBundlePath` | string | `'assets.zip'` | Zip bundle to fetch before startup. Relative to `assetsPath` unless absolute. If unavailable, the editor falls back to raw asset files. |
| `menuState` | string | (none) | Serialised menu state to restore (as previously returned by `setEditorState`). |
| `localization` | object | (see below) | UI text strings. |

#### Localisation

```js
localization: {
  randomize: 'Randomize',
  boy: 'Boy',
  girl: 'Girl',
}
```

### Reading the result

After the editor loads, the instance is available and exposes two methods:

```js
// The editor auto-instantiates, but also calls window.HabboEditor.setGenderAndFigure
// on every change, so you typically just listen to the callback.
```

The `setGenderAndFigure` callback is the primary way to get the figure string. It fires on every change (part selection, colour change, gender switch, randomise).

## Project structure

```
avatar-editor/
  src/
    index.ts              - Entry point, editor class, render loop
    config.ts             - Config types and constants
    api/
      HabboEditorBridge.ts - window.HabboEditor callback wrapper
    data/
      FigureData.ts       - Parses figuredata.xml (parts, sets, palettes)
      DrawOrder.ts        - Parses draworder.xml (layer ordering)
      SymbolMap.ts        - Parses symbols.csv and spriteoffsets.csv
      FigureDataSet.ts    - Individual figure set
      FigureDataPart.ts   - Individual figure part
      FigureDataColor.ts  - Palette colour entry
    model/
      Figure.ts           - Figure string parsing, randomisation, gender handling
      FigureSetItem.ts    - Set item within a figure
      EditorState.ts      - Shared editor state and event bus
    rendering/
      AvatarRenderer.ts   - Full avatar rendering (all parts, directions, flipping)
      PreviewIconRenderer.ts - Small preview icon rendering for the part grid
      SpriteLoader.ts     - PNG sprite loading and caching
      ColorTint.ts        - Pixel-level colour multiplication
    ui/
      CanvasManager.ts    - Canvas setup, hit testing, input handling
      MainMenu.ts         - Top-level tabs (body/head/chest/legs) and sub-tabs
      BodyPartMenu.ts     - Part selection grid with paging
      ColorChooserMenu.ts - Colour palette grid with paging
      AvatarDisplay.ts    - Avatar preview with floor tile and rotation arrows
      RandomizeButton.ts  - Randomise button with cloud animation
      UIAssets.ts         - UI image loading from decompiled SWF assets
      HitRegion.ts        - Click/hover region management
  assets/                 - Source runtime assets used for dev and bundle generation
  dist/                   - Library build output (`habbo-editor.iife.js`, `assets.zip`, `frames/`)
  demo/                   - Self-contained static demo output for `npm run serve`
```

## Origin

The source data comes from two decompiled SWFs:

- `decompiled/` - `HabboRegistration.swf` (the editor UI, ActionScript 2)
- `avatars_big/` - Avatar sprite sheet SWF (all body part images)

These were decompiled with FFDEC. The `avatars_big/shapes/` SVG files provide the sprite offset positions via their `patternTransform` matrix values.
