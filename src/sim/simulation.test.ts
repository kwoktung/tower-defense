import { describe, expect, it } from 'vitest';
import { loadBundledLevel } from '../content/bundled';
import { createSimulation } from './simulation';

const level = loadBundledLevel('level-1');

describe('createSimulation', () => {
  it("starts from the level's gold and lives, before the first wave, still playing", () => {
    const sim = createSimulation({ level, seed: 1 });

    expect(sim.state).toEqual({
      tick: 0,
      rngState: 1,
      gold: 120,
      lives: 10,
      waveIndex: -1,
      outcome: 'playing',
    });
  });

  it('can start from a given state without sharing it', () => {
    const initialState = { ...createSimulation({ level, seed: 1 }).state, gold: 999, tick: 42 };

    const sim = createSimulation({ level, seed: 1, initialState });
    initialState.gold = 0;

    expect(sim.state.gold).toBe(999);
    expect(sim.state.tick).toBe(42);
  });
});
