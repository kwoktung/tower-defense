import type * as Phaser from 'phaser';
import type { LevelDef } from '../../../content/schemas';
import { buildPath } from '../../../sim/path';
import { colorNumber, type MapView, type Skin, type SkinTheme } from '../../skin';

const theme: SkinTheme = {
  colors: {
    background: '#1e2430',
    path: '#c9b28a',
    slot: '#3d5a4a',
    slotHover: '#6fae8a',
    text: '#f8fafc',
    gold: '#fbbf24',
  },
  fonts: {
    ui: 'system-ui, sans-serif',
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
  const drawSlots = (hovered: string | null) => {
    slots.clear();
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

  return {
    setSlotHover: drawSlots,
    destroy: () => root.destroy(),
  };
}

export const polygonSkin: Skin = {
  id: 'polygon',
  theme,
  preload: () => {},
  createMap,
};
