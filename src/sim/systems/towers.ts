import type { SimContext } from '../context';
import type { SimEvent, SimState } from '../types';

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
