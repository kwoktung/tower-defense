export type Outcome = 'playing' | 'won' | 'lost';

export interface Enemy {
  id: number;
  kind: string;
  hp: number;
  maxHp: number;
  /** Distance travelled along the Path, in world units. Position and heading derive from it. */
  pathT: number;
}

export interface Tower {
  id: number;
  kind: string;
  slotId: string;
  /** Ticks until the tower may fire again; 0 means ready. */
  cooldownTicks: number;
  /** Enemy currently aimed at, if any. */
  targetId: number | null;
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
 * Projectiles arrive with the ticket that introduces them.
 */
export interface SimState {
  tick: number;
  rngState: number;
  gold: number;
  lives: number;
  wave: WaveProgress;
  outcome: Outcome;
  towers: Tower[];
  enemies: Enemy[];
  nextId: number;
}

export type SimEvent =
  | { type: 'waveStarted'; index: number }
  | { type: 'towerPlaced'; id: number; kind: string; slotId: string }
  | { type: 'enemySpawned'; id: number; kind: string }
  | { type: 'enemyLeaked'; id: number; livesLost: number }
  | { type: 'gameEnded'; outcome: Exclude<Outcome, 'playing'> };
