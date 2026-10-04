import * as Phaser from 'phaser';
import { createGameConfig, GAME_HEIGHT, GAME_WIDTH } from '../game-config';
import type { Skin } from '../render/skin';
import { resolveSkin } from '../render/skins';

declare global {
  interface Window {
    /** Set once a story's first frame has rendered; the Shots script waits for it. */
    __STORY_READY__?: boolean;
  }
}

export interface StoryBuildContext {
  scene: Phaser.Scene;
  skin: Skin;
  debug: boolean;
}

export interface MountOptions {
  skin: string;
  debug: boolean;
  /** Draws the story's content into a fresh scene. */
  build(ctx: StoryBuildContext): void;
}

let mounted: Phaser.Game | null = null;

/**
 * Destroys the story's Phaser game and releases its WebGL context. Registered as the Storybook
 * cleanup, and also called before every mount so arg changes never leave a game behind.
 */
export function destroyMountedGame(): void {
  if (!mounted) return;
  const game = mounted;
  mounted = null;
  game.destroy(true);
}

/**
 * Mounts a 960×640 Phaser game running `scenes` and returns the element to render.
 * `__STORY_READY__` turns true after the first frame rendered once `isReady(game)` holds.
 */
export function mountPhaserGame(
  scenes: Phaser.Types.Scenes.SceneType[],
  isReady: (game: Phaser.Game) => boolean = () => true,
): HTMLElement {
  destroyMountedGame();
  window.__STORY_READY__ = false;

  const host = document.createElement('div');
  host.style.width = `${GAME_WIDTH}px`;
  host.style.height = `${GAME_HEIGHT}px`;

  const game = new Phaser.Game(createGameConfig(host, scenes, { scale: 'none' }));
  const onRender = () => {
    if (!isReady(game)) return;
    game.events.off(Phaser.Core.Events.POST_RENDER, onRender);
    window.__STORY_READY__ = true;
  };
  game.events.on(Phaser.Core.Events.POST_RENDER, onRender);
  mounted = game;
  return host;
}

/** Mounts a single-scene story whose content `build` draws with the chosen Skin. */
export function mountPhaserStory({ skin: skinId, debug, build }: MountOptions): HTMLElement {
  const skin = resolveSkin(skinId);
  let built = false;

  class StoryScene extends Phaser.Scene {
    preload() {
      skin.preload(this);
    }
    create() {
      build({ scene: this, skin, debug });
      built = true;
    }
  }

  return mountPhaserGame([StoryScene], () => built);
}
