import { describe, expect, it } from 'vitest';
import { createServices } from '../create-services';
import type { KeyValueStorage } from '../types';

function memoryStorage(initial: Record<string, string> = {}): KeyValueStorage & {
  data: Record<string, string>;
} {
  const data = { ...initial };
  return {
    data,
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => void (data[key] = value),
  };
}

const progressWith = (storage = memoryStorage()) =>
  createServices({ kind: 'local', storage }).progress;

describe('local ProgressStore', () => {
  it('has no record for a level never finished', async () => {
    expect(await progressWith().load('level-1')).toBeNull();
  });

  it('records the first finished game and reads it back', async () => {
    const progress = progressWith();

    await progress.save('level-1', { bestOutcome: 'lost', bestLivesLeft: 0 });

    expect(await progress.load('level-1')).toEqual({
      bestOutcome: 'lost',
      bestLivesLeft: 0,
      updatedAt: expect.any(String),
    });
  });

  it('keeps progress separate per level, under a prefixed key', async () => {
    const storage = memoryStorage();
    const progress = progressWith(storage);

    await progress.save('level-1', { bestOutcome: 'won', bestLivesLeft: 3 });

    expect(Object.keys(storage.data)).toEqual(['td:progress:level-1']);
    expect(await progress.load('level-2')).toBeNull();
  });

  it.each([
    [
      'a win over a loss',
      { bestOutcome: 'lost', bestLivesLeft: 0 },
      { bestOutcome: 'won', bestLivesLeft: 1 },
    ],
    [
      'a win with more lives',
      { bestOutcome: 'won', bestLivesLeft: 3 },
      { bestOutcome: 'won', bestLivesLeft: 8 },
    ],
  ] as const)('replaces the record with a better result: %s', async (_, first, better) => {
    const progress = progressWith();
    await progress.save('level-1', first);

    const stored = await progress.save('level-1', better);

    expect(stored).toMatchObject(better);
    expect(await progress.load('level-1')).toMatchObject(better);
  });

  it.each([
    [
      'a loss after a win',
      { bestOutcome: 'won', bestLivesLeft: 1 },
      { bestOutcome: 'lost', bestLivesLeft: 0 },
    ],
    [
      'a win with fewer lives',
      { bestOutcome: 'won', bestLivesLeft: 8 },
      { bestOutcome: 'won', bestLivesLeft: 3 },
    ],
    [
      'the same result again',
      { bestOutcome: 'won', bestLivesLeft: 5 },
      { bestOutcome: 'won', bestLivesLeft: 5 },
    ],
  ] as const)('keeps the record for a worse or equal result: %s', async (_, first, worse) => {
    const progress = progressWith();
    const kept = await progress.save('level-1', first);

    const stored = await progress.save('level-1', worse);

    expect(stored).toEqual(kept);
    expect(await progress.load('level-1')).toEqual(kept);
  });

  it('treats an unreadable stored record as no record', async () => {
    const progress = progressWith(memoryStorage({ 'td:progress:level-1': '{not json' }));

    expect(await progress.load('level-1')).toBeNull();
    await progress.save('level-1', { bestOutcome: 'lost', bestLivesLeft: 0 });
    expect(await progress.load('level-1')).toMatchObject({ bestOutcome: 'lost' });
  });
});
