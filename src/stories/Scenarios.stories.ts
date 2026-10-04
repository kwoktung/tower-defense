import type { Meta, StoryObj } from '@storybook/html-vite';
import { fixtures, type FixtureName } from '../fixtures/named';
import { baseArgs, baseArgTypes, type BaseStoryArgs } from '../storybook/args';
import { mountFixtureStory } from '../storybook/fixture-story';

interface ScenarioArgs extends BaseStoryArgs {
  fixture: FixtureName;
}

const meta: Meta<ScenarioArgs> = {
  title: 'Scenarios',
  args: baseArgs,
  argTypes: { ...baseArgTypes, fixture: { control: false } },
  render: (args) => mountFixtureStory(args, fixtures[args.fixture](), { hud: true }),
};
export default meta;

type Story = StoryObj<ScenarioArgs>;

export const OneOfEachEnemy: Story = { args: { fixture: 'oneOfEachEnemy' } };
export const BasicTowerFiring: Story = { args: { fixture: 'basicTowerFiring' } };
export const SplashHittingCluster: Story = { args: { fixture: 'splashHittingCluster' } };
export const OneOfEachTower: Story = { args: { fixture: 'oneOfEachTower' } };
export const EnemyLeaking: Story = { args: { fixture: 'enemyLeaking' } };
