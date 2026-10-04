export type Outcome = 'playing' | 'won' | 'lost';

/**
 * The complete, serializable state of a Simulation at one tick.
 * Entity collections (towers, enemies, projectiles) arrive with the tickets that introduce them.
 */
export interface SimState {
  tick: number;
  rngState: number;
  gold: number;
  lives: number;
  /** Index of the current or last started wave; -1 before the first wave. */
  waveIndex: number;
  outcome: Outcome;
}
