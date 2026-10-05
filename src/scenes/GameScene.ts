import * as Phaser from 'phaser';
import type { LevelDef, UnitCatalog } from '../content/schemas';
import { createFixedStep } from '../game-loop';
import { createDebugOverlay, type DebugOverlay } from '../render/debug-overlay';
import type { MapView, Skin } from '../render/skin';
import { WorldRenderer } from '../render/world-renderer';
import { slotAt } from '../sim/path';
import { createSimulation, type Simulation } from '../sim/simulation';
import type { SimEvent } from '../sim/types';
import type { ProgressStore } from '../services/types';
import type { HudSceneData } from './HudScene';
import { SceneKeys } from './keys';
import type { UiState } from './ui-state';

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
  private sim!: Simulation;
  private mapView!: MapView;
  private world!: WorldRenderer;
  private debugOverlay!: DebugOverlay;
  private progress!: ProgressStore;
  private fixedStep = createFixedStep();

  constructor() {
    super(SceneKeys.Game);
  }

  create(data: GameSceneData) {
    const { level, units, progress, skin, debug, seed = Date.now() } = data;
    this.progress = progress;
    this.sim = createSimulation({ level, units, seed });
    this.fixedStep = createFixedStep();
    this.mapView = skin.createMap(this, level);
    this.world = new WorldRenderer(this, skin, level);
    this.debugOverlay = createDebugOverlay(this, level, units, debug);
    this.world.render(this.sim.state);

    const ui: UiState = { selectedTower: Object.keys(units.towers)[0] ?? null };
    /** The empty Slot under the pointer, if any. Occupied Slots don't react. */
    const emptySlotAt = (pointer: Phaser.Input.Pointer) => {
      const slotId = slotAt(level, pointer.worldX, pointer.worldY);
      return slotId && !this.sim.state.towers.some((t) => t.slotId === slotId) ? slotId : null;
    };
    const updateHover = (pointer: Phaser.Input.Pointer) => {
      const slotId = emptySlotAt(pointer);
      const def = ui.selectedTower ? units.towers[ui.selectedTower] : undefined;
      this.mapView.setHover(slotId ? { slotId, rangePreview: def?.range ?? null } : null);
    };
    this.input.on(Phaser.Input.Events.POINTER_MOVE, updateHover);
    this.input.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Phaser.Input.Pointer) => {
      const slotId = emptySlotAt(pointer);
      if (slotId && ui.selectedTower) this.sim.placeTower(slotId, ui.selectedTower);
      updateHover(pointer);
    });
    this.input.keyboard?.on('keydown-D', () => {
      this.debugOverlay.setVisible(!this.debugOverlay.visible);
    });

    const hud: HudSceneData = {
      sim: this.sim,
      ui,
      theme: skin.theme,
      onRestart: () => {
        const next: GameSceneData = { ...data, debug: this.debugOverlay.visible, seed: Date.now() };
        this.scene.restart(next);
      },
    };
    // Runs the HUD alongside this scene. On restart the HUD is already running, and launch
    // shuts it down and starts it again with the new Simulation.
    this.scene.launch(SceneKeys.Hud, hud);
  }

  override update(_time: number, deltaMs: number) {
    const events = this.sim.advance(this.fixedStep.consume(deltaMs));
    this.world.render(this.sim.state, events);
    this.debugOverlay.sync(this.sim.state);
    for (const event of events) if (event.type === 'gameEnded') this.saveResult(event);
  }

  private saveResult({ outcome }: Extract<SimEvent, { type: 'gameEnded' }>) {
    this.progress
      .save(this.sim.level.id, { bestOutcome: outcome, bestLivesLeft: this.sim.state.lives })
      .catch((error: unknown) => console.warn('Could not save progress', error));
  }
}
