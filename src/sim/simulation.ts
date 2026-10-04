import type { LevelDef } from '../content/schemas';
import type { SimState } from './types';

export interface SimulationInput {
  level: LevelDef;
  seed: number;
  /** Start from an arbitrary state instead of the level's initial state (used by Fixtures). */
  initialState?: SimState;
}

export interface Simulation {
  readonly level: LevelDef;
  readonly state: Readonly<SimState>;
}

export function createInitialState(level: LevelDef, seed: number): SimState {
  return {
    tick: 0,
    rngState: seed >>> 0,
    gold: level.startGold,
    lives: level.startLives,
    waveIndex: -1,
    outcome: 'playing',
  };
}

export function createSimulation(input: SimulationInput): Simulation {
  const state = input.initialState
    ? structuredClone(input.initialState)
    : createInitialState(input.level, input.seed);
  return {
    level: input.level,
    get state() {
      return state;
    },
  };
}
