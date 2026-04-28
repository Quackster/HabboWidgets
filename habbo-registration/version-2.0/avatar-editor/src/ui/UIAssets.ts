import { SpriteLoader } from '../rendering/SpriteLoader';

/**
 * UI asset mapping: symbolic name -> decompiled image file number.
 * These IDs come from decompiled/symbolClass/symbols.csv
 * Image filename = (csvId - 2).png for decompiled UI assets.
 */
const CLOUD_FRAME_COUNT = 13;

const UI_ASSET_MAP: Record<string, number> = {
  // Preview icon
  'prevIconBg': 14,              // 16-2=14
  'prevIconMask': 17,            // 19-2=17
  // Randomize
  'randomizeButtonBg': 139,      // 141-2=139
  // HC tag
  'hcTagSmall': 22,              // 24-2=22
  // Rotation arrows
  'rotateArrowLeft': 25,         // 27-2=25
  'rotateArrowRight': 28,        // 30-2=28
  // Part arrows
  'partArrowLeft': 31,           // 33-2=31
  'partArrowLeftReactive': 34,   // 36-2=34
  'partArrowRight': 37,          // 39-2=37
  'partArrowRightReactive': 40,  // 42-2=40
  // Part selected
  'partSelected': 43,            // 45-2=43
  // Main menu backgrounds
  'mainMenuMainSelectedBg': 46,  // 48-2=46
  'mainMenuSubSelectedBg': 49,   // 51-2=49
  // Color chooser arrows
  'arrowSmallLeft': 52,          // 54-2=52
  'arrowSmallLeftReactive': 55,  // 57-2=55
  'arrowSmallRightReactive': 58, // 60-2=58
  'arrowSmallRight': 61,         // 63-2=61
  // Main menu unselected
  'mainMenuMainUnselectedBg': 64,// 66-2=64
  // Main menu icons
  'mainMenuMain_body_Selected': 67,     // 69-2=67
  'mainMenuMain_body_Unselected': 70,   // 72-2=70
  'mainMenuMain_chest_Selected': 73,    // 75-2=73
  'mainMenuMain_chest_Unselected': 76,  // 78-2=76
  'mainMenuMain_legs_Unselected': 79,   // 81-2=79
  'mainMenuMain_legs_Selected': 82,     // 84-2=82
  'mainMenuMain_head_Unselected': 85,   // 87-2=85
  'mainMenuMain_head_Selected': 88,     // 90-2=88
  // Sub menu icons
  'mainMenuSub_sh': 91,         // 93-2=91
  'mainMenuSub_male': 94,       // 96-2=94
  'mainMenuSub_lg': 97,         // 99-2=97
  'mainMenuSub_female': 100,    // 102-2=100
  'mainMenuSub_ha': 103,        // 105-2=103
  'mainMenuSub_hr': 106,        // 108-2=106
  'mainMenuSub_ea': 109,        // 111-2=109
  'mainMenuSub_wa': 112,        // 114-2=112
  'mainMenuSub_ca': 115,        // 117-2=115
  'mainMenuSub_he': 118,        // 120-2=118
  'mainMenuSub_fa': 121,        // 123-2=121
  'mainMenuSub_ch': 124,        // 126-2=124
  // Part remove
  'partRemove': 127,             // 129-2=127
  // Color chooser
  'colorBg': 130,               // 132-2=130
  'colorSelect': 133,           // 135-2=133
  // Gender selected bg
  'mainMenuSubGenderSelectedBg': 136, // 138-2=136
  // Floor tile (direct timeline image, not symbolClass-mapped)
  'floorTile': 152,
};

export class UIAssets {
  private spriteLoader: SpriteLoader;
  private cloudFrames: HTMLImageElement[] = [];

  constructor(spriteLoader: SpriteLoader) {
    this.spriteLoader = spriteLoader;
  }

  async loadAll(onProgress?: (loaded: number, total: number) => void): Promise<void> {
    const filenames = Object.values(UI_ASSET_MAP).map(id => `${id}.png`);
    // Add cloud frame filenames
    for (let i = 0; i < CLOUD_FRAME_COUNT; i++) {
      filenames.push(`cloud/cloud_${i}.png`);
    }
    await this.spriteLoader.preloadUIAssets(filenames, onProgress);

    // Cache cloud frame references in order
    this.cloudFrames = [];
    for (let i = 0; i < CLOUD_FRAME_COUNT; i++) {
      const img = this.spriteLoader.getUIAsset(`cloud/cloud_${i}.png`);
      if (img) this.cloudFrames.push(img);
    }
  }

  get(name: string): HTMLImageElement | null {
    const id = UI_ASSET_MAP[name];
    if (id === undefined) return null;
    return this.spriteLoader.getUIAsset(`${id}.png`);
  }

  getCloudFrames(): HTMLImageElement[] {
    return this.cloudFrames;
  }

  getAssetMap(): Record<string, number> {
    return UI_ASSET_MAP;
  }
}
