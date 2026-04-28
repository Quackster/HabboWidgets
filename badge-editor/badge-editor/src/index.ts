import { loadExternalData } from './data/ExternalData';
import { loadLocalization, getText } from './data/Localization';
import { prepareRuntimeAssets } from './runtime/RuntimeAssetLoader';
import { preloadSprites, getUI } from './rendering/SpriteLoader';
import { renderBadgePreview } from './rendering/BadgeRenderer';
import { BadgeModel } from './model/BadgeModel';
import { on, EVT_REDRAW } from './model/EventBus';
import { getConfig, fireSave, fireCancel } from './api/Bridge';
import {
  initCanvas,
  setDrawCallback,
  clearRegions,
  requestRedraw,
} from './ui/CanvasManager';
import { drawLayerPanel } from './ui/LayerPanel';
import { drawColorPalette } from './ui/ColorPalette';
import { drawPositionGrid } from './ui/PositionGrid';
import { drawButtonBar } from './ui/ButtonBar';
import {
  DEFAULT_BADGE,
  NUM_SYMBOL_LAYERS,
  PREVIEW_SET_ORIGIN_X, PREVIEW_SET_ORIGIN_Y,
  COLOR_SET_ORIGIN_X, COLOR_SET_ORIGIN_Y,
  POS_SET_ORIGIN_X, POS_SET_ORIGIN_Y,
  PREVIEW_SCREEN_ORIGIN_X, PREVIEW_SCREEN_ORIGIN_Y,
  REG_PREVIEW_LAYER, REG_PREVIEW_SCREEN,
  DESCRIPTION_TXT_X, DESCRIPTION_TXT_Y,
  SYMBOLS_HEADER_X, SYMBOLS_HEADER_Y,
  POSITION_HEADER_X, POSITION_HEADER_Y,
  COLOURS_HEADER_X, COLOURS_HEADER_Y,
  BASE_HEADER_X, BASE_HEADER_Y,
  BASE_COLOURS_HEADER_X, BASE_COLOURS_HEADER_Y,
} from './config';

function fillTextWrapped(
  ctx: CanvasRenderingContext2D,
  text: string, x: number, y: number,
  maxWidth: number, lineHeight: number
): void {
  const words = text.split(' ');
  let line = '';
  let curY = y;
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, curY);
      line = word;
      curY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, curY);
}

async function init(): Promise<void> {
  const container = document.getElementById('editor-container');
  if (!container) {
    console.error('Badge editor: #editor-container not found');
    return;
  }

  await prepareRuntimeAssets();

  // Load data in parallel
  await Promise.all([loadExternalData(), loadLocalization(), preloadSprites()]);

  const model = new BadgeModel();

  // Parse initial badge data
  const cfg = getConfig();
  const badgeData = cfg.badge_data || DEFAULT_BADGE;
  model.deserialize(badgeData);

  // Init canvas
  const ctx = initCanvas(container);

  function draw(ctx: CanvasRenderingContext2D): void {
    clearRegions();

    // ── Text labels ──
    ctx.fillStyle = '#000000';
    ctx.font = '11px Verdana, Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    fillTextWrapped(ctx, getText('description_txt'), DESCRIPTION_TXT_X, DESCRIPTION_TXT_Y, 183, 13);

    ctx.font = 'bold 11px Verdana, Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(getText('symbols_header'), SYMBOLS_HEADER_X, SYMBOLS_HEADER_Y);
    ctx.fillText(getText('position_header'), POSITION_HEADER_X, POSITION_HEADER_Y);
    ctx.fillText(getText('colours_header'), COLOURS_HEADER_X, COLOURS_HEADER_Y);
    ctx.fillText(getText('base_header'), BASE_HEADER_X, BASE_HEADER_Y);
    ctx.fillText(getText('base_colours_header'), BASE_COLOURS_HEADER_X, BASE_COLOURS_HEADER_Y);

    // ── Symbol layers (0-3) ──
    // All draw functions receive the ORIGIN position of the parent sprite
    for (let i = 0; i < NUM_SYMBOL_LAYERS; i++) {
      const layer = model.layers[i];
      drawLayerPanel(ctx, layer, i, PREVIEW_SET_ORIGIN_X, PREVIEW_SET_ORIGIN_Y[i]);
      drawColorPalette(ctx, layer, i, COLOR_SET_ORIGIN_X, COLOR_SET_ORIGIN_Y[i]);
      drawPositionGrid(ctx, layer, i, POS_SET_ORIGIN_X, POS_SET_ORIGIN_Y[i]);
    }

    // ── Base layer (4) ──
    const baseLayer = model.layers[4];
    drawLayerPanel(ctx, baseLayer, 4, PREVIEW_SET_ORIGIN_X, PREVIEW_SET_ORIGIN_Y[4]);
    drawColorPalette(ctx, baseLayer, 4, COLOR_SET_ORIGIN_X, COLOR_SET_ORIGIN_Y[4]);

    // ── Combined badge preview ──
    // preview_screen (351, 40x40, regPt 20,20) contains 5 stacked preview_layer (350) instances
    // Draw the preview_layer background at the screen's origin - regPt
    const previewLayerImg = getUI('preview_layer');
    const plX = PREVIEW_SCREEN_ORIGIN_X - REG_PREVIEW_LAYER.x;
    const plY = PREVIEW_SCREEN_ORIGIN_Y - REG_PREVIEW_LAYER.y;
    ctx.drawImage(previewLayerImg, plX, plY);

    // Render all badge layers composited on the preview area
    // The preview area is 40x40 starting at the PNG top-left
    renderBadgePreview(
      ctx, model.layers,
      plX, plY,
      previewLayerImg.width,
      previewLayerImg.height
    );

    // ── Buttons ──
    drawButtonBar(
      ctx,
      () => fireSave(model.serialize()),
      () => fireCancel()
    );
  }

  setDrawCallback(draw);
  on(EVT_REDRAW, () => requestRedraw());
  requestRedraw();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => init());
} else {
  init();
}
