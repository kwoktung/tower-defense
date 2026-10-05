import { LevelProgressSchema } from '../level-progress';
import type { GameResult, KeyValueStorage, LevelProgress, ProgressStore } from '../types';

const KEY_PREFIX = 'td:progress:';

const rank = (r: GameResult) => [r.bestOutcome === 'won' ? 1 : 0, r.bestLivesLeft] as const;

function isBetter(next: GameResult, current: GameResult): boolean {
  const [a, b] = [rank(next), rank(current)];
  return a[0] !== b[0] ? a[0] > b[0] : a[1] > b[1];
}

/** Stores progress as JSON under `td:progress:<levelId>`. Unreadable entries count as no record. */
export function createLocalProgressStore(
  storage: KeyValueStorage,
  now: () => Date = () => new Date(),
): ProgressStore {
  const load = async (levelId: string): Promise<LevelProgress | null> => {
    const raw = storage.getItem(KEY_PREFIX + levelId);
    if (raw === null) return null;
    try {
      return LevelProgressSchema.parse(JSON.parse(raw));
    } catch {
      return null;
    }
  };

  return {
    load,
    async save(levelId, result) {
      const current = await load(levelId);
      if (current && !isBetter(result, current)) return current;
      const next: LevelProgress = { ...result, updatedAt: now().toISOString() };
      storage.setItem(KEY_PREFIX + levelId, JSON.stringify(next));
      return next;
    },
  };
}
