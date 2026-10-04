import type { Cell, LevelDef } from '../content/schemas';

export interface Point {
  x: number;
  y: number;
}

export interface PathPose extends Point {
  /** Heading in radians, 0 = +x, measured toward +y. */
  angle: number;
}

export interface PathGeometry {
  /** Waypoints in world units (cell centres). */
  points: Point[];
  /** Cumulative distance at each waypoint; `distances[0]` is 0. */
  distances: number[];
  /** Total length in world units. */
  length: number;
}

export function cellCenter(cell: Cell, tileSize: number): Point {
  return { x: (cell.col + 0.5) * tileSize, y: (cell.row + 0.5) * tileSize };
}

export function buildPath(level: LevelDef): PathGeometry {
  const points = level.path.map((cell) => cellCenter(cell, level.grid.tileSize));
  const distances = [0];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!;
    const b = points[i]!;
    distances.push(distances[i - 1]! + Math.hypot(b.x - a.x, b.y - a.y));
  }
  return { points, distances, length: distances[distances.length - 1]! };
}

/** Position and heading at distance `t` along the path, clamped to its ends. */
export function poseAt(path: PathGeometry, t: number): PathPose {
  const { points, distances } = path;
  let i = 1;
  while (i < points.length - 1 && distances[i]! < t) i++;
  const a = points[i - 1]!;
  const b = points[i]!;
  const segStart = distances[i - 1]!;
  const segLength = distances[i]! - segStart;
  const f = segLength === 0 ? 0 : Math.min(Math.max((t - segStart) / segLength, 0), 1);
  return {
    x: a.x + (b.x - a.x) * f,
    y: a.y + (b.y - a.y) * f,
    angle: Math.atan2(b.y - a.y, b.x - a.x),
  };
}

/** The Slot whose cell contains the world point, if any. */
export function slotAt(level: LevelDef, x: number, y: number): string | null {
  const col = Math.floor(x / level.grid.tileSize);
  const row = Math.floor(y / level.grid.tileSize);
  return level.slots.find((s) => s.col === col && s.row === row)?.id ?? null;
}
