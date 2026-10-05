import type { Meta, StoryObj } from '@storybook/html-vite';
import { fixtures } from '../fixtures/named';
import { baseArgs, baseArgTypes, type BaseStoryArgs } from '../storybook/args';
import { mountFixtureStory } from '../storybook/fixture-story';

interface MapArgs extends BaseStoryArgs {
  hoverSlot: string | null;
}

const meta: Meta<MapArgs> = {
  title: 'Map',
  args: { ...baseArgs, hoverSlot: null },
  argTypes: {
    ...baseArgTypes,
    hoverSlot: {
      control: 'select',
      options: [null, ...fixtures.emptyMap().level.slots.map((s) => s.id)],
    },
  },
  // No tower selected, so hovering a Slot only highlights it (no range preview).
  render: (args) =>
    mountFixtureStory(args, fixtures.emptyMap(), {
      ui: { selectedTower: null, ...(args.hoverSlot ? { hoverSlot: args.hoverSlot } : {}) },
    }),
};
export default meta;

type Story = StoryObj<MapArgs>;

export const Empty: Story = {};

export const SlotHover: Story = {
  args: { hoverSlot: 'slot-3' },
};
