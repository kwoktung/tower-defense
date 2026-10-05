import { towerStats, type UnitCatalog } from '../content/schemas';
import type { SlotHover } from '../render/skin';
import type { Simulation } from '../sim/simulation';

/** Player UI choices that are not game state: shared by the Game and HUD scenes. */
export interface UiState {
  /** Tower kind to build on the next free-Slot click; null when nothing is chosen. */
  buildKind: string | null;
  /** Placed tower whose panel is open; null when none is selected. */
  selectedTowerId: number | null;
  /** The selected tower's sell button was pressed once and awaits a second press. */
  confirmingSell: boolean;
}

/** UI state at the start of a game: the first tower kind in the Unit catalog, nothing selected. */
export function createUiState(units: UnitCatalog): UiState {
  return {
    buildKind: Object.keys(units.towers)[0] ?? null,
    selectedTowerId: null,
    confirmingSell: false,
  };
}

export function selectTower(ui: UiState, towerId: number | null): void {
  ui.selectedTowerId = towerId;
  ui.confirmingSell = false;
}

/** Choosing a kind to build closes any open tower panel. */
export function chooseBuildKind(ui: UiState, kind: string): void {
  ui.buildKind = kind;
  selectTower(ui, null);
}

/** Drops the selection once its tower is gone (sold, or a new game). */
export function dropStaleSelection(sim: Simulation, ui: UiState): void {
  if (ui.selectedTowerId === null) return;
  if (!sim.state.towers.some((t) => t.id === ui.selectedTowerId)) selectTower(ui, null);
}

/**
 * What a click on the map does: open the panel of the tower on the Slot clicked; otherwise
 * close an open panel (without building, so a stray click never builds); otherwise build.
 */
export function clickMap(sim: Simulation, ui: UiState, slotId: string | null): void {
  const tower = slotId ? sim.state.towers.find((t) => t.slotId === slotId) : undefined;
  if (tower) selectTower(ui, tower.id);
  else if (ui.selectedTowerId !== null) selectTower(ui, null);
  else if (slotId && ui.buildKind) sim.placeTower(slotId, ui.buildKind);
}

/**
 * How the map shows the pointer over `slotId`: only a free Slot highlights, previewing the
 * range of the tower that would be built. Nothing shows while a tower is selected, since a
 * click would only close its panel.
 */
export function slotHoverFor(
  sim: Simulation,
  slotId: string | null,
  ui: Pick<UiState, 'buildKind' | 'selectedTowerId'>,
): SlotHover | null {
  if (!slotId || !sim.isSlotFree(slotId) || ui.selectedTowerId !== null) return null;
  const range = ui.buildKind ? (towerStats(sim.units, ui.buildKind, 1)?.range ?? null) : null;
  return { slotId, rangePreview: range };
}
