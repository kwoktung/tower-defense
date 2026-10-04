import { parseLevel, type LevelDef } from './schemas';

const rawLevels = import.meta.glob<unknown>('../../content/levels/*.json', {
  eager: true,
  import: 'default',
});

/** Raw bundled level JSON keyed by level id (the file name without extension). */
export const bundledLevelSources: Record<string, unknown> = Object.fromEntries(
  Object.entries(rawLevels).map(([file, raw]) => [file.replace(/^.*\/(.+)\.json$/, '$1'), raw]),
);

/** Synchronous, validated access to bundled levels — for Fixtures and stories, which bypass services. */
export function loadBundledLevel(id: string): LevelDef {
  if (!(id in bundledLevelSources)) throw new Error(`Unknown bundled level "${id}"`);
  return parseLevel(bundledLevelSources[id], id);
}
