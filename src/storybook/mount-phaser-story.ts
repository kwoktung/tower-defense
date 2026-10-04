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

/** Mounts a 960×640 Phaser game for a story and returns the element to render. */
export function mountPhaserStory({ skin: skinId, debug, build }: MountOptions): HTMLElement {
  destroyMountedGame();
  window.__STORY_READY__ = false;

  const host = document.createElement('div');
  host.style.width = `${GAME_WIDTH}px`;
  host.style.height = `${GAME_HEIGHT}px`;

  const skin = resolveSkin(skinId);

  class StoryScene extends Phaser.Scene {
    preload() {
      skin.preload(this);
    }
    create() {
      build({ scene: this, skin, debug });
      this.game.events.once(Phaser.Core.Events.POST_RENDER, () => {
        window.__STORY_READY__ = true;
      });
    }
  }

  mounted = new Phaser.Game(createGameConfig(host, [StoryScene], { scale: 'none' }));
  return host;
}
