import { describe, expect, it } from 'vitest';
import { fixtures } from '../fixtures/named';
import { scenario } from '../fixtures/scenario';
import { createSimulation } from './simulation';
import type { SimEvent } from './types';

const TICKS_PER_SECOND = 60;
const ofType = <T extends SimEvent['type']>(events: SimEvent[], type: T) =>
  events.filter((e): e is Extract<SimEvent, { type: T }> => e.type === type);

/** Ticks at which each enemySpawned event happened while advancing one tick at a time. */
function spawnTicks(sim: ReturnType<typeof createSimulation>, ticks: number) {
  const result: { tick: number; kind: string }[] = [];
  for (let i = 0; i < ticks; i++) {
    for (const e of ofType(sim.advance(1), 'enemySpawned')) result.push({ tick: i, kind: e.kind });
  }
  return result;
}

describe('createSimulation', () => {
  it("starts from the level's gold and lives, before the first Wave, still playing", () => {
    const sim = createSimulation(fixtures.emptyMap());

    expect(sim.state).toMatchObject({
      tick: 0,
      gold: 120,
      lives: 10,
      wave: { index: -1, spawning: null },
      outcome: 'playing',
      enemies: [],
    });
  });

  it('starts from a Fixture state without sharing it', () => {
    const fixture = scenario().withLives(4).build();

    const sim = createSimulation(fixture);
    fixture.initialState.lives = 0;

    expect(sim.state.lives).toBe(4);
  });
});

describe('starting a Wave', () => {
  it('is allowed before the first Wave and reports waveStarted on the next advance', () => {
    const sim = createSimulation(fixtures.emptyMap());

    expect(sim.startNextWave()).toBe(true);
    expect(sim.state.wave.index).toBe(0);
    expect(ofType(sim.advance(1), 'waveStarted')).toEqual([{ type: 'waveStarted', index: 0 }]);
  });

  it('is refused while the current Wave is still spawning', () => {
    const sim = createSimulation(fixtures.emptyMap());
    sim.startNextWave();
    sim.advance(1);

    expect(sim.canStartNextWave()).toBe(false);
    expect(sim.startNextWave()).toBe(false);
  });

  it('is refused while enemies are on the field', () => {
    const sim = createSimulation(fixtures.oneOfEachEnemy());

    expect(sim.startNextWave()).toBe(false);
  });

  it('is allowed again once the Wave has fully spawned and the field is clear', () => {
    const sim = createSimulation(scenario().atWave(0).build());

    expect(sim.startNextWave()).toBe(true);
    expect(sim.state.wave.index).toBe(1);
  });

  it('is refused after the last Wave', () => {
    const sim = createSimulation(scenario().atWave(2).build());

    expect(sim.startNextWave()).toBe(false);
  });

  it('is refused once the game has ended', () => {
    const sim = createSimulation(
      scenario().withLives(1).withEnemies('fast', 1, { atPathT: 2430 }).build(),
    );
    sim.advance(1);

    expect(sim.state.outcome).toBe('lost');
    expect(sim.startNextWave()).toBe(false);
  });
});

describe('spawning', () => {
  it("spawns each group's count at its interval, starting on the first tick", () => {
    const sim = createSimulation(fixtures.emptyMap());
    sim.startNextWave();

    const spawns = spawnTicks(sim, 10 * TICKS_PER_SECOND);

    // Wave 1: 8 normal, 0.8 s apart.
    expect(spawns.map((s) => s.tick)).toEqual([0, 48, 96, 144, 192, 240, 288, 336]);
    expect(spawns.every((s) => s.kind === 'normal')).toBe(true);
    expect(sim.state.wave.spawning).toBeNull();
  });

  it('walks the spawn groups in order, keeping the previous interval between groups', () => {
    const sim = createSimulation(scenario().atWave(0).build());
    sim.startNextWave();

    const spawns = spawnTicks(sim, 20 * TICKS_PER_SECOND);

    // Wave 2: 10 normal 0.7 s apart, then 6 fast 0.5 s apart.
    expect(spawns.map((s) => s.kind)).toEqual([
      ...Array(10).fill('normal'),
      ...Array(6).fill('fast'),
    ]);
    expect(spawns[9]!.tick - spawns[8]!.tick).toBe(42);
    expect(spawns[10]!.tick - spawns[9]!.tick).toBe(42);
    expect(spawns[11]!.tick - spawns[10]!.tick).toBe(30);
  });

  it('spawns new enemies at the start of the Path with full hp', () => {
    const sim = createSimulation(fixtures.emptyMap());
    sim.startNextWave();
    sim.advance(1);

    expect(sim.state.enemies).toEqual([{ id: 1, kind: 'normal', hp: 40, maxHp: 40, pathT: 0 }]);
  });
});

describe('movement and Leaks', () => {
  it('moves each enemy along the Path at its speed', () => {
    const sim = createSimulation(fixtures.oneOfEachEnemy());

    sim.advance(TICKS_PER_SECOND);

    const [normal, fast] = sim.state.enemies;
    expect(normal!.pathT).toBeCloseTo(900 + 64);
    expect(fast!.pathT).toBeCloseTo(700 + 128);
  });

  it('removes an enemy that reaches the end of the Path and takes its leak damage from lives', () => {
    const sim = createSimulation(fixtures.enemyLeaking());
    const [leader] = sim.state.enemies;

    const events = sim.advance(TICKS_PER_SECOND);

    expect(ofType(events, 'enemyLeaked')[0]).toEqual({
      type: 'enemyLeaked',
      id: leader!.id,
      livesLost: 1,
    });
    expect(sim.state.enemies.map((e) => e.id)).not.toContain(leader!.id);
    expect(sim.state.lives).toBe(3 - ofType(events, 'enemyLeaked').length);
  });
});

describe('losing', () => {
  it('ends the game as lost the moment lives reach zero', () => {
    const sim = createSimulation(
      scenario()
        .atWave(0)
        .withLives(1)
        .withEnemies('normal', 2, { atPathT: 2431, spacing: 300 })
        .build(),
    );

    const events = sim.advance(1);

    expect(sim.state.outcome).toBe('lost');
    expect(sim.state.lives).toBe(0);
    expect(ofType(events, 'gameEnded')).toEqual([{ type: 'gameEnded', outcome: 'lost' }]);
  });

  it('freezes the state once the game has ended', () => {
    const sim = createSimulation(
      scenario()
        .atWave(0)
        .withLives(1)
        .withEnemies('normal', 2, { atPathT: 2431, spacing: 300 })
        .build(),
    );
    sim.advance(1);
    const frozen = structuredClone(sim.state);

    const events = sim.advance(TICKS_PER_SECOND);

    expect(events).toEqual([]);
    expect(sim.state).toEqual(frozen);
  });
});

describe('determinism', () => {
  it('produces identical states for the same seed and actions', () => {
    const run = () => {
      const sim = createSimulation(scenario({ seed: 7 }).build());
      const events: SimEvent[] = [];
      for (let wave = 0; wave < 3 && sim.state.outcome === 'playing'; wave++) {
        sim.startNextWave();
        events.push(...sim.advance(90 * TICKS_PER_SECOND));
      }
      return { state: sim.state, events };
    };

    const first = run();
    expect(first.state.outcome).toBe('lost');
    expect(run()).toEqual(first);
  });
});
