import * as Phaser from 'phaser';
import type { LevelDef } from '../content/schemas';
import { createDebugOverlay, type DebugOverlay } from '../render/debug-overlay';
import type { MapView, Skin } from '../render/skin';
import { slotAt } from '../sim/path';
import { createSimulation, type Simulation } from '../sim/simulation';
import { SceneKeys } from './keys';

export interface GameSceneData {
  level: LevelDef;
  skin: Skin;
  debug: boolean;
  seed?: number;
}

export class GameScene extends Phaser.Scene {
  private sim!: Simulation;
  private mapView!: MapView;
  private debugOverlay!: DebugOverlay;

  constructor() {
    super(SceneKeys.Game);
  }

  create({ level, skin, debug, seed = Date.now() }: GameSceneData) {
    this.sim = createSimulation({ level, seed });
    this.mapView = skin.createMap(this, level);
    this.debugOverlay = createDebugOverlay(this, level, debug);

    this.input.on(Phaser.Input.Events.POINTER_MOVE, (pointer: Phaser.Input.Pointer) => {
      this.mapView.setSlotHover(slotAt(this.sim.level, pointer.worldX, pointer.worldY));
    });
    this.input.keyboard?.on('keydown-D', () => {
      this.debugOverlay.setVisible(!this.debugOverlay.visible);
    });
  }
}
