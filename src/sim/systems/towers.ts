import type { SimContext } from '../context';
import { cellCenter, poseAt, type Point } from '../path';
import { secondsToTicks } from '../time';
import type { Enemy, SimEvent, SimState, Tower } from '../types';

export type PlaceTowerFailure =
  'gameOver' | 'unknownSlot' | 'unknownKind' | 'slotOccupied' | 'notEnoughGold';

export type PlaceTowerResult = { ok: true; id: number } | { ok: false; reason: PlaceTowerFailure };

/** Builds a tower of `kind` on an empty Slot, paying its cost. Leaves the state untouched on failure. */
export function placeTower(
  state: SimState,
  ctx: SimContext,
  slotId: string,
  kind: string,
  events: SimEvent[],
): PlaceTowerResult {
  const fail = (reason: PlaceTowerFailure): PlaceTowerResult => ({ ok: false, reason });
  if (state.outcome !== 'playing') return fail('gameOver');
  if (!ctx.level.slots.some((s) => s.id === slotId)) return fail('unknownSlot');
  const def = ctx.units.towers[kind];
  if (!def) return fail('unknownKind');
  if (state.towers.some((t) => t.slotId === slotId)) return fail('slotOccupied');
  if (state.gold < def.cost) return fail('notEnoughGold');

  state.gold -= def.cost;
  const id = state.nextId++;
  state.towers.push({ id, kind, slotId, cooldownTicks: 0, targetId: null });
  events.push({ type: 'towerPlaced', id, kind, slotId });
  return { ok: true, id };
}

export function towerPosition(tower: Tower, ctx: SimContext): Point {
  const slot = ctx.level.slots.find((s) => s.id === tower.slotId)!;
  return cellCenter(slot, ctx.level.grid.tileSize);
}

/** The enemy in range that has travelled furthest along the Path, if any. */
function acquireTarget(tower: Tower, state: SimState, ctx: SimContext): Enemy | null {
  const range = ctx.units.towers[tower.kind]!.range;
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

    const def = ctx.units.towers[tower.kind]!;
    const from = towerPosition(tower, ctx);
    const to = poseAt(ctx.path, target.pathT);
    const id = state.nextId++;
    state.projectiles.push({
      id,
      kind: tower.kind,
      towerId: tower.id,
      targetId: target.id,
      x: from.x,
      y: from.y,
      targetX: to.x,
      targetY: to.y,
    });
    tower.cooldownTicks = secondsToTicks(def.cooldownSec);
    events.push({ type: 'towerFired', towerId: tower.id, projectileId: id, targetId: target.id });
  }
}
