import type { Meta, StoryObj } from '@storybook/html-vite';
import { fixtures, type FixtureName } from '../fixtures/named';
import { baseArgs, baseArgTypes, type BaseStoryArgs } from '../storybook/args';
import { mountFixtureStory } from '../storybook/fixture-story';

interface TowerPanelArgs extends BaseStoryArgs {
  fixture: FixtureName;
  confirmingSell: boolean;
}

/** The first tower of a Fixture selected: its range circles and its upgrade / sell panel. */
const meta: Meta<TowerPanelArgs> = {
  title: 'Tower panel',
  args: { ...baseArgs, confirmingSell: false },
  argTypes: {
    ...baseArgTypes,
    fixture: { control: false },
    confirmingSell: { control: 'boolean', description: 'Sell pressed once, awaiting confirmation' },
  },
  render: (args) => {
    const fixture = fixtures[args.fixture]();
    return mountFixtureStory(args, fixture, {
      ui: {
        hud: true,
        selectedTowerId: fixture.initialState.towers[0]!.id,
        confirmingSell: args.confirmingSell,
      },
    });
  },
};
export default meta;

type Story = StoryObj<TowerPanelArgs>;

/** Upgrade affordable: next-level stats and the next level's range circle. */
export const CanUpgrade: Story = { args: { fixture: 'towerSelected' } };
/** Upgrade cost in the danger colour, button disabled. */
export const NotEnoughGold: Story = { args: { fixture: 'towerSelectedLowGold' } };
/** Top level: "已满级", no next-level values; the panel flips left near the right edge. */
export const MaxLevel: Story = { args: { fixture: 'towerSelectedMaxLevel' } };
/** Sell pressed once: the button asks for confirmation. */
/** A slow tower: the Slow line, and the Splash the next level gains ("—" now). */
export const SlowTower: Story = { args: { fixture: 'slowTowerSelected' } };
export const ConfirmingSell: Story = { args: { fixture: 'towerSelected', confirmingSell: true } };
