import * as Phaser from 'phaser';
import { resolveSkin } from '../render/skins';
import type { Skin } from '../render/skin';
import type { Services } from '../services/types';
import type { GameSceneData } from './GameScene';
import { SceneKeys } from './keys';

export interface BootOptions {
  services: Services;
  levelId: string;
  skinId: string | null;
  debug: boolean;
}

/** Wires services and the chosen Skin, loads content, then starts the Game scene. */
export class BootScene extends Phaser.Scene {
  private skin!: Skin;

  constructor(private readonly options: BootOptions) {
    super(SceneKeys.Boot);
  }

  preload() {
    this.skin = resolveSkin(this.options.skinId);
    this.skin.preload(this);
  }

  async create() {
    const { levels } = this.options.services;
    const [level, units] = await Promise.all([
      levels.getLevel(this.options.levelId),
      levels.getUnitCatalog(),
    ]);
    const data: GameSceneData = { level, units, skin: this.skin, debug: this.options.debug };
    this.scene.start(SceneKeys.Game, data);
  }
}
