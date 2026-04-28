export interface EditorConfig {
  figure: string;
  gender: string;
  userHasClub: boolean;
  showClubSelections: boolean;
  showRotationArrows: boolean;
  assetsPath: string;
  assetBundlePath: string;
  menuState?: string;
  localization: LocalizationConfig;
}

export interface LocalizationConfig {
  randomize: string;
  boy: string;
  girl: string;
}

export const DEFAULT_CONFIG: EditorConfig = {
  figure: '',
  gender: 'U',
  userHasClub: false,
  showClubSelections: true,
  showRotationArrows: false,
  assetsPath: '',
  assetBundlePath: 'assets.zip',
  localization: {
    randomize: 'Randomize',
    boy: 'Boy',
    girl: 'Girl',
  },
};

export const CANVAS_WIDTH_WITH_ARROWS = 495;
export const CANVAS_WIDTH_NO_ARROWS = 435; // Flash stage width (confirmed from decompiled SWF)
export const CANVAS_HEIGHT = 400; // Flash stage is 435x400 (confirmed from FFDEC frame exports)

export const AVATAR_CANVAS_WIDTH = 64;
export const AVATAR_CANVAS_HEIGHT = 106;
export const AVATAR_CANVAS_OFFSET_X = 0;
export const AVATAR_CANVAS_OFFSET_Y = -8; // translates to height + offset = 106 + (-8) = 98

export const FLIP_WIDTH = 68;
export const AVATAR_SCALE = 2;
export const AVATAR_DISPLAY_X_ARROWS = 323;
export const AVATAR_DISPLAY_X_NO_ARROWS = 303;
export const AVATAR_DISPLAY_Y = 70;

// Randomize button position (from AvatarEditorUi.as lines 127-128)
export const RANDOMIZE_X = 307;
export const RANDOMIZE_Y = 46;

// Cloud animation bounds (from AvatarEditorUi.as lines 434-435)
export const CLOUD_AREA_X = 305;
export const CLOUD_AREA_WIDTH = 80;  // random(80) → range 305-385
export const CLOUD_AREA_Y = 85;
export const CLOUD_AREA_HEIGHT = 180; // random(180) → range 85-265

export const DEFAULT_DIRECTION = 4;
export const DEFAULT_SET_TYPE = 'hd';

export const FLIP_LIST = [0, 1, 2, 3, 2, 1, 0, 7];

export const MAIN_MENU_STRUCT = [
  { id: 'body', type: 'gender', items: ['male', 'female'] },
  { id: 'head', type: 'part', items: ['hr', 'ha', 'he', 'ea', 'fa'] },
  { id: 'chest', type: 'part', items: ['ch', 'ca'] },
  { id: 'legs', type: 'part', items: ['lg', 'sh', 'wa'] },
];
