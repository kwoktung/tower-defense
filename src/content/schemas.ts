import { z } from 'zod';

const CellSchema = z.object({ col: z.int(), row: z.int() });

export const LevelDefSchema = z
  .object({
    id: z.string().min(1),
    grid: z.object({
      cols: z.int().positive(),
      rows: z.int().positive(),
      tileSize: z.int().positive(),
    }),
    /** Waypoints at cell centres. May start/end one cell outside the grid so enemies walk in and out. */
    path: z.array(CellSchema).min(2),
    slots: z.array(CellSchema.extend({ id: z.string().min(1) })).min(1),
    startGold: z.int().nonnegative(),
    startLives: z.int().positive(),
  })
  .superRefine((level, ctx) => {
    const { cols, rows } = level.grid;

    level.path.forEach((cell, i) => {
      const prev = level.path[i - 1];
      if (prev && prev.col !== cell.col && prev.row !== cell.row) {
        ctx.addIssue({
          code: 'custom',
          path: ['path', i],
          message: 'Consecutive path waypoints must share a row or a column',
        });
      }
    });

    const pathCells = new Set<string>();
    level.path.forEach((cell, i) => {
      const next = level.path[i + 1];
      if (!next) return;
      const dc = Math.sign(next.col - cell.col);
      const dr = Math.sign(next.row - cell.row);
      for (let c = cell.col, r = cell.row; ; c += dc, r += dr) {
        pathCells.add(`${c},${r}`);
        if (c === next.col && r === next.row) break;
      }
    });

    const seen = new Set<string>();
    level.slots.forEach((slot, i) => {
      if (slot.col < 0 || slot.col >= cols || slot.row < 0 || slot.row >= rows) {
        ctx.addIssue({ code: 'custom', path: ['slots', i], message: 'Slot is outside the grid' });
      }
      if (pathCells.has(`${slot.col},${slot.row}`)) {
        ctx.addIssue({ code: 'custom', path: ['slots', i], message: 'Slot overlaps the path' });
      }
      if (seen.has(slot.id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['slots', i, 'id'],
          message: `Duplicate slot id "${slot.id}"`,
        });
      }
      seen.add(slot.id);
    });
  });

export type LevelDef = z.infer<typeof LevelDefSchema>;
export type SlotDef = LevelDef['slots'][number];
export type Cell = z.infer<typeof CellSchema>;

export class ContentError extends Error {
  override name = 'ContentError';
}

/** Validates raw level data, throwing a ContentError that names every offending field path. */
export function parseLevel(raw: unknown, source: string): LevelDef {
  const result = LevelDefSchema.safeParse(raw);
  if (!result.success) {
    throw new ContentError(`Invalid level "${source}":\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
