import type { Meta, StoryObj } from '@storybook/html-vite';
import { BootScene } from '../scenes/BootScene';
import { GameScene } from '../scenes/GameScene';
import { HudScene } from '../scenes/HudScene';
import { SceneKeys } from '../scenes/keys';
import { createServices } from '../services/create-services';
import { baseArgs, baseArgTypes, type BaseStoryArgs } from '../storybook/args';
import { mountPhaserGame } from '../storybook/mount-phaser-story';

const meta: Meta<BaseStoryArgs> = {
  title: 'Game',
  args: baseArgs,
  argTypes: baseArgTypes,
};
export default meta;

/** The whole game — Boot, Game and HUD scenes with local services — playable inside Storybook. */
export const Playable: StoryObj<BaseStoryArgs> = {
  render: (args) =>
    mountPhaserGame(
      [
        new BootScene({
          services: createServices({ kind: 'local' }),
          levelId: 'level-1',
          skinId: args.skin,
          debug: args.debug,
        }),
        GameScene,
        HudScene,
      ],
      (game) => game.scene.isActive(SceneKeys.Hud),
    ),
};
