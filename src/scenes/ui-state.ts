/** Player UI choices that are not game state: shared by the Game and HUD scenes. */
export interface UiState {
  /** Tower kind to build on the next Slot click; null when nothing is selected. */
  selectedTower: string | null;
}
