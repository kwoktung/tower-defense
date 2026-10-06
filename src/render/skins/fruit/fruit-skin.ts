import type { Skin, SkinTheme } from '../../skin';
import { preloadFruit } from './atlas';
import { playFruitEffect } from './effects';
import { createFruitEnemyView } from './enemy-view';
import { createFruitMap } from './map-view';
import { palette, uiFont } from './palette';
import { createFruitProjectileView } from './projectile-view';
import { createFruitTowerView } from './tower-view';
import { createVectorIcon, type IconStyle } from '../vector-icons';

const theme: SkinTheme = {
  colors: {
    background: palette.grass,
    path: palette.path,
    slot: palette.slot,
    slotHover: palette.slotHover,
    text: palette.text,
    textMuted: palette.textMuted,
    gold: palette.gold,
    hudPanel: palette.hudPanel,
    button: palette.button,
    buttonHover: palette.buttonHover,
    buttonDisabled: palette.buttonDisabled,
    selection: palette.selection,
    range: palette.rangePreview,
    danger: palette.danger,
    overlay: palette.overlay,
  },
  fonts: { ui: uiFont },
};

/** Chunky, outlined icons to match the cartoon art. */
const iconStyle: IconStyle = {
  heart: palette.iconHeart,
  coin: palette.gold,
  coinEdge: palette.iconCoinEdge,
  flag: palette.iconFlag,
  flagPole: palette.pathEdge,
  glyph: palette.text,
  upgrade: palette.hpBar,
  fallback: palette.fallback,
  outline: { color: palette.iconOutline, width: 1.5 },
};

/**
 * Original chibi fruit-orchard art (blueberry, pineapple and lemon towers against caterpillars,
 * fruit flies and armoured beetles), generated with Gemini and packed by `pnpm art:fruit`.
 */
export const fruitSkin: Skin = {
  id: 'fruit',
  theme,
  preload: preloadFruit,
  createMap: createFruitMap,
  createTowerView: createFruitTowerView,
  createEnemyView: createFruitEnemyView,
  createProjectileView: createFruitProjectileView,
  playEffect: playFruitEffect,
  createIcon: (scene, name, size) => createVectorIcon(scene, name, size, iconStyle),
};
