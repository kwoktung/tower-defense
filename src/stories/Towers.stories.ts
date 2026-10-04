import type { Meta, StoryObj } from '@storybook/html-vite';
import { fixtures } from '../fixtures/named';
import { scenario } from '../fixtures/scenario';
import { baseArgs, baseArgTypes, type BaseStoryArgs } from '../storybook/args';
import { mountFixtureStory } from '../storybook/fixture-story';

interface TowerArgs extends BaseStoryArgs {
  kind: string;
}

const SLOT = 'slot-7';

const meta: Meta<TowerArgs> = {
  title: 'Entities/Towers',
  args: { ...baseArgs, kind: 'basic' },
  argTypes: { ...baseArgTypes, kind: { control: 'select', options: ['basic'] } },
};
export default meta;

type Story = StoryObj<TowerArgs>;

export const Idle: Story = {
  render: (args) =>
    mountFixtureStory(args, scenario().withTower(args.kind, SLOT).build(), {
      focus: { slotId: SLOT },
    }),
};

/** The pointer over an empty Slot previews the selected tower's range before building. */
export const HoverRangePreview: Story = {
  render: (args) =>
    mountFixtureStory(args, scenario().build(), {
      selectedTower: args.kind,
      hoverSlot: SLOT,
      focus: { slotId: SLOT },
      zoom: 2,
    }),
};

/** Mid-shot: the projectile is in flight toward the leading enemy. */
export const Firing: Story = {
  render: (args) =>
    mountFixtureStory(args, fixtures.basicTowerFiring(), { focus: { slotId: 'slot-3' }, zoom: 2 }),
};
