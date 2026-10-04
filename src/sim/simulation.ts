import type { LevelDef, UnitCatalog } from '../content/schemas';
import type { SimContext } from './context';
import { buildPath } from './path';
import { moveEnemies } from './systems/enemies';
import { resolveOutcome } from './systems/outcome';
import { placeTower, type PlaceTowerResult } from './systems/towers';
import { canStartNextWave, spawnEnemies, startNextWave } from './systems/waves';
import type { SimEvent, SimState } from './types';

export interface SimulationInput {
  level: LevelDef;
  units: UnitCatalog;
  seed: number;
  /** Start from an arbitrary state instead of the level's initial state (used by Fixtures). */
  initialState?: SimState;
}

export interface Simulation {
  readonly level: LevelDef;
  readonly units: UnitCatalog;
  readonly state: Readonly<SimState>;
  /** Advances `ticks` fixed steps and returns every SimEvent produced, oldest first. */
  advance(ticks: number): SimEvent[];
  canStartNextWave(): boolean;
  /** Starts the next Wave if allowed; its spawning begins on the next advanced tick. */
  startNextWave(): boolean;
  /** Builds a tower on an empty Slot; the towerPlaced event arrives with the next advance. */
  placeTower(slotId: string, kind: string): PlaceTowerResult;
}

export type { PlaceTowerFailure, PlaceTowerResult } from './systems/towers';

export function createInitialState(level: LevelDef, seed: number): SimState {
  return {
    tick: 0,
    rngState: seed >>> 0,
    gold: level.startGold,
    lives: level.startLives,
    wave: { index: -1, spawning: null },
    outcome: 'playing',
    towers: [],
    enemies: [],
    nextId: 1,
  };
}

export function createSimulation(input: SimulationInput): Simulation {
  const state = input.initialState
    ? structuredClone(input.initialState)
    : createInitialState(input.level, input.seed);
  const ctx: SimContext = { level: input.level, units: input.units, path: buildPath(input.level) };
  /** Events raised by player actions between advances; delivered with the next advance. */
  let pending: SimEvent[] = [];

  const step = (events: SimEvent[]) => {
    moveEnemies(state, ctx, events);
    spawnEnemies(state, ctx, events);
    resolveOutcome(state, events);
    state.tick++;
  };

  return {
    level: input.level,
    units: input.units,
    get state() {
      return state;
    },
    advance(ticks) {
      const events = pending;
      pending = [];
      for (let i = 0; i < ticks && state.outcome === 'playing'; i++) step(events);
      return events;
    },
    canStartNextWave: () => canStartNextWave(state, ctx),
    startNextWave() {
      if (!canStartNextWave(state, ctx)) return false;
      pending.push(startNextWave(state));
      return true;
    },
    placeTower: (slotId, kind) => placeTower(state, ctx, slotId, kind, pending),
  };
}
