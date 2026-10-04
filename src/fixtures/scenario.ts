import { loadBundledLevel, loadBundledUnits } from '../content/bundled';
import type { LevelDef, UnitCatalog } from '../content/schemas';
import { createInitialState, type SimulationInput } from '../sim/simulation';
import type { Outcome, SimState } from '../sim/types';

/** One moment of play, ready for `createSimulation(fixture)` in tests or to render in a story. */
export type Fixture = Required<SimulationInput>;

export interface EnemyPlacement {
  /** Distance along the Path of the first (leading) enemy. */
  atPathT: number;
  /** Gap between consecutive enemies; later ones are placed behind the leader. Default 32. */
  spacing?: number;
  /** Current hp as a fraction of max hp. Default 1. */
  hpRatio?: number;
}

/**
 * Builds a Fixture step by step, starting from the level's initial state:
 *
 *   scenario().withLives(1).withEnemies('normal', 3, { atPathT: 2400 }).build()
 */
export class ScenarioBuilder {
  private level: LevelDef;
  private readonly units: UnitCatalog;
  private state: SimState;

  constructor(private readonly seed: number) {
    this.units = loadBundledUnits();
    this.level = loadBundledLevel('level-1');
    this.state = createInitialState(this.level, seed);
  }

  /** Switches to another bundled level, resetting the state to its initial state. */
  withLevel(id: string): this {
    this.level = loadBundledLevel(id);
    this.state = createInitialState(this.level, this.seed);
    return this;
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

  /** Marks `index` as the current Wave with all of its enemies already spawned. */
  atWave(index: number): this {
    this.state.wave = { index, spawning: null };
    return this;
  }

  /** Puts a tower on a Slot without paying for it. */
  withTower(kind: string, slotId: string): this {
    if (!this.units.towers[kind]) throw new Error(`Unknown tower kind "${kind}"`);
    if (!this.level.slots.some((s) => s.id === slotId)) throw new Error(`Unknown slot "${slotId}"`);
    this.state.towers.push({
      id: this.state.nextId++,
      kind,
      slotId,
      cooldownTicks: 0,
      targetId: null,
    });
    return this;
  }

  withEnemies(kind: string, count: number, placement: EnemyPlacement): this {
    const def = this.units.enemies[kind];
    if (!def) throw new Error(`Unknown enemy kind "${kind}"`);
    const { atPathT, spacing = 32, hpRatio = 1 } = placement;
    for (let i = 0; i < count; i++) {
      this.state.enemies.push({
        id: this.state.nextId++,
        kind,
        hp: def.hp * hpRatio,
        maxHp: def.hp,
        pathT: Math.max(0, atPathT - i * spacing),
      });
    }
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
