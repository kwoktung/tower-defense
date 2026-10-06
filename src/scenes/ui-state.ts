import type { BuildMenuState } from '../render/build-menu';
import type { SlotHover } from '../render/skin';
import type { Simulation } from '../sim/simulation';

/** Player UI choices that are not game state: shared by the Game and HUD scenes. */
export interface UiState {
  /** The Build menu open on a free Slot; null when closed. Never open while a tower is selected. */
  buildMenu: BuildMenuState | null;
  /** Placed tower whose panel is open; null when none is selected. */
  selectedTowerId: number | null;
  /** The selected tower's sell button was pressed once and awaits a second press. */
  confirmingSell: boolean;
}

/** UI state at the start of a game: no menu open, nothing selected. */
export function createUiState(): UiState {
  return { buildMenu: null, selectedTowerId: null, confirmingSell: false };
}

/** Selecting a tower (or nothing) closes the Build menu. */
export function selectTower(ui: UiState, towerId: number | null): void {
  ui.selectedTowerId = towerId;
  ui.confirmingSell = false;
  ui.buildMenu = null;
}

/** Opens the Build menu on `slotId`, with nothing previewed; closes any tower panel. */
export function openBuildMenu(ui: UiState, slotId: string): void {
  selectTower(ui, null);
  ui.buildMenu = { slotId, previewKind: null, hoverKind: null };
}

/** Drops a selection or menu that no longer fits the game: a sold tower, a taken Slot, game over. */
export function dropStaleSelection(sim: Simulation, ui: UiState): void {
  if (ui.selectedTowerId !== null && !sim.state.towers.some((t) => t.id === ui.selectedTowerId)) {
    selectTower(ui, null);
  }
  const menu = ui.buildMenu;
  if (menu && (sim.state.outcome !== 'playing' || !sim.isSlotFree(menu.slotId))) {
    ui.buildMenu = null;
  }
}

/**
 * What a click on the map does: open the panel of the tower on the Slot clicked; on a free Slot,
 * open the Build menu there (or close it, if it is already open there); anywhere else, close
 * whatever is open. A map click never builds: only a Build menu option does.
 */
export function clickMap(sim: Simulation, ui: UiState, slotId: string | null): void {
  const tower = slotId ? sim.state.towers.find((t) => t.slotId === slotId) : undefined;
  if (tower) selectTower(ui, tower.id);
  else if (slotId && sim.isSlotFree(slotId) && ui.buildMenu?.slotId !== slotId) {
    openBuildMenu(ui, slotId);
  } else selectTower(ui, null);
}

/**
 * A press on a Build menu option. The first press previews that kind; a second press on the
 * previewed kind builds it and closes the menu, if the gold covers it (otherwise nothing happens).
 */
export function clickBuildOption(sim: Simulation, ui: UiState, kind: string): void {
  const menu = ui.buildMenu;
  if (!menu) return;
  if (menu.previewKind !== kind) {
    menu.previewKind = kind;
    return;
  }
  if (sim.placeTower(menu.slotId, kind).ok) ui.buildMenu = null;
}

/** The pointer entering (`kind`) or leaving (null) a Build menu option: shows its range only. */
export function hoverBuildOption(ui: UiState, kind: string | null): void {
  if (ui.buildMenu) ui.buildMenu.hoverKind = kind;
}

/** How the map shows the pointer over `slotId`: only a free Slot highlights, as clickable. */
export function slotHoverFor(sim: Simulation, slotId: string | null): SlotHover | null {
  return slotId && sim.isSlotFree(slotId) ? { slotId } : null;
}
