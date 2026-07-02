# Habbo Flash Widgets

Habbo Flash widgets ported to HTML5 via AI. This is a restoration project for education purposes, as Adobe Flash is EOL. All projects are written in TypeScript, built with Vite, and render entirely on `<canvas>` with no Flash dependency.

## Avatar Editor

### [Version 1.0](habbo-registration/version-1.0/)

Port of the original `HabboRegistration.swf` (v38, 2007). Uses the legacy numeric figure string format (`1750118022210132810129003`) and the older `figure_data_xml.xml` / `figure_editor.xml` data files that shipped with that SWF. Sprites and UI assets are extracted directly from the decompiled SWF via a bundled `extract-assets.ts` script.

### [Version 2.0](habbo-registration/version-2.0/)

Port of the later `HabboRegistration.swf` (v0.916). Uses the dot-delimited figure string format (`hd-180-1.ch-215-82.lg-270-82`) and the restructured `figuredata.xml` / `draworder.xml` data files. Includes Habbo Club item filtering, serialisable menu state, full localisation support, and a more complete callback interface via `window.HabboEditor`. Sprites are sourced from a separate `avatars_big` SWF.

## [Badge Editor](badge-editor/)

Port of the Flash-based `BadgeEditor.swf`. Lets users compose a group badge from layered symbols, bases, colours, and positions. See the [badge editor README](badge-editor/README.md) for build instructions, usage, and badge code format.

## [Habbos v2 Landing Widget](habbos_v2_landing/)

Port of the Flash-based `habbos_v2.swf` landing widget. Reuses the SWF-extracted UI assets, loads promo Habbo XML from Lisbon/Havana-style endpoints, and exposes a `window.HabboLandingWidget` embed API. See the [Habbos v2 README](habbos_v2_landing/README.md) for build instructions and integration options.

## Licence

See [LICENSE](LICENSE).
