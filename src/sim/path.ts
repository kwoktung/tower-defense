import type { Cell, LevelDef } from '../content/schemas';

export interface Point {
  x: number;
  y: number;
}

export interface PathGeometry {
  /** Waypoints in world units (cell centres). */
  points: Point[];
  /** Total length in world units. */
  length: number;
}

export function cellCenter(cell: Cell, tileSize: number): Point {
  return { x: (cell.col + 0.5) * tileSize, y: (cell.row + 0.5) * tileSize };
}

export function buildPath(level: LevelDef): PathGeometry {
  const points = level.path.map((cell) => cellCenter(cell, level.grid.tileSize));
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!;
    const b = points[i]!;
    length += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return { points, length };
}

/** The Slot whose cell contains the world point, if any. */
export function slotAt(level: LevelDef, x: number, y: number): string | null {
  const col = Math.floor(x / level.grid.tileSize);
  const row = Math.floor(y / level.grid.tileSize);
  return level.slots.find((s) => s.col === col && s.row === row)?.id ?? null;
}
