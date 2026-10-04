export type Outcome = 'playing' | 'won' | 'lost';

export interface Enemy {
  id: number;
  kind: string;
  hp: number;
  maxHp: number;
  /** Distance travelled along the Path, in world units. Position and heading derive from it. */
  pathT: number;
}

/** Where the current Wave is in its spawn groups. */
export interface SpawnCursor {
  groupIndex: number;
  /** Enemies already spawned from the current group. */
  spawnedInGroup: number;
  /** Ticks until the next spawn; 0 means spawn on the next tick. */
  cooldownTicks: number;
}

export interface WaveProgress {
  /** Index of the current or last started Wave; -1 before the first Wave. */
  index: number;
  /** Null once every enemy of the Wave has spawned (or before the first Wave). */
  spawning: SpawnCursor | null;
}

/**
 * The complete, serializable state of a Simulation at one tick.
 * Towers and projectiles arrive with the tickets that introduce them.
 */
export interface SimState {
  tick: number;
  rngState: number;
  gold: number;
  lives: number;
  wave: WaveProgress;
  outcome: Outcome;
  enemies: Enemy[];
  nextId: number;
}

export type SimEvent =
  | { type: 'waveStarted'; index: number }
  | { type: 'enemySpawned'; id: number; kind: string }
  | { type: 'enemyLeaked'; id: number; livesLost: number }
  | { type: 'gameEnded'; outcome: Exclude<Outcome, 'playing'> };
