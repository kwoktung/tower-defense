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
    waves: z
      .array(
        z.object({
          groups: z
            .array(
              z.object({
                kind: z.string().min(1),
                count: z.int().positive(),
                intervalSec: z.number().positive(),
              }),
            )
            .min(1),
        }),
      )
      .min(1),
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

/** One Tower level's full stats. */
const TowerLevelSchema = z.object({
  /** Level 1: the build cost. Higher levels: the cost of upgrading to this level. */
  cost: z.int().nonnegative(),
  /** World units. */
  range: z.number().positive(),
  damage: z.number().positive(),
  cooldownSec: z.number().positive(),
  /** World units per second. */
  projectileSpeed: z.number().positive(),
  attack: z.discriminatedUnion('mode', [
    z.object({ mode: z.literal('single') }),
    z.object({ mode: z.literal('splash'), radius: z.number().positive() }),
  ]),
});

export const UnitCatalogSchema = z.object({
  /** Share of everything spent on a Tower that selling it returns (its Sell value). */
  sellRefundRatio: z.number().min(0).max(1),
  towers: z.record(
    z.string().min(1),
    z.object({
      /** Shown on the HUD build button. */
      name: z.string().min(1),
      /** Stats per Tower level; `levels[0]` is level 1. No art: Skins decide looks (ADR-0002). */
      levels: z.array(TowerLevelSchema).min(1),
    }),
  ),
  enemies: z.record(
    z.string().min(1),
    z.object({
      hp: z.number().positive(),
      /** World units per second. */
      speed: z.number().positive(),
      reward: z.int().nonnegative(),
      leakDamage: z.int().positive(),
    }),
  ),
});

export type LevelDef = z.infer<typeof LevelDefSchema>;
export type UnitCatalog = z.infer<typeof UnitCatalogSchema>;
export type EnemyDef = UnitCatalog['enemies'][string];
export type TowerDef = UnitCatalog['towers'][string];
export type TowerLevelDef = TowerDef['levels'][number];
export type WaveDef = LevelDef['waves'][number];
export type SlotDef = LevelDef['slots'][number];
export type Cell = z.infer<typeof CellSchema>;

/** Stats of a `kind` Tower at `level` (1-based); undefined for unknown kinds or levels. */
export function towerStats(
  units: UnitCatalog,
  kind: string,
  level: number,
): TowerLevelDef | undefined {
  return units.towers[kind]?.levels[level - 1];
}

/** Gold spent on a `kind` Tower that has reached `level`: build cost plus every upgrade. */
export function towerInvestment(units: UnitCatalog, kind: string, level: number): number {
  const levels = units.towers[kind]?.levels.slice(0, level) ?? [];
  return levels.reduce((sum, l) => sum + l.cost, 0);
}

export class ContentError extends Error {
  override name = 'ContentError';
}

function parse<T>(schema: z.ZodType<T>, raw: unknown, label: string): T {
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new ContentError(`Invalid ${label}:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

export function parseUnitCatalog(raw: unknown): UnitCatalog {
  return parse(UnitCatalogSchema, raw, 'unit catalog');
}

/**
 * Validates raw level data against its schema and against the Unit catalog it references,
 * throwing a ContentError that names every offending field path.
 */
export function parseLevel(raw: unknown, source: string, units: UnitCatalog): LevelDef {
  const level = parse(LevelDefSchema, raw, `level "${source}"`);
  const unknownKinds = level.waves.flatMap((wave, w) =>
    wave.groups.flatMap((group, g) =>
      group.kind in units.enemies
        ? []
        : [`  ✖ Unknown enemy kind "${group.kind}"\n    → at waves[${w}].groups[${g}].kind`],
    ),
  );
  if (unknownKinds.length) {
    throw new ContentError(`Invalid level "${source}":\n${unknownKinds.join('\n')}`);
  }
  return level;
}
