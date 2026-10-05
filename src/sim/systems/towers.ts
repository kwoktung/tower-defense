import { towerInvestment, towerStats } from '../../content/schemas';
import type { SimContext } from '../context';
import { poseAt, slotCenter, type Point } from '../path';
import { secondsToTicks } from '../time';
import type { Enemy, SimEvent, SimState, Tower } from '../types';

export type PlaceTowerFailure =
  'gameOver' | 'unknownSlot' | 'unknownKind' | 'slotOccupied' | 'notEnoughGold';

export type PlaceTowerResult = { ok: true; id: number } | { ok: false; reason: PlaceTowerFailure };

/** Whether a tower could be built right now, and if not, the reason `placeTower` would give. */
export type PlacementCheck = { ok: true } | { ok: false; reason: PlaceTowerFailure };

export type UpgradeTowerFailure = 'gameOver' | 'unknownTower' | 'maxLevel' | 'notEnoughGold';

/** Whether a tower could be upgraded right now, and if not, the reason `upgradeTower` would give. */
export type UpgradeCheck = { ok: true } | { ok: false; reason: UpgradeTowerFailure };

export type SellTowerFailure = 'gameOver' | 'unknownTower';

export type SellTowerResult =
  { ok: true; refund: number } | { ok: false; reason: SellTowerFailure };

const slotExists = (ctx: SimContext, slotId: string) =>
  ctx.level.slots.some((s) => s.id === slotId);
const slotOccupied = (state: SimState, slotId: string) =>
  state.towers.some((t) => t.slotId === slotId);

/** A Slot that exists and has no tower on it. */
export function isSlotFree(state: SimState, ctx: SimContext, slotId: string): boolean {
  return slotExists(ctx, slotId) && !slotOccupied(state, slotId);
}

/** Whether the current gold covers the cost of a tower of `kind` (false for unknown kinds). */
export function canAfford(state: SimState, ctx: SimContext, kind: string): boolean {
  const def = towerStats(ctx.units, kind, 1);
  return def !== undefined && state.gold >= def.cost;
}

/** The single home of the build rules; `placeTower` and every caller-facing query use it. */
export function checkPlacement(
  state: SimState,
  ctx: SimContext,
  slotId: string,
  kind: string,
): PlacementCheck {
  const fail = (reason: PlaceTowerFailure): PlacementCheck => ({ ok: false, reason });
  if (state.outcome !== 'playing') return fail('gameOver');
  if (!slotExists(ctx, slotId)) return fail('unknownSlot');
  if (!ctx.units.towers[kind]) return fail('unknownKind');
  if (slotOccupied(state, slotId)) return fail('slotOccupied');
  if (!canAfford(state, ctx, kind)) return fail('notEnoughGold');
  return { ok: true };
}

/** Builds a tower of `kind` on an empty Slot, paying its cost. Leaves the state untouched on failure. */
export function placeTower(
  state: SimState,
  ctx: SimContext,
  slotId: string,
  kind: string,
  events: SimEvent[],
): PlaceTowerResult {
  const check = checkPlacement(state, ctx, slotId, kind);
  if (!check.ok) return check;

  state.gold -= towerStats(ctx.units, kind, 1)!.cost;
  const id = state.nextId++;
  state.towers.push({ id, kind, slotId, level: 1, cooldownTicks: 0, targetId: null });
  events.push({ type: 'towerPlaced', id, kind, slotId });
  return { ok: true, id };
}

const findTower = (state: SimState, towerId: number) => state.towers.find((t) => t.id === towerId);

/** The single home of the upgrade rules; `upgradeTower` and every caller-facing query use it. */
export function checkUpgrade(state: SimState, ctx: SimContext, towerId: number): UpgradeCheck {
  const fail = (reason: UpgradeTowerFailure): UpgradeCheck => ({ ok: false, reason });
  if (state.outcome !== 'playing') return fail('gameOver');
  const tower = findTower(state, towerId);
  if (!tower) return fail('unknownTower');
  const next = towerStats(ctx.units, tower.kind, tower.level + 1);
  if (!next) return fail('maxLevel');
  if (state.gold < next.cost) return fail('notEnoughGold');
  return { ok: true };
}

/**
 * Raises a tower one level, paying that level's cost. Cooldown and target carry over.
 * Leaves the state untouched on failure.
 */
export function upgradeTower(
  state: SimState,
  ctx: SimContext,
  towerId: number,
  events: SimEvent[],
): UpgradeCheck {
  const check = checkUpgrade(state, ctx, towerId);
  if (!check.ok) return check;

  const tower = findTower(state, towerId)!;
  tower.level++;
  state.gold -= towerStats(ctx.units, tower.kind, tower.level)!.cost;
  events.push({ type: 'towerUpgraded', id: tower.id, kind: tower.kind, level: tower.level });
  return { ok: true };
}

/** Gold selling the tower would return now; null if there is no such tower. */
export function sellValue(state: SimState, ctx: SimContext, towerId: number): number | null {
  const tower = findTower(state, towerId);
  if (!tower) return null;
  const invested = towerInvestment(ctx.units, tower.kind, tower.level);
  return Math.floor(invested * ctx.units.sellRefundRatio);
}

/**
 * Removes a tower and refunds its Sell value; its Slot is free again. Projectiles it already
 * fired fly on. Leaves the state untouched on failure.
 */
export function sellTower(
  state: SimState,
  ctx: SimContext,
  towerId: number,
  events: SimEvent[],
): SellTowerResult {
  if (state.outcome !== 'playing') return { ok: false, reason: 'gameOver' };
  const tower = findTower(state, towerId);
  if (!tower) return { ok: false, reason: 'unknownTower' };

  const refund = sellValue(state, ctx, towerId)!;
  state.gold += refund;
  state.towers = state.towers.filter((t) => t !== tower);
  const { id, kind, level, slotId } = tower;
  events.push({ type: 'towerSold', id, kind, level, slotId, refund });
  return { ok: true, refund };
}

/** Towers only stand on existing Slots (placeTower and Fixtures check), so the centre always exists. */
export function towerPosition(tower: Tower, ctx: SimContext): Point {
  return slotCenter(ctx.level, tower.slotId)!;
}

/** The enemy in range that has travelled furthest along the Path, if any. */
function acquireTarget(tower: Tower, state: SimState, ctx: SimContext): Enemy | null {
  const range = towerStats(ctx.units, tower.kind, tower.level)!.range;
  const origin = towerPosition(tower, ctx);
  let best: Enemy | null = null;
  for (const enemy of state.enemies) {
    const pose = poseAt(ctx.path, enemy.pathT);
    if (Math.hypot(pose.x - origin.x, pose.y - origin.y) > range) continue;
    if (!best || enemy.pathT > best.pathT) best = enemy;
  }
  return best;
}

/** Each tower re-aims every tick and fires a projectile whenever its cooldown has run out. */
export function towersFire(state: SimState, ctx: SimContext, events: SimEvent[]): void {
  for (const tower of state.towers) {
    if (tower.cooldownTicks > 0) tower.cooldownTicks--;
    const target = acquireTarget(tower, state, ctx);
    tower.targetId = target?.id ?? null;
    if (!target || tower.cooldownTicks > 0) continue;

    const def = towerStats(ctx.units, tower.kind, tower.level)!;
    const from = towerPosition(tower, ctx);
    const to = poseAt(ctx.path, target.pathT);
    const id = state.nextId++;
    state.projectiles.push({
      id,
      kind: tower.kind,
      level: tower.level,
      towerId: tower.id,
      targetId: target.id,
      position: { x: from.x, y: from.y },
      destination: { x: to.x, y: to.y },
    });
    tower.cooldownTicks = secondsToTicks(def.cooldownSec);
    events.push({ type: 'towerFired', towerId: tower.id, projectileId: id, targetId: target.id });
  }
}
