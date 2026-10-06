import type { Meta, StoryObj } from '@storybook/html-vite';
import { GAME_HEIGHT, GAME_WIDTH } from '../game-config';
import { colorNumber, ICON_NAMES } from '../render/skin';
import { baseArgs, baseArgTypes, type BaseStoryArgs } from '../storybook/args';
import { mountPhaserStory } from '../storybook/mount-phaser-story';

/** The sizes the HUD uses (stat icons, button icons) and a large one for checking the drawing. */
const SIZES = [18, 17, 32, 64];

/**
 * Every HUD icon a Skin provides, at several sizes, on the HUD panel colour: the acceptance
 * page for a new Skin's icons. A missing icon reports console.error, failing the story test.
 */
const meta: Meta<BaseStoryArgs> = {
  title: 'Icons',
  args: baseArgs,
  argTypes: baseArgTypes,
  render: (args) =>
    mountPhaserStory({
      ...args,
      build: ({ scene, skin }) => {
        const { theme } = skin;
        const bg = scene.add.graphics();
        bg.fillStyle(colorNumber(theme.colors.hudPanel));
        bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        const columnWidth = GAME_WIDTH / ICON_NAMES.length;
        ICON_NAMES.forEach((name, i) => {
          const x = columnWidth * (i + 0.5);
          scene.add
            .text(x, 60, name, {
              fontFamily: theme.fonts.ui,
              fontSize: '16px',
              color: theme.colors.text,
            })
            .setOrigin(0.5);
          let y = 110;
          for (const size of SIZES) {
            skin.createIcon(scene, name, size).setPosition(x, y + size / 2);
            y += size + 40;
          }
        });
      },
    }),
};
export default meta;

type Story = StoryObj<BaseStoryArgs>;

export const Polygon: Story = { args: { skin: 'polygon' } };
export const Fruit: Story = { args: { skin: 'fruit' } };
