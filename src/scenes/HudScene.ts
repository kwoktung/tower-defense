import * as Phaser from 'phaser';
import { createHud, hudModelOf, type Hud } from '../render/hud';
import type { SkinTheme } from '../render/skin';
import type { Simulation } from '../sim/simulation';
import { SceneKeys } from './keys';

export interface HudSceneData {
  sim: Simulation;
  theme: SkinTheme;
  onRestart(): void;
}

/** Runs above the Game scene and redraws the HUD from the Simulation's snapshot every frame. */
export class HudScene extends Phaser.Scene {
  private hud!: Hud;
  private sim!: Simulation;

  constructor() {
    super(SceneKeys.Hud);
  }

  create({ sim, theme, onRestart }: HudSceneData) {
    this.sim = sim;
    this.hud = createHud(this, theme, {
      onStartNextWave: () => sim.startNextWave(),
      onRestart,
    });
    this.hud.update(hudModelOf(sim));
  }

  override update() {
    this.hud.update(hudModelOf(this.sim));
  }
}
