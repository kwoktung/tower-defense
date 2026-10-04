import { parseLevel } from '../../content/schemas';
import type { LevelRepository } from '../types';

export class UnknownLevelError extends Error {
  override name = 'UnknownLevelError';
}

/** Reads levels from raw JSON sources (bundled files by default), validating on every read. */
export function createLocalLevelRepository(sources: Record<string, unknown>): LevelRepository {
  return {
    async getLevel(id) {
      if (!(id in sources)) throw new UnknownLevelError(`Unknown level "${id}"`);
      return parseLevel(sources[id], id);
    },
  };
}
