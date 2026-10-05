import type { LevelDef, UnitCatalog } from '../content/schemas';
import type { SimContext } from './context';
import { buildPath } from './path';
import { moveEnemies } from './systems/enemies';
import { resolveOutcome } from './systems/outcome';
import { moveProjectiles } from './systems/projectiles';
import {
  canAfford,
  checkPlacement,
  checkUpgrade,
  isSlotFree,
  placeTower,
  sellTower,
  sellValue,
  towersFire,
  upgradeTower,
  type PlacementCheck,
  type PlaceTowerResult,
  type SellTowerResult,
  type UpgradeCheck,
} from './systems/towers';
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
  /** Whether `placeTower(slotId, kind)` would succeed now, and if not, why. Changes nothing. */
  canPlaceTower(slotId: string, kind: string): PlacementCheck;
  /** Whether the current gold covers a tower of `kind`, wherever it would go. */
  canAfford(kind: string): boolean;
  /** Whether `slotId` is a Slot with no tower on it. */
  isSlotFree(slotId: string): boolean;
  /** Raises a tower one level, paying for it; the towerUpgraded event arrives with the next advance. */
  upgradeTower(towerId: number): UpgradeCheck;
  /** Whether `upgradeTower(towerId)` would succeed now, and if not, why. Changes nothing. */
  canUpgradeTower(towerId: number): UpgradeCheck;
  /** Removes a tower and refunds its Sell value; the towerSold event arrives with the next advance. */
  sellTower(towerId: number): SellTowerResult;
  /** Gold `sellTower(towerId)` would return now; null if there is no such tower. */
  sellValue(towerId: number): number | null;
}

export type {
  PlacementCheck,
  PlaceTowerFailure,
  PlaceTowerResult,
  SellTowerFailure,
  SellTowerResult,
  UpgradeCheck,
  UpgradeTowerFailure,
} from './systems/towers';

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
    projectiles: [],
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

  /** One tick. Towers aim at where enemies are at the start of the tick. */
  const step = (events: SimEvent[]) => {
    towersFire(state, ctx, events);
    moveProjectiles(state, ctx, events);
    moveEnemies(state, ctx, events);
    spawnEnemies(state, ctx, events);
    resolveOutcome(state, ctx, events);
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
    canPlaceTower: (slotId, kind) => checkPlacement(state, ctx, slotId, kind),
    canAfford: (kind) => canAfford(state, ctx, kind),
    isSlotFree: (slotId) => isSlotFree(state, ctx, slotId),
    upgradeTower: (towerId) => upgradeTower(state, ctx, towerId, pending),
    canUpgradeTower: (towerId) => checkUpgrade(state, ctx, towerId),
    sellTower: (towerId) => sellTower(state, ctx, towerId, pending),
    sellValue: (towerId) => sellValue(state, ctx, towerId),
  };
}
