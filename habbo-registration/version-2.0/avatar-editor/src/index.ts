import { EditorConfig, DEFAULT_CONFIG, DEFAULT_SET_TYPE, MAIN_MENU_STRUCT, CANVAS_WIDTH_WITH_ARROWS, CANVAS_WIDTH_NO_ARROWS, CANVAS_HEIGHT, AVATAR_DISPLAY_X_ARROWS, AVATAR_DISPLAY_X_NO_ARROWS } from './config';
import { AssetBundle } from './assets/AssetBundle';
import { FigureData } from './data/FigureData';
import { DrawOrder } from './data/DrawOrder';
import { SymbolMap } from './data/SymbolMap';
import { Figure } from './model/Figure';
import { EditorState, EventBus, SetTypeSelectedData, SetSelectedData, ColorSelectedData } from './model/EditorState';
import { SpriteLoader } from './rendering/SpriteLoader';
import { AvatarRenderer } from './rendering/AvatarRenderer';
import { PreviewIconRenderer } from './rendering/PreviewIconRenderer';
import { CanvasManager } from './ui/CanvasManager';
import { HitRegionManager } from './ui/HitRegion';
import { UIAssets } from './ui/UIAssets';
import { MainMenu } from './ui/MainMenu';
import { BodyPartMenu } from './ui/BodyPartMenu';
import { ColorChooserMenu } from './ui/ColorChooserMenu';
import { AvatarDisplay } from './ui/AvatarDisplay';
import { RandomizeButton } from './ui/RandomizeButton';
import { HabboEditorBridge } from './api/HabboEditorBridge';
import { loadFrames, startLoadingAnimation, stopLoadingAnimation } from './ui/LoadingScreen';
import { resolveAssetPath } from './utils/assetPaths';

export class HabboAvatarEditor {
  private config: EditorConfig;
  private state: EditorState;
  private spriteLoader: SpriteLoader;
  private avatarRenderer: AvatarRenderer;
  private previewIconRenderer: PreviewIconRenderer;
  private canvasManager!: CanvasManager;
  private hitRegions: HitRegionManager;
  private uiAssets!: UIAssets;
  private mainMenu!: MainMenu;
  private bodyPartMenu!: BodyPartMenu;
  private colorChooser!: ColorChooserMenu;
  private avatarDisplay!: AvatarDisplay;
  private randomizeButton!: RandomizeButton;
  private bridge: HabboEditorBridge;
  private container: HTMLElement;

  constructor(container: HTMLElement, options?: Partial<EditorConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...options };
    this.container = container;
    this.hitRegions = new HitRegionManager();
    this.state = new EditorState(this.config.userHasClub, this.config.showClubSelections);
    this.spriteLoader = new SpriteLoader(this.config.assetsPath);
    this.avatarRenderer = new AvatarRenderer(this.spriteLoader);
    this.previewIconRenderer = new PreviewIconRenderer(this.spriteLoader);
    this.bridge = new HabboEditorBridge();

    this.init();
  }

  private async tryLoadAssetBundle(assetsPath: string): Promise<AssetBundle | null> {
    const bundlePath = resolveAssetPath(assetsPath, this.config.assetBundlePath);
    if (!bundlePath) {
      return null;
    }

    try {
      const bundle = await AssetBundle.loadFromUrl(bundlePath);
      console.log(`[HabboEditor] Asset bundle loaded from ${bundlePath} (${bundle.fileCount()} files)`);
      return bundle;
    } catch (error) {
      console.warn(`[HabboEditor] Asset bundle unavailable, falling back to raw assets: ${bundlePath}`, error);
      return null;
    }
  }

  private async loadDataFiles(assetsPath: string, assetBundle: AssetBundle | null): Promise<void> {
    if (assetBundle) {
      FigureData.getInstance().loadFromText(assetBundle.getText('data/figuredata.xml'));
      DrawOrder.getInstance().loadFromText(assetBundle.getText('data/draworder.xml'));
      SymbolMap.getInstance().loadFromText(assetBundle.getText('data/symbols.csv'));
      SymbolMap.getInstance().loadOffsetsFromText(assetBundle.getText('data/spriteoffsets.csv'));
      return;
    }

    const dataPath = resolveAssetPath(assetsPath, 'data/');

    await Promise.all([
      FigureData.getInstance().loadFromUrl(dataPath + 'figuredata.xml'),
      DrawOrder.getInstance().loadFromUrl(dataPath + 'draworder.xml'),
      SymbolMap.getInstance().loadFromUrl(dataPath + 'symbols.csv'),
      SymbolMap.getInstance().loadOffsetsFromUrl(dataPath + 'spriteoffsets.csv'),
    ]);
  }

  private async init(): Promise<void> {
    const assetsPath = this.config.assetsPath;

    // Phase 0: Show loading screen immediately
    const showArrows = this.config.showRotationArrows;
    const canvasWidth = showArrows ? CANVAS_WIDTH_WITH_ARROWS : CANVAS_WIDTH_NO_ARROWS;
    const loadingCanvas = document.createElement('canvas');
    loadingCanvas.width = canvasWidth;
    loadingCanvas.height = CANVAS_HEIGHT;
    loadingCanvas.style.display = 'block';
    this.container.appendChild(loadingCanvas);

    await loadFrames(assetsPath);
    startLoadingAnimation(loadingCanvas);

    const MIN_LOADING_MS = 3000;
    const loadingStart = Date.now();

    // Phase 1: Load bundled assets if available
    const assetBundle = await this.tryLoadAssetBundle(assetsPath);
    this.spriteLoader.setAssetBundle(assetBundle);

    // Phase 2: Load data files
    await this.loadDataFiles(assetsPath, assetBundle);

    // Phase 3: Load sprites
    const symbolMap = SymbolMap.getInstance();
    const spriteFilenames = symbolMap.getAllNames().map(name => {
      const filename = symbolMap.getFilenameForName(name);
      return filename!;
    }).filter(Boolean);

    await this.spriteLoader.preloadAllSprites(spriteFilenames);
    console.log(`[HabboEditor] Loaded ${spriteFilenames.length} avatar sprites`);

    // Phase 4: Load UI assets
    this.uiAssets = new UIAssets(this.spriteLoader);
    await this.uiAssets.loadAll();

    console.log(`[HabboEditor] UI assets loaded`);

    // Ensure minimum loading screen display time
    const elapsed = Date.now() - loadingStart;
    if (elapsed < MIN_LOADING_MS) {
      await new Promise(resolve => setTimeout(resolve, MIN_LOADING_MS - elapsed));
    }

    // Remove loading screen
    stopLoadingAnimation();
    this.container.removeChild(loadingCanvas);

    // Phase 5: Initialize figure
    this.initFigure();
    console.log(`[HabboEditor] Figure: ${this.state.figure.getFigureString()} gender=${this.state.figure.getGender()}`);

    // Phase 6: Create UI
    this.createUI();

    // Phase 7: Start rendering
    this.canvasManager.setDrawCallback(() => this.drawAll());
    this.canvasManager.requestRedraw();

    // Phase 8: Initial bridge calls
    this.bridge.setGenderAndFigure(
      this.state.figure.getGender(),
      this.state.figure.getFigureString()
    );

    const clubOk = this.checkClubSetsStatus();
    if (clubOk) {
      this.bridge.setAllowedToProceed(false); // Init block active
    }

    // Phase 9: Restore menu state if provided
    if (this.config.menuState) {
      this.updatePartAndColorMenu(this.config.menuState);
    }
  }

  private initFigure(): void {
    const figureString = this.config.figure;
    const gender = this.config.gender;

    if (!figureString || !gender || figureString === '' || gender === '') {
      const g = (!gender || gender === '') ? 'U' : gender;
      this.state.figure = new Figure();
      this.state.figure.randomizeFigure(g, this.config.userHasClub && this.config.showClubSelections);
    } else {
      this.state.figure = new Figure(gender);
      const valid = this.state.figure.parseFigureString(figureString);
      if (!valid) {
        this.bridge.showOldFigureNotice();
      }
    }

    this.state.storedFemaleFigure = new Figure('F');
    this.state.storedMaleFigure = new Figure('M');
  }

  private createUI(): void {
    const showArrows = this.config.showRotationArrows;
    const canvasWidth = showArrows ? CANVAS_WIDTH_WITH_ARROWS : CANVAS_WIDTH_NO_ARROWS;
    const avatarDisplayX = showArrows ? AVATAR_DISPLAY_X_ARROWS : AVATAR_DISPLAY_X_NO_ARROWS;
    this.canvasManager = new CanvasManager(this.container, this.hitRegions, canvasWidth);

    // Main menu
    this.mainMenu = new MainMenu(
      0, 0,
      this.uiAssets,
      this.hitRegions,
      this.state.eventBus,
      this.config.localization
    );

    // Set initial gender sub-index
    const genderSubIdx = this.state.figure.getGender() === 'F' ? 1 : 0;
    this.mainMenu.showMenuIndex(0, genderSubIdx);

    // Body part menu - positioned so grid aligns with color chooser and main menu at x=18
    this.bodyPartMenu = new BodyPartMenu(
      9, 100,
      this.config.showClubSelections,
      this.uiAssets,
      this.hitRegions,
      this.state.eventBus,
      this.previewIconRenderer
    );
    this.initBodyPartMenu();

    // Color chooser (from AvatarEditorUi.as lines 133-134)
    this.colorChooser = new ColorChooserMenu(
      15, 270,
      this.uiAssets,
      this.hitRegions,
      this.state.eventBus
    );
    this.initColorChooser();

    // Avatar display
    this.avatarDisplay = new AvatarDisplay(
      this.uiAssets,
      this.hitRegions,
      this.state.eventBus,
      this.avatarRenderer,
      this.state.figure,
      this.state.avatarDirection,
      showArrows,
      avatarDisplayX
    );

    // Randomize button
    this.randomizeButton = new RandomizeButton(
      this.uiAssets,
      this.hitRegions,
      this.state.eventBus,
      this.config.localization,
      avatarDisplayX
    );

    // Wire events
    this.wireEvents();
  }

  private initBodyPartMenu(): void {
    const fd = FigureData.getInstance();
    const colorId = this.state.figure.getSetTypeColorId(DEFAULT_SET_TYPE);
    const colorData = fd.getColorData(colorId);
    const colorStr = colorData ? colorData.getColorStr() : 'FFFFFF';
    const setObj = this.state.figure.getSetItemByType(DEFAULT_SET_TYPE);
    const selectedSetId = setObj ? setObj.getSetId() : 0;
    const mandatory = fd.isSetTypeMandatory(DEFAULT_SET_TYPE);

    this.bodyPartMenu.showMenu(
      DEFAULT_SET_TYPE,
      this.state.figure.getGender(),
      colorStr,
      selectedSetId,
      mandatory
    );
  }

  private initColorChooser(): void {
    const fd = FigureData.getInstance();
    const paletteId = fd.getPaletteIdForSetType(DEFAULT_SET_TYPE);
    const colorId = this.state.figure.getSetTypeColorId(DEFAULT_SET_TYPE);

    this.colorChooser.showColorChooser(
      paletteId,
      colorId,
      DEFAULT_SET_TYPE,
      this.config.showClubSelections
    );
  }

  private wireEvents(): void {
    const bus = this.state.eventBus;

    bus.on('setTypeSelected', (data) => {
      this.handleSetTypeSelection(data as SetTypeSelectedData);
    });

    bus.on('setSelected', (data) => {
      this.handleSetSelection(data as SetSelectedData);
    });

    bus.on('colorSelected', (data) => {
      this.handleColorSelection(data as ColorSelectedData);
    });

    bus.on('randomizeAvatar', () => {
      this.handleRandomize();
    });

    bus.on('animationStart', () => {
      this.canvasManager.startAnimationLoop();
    });

    bus.on('animationEnd', () => {
      this.canvasManager.stopAnimationLoop();
    });

    bus.on('stateChanged', () => {
      this.canvasManager.requestRedraw();
    });
  }

  private handleSetTypeSelection(data: SetTypeSelectedData): void {
    let setType = data.setType;
    const oldGender = this.state.figure.getGender();
    let newGender = oldGender;

    // Handle gender switch
    if (setType === 'male' || setType === 'female') {
      newGender = setType === 'male' ? 'M' : 'F';
      setType = 'hd';
    }

    if (oldGender !== newGender) {
      const oldFigureStr = this.state.figure.getFigureString();

      if (newGender === 'M') {
        this.state.storedFemaleFigure.parseFigureString(oldFigureStr);
        this.state.figure.setGender(newGender);
        this.state.figure.parseFigureString(this.state.storedMaleFigure.getFigureString());
      } else {
        this.state.storedMaleFigure.parseFigureString(oldFigureStr);
        this.state.figure.setGender(newGender);
        this.state.figure.parseFigureString(this.state.storedFemaleFigure.getFigureString());
      }

      if (this.state.figure.getFigureString().length === 0) {
        this.state.figure.randomizeFigure(
          newGender,
          this.config.userHasClub && this.config.showClubSelections
        );
        this.checkClubSetsStatus();
      }

      this.bridge.setGenderAndFigure(
        this.state.figure.getGender(),
        this.state.figure.getFigureString()
      );
      this.bridge.setAllowedToProceed(true);
    }

    this.state.currentSetType = setType;

    // Update menus
    const fd = FigureData.getInstance();
    const mandatory = fd.isSetTypeMandatory(setType);
    const paletteId = fd.getPaletteIdForSetType(setType);
    const setItem = this.state.figure.getSetItemByType(setType);

    if (setItem) {
      const setId = setItem.getSetId();
      const colorId = setItem.getColorId();
      const colorData = fd.getColorData(colorId);
      const colorStr = colorData ? colorData.getColorStr() : 'FFFFFF';

      this.colorChooser.showColorChooser(paletteId, colorId, setType, this.config.showClubSelections);
      this.bodyPartMenu.showMenu(setType, newGender, colorStr, setId, mandatory);
    } else {
      const colors = fd.getColorsForPaletteId(paletteId, this.config.userHasClub, true);
      const colorId = colors.length > 0 ? colors[0].getID() : 0;
      const colorStr = colors.length > 0 ? colors[0].getColorStr() : 'FFFFFF';

      this.colorChooser.showColorChooser(paletteId, colorId, setType, this.config.showClubSelections);
      this.bodyPartMenu.showMenu(setType, newGender, colorStr, 0, mandatory);
    }

    // Update avatar display
    this.avatarDisplay.setFigure(this.state.figure);

    // Inform container of menu state
    const menuState = `${setType}-${this.mainMenu.getMenuMainOpenedIndex()}-${this.mainMenu.getMenuSubOpenedIndex()}`;
    this.bridge.setEditorState(menuState);

    this.canvasManager.requestRedraw();
  }

  private handleSetSelection(data: SetSelectedData): void {
    const fd = FigureData.getInstance();
    const setType = data.setType;
    let setId = data.setId;
    let allowMenuUpdate = true;

    const paletteId = fd.getPaletteIdForSetType(setType);
    let colorId = this.state.figure.getSetTypeColorId(setType);

    if (colorId === undefined || colorId === -1) {
      colorId = this.colorChooser.getCurrentSelectedColorId();
    }
    if (colorId === undefined || colorId === -1) {
      const colors = fd.getColorsForPaletteId(paletteId);
      if (colors.length > 0) {
        colorId = colors[0].getID();
        this.colorChooser.showColorChooser(
          paletteId, colorId, setType, this.config.showClubSelections
        );
      }
    }

    const colorData = fd.getColorData(colorId);
    const colorStr = colorData ? colorData.getColorStr() : 'FFFFFF';

    // Toggle deselection for non-mandatory types
    const currentItem = this.state.figure.getSetItemByType(setType);
    if (currentItem && setId === currentItem.getSetId()) {
      if (!fd.isSetTypeMandatory(setType)) {
        setId = 0;
        allowMenuUpdate = false;
        this.bodyPartMenu.clearSelection();
      }
    }

    if (setId === 0) {
      this.state.figure.removeSetItemByType(setType);
    } else {
      this.state.figure.setSetItem(setType, setId, colorId);
    }

    if (allowMenuUpdate) {
      this.bodyPartMenu.setSelection(setId);
      this.bodyPartMenu.setColor(colorStr);
    }

    this.bridge.setGenderAndFigure(
      this.state.figure.getGender(),
      this.state.figure.getFigureString()
    );
    this.avatarDisplay.setFigure(this.state.figure);
    this.checkClubSetsStatus();
    this.canvasManager.requestRedraw();
  }

  private handleColorSelection(data: ColorSelectedData): void {
    const colorStr = data.colorStr;
    const setType = data.targetSetType;
    const colorId = data.colorId;

    this.bodyPartMenu.setColor(colorStr);
    this.state.figure.setSetTypeColor(setType, colorId);

    this.bridge.setGenderAndFigure(
      this.state.figure.getGender(),
      this.state.figure.getFigureString()
    );
    this.avatarDisplay.setFigure(this.state.figure);
    this.checkClubSetsStatus();
    this.canvasManager.requestRedraw();
  }

  private handleRandomize(): void {
    this.state.figure.randomizeFigure(
      this.state.figure.getGender(),
      this.config.userHasClub && this.config.showClubSelections
    );

    this.bridge.setGenderAndFigure(
      this.state.figure.getGender(),
      this.state.figure.getFigureString()
    );

    this.avatarDisplay.setFigure(this.state.figure);
    this.updatePartAndColorMenu();
    this.canvasManager.requestRedraw();
  }

  private updatePartAndColorMenu(stateStr?: string): void {
    const fd = FigureData.getInstance();
    let setType = this.bodyPartMenu.getCurrentSetType();

    if (stateStr) {
      const parts = stateStr.split('-');
      const updateSetType = parts[0];
      const mainIdx = parseInt(parts[1], 10);
      const subIdx = parseInt(parts[2], 10);
      this.mainMenu.showMenuIndex(mainIdx, subIdx);

      // Validate the set type
      const setTypes = fd.getSetTypes();
      for (const [st] of setTypes) {
        if (st === updateSetType) {
          setType = updateSetType;
          break;
        }
      }
    }

    const gender = this.state.figure.getGender();
    const mandatory = fd.isSetTypeMandatory(setType);
    const paletteId = fd.getPaletteIdForSetType(setType);
    const setItem = this.state.figure.getSetItemByType(setType);

    let setId: number;
    let colorId: number;
    let colorStr: string;

    if (setItem) {
      setId = setItem.getSetId();
      colorId = setItem.getColorId();
      const colorData = fd.getColorData(colorId);
      colorStr = colorData ? colorData.getColorStr() : 'FFFFFF';
    } else {
      setId = 0;
      const colors = fd.getColorsForPaletteId(paletteId, this.config.userHasClub, true);
      colorId = colors.length > 0 ? colors[0].getID() : 0;
      colorStr = colors.length > 0 ? colors[0].getColorStr() : 'FFFFFF';
    }

    this.colorChooser.showColorChooser(paletteId, colorId, setType, this.config.showClubSelections);
    this.bodyPartMenu.showMenu(setType, gender, colorStr, setId, mandatory);
    this.checkClubSetsStatus();
    this.avatarDisplay.setFigure(this.state.figure);
  }

  private checkClubSetsStatus(): boolean {
    const clubSets = this.state.figure.getClubSets();
    if (clubSets.length > 0 && !this.config.userHasClub) {
      this.bridge.setAllowedToProceed(false);
      this.bridge.showHabboClubNotice();
      return false;
    }

    const clubColors = this.state.figure.getClubColors();
    if (clubColors.length > 0 && !this.config.userHasClub) {
      this.bridge.setAllowedToProceed(false);
      this.bridge.showHabboClubNotice();
      return false;
    }

    this.bridge.setAllowedToProceed(true);
    this.bridge.hideHabboClubNotice();
    return true;
  }

  private drawBorders(ctx: CanvasRenderingContext2D): void {
    const r = 8; // corner radius
    // Notch dimensions
    const notchHalfW = 12;
    const notchH = 8;
    const notchCenterX = 140;

    // Compute from grid layout
    const gridY = 100;
    const gridItemSize = 45;
    const gridMargin = 9;
    const gridRows = 3;
    const gridBottom = gridY + gridRows * gridItemSize + (gridRows - 1) * gridMargin; // 253
    const gridPadding = 6;
    const borderGap = 4;

    // --- Yellow border (sub-menu + body part grid, flush with tab bottoms at y=47) ---
    const yx = 3, yy = 47, yw = 291;
    const yellowBottom = gridBottom + gridPadding; // 259
    const yh = yellowBottom - yy; // 212
    const yBottom = yy + yh;

    // --- Grey sub-menu bar behind yellow border ---
    const subBarY = 50;
    const subBarH = 36; // Part type height (40px) - 4px
    ctx.beginPath();
    ctx.moveTo(yx + r, subBarY);
    ctx.lineTo(yx + yw - r, subBarY);
    ctx.arcTo(yx + yw, subBarY, yx + yw, subBarY + r, r);
    ctx.lineTo(yx + yw, subBarY + subBarH - r);
    ctx.arcTo(yx + yw, subBarY + subBarH, yx + yw - r, subBarY + subBarH, r);
    ctx.lineTo(yx + r, subBarY + subBarH);
    ctx.arcTo(yx, subBarY + subBarH, yx, subBarY + subBarH - r, r);
    ctx.lineTo(yx, subBarY + r);
    ctx.arcTo(yx, subBarY, yx + r, subBarY, r);
    ctx.closePath();
    ctx.fillStyle = '#E5E3E1';
    ctx.fill();

    // --- Yellow border (no notch — flat bottom, gap for selected tab) ---
    const selectedTabIndex = this.mainMenu.getMenuMainOpenedIndex();
    const tabX = 18 + selectedTabIndex * 65; // MAIN_OFFSET_X + index * (MAIN_ITEM_WIDTH + MAIN_ITEM_MARGIN)
    const tabW = 60; // MAIN_ITEM_WIDTH

    ctx.beginPath();
    // Start at left edge, just below top-left corner
    ctx.moveTo(yx, yy + r);
    ctx.arcTo(yx, yy, yx + r, yy, r);
    // Top edge left of selected tab
    ctx.lineTo(tabX, yy);
    // Gap: move across selected tab without drawing
    ctx.moveTo(tabX + tabW, yy);
    // Top edge right of selected tab → top-right corner
    ctx.lineTo(yx + yw - r, yy);
    ctx.arcTo(yx + yw, yy, yx + yw, yy + r, r);
    // Right edge → bottom-right corner
    ctx.lineTo(yx + yw, yBottom - r);
    ctx.arcTo(yx + yw, yBottom, yx + yw - r, yBottom, r);
    // Bottom edge → bottom-left corner
    ctx.lineTo(yx + r, yBottom);
    ctx.arcTo(yx, yBottom, yx, yBottom - r, r);
    // Left edge back up
    ctx.lineTo(yx, yy + r);
    ctx.strokeStyle = '#FFCC00';
    ctx.lineWidth = 3;
    ctx.stroke();

    // --- Black border (bottom area: color palette, 9px padding around palette) ---
    const bx = 3, bw = 291;
    const colorPaletteY = yellowBottom + borderGap + 9; // colorChooserY
    const colorPaletteH = 4 * 27 + 3 * 2; // 4 rows × 27px + 3 gaps × 2px = 114
    const by = colorPaletteY - 9;
    const bh = 9 + colorPaletteH + 9; // 132
    const bTop = by;

    // White-filled notch to erase yellow border behind it
    ctx.beginPath();
    ctx.moveTo(notchCenterX - notchHalfW, bTop);
    ctx.lineTo(notchCenterX, bTop - notchH);
    ctx.lineTo(notchCenterX + notchHalfW, bTop);
    ctx.closePath();
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    // Black border with upward notch
    ctx.beginPath();
    ctx.moveTo(bx + r, bTop);
    ctx.lineTo(notchCenterX - notchHalfW, bTop);
    ctx.lineTo(notchCenterX, bTop - notchH);
    ctx.lineTo(notchCenterX + notchHalfW, bTop);
    ctx.lineTo(bx + bw - r, bTop);
    ctx.arcTo(bx + bw, bTop, bx + bw, bTop + r, r);
    ctx.lineTo(bx + bw, bTop + bh - r);
    ctx.arcTo(bx + bw, bTop + bh, bx + bw - r, bTop + bh, r);
    ctx.lineTo(bx + r, bTop + bh);
    ctx.arcTo(bx, bTop + bh, bx, bTop + bh - r, r);
    ctx.lineTo(bx, bTop + r);
    ctx.arcTo(bx, bTop, bx + r, bTop, r);
    ctx.closePath();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  private drawAll(): void {
    const ctx = this.canvasManager.ctx;

    // Draw borders behind everything
    this.drawBorders(ctx);

    // Draw avatar display (with floor tile and rotation arrows)
    this.avatarDisplay.draw(ctx);

    // Draw randomize button
    this.randomizeButton.draw(ctx);

    // Draw main menu (tabs + sub-menu)
    this.mainMenu.draw(ctx);

    // Draw body part grid
    this.bodyPartMenu.draw(ctx);

    // Draw color chooser
    this.colorChooser.draw(ctx);

    // Draw cloud animations on top
    this.randomizeButton.drawClouds(ctx);
  }

  // Public API
  getFigureString(): string {
    return this.state.figure.getFigureString();
  }

  getGender(): string {
    return this.state.figure.getGender();
  }
}

// Auto-instantiate if container exists (for dev)
declare global {
  interface Window {
    HabboAvatarEditor: typeof HabboAvatarEditor;
  }
}

window.HabboAvatarEditor = HabboAvatarEditor;

// Auto-init: reads config from window.HabboEditorConfig if present
const container = document.getElementById('editor-container');
if (container) {
  const cfg = (window as any).HabboEditorConfig || {};
  new HabboAvatarEditor(container, cfg);
}
