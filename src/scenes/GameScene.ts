import * as Phaser from 'phaser';
import type { LevelDef, UnitCatalog } from '../content/schemas';
import type { MapView, Skin } from '../render/skin';
import {
  createTowerSelection,
  towerPanelModelOf,
  type TowerSelectionView,
} from '../render/tower-panel';
import { slotAt } from '../sim/path';
import { createSimulation } from '../sim/simulation';
import type { SimEvent } from '../sim/types';
import type { ProgressStore } from '../services/types';
import { SIM_EVENTS, type HudSceneData } from './HudScene';
import { SceneKeys } from './keys';
import {
  clickMap,
  createUiState,
  dropStaleSelection,
  selectTower,
  slotHoverFor,
  type UiState,
} from './ui-state';
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
  private ui!: UiState;
  private selection!: TowerSelectionView;
  /** A fresh emitter per game, so a restarted HUD never hears the old Simulation. */
  private simEvents!: Phaser.Events.EventEmitter;

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

    const ui = createUiState(units);
    this.ui = ui;
    this.selection = createTowerSelection(this, skin.theme, level);
    const slotUnder = (pointer: Phaser.Input.Pointer) =>
      slotAt(level, pointer.worldX, pointer.worldY);
    const updateHover = (pointer: Phaser.Input.Pointer) => {
      this.mapView.setHover(slotHoverFor(sim, slotUnder(pointer), ui));
    };
    this.input.on(Phaser.Input.Events.POINTER_MOVE, updateHover);
    this.input.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Phaser.Input.Pointer) => {
      clickMap(sim, ui, slotUnder(pointer));
      updateHover(pointer);
    });
    this.input.keyboard?.on('keydown-ESC', () => selectTower(ui, null));
    this.input.keyboard?.on('keydown-D', () => {
      const overlay = this.runner.debugOverlay;
      overlay.setVisible(!overlay.visible);
    });

    this.simEvents = new Phaser.Events.EventEmitter();
    const hud: HudSceneData = {
      sim,
      simEvents: this.simEvents,
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
    const events = this.runner.tick(deltaMs);
    for (const event of events) {
      if (event.type === 'gameEnded') this.saveResult(event);
    }
    if (events.length) this.simEvents.emit(SIM_EVENTS, events);
    dropStaleSelection(this.runner.sim, this.ui);
    this.selection.update(
      towerPanelModelOf(this.runner.sim, this.ui.selectedTowerId, this.ui.confirmingSell),
    );
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
