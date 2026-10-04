import * as Phaser from 'phaser';
import { createHud, hudModelOf, type Hud } from '../render/hud';
import type { SkinTheme } from '../render/skin';
import type { Simulation } from '../sim/simulation';
import { SceneKeys } from './keys';
import type { UiState } from './ui-state';

export interface HudSceneData {
  sim: Simulation;
  ui: UiState;
  theme: SkinTheme;
  onRestart(): void;
}

/** Runs above the Game scene and redraws the HUD from the Simulation's snapshot every frame. */
export class HudScene extends Phaser.Scene {
  private hud!: Hud;
  private sim!: Simulation;
  private ui!: UiState;

  constructor() {
    super(SceneKeys.Hud);
  }

  create({ sim, ui, theme, onRestart }: HudSceneData) {
    this.sim = sim;
    this.ui = ui;
    this.hud = createHud(this, theme, {
      onSelectTower: (kind) => (ui.selectedTower = kind),
      onStartNextWave: () => sim.startNextWave(),
      onRestart,
    });
    this.hud.update(hudModelOf(sim, ui.selectedTower));
  }

  override update() {
    this.hud.update(hudModelOf(this.sim, this.ui.selectedTower));
  }
}
