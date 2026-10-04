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

/** Wires services and the chosen Skin, loads the level, then starts the Game scene. */
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
    const level = await this.options.services.levels.getLevel(this.options.levelId);
    const data: GameSceneData = { level, skin: this.skin, debug: this.options.debug };
    this.scene.start(SceneKeys.Game, data);
  }
}
