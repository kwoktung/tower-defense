import type { Meta, StoryObj } from '@storybook/html-vite';
import { loadBundledLevel, loadBundledUnits } from '../content/bundled';
import { createDebugOverlay } from '../render/debug-overlay';
import { baseArgs, baseArgTypes, type BaseStoryArgs } from '../storybook/args';
import { mountPhaserStory } from '../storybook/mount-phaser-story';

interface MapArgs extends BaseStoryArgs {
  level: string;
  hoverSlot: string | null;
}

const meta: Meta<MapArgs> = {
  title: 'Map',
  args: { ...baseArgs, level: 'level-1', hoverSlot: null },
  argTypes: {
    ...baseArgTypes,
    level: { control: false },
    hoverSlot: {
      control: 'select',
      options: [null, ...loadBundledLevel('level-1').slots.map((s) => s.id)],
    },
  },
  render: (args) =>
    mountPhaserStory({
      skin: args.skin,
      debug: args.debug,
      build: ({ scene, skin, debug }) => {
        const level = loadBundledLevel(args.level);
        skin
          .createMap(scene, level)
          .setHover(args.hoverSlot ? { slotId: args.hoverSlot, rangePreview: null } : null);
        createDebugOverlay(scene, level, loadBundledUnits(), debug);
      },
    }),
};
export default meta;

type Story = StoryObj<MapArgs>;

export const Empty: Story = {};

export const SlotHover: Story = {
  args: { hoverSlot: 'slot-3' },
};
