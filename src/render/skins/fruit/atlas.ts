import type * as Phaser from 'phaser';
import atlasData from './assets/fruit-atlas.json';
import atlasUrl from './assets/fruit-atlas.png';
import dirtUrl from './assets/dirt.png';
import grassUrl from './assets/grass.png';

/** Texture keys of the fruit skin. The atlas is built by `pnpm art:fruit`. */
export const ATLAS = 'fruit-atlas';
export const GRASS = 'fruit-grass';
export const DIRT = 'fruit-dirt';

/** Frames are stored at twice their display size, for sharp scaling on large screens. */
export const ART_SCALE = 0.5;

export function preloadFruit(scene: Phaser.Scene): void {
  scene.load.atlas(ATLAS, atlasUrl, atlasData);
  scene.load.image(GRASS, grassUrl);
  scene.load.image(DIRT, dirtUrl);
}

/** Whether the atlas has `frame`; a missing look is reported once per view (ADR-0002). */
export function hasFrame(scene: Phaser.Scene, frame: string): boolean {
  return scene.textures.get(ATLAS).has(frame);
}
