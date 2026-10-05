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
  render: (args) => mountFixtureStory(args, fixtures[args.fixture](), { ui: { hud: true } }),
};
export default meta;

type Story = StoryObj<HudArgs>;

/** Before the first Wave: "开始第 1 波", enabled. */
export const Default: Story = { args: { fixture: 'emptyMap' } };
/** The current Wave still spawning: "出怪中", disabled. */
export const WaveSpawning: Story = { args: { fixture: 'waveSpawning' } };
/** Spawned, enemies still on the field: "提前开波 +12" in gold, enabled (an Early call). */
export const EarlyCall: Story = { args: { fixture: 'earlyCallReady' } };
/** Just made an Early call: "+12" floats from the gold (frozen at its first frame). */
export const EarlyCallBonus: Story = {
  args: { fixture: 'earlyCallReady' },
  render: (args) => {
    const fixture = fixtures[args.fixture]();
    const bonus = fixture.initialState.enemies.length * fixture.level.earlyCallGoldPerEnemy;
    return mountFixtureStory(args, fixture, {
      ui: { hud: true },
      effects: [{ type: 'waveStarted', index: 2, trigger: 'player', bonus }],
    });
  },
};
/** The Auto start countdown: "下一波 3", enabled to start now. */
export const AutoStartCountdown: Story = { args: { fixture: 'waveCountdown' } };
/** Not enough gold for any tower: build buttons are disabled. */
export const LowGold: Story = { args: { fixture: 'lowGold' } };
/** During the last Wave ("第 N / N 波"): "最后一波", disabled. */
export const FinalWave: Story = { args: { fixture: 'finalWave' } };
export const WonOverlay: Story = { args: { fixture: 'won' } };
export const LostOverlay: Story = { args: { fixture: 'lost' } };
