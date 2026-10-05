import * as Phaser from 'phaser';
import { createHud, hudModelOf, type Hud } from '../render/hud';
import type { SkinTheme } from '../render/skin';
import { createTowerPanel, towerPanelModelOf, type TowerPanel } from '../render/tower-panel';
import type { Simulation } from '../sim/simulation';
import { SceneKeys } from './keys';
import { chooseBuildKind, selectTower, type UiState } from './ui-state';

export interface HudSceneData {
  sim: Simulation;
  ui: UiState;
  theme: SkinTheme;
  onRestart(): void;
}

/** How long the sell button waits for its confirming second press. */
const SELL_CONFIRM_MS = 3000;

/**
 * Runs above the Game scene and redraws the HUD and the selected tower's panel from the
 * Simulation's snapshot every frame.
 */
export class HudScene extends Phaser.Scene {
  private hud!: Hud;
  private panel!: TowerPanel;
  private sim!: Simulation;
  private ui!: UiState;
  /** Counts sell-button arms, so an old timer can't disarm a newer press. */
  private sellArms = 0;

  constructor() {
    super(SceneKeys.Hud);
  }

  create({ sim, ui, theme, onRestart }: HudSceneData) {
    this.sim = sim;
    this.ui = ui;
    this.hud = createHud(this, theme, {
      onChooseBuildKind: (kind) => chooseBuildKind(ui, kind),
      onStartNextWave: () => sim.startNextWave(),
      onRestart,
    });
    this.panel = createTowerPanel(this, theme, sim.level, {
      onUpgrade: (towerId) => {
        sim.upgradeTower(towerId);
        ui.confirmingSell = false;
      },
      onSell: (towerId) => this.sell(towerId),
    });
    this.redraw();
  }

  override update() {
    this.redraw();
  }

  /** The first press arms the button; a second press within SELL_CONFIRM_MS sells. */
  private sell(towerId: number) {
    const { sim, ui } = this;
    if (ui.confirmingSell) {
      sim.sellTower(towerId);
      selectTower(ui, null);
      return;
    }
    ui.confirmingSell = true;
    const arm = ++this.sellArms;
    this.time.delayedCall(SELL_CONFIRM_MS, () => {
      if (arm === this.sellArms) ui.confirmingSell = false;
    });
  }

  private redraw() {
    const { sim, ui } = this;
    this.hud.update(hudModelOf(sim, ui.buildKind));
    this.panel.update(towerPanelModelOf(sim, ui.selectedTowerId, ui.confirmingSell));
  }
}
