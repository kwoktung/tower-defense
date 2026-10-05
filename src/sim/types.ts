import type { Point } from './path';

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
  /** Tower level, from 1. Stats come from the Unit catalog for this kind and level. */
  level: number;
  /** Ticks until the tower may fire again; 0 means ready. */
  cooldownTicks: number;
  /** Enemy currently aimed at, if any. */
  targetId: number | null;
}

/** A homing shot. Flies at the target, or at its last known position once the target is gone. */
export interface Projectile {
  id: number;
  /** Kind of the tower that fired it; with `level`, decides speed, damage and attack mode. */
  kind: string;
  /** Level of the tower when it fired. Later upgrades or a sale don't change this shot. */
  level: number;
  towerId: number;
  /** Null once the target has died or leaked. */
  targetId: number | null;
  /** Where the projectile is now, in world units. */
  position: Point;
  /** Where it is flying: the target's position, or its last known one once the target is gone. */
  destination: Point;
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
  projectiles: Projectile[];
  nextId: number;
}

export type SimEvent =
  | { type: 'waveStarted'; index: number }
  | { type: 'towerPlaced'; id: number; kind: string; slotId: string }
  | { type: 'towerUpgraded'; id: number; kind: string; level: number }
  | {
      type: 'towerSold';
      id: number;
      kind: string;
      level: number;
      slotId: string;
      refund: number;
    }
  | { type: 'towerFired'; towerId: number; projectileId: number; targetId: number }
  | { type: 'projectileHit'; projectileId: number; x: number; y: number; splashRadius?: number }
  | { type: 'enemySpawned'; id: number; kind: string }
  | { type: 'enemyDamaged'; id: number; amount: number }
  | { type: 'enemyKilled'; id: number; kind: string; reward: number; x: number; y: number }
  | { type: 'enemyLeaked'; id: number; livesLost: number }
  | { type: 'gameEnded'; outcome: Exclude<Outcome, 'playing'> };
