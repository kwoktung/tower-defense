import { parseLevel, parseUnitCatalog } from '../../content/schemas';
import type { LevelRepository } from '../types';

export class UnknownLevelError extends Error {
  override name = 'UnknownLevelError';
}

export interface LocalContentSources {
  levels: Record<string, unknown>;
  units: unknown;
}

/** Reads levels and units from raw JSON sources (bundled files by default), validating on every read. */
export function createLocalLevelRepository(sources: LocalContentSources): LevelRepository {
  const getUnitCatalog = async () => parseUnitCatalog(sources.units);
  return {
    getUnitCatalog,
    async getLevel(id) {
      if (!(id in sources.levels)) throw new UnknownLevelError(`Unknown level "${id}"`);
      return parseLevel(sources.levels[id], id, await getUnitCatalog());
    },
  };
}
