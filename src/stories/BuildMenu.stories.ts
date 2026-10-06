import type { Meta, StoryObj } from '@storybook/html-vite';
import { fixtures, type FixtureName } from '../fixtures/named';
import { baseArgs, baseArgTypes, towerKinds, type BaseStoryArgs } from '../storybook/args';
import { mountFixtureStory } from '../storybook/fixture-story';

interface BuildMenuArgs extends BaseStoryArgs {
  fixture: FixtureName;
  slotId: string;
  previewKind: string | null;
}

const slotIds = fixtures.emptyMap().level.slots.map((s) => s.id);

/** The Build menu open on a free Slot: one option per tower kind around it, with its cost. */
const meta: Meta<BuildMenuArgs> = {
  title: 'Build menu',
  args: { ...baseArgs, fixture: 'emptyMap', slotId: 'slot-6', previewKind: null },
  argTypes: {
    ...baseArgTypes,
    fixture: { control: false },
    slotId: { control: 'select', options: slotIds, description: 'Slot the menu is open on' },
    previewKind: {
      control: 'select',
      options: [null, ...towerKinds],
      description: 'Option pressed once: its range shows, a second press builds',
    },
  },
  render: (args) =>
    mountFixtureStory(args, fixtures[args.fixture](), {
      ui: {
        hud: true,
        buildMenu: {
          slotId: args.slotId,
          ...(args.previewKind && { previewKind: args.previewKind }),
        },
      },
    }),
};
export default meta;

type Story = StoryObj<BuildMenuArgs>;

/** Just opened: every option affordable, nothing previewed. */
export const Open: Story = {};
/** The basic option pressed once: outlined, with its range around the Slot. */
export const Previewing: Story = { args: { previewKind: 'basic' } };
export const PreviewingSplash: Story = { args: { previewKind: 'splash' } };
/** Only the basic tower is affordable: the others are greyed, their cost in the danger colour. */
export const NotEnoughGold: Story = {
  args: { fixture: 'buildMenuLowGold', previewKind: 'splash' },
};
/**
 * The top row of Slots, still with room above for the menu. (No level-1 Slot is close enough to
 * the top bar or a side for `buildMenuLayout` to open the row below or push it sideways.)
 */
export const TopRow: Story = { args: { slotId: 'slot-2' } };
/** The rightmost Slot: the row still fits centred. */
export const RightEdge: Story = { args: { slotId: 'slot-12' } };
export const BottomRow: Story = { args: { slotId: 'slot-9' } };
export const OpenFruit: Story = { args: { skin: 'fruit', previewKind: 'slow' } };
export const NotEnoughGoldFruit: Story = {
  args: { skin: 'fruit', fixture: 'buildMenuLowGold' },
};
