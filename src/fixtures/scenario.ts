import { loadBundledLevel, loadBundledUnits } from '../content/bundled';
import { towerStats, type LevelDef, type UnitCatalog, type WaveDef } from '../content/schemas';
import { createInitialState, createSimulation, type SimulationInput } from '../sim/simulation';
import { secondsToTicks } from '../sim/time';
import type { Outcome, SimState, SpawnCursor } from '../sim/types';

/** One moment of play, ready for `createSimulation(fixture)` in tests or to render in a story. */
export type Fixture = Required<SimulationInput>;

export interface EnemyPlacement {
  /** Distance along the Path of the first (leading) enemy. */
  atPathT: number;
  /** Gap between consecutive enemies; later ones are placed behind the leader. Default 32. */
  spacing?: number;
  /** Current hp as a fraction of max hp. Default 1. */
  hpRatio?: number;
  /** A Slow already on every placed enemy. */
  slow?: { factor: number; durationSec: number };
}

/**
 * Builds a Fixture step by step, starting from the level's initial state:
 *
 *   scenario().withLives(1).withEnemies('normal', 3, { atPathT: 2400 }).build()
 */
export class ScenarioBuilder {
  private level: LevelDef;
  readonly units: UnitCatalog;
  private state: SimState;

  constructor(private readonly seed: number) {
    this.units = loadBundledUnits();
    this.level = loadBundledLevel('level-1');
    this.state = createInitialState(this.level, seed);
  }

  withGold(gold: number): this {
    this.state.gold = gold;
    return this;
  }

  withLives(lives: number): this {
    this.state.lives = lives;
    return this;
  }

  withOutcome(outcome: Outcome): this {
    this.state.outcome = outcome;
    return this;
  }

  /**
   * Replaces the level's Waves, so a rule can be tested on Waves of its own instead of depending
   * on how the bundled level is tuned.
   */
  withWaves(waves: WaveDef[]): this {
    this.level = { ...this.level, waves: structuredClone(waves) };
    return this;
  }

  /** Marks the level's last Wave as current with all of its enemies already spawned. */
  atLastWave(): this {
    return this.atWave(this.level.waves.length - 1);
  }

  /** Marks `index` as the current Wave with all of its enemies already spawned. */
  atWave(index: number): this {
    this.state.wave = { index, spawning: null, autoStartTicks: null };
    return this;
  }

  /** Puts a tower of `level` (default 1) on a Slot without paying for it. */
  withTower(kind: string, slotId: string, level = 1): this {
    if (!this.units.towers[kind]) throw new Error(`Unknown tower kind "${kind}"`);
    if (!towerStats(this.units, kind, level)) {
      throw new Error(`Tower kind "${kind}" has no level ${level}`);
    }
    if (!this.level.slots.some((s) => s.id === slotId)) throw new Error(`Unknown slot "${slotId}"`);
    this.state.towers.push({
      id: this.state.nextId++,
      kind,
      slotId,
      level,
      cooldownTicks: 0,
      targetId: null,
    });
    return this;
  }

  /** Puts the Auto start countdown at `ticks` before the next Wave. */
  withAutoStartIn(ticks: number): this {
    this.state.wave.autoStartTicks = ticks;
    return this;
  }

  /** Marks the current Wave as still spawning from the given cursor. */
  withSpawning(cursor: SpawnCursor): this {
    this.state.wave.spawning = { ...cursor };
    return this;
  }

  withEnemies(kind: string, count: number, placement: EnemyPlacement): this {
    const def = this.units.enemies[kind];
    if (!def) throw new Error(`Unknown enemy kind "${kind}"`);
    const { atPathT, spacing = 32, hpRatio = 1, slow } = placement;
    for (let i = 0; i < count; i++) {
      this.state.enemies.push({
        id: this.state.nextId++,
        kind,
        hp: def.hp * hpRatio,
        maxHp: def.hp,
        pathT: Math.max(0, atPathT - i * spacing),
        slow: slow ? { factor: slow.factor, ticksLeft: secondsToTicks(slow.durationSec) } : null,
      });
    }
    return this;
  }

  /** Runs the Simulation forward from the state built so far, e.g. to catch a projectile mid-flight. */
  advance(ticks: number): this {
    const sim = createSimulation({ ...this.build(), seed: this.seed });
    sim.advance(ticks);
    this.state = structuredClone(sim.state);
    return this;
  }

  build(): Fixture {
    return {
      level: this.level,
      units: this.units,
      seed: this.seed,
      initialState: structuredClone(this.state),
    };
  }
}

export function scenario({ seed = 1 }: { seed?: number } = {}): ScenarioBuilder {
  return new ScenarioBuilder(seed);
}
