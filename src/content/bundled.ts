import { parseLevel, parseUnitCatalog, type LevelDef, type UnitCatalog } from './schemas';
import rawUnits from '../../content/units.json';

const rawLevels = import.meta.glob<unknown>('../../content/levels/*.json', {
  eager: true,
  import: 'default',
});

/** Raw bundled level JSON keyed by level id (the file name without extension). */
export const bundledLevelSources: Record<string, unknown> = Object.fromEntries(
  Object.entries(rawLevels).map(([file, raw]) => [file.replace(/^.*\/(.+)\.json$/, '$1'), raw]),
);

/** Raw bundled Unit catalog JSON. */
export const bundledUnitsSource: unknown = rawUnits;

/** Synchronous, validated access to the bundled Unit catalog — for Fixtures and stories. */
export function loadBundledUnits(): UnitCatalog {
  return parseUnitCatalog(bundledUnitsSource);
}

/** Synchronous, validated access to bundled levels — for Fixtures and stories, which bypass services. */
export function loadBundledLevel(id: string): LevelDef {
  if (!(id in bundledLevelSources)) throw new Error(`Unknown bundled level "${id}"`);
  return parseLevel(bundledLevelSources[id], id, loadBundledUnits());
}
