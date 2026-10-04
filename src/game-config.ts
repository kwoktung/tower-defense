import * as Phaser from 'phaser';

/** Logical resolution; the world is 15×10 tiles of 64. */
export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 640;

export interface GameConfigOptions {
  /** FIT scales to the parent (the game); NONE keeps 960×640 pixels (stories and Shots). */
  scale?: 'fit' | 'none';
}

export function createGameConfig(
  parent: HTMLElement,
  scenes: Phaser.Types.Scenes.SceneType[],
  { scale = 'fit' }: GameConfigOptions = {},
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#000000',
    banner: false,
    scale:
      scale === 'fit'
        ? { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }
        : { mode: Phaser.Scale.NONE },
    scene: scenes,
  };
}
