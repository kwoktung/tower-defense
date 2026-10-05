import { towerStats, type UnitCatalog } from '../content/schemas';
import type { SlotHover } from '../render/skin';
import type { Simulation } from '../sim/simulation';

/** Player UI choices that are not game state: shared by the Game and HUD scenes. */
export interface UiState {
  /** Tower kind to build on the next Slot click; null when nothing is selected. */
  selectedTower: string | null;
}

/** The tower kind selected when a game starts: the first in the Unit catalog. */
export function defaultSelectedTower(units: UnitCatalog): string | null {
  return Object.keys(units.towers)[0] ?? null;
}

/**
 * How the map shows the pointer over `slotId`: only a free Slot highlights, previewing the
 * selected tower's range. Null when there is nothing to show.
 */
export function slotHoverFor(
  sim: Simulation,
  slotId: string | null,
  selectedTower: string | null,
): SlotHover | null {
  if (!slotId || !sim.isSlotFree(slotId)) return null;
  const range = selectedTower ? (towerStats(sim.units, selectedTower, 1)?.range ?? null) : null;
  return { slotId, rangePreview: range };
}
