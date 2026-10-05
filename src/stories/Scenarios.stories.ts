import type { Meta, StoryObj } from '@storybook/html-vite';
import { fixtures, type FixtureName } from '../fixtures/named';
import { baseArgs, baseArgTypes, type BaseStoryArgs } from '../storybook/args';
import { mountFixtureStory } from '../storybook/fixture-story';
import type { ShotsParameters } from '../storybook/shots';

interface ScenarioArgs extends BaseStoryArgs {
  fixture: FixtureName;
  running: boolean;
  speed: number;
  advanceTicks: number;
}

/** One story per named Fixture. Static by default; turn on `running` to watch it play out. */
const meta: Meta<ScenarioArgs> = {
  title: 'Scenarios',
  args: { ...baseArgs, running: false, speed: 1, advanceTicks: 0 },
  argTypes: {
    ...baseArgTypes,
    fixture: { control: false },
    running: { control: 'boolean', description: 'Keep the Simulation running' },
    speed: { control: { type: 'range', min: 0.25, max: 4, step: 0.25 } },
    advanceTicks: {
      control: { type: 'number', min: 0, step: 10 },
      description: 'Fast-forward before the first frame (60 ticks = 1 s)',
    },
  },
  render: (args) =>
    mountFixtureStory(args, fixtures[args.fixture](), {
      ui: { hud: true },
      playback: {
        running: args.running,
        speed: Number(args.speed),
        advanceTicks: Number(args.advanceTicks),
      },
    }),
};
export default meta;

type Story = StoryObj<ScenarioArgs>;

const timeline = (...ticks: number[]): { parameters: { shots: ShotsParameters } } => ({
  parameters: { shots: { ticks } },
});

export const EmptyMap: Story = { args: { fixture: 'emptyMap' } };
export const OneOfEachEnemy: Story = { args: { fixture: 'oneOfEachEnemy' } };
export const OneOfEachTower: Story = { args: { fixture: 'oneOfEachTower' } };
/** The skin acceptance page: every tower kind at every level (ADR-0002). */
export const AllTowerLevels: Story = { args: { fixture: 'allTowerLevels' } };
/** Armor: the level-1 tower's hits barely dent the armored line; the top-level one cuts through. */
export const ArmoredWave: Story = {
  args: { fixture: 'armoredWave' },
  ...timeline(0, 600, 1100, 1500),
};
/** Slow: hit fast enemies get an icy ring and fall behind the unslowed ones. */
export const SlowingFastEnemies: Story = {
  args: { fixture: 'slowingFastEnemies' },
  ...timeline(0, 60, 150, 300),
};
/** An Early call moment: wave 2's pack still on the field; watch the defence hold (or not). */
export const EarlyCallReady: Story = {
  args: { fixture: 'earlyCallReady' },
  ...timeline(0, 120, 300),
};
/** Gold on more towers vs on one upgrade: same pack, compare the timelines (ticket 04). */
export const SpentOnTowers: Story = {
  args: { fixture: 'spentOnTowers' },
  ...timeline(0, 120, 300, 600),
};
export const SpentOnUpgrade: Story = {
  args: { fixture: 'spentOnUpgrade' },
  ...timeline(0, 120, 300, 600),
};
export const BasicTowerFiring: Story = {
  args: { fixture: 'basicTowerFiring' },
  ...timeline(0, 10, 40, 90),
};
export const SplashHittingCluster: Story = {
  args: { fixture: 'splashHittingCluster' },
  ...timeline(0, 8, 30, 120),
};
export const EnemyLeaking: Story = { args: { fixture: 'enemyLeaking' }, ...timeline(0, 50, 100) };
export const LowGold: Story = { args: { fixture: 'lowGold' } };
export const FinalWave: Story = { args: { fixture: 'finalWave' }, ...timeline(0, 60, 180) };
export const Won: Story = { args: { fixture: 'won' } };
export const Lost: Story = { args: { fixture: 'lost' } };
