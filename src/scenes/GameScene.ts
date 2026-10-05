import * as Phaser from 'phaser';
import type { LevelDef, UnitCatalog } from '../content/schemas';
import type { MapView, Skin } from '../render/skin';
import { slotAt } from '../sim/path';
import { createSimulation } from '../sim/simulation';
import type { SimEvent } from '../sim/types';
import type { ProgressStore } from '../services/types';
import type { HudSceneData } from './HudScene';
import { SceneKeys } from './keys';
import { defaultSelectedTower, slotHoverFor, type UiState } from './ui-state';
import { createWorldRunner, type WorldRunner } from './world-runner';

export interface GameSceneData {
  level: LevelDef;
  units: UnitCatalog;
  progress: ProgressStore;
  skin: Skin;
  debug: boolean;
  seed?: number;
}

/** Drives the Simulation at a fixed step, renders it, and launches the HUD above itself. */
export class GameScene extends Phaser.Scene {
  private runner!: WorldRunner;
  private mapView!: MapView;
  private progress!: ProgressStore;

  constructor() {
    super(SceneKeys.Game);
  }

  create(data: GameSceneData) {
    const { level, units, progress, skin, debug, seed = Date.now() } = data;
    this.progress = progress;
    const sim = createSimulation({ level, units, seed });
    this.mapView = skin.createMap(this, level);
    this.runner = createWorldRunner(this, { sim, skin, debug });
    this.runner.render();

    const ui: UiState = { selectedTower: defaultSelectedTower(units) };
    const slotUnder = (pointer: Phaser.Input.Pointer) =>
      slotAt(level, pointer.worldX, pointer.worldY);
    const updateHover = (pointer: Phaser.Input.Pointer) => {
      this.mapView.setHover(slotHoverFor(sim, slotUnder(pointer), ui.selectedTower));
    };
    this.input.on(Phaser.Input.Events.POINTER_MOVE, updateHover);
    this.input.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Phaser.Input.Pointer) => {
      const slotId = slotUnder(pointer);
      if (slotId && ui.selectedTower) sim.placeTower(slotId, ui.selectedTower);
      updateHover(pointer);
    });
    this.input.keyboard?.on('keydown-D', () => {
      const overlay = this.runner.debugOverlay;
      overlay.setVisible(!overlay.visible);
    });

    const hud: HudSceneData = {
      sim,
      ui,
      theme: skin.theme,
      onRestart: () => {
        const debugVisible = this.runner.debugOverlay.visible;
        const next: GameSceneData = { ...data, debug: debugVisible, seed: Date.now() };
        this.scene.restart(next);
      },
    };
    // Runs the HUD alongside this scene. On restart the HUD is already running, and launch
    // shuts it down and starts it again with the new Simulation.
    this.scene.launch(SceneKeys.Hud, hud);
  }

  override update(_time: number, deltaMs: number) {
    for (const event of this.runner.tick(deltaMs)) {
      if (event.type === 'gameEnded') this.saveResult(event);
    }
  }

  private saveResult({ outcome }: Extract<SimEvent, { type: 'gameEnded' }>) {
    this.progress
      .save(this.runner.sim.level.id, {
        bestOutcome: outcome,
        bestLivesLeft: this.runner.sim.state.lives,
      })
      .catch((error: unknown) => console.warn('Could not save progress', error));
  }
}
