import type * as Phaser from 'phaser';
import type { LevelDef } from '../../../content/schemas';
import { buildPath, slotCenter } from '../../../sim/path';
import { colorNumber, type MapView, type Skin, type SkinTheme, type SlotHover } from '../../skin';
import { playEffect } from './effects';
import { createEnemyView } from './enemy-view';
import { createTowerView } from './tower-view';
import { palette, uiFont } from './palette';
import { createProjectileView } from './projectile-view';

const theme: SkinTheme = {
  colors: {
    background: palette.background,
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
  fonts: {
    ui: uiFont,
  },
};

/** Path band width as a fraction of the tile size. */
const PATH_WIDTH = 0.6;
/** Slot outline inset from the cell edge, in world units. */
const SLOT_INSET = 6;

function createMap(scene: Phaser.Scene, level: LevelDef): MapView {
  const { cols, rows, tileSize } = level.grid;
  const root = scene.add.container(0, 0);

  const ground = scene.add.graphics();
  ground.fillStyle(colorNumber(theme.colors.background));
  ground.fillRect(0, 0, cols * tileSize, rows * tileSize);

  // Axis-aligned segments (guaranteed by the level schema) drawn as rectangles,
  // plus a square at every waypoint so corners join cleanly.
  const band = tileSize * PATH_WIDTH;
  const { points } = buildPath(level);
  ground.fillStyle(colorNumber(theme.colors.path));
  points.forEach((p, i) => {
    ground.fillRect(p.x - band / 2, p.y - band / 2, band, band);
    const next = points[i + 1];
    if (!next) return;
    const x = Math.min(p.x, next.x) - band / 2;
    const y = Math.min(p.y, next.y) - band / 2;
    ground.fillRect(x, y, Math.abs(next.x - p.x) + band, Math.abs(next.y - p.y) + band);
  });

  const slots = scene.add.graphics();
  const range = scene.add.graphics().setDepth(3);
  const drawSlots = (hover: SlotHover | null) => {
    const hovered = hover?.slotId ?? null;
    slots.clear();
    range.clear();
    const c = hovered ? slotCenter(level, hovered) : undefined;
    if (c && hover?.rangePreview) {
      range.fillStyle(colorNumber(palette.rangePreview), 0.12);
      range.fillCircle(c.x, c.y, hover.rangePreview);
      range.lineStyle(1, colorNumber(palette.rangePreview), 0.6);
      range.strokeCircle(c.x, c.y, hover.rangePreview);
    }
    for (const slot of level.slots) {
      const isHovered = slot.id === hovered;
      const x = slot.col * tileSize + SLOT_INSET;
      const y = slot.row * tileSize + SLOT_INSET;
      const size = tileSize - SLOT_INSET * 2;
      if (isHovered) {
        slots.fillStyle(colorNumber(theme.colors.slotHover), 0.25);
        slots.fillRect(x, y, size, size);
      }
      slots.lineStyle(2, colorNumber(isHovered ? theme.colors.slotHover : theme.colors.slot));
      slots.strokeRect(x, y, size, size);
    }
  };
  drawSlots(null);

  root.add([ground, slots]);

  return { setHover: drawSlots };
}

export const polygonSkin: Skin = {
  id: 'polygon',
  theme,
  preload: () => {},
  createMap,
  createTowerView,
  createEnemyView,
  createProjectileView,
  playEffect,
};
