import * as Phaser from 'phaser';
import type { LevelDef, UnitCatalog } from '../content/schemas';
import { createFixedStep } from '../game-loop';
import { createDebugOverlay, type DebugOverlay } from '../render/debug-overlay';
import type { MapView, Skin } from '../render/skin';
import { WorldRenderer } from '../render/world-renderer';
import { slotAt } from '../sim/path';
import { createSimulation, type Simulation } from '../sim/simulation';
import type { HudSceneData } from './HudScene';
import { SceneKeys } from './keys';
import type { UiState } from './ui-state';

export interface GameSceneData {
  level: LevelDef;
  units: UnitCatalog;
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
  private fixedStep = createFixedStep();

  constructor() {
    super(SceneKeys.Game);
  }

  create(data: GameSceneData) {
    const { level, units, skin, debug, seed = Date.now() } = data;
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
    this.scene.stop(SceneKeys.Hud);
    this.scene.launch(SceneKeys.Hud, hud);
  }

  override update(_time: number, deltaMs: number) {
    const events = this.sim.advance(this.fixedStep.consume(deltaMs));
    this.world.render(this.sim.state, events);
    this.debugOverlay.sync(this.sim.state);
  }
}
