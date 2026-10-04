import type { Meta, StoryObj } from '@storybook/html-vite';
import { fixtures, type FixtureName } from '../fixtures/named';
import { baseArgs, baseArgTypes, type BaseStoryArgs } from '../storybook/args';
import { mountFixtureStory } from '../storybook/fixture-story';

interface HudArgs extends BaseStoryArgs {
  fixture: FixtureName;
}

const meta: Meta<HudArgs> = {
  title: 'HUD',
  args: baseArgs,
  argTypes: { ...baseArgTypes, fixture: { control: false } },
  render: (args) => mountFixtureStory(args, fixtures[args.fixture](), { hud: true }),
};
export default meta;

type Story = StoryObj<HudArgs>;

/** Before the first Wave: the next-wave button is enabled. */
export const Default: Story = { args: { fixture: 'emptyMap' } };
/** Enemies on the field: the next-wave button is disabled. */
export const CannotStartWave: Story = { args: { fixture: 'oneOfEachEnemy' } };
/** Not enough gold for any tower: build buttons are disabled. */
export const LowGold: Story = { args: { fixture: 'lowGold' } };
export const WonOverlay: Story = { args: { fixture: 'won' } };
export const LostOverlay: Story = { args: { fixture: 'lost' } };
