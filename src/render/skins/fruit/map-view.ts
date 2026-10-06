import type * as Phaser from 'phaser';
import type { LevelDef } from '../../../content/schemas';
import { buildPath, slotCenter } from '../../../sim/path';
import { colorNumber, type MapView, type SlotHover } from '../../skin';
import { ART_SCALE, ATLAS, DIRT, GRASS } from './atlas';
import { palette } from './palette';

/** Path band width as a fraction of the tile size (same footprint as the Polygon skin). */
const PATH_WIDTH = 0.6;
/** Darker rim around the path, in world units. */
const PATH_EDGE = 3;
/** Soil beds sit inside their cell with this margin, in world units. */
const SLOT_INSET = 5;

/**
 * Grass everywhere, a dirt path along the level's Path (one tiled strip per straight run plus a
 * square at each waypoint, all sharing the world-aligned texture so they join seamlessly), and a
 * soil bed on every Slot.
 */
export function createFruitMap(scene: Phaser.Scene, level: LevelDef): MapView {
  const { cols, rows, tileSize } = level.grid;
  const width = cols * tileSize;
  const height = rows * tileSize;
  const root = scene.add.container(0, 0);

  const grass = scene.add.tileSprite(0, 0, width, height, GRASS).setOrigin(0);
  grass.setTileScale(ART_SCALE);
  root.add(grass);

  const band = tileSize * PATH_WIDTH;
  const { points } = buildPath(level);
  const rects: { x: number; y: number; w: number; h: number }[] = [];
  points.forEach((p, i) => {
    rects.push({ x: p.x - band / 2, y: p.y - band / 2, w: band, h: band });
    const next = points[i + 1];
    if (!next) return;
    rects.push({
      x: Math.min(p.x, next.x) - band / 2,
      y: Math.min(p.y, next.y) - band / 2,
      w: Math.abs(next.x - p.x) + band,
      h: Math.abs(next.y - p.y) + band,
    });
  });
  const edge = scene.add.graphics();
  edge.fillStyle(colorNumber(palette.pathEdge), 0.55);
  for (const r of rects) {
    edge.fillRoundedRect(
      r.x - PATH_EDGE,
      r.y - PATH_EDGE,
      r.w + PATH_EDGE * 2,
      r.h + PATH_EDGE * 2,
      6,
    );
  }
  root.add(edge);
  for (const r of rects) {
    const dirt = scene.add.tileSprite(r.x, r.y, r.w, r.h, DIRT).setOrigin(0);
    // Offsetting each strip by its world position keeps the pattern continuous across strips.
    dirt.setTileScale(ART_SCALE).setTilePosition(r.x / ART_SCALE, r.y / ART_SCALE);
    root.add(dirt);
  }

  const size = tileSize - SLOT_INSET * 2;
  const beds = new Map<string, Phaser.GameObjects.Image>();
  for (const slot of level.slots) {
    const c = slotCenter(level, slot.id)!;
    const bed = scene.add.image(c.x, c.y, ATLAS, 'slot').setDisplaySize(size, size);
    beds.set(slot.id, bed);
    root.add(bed);
  }

  const hoverMark = scene.add.graphics().setDepth(3);
  return {
    setHover(hover: SlotHover | null) {
      hoverMark.clear();
      const c = hover ? slotCenter(level, hover.slotId) : undefined;
      if (!hover || !c) return;
      hoverMark.lineStyle(3, colorNumber(palette.slotHover), 0.95);
      hoverMark.strokeRoundedRect(c.x - size / 2, c.y - size / 2, size, size, 8);
    },
  };
}
