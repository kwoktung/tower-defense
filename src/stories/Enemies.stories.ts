import type { Meta, StoryObj } from '@storybook/html-vite';
import { scenario } from '../fixtures/scenario';
import { baseArgs, baseArgTypes, type BaseStoryArgs } from '../storybook/args';
import { mountFixtureStory } from '../storybook/fixture-story';

interface EnemyArgs extends BaseStoryArgs {
  kind: string;
  hpRatio: number;
  /** Where along the Path to stand; changes the heading on turns. */
  pathT: number;
}

const meta: Meta<EnemyArgs> = {
  title: 'Entities/Enemies',
  args: { ...baseArgs, kind: 'normal', hpRatio: 1, pathT: 400 },
  argTypes: {
    ...baseArgTypes,
    kind: { control: 'select', options: ['normal', 'fast'] },
    hpRatio: { control: { type: 'range', min: 0, max: 1, step: 0.05 } },
    pathT: { control: { type: 'range', min: 0, max: 2432, step: 8 } },
  },
  render: (args) => {
    const fixture = scenario()
      .atWave(0)
      .withEnemies(args.kind, 1, { atPathT: args.pathT, hpRatio: args.hpRatio })
      .build();
    return mountFixtureStory(args, fixture, {
      focus: { enemyId: fixture.initialState.enemies[0]!.id },
    });
  },
};
export default meta;

type Story = StoryObj<EnemyArgs>;

export const Normal: Story = {};
export const NormalDamaged: Story = { args: { hpRatio: 0.35 } };
/** On the downward segment, so the triangle points down. */
export const Fast: Story = { args: { kind: 'fast', pathT: 860 } };
export const FastDamaged: Story = { args: { kind: 'fast', pathT: 860, hpRatio: 0.5 } };
