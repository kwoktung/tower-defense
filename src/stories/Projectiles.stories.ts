import type { Meta, StoryObj } from '@storybook/html-vite';
import { fixtures } from '../fixtures/named';
import { baseArgs, baseArgTypes, type BaseStoryArgs } from '../storybook/args';
import { mountFixtureStory } from '../storybook/fixture-story';

const meta: Meta<BaseStoryArgs> = {
  title: 'Entities/Projectiles',
  args: baseArgs,
  argTypes: baseArgTypes,
};
export default meta;

type Story = StoryObj<BaseStoryArgs>;

/** A basic tower's projectile in flight, zoomed in. */
export const Basic: Story = {
  render: (args) => {
    const fixture = fixtures.basicTowerFiring();
    const projectile = fixture.initialState.projectiles[0];
    if (!projectile) throw new Error('basicTowerFiring has no projectile in flight');
    return mountFixtureStory(args, fixture, { focus: { projectileId: projectile.id }, zoom: 4 });
  },
};
