import type { Meta, StoryObj } from '@storybook/html-vite';
import { fixtures } from '../fixtures/named';
import { loadBundledUnits } from '../content/bundled';
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
    return mountFixtureStory(args, fixture, {
      camera: { focus: { projectileId: projectile.id }, zoom: 4 },
    });
  },
};

/** A splash impact on a cluster: the explosion disc shows the splash radius (frozen at full strength). */
export const SplashExplosion: Story = {
  render: (args) => {
    const fixture = fixtures.splashHittingCluster();
    const leader = fixture.initialState.enemies[0]!;
    const projectile = fixture.initialState.projectiles[0]!;
    const radius = loadBundledUnits().towers.splash!.attack;
    if (radius.mode !== 'splash') throw new Error('splash tower is not a splash attack');
    // Show the explosion where the projectile is headed, without the projectile itself.
    fixture.initialState.projectiles = [];
    return mountFixtureStory(args, fixture, {
      camera: { focus: { enemyId: leader.id }, zoom: 3 },
      effects: [
        {
          type: 'projectileHit',
          projectileId: projectile.id,
          x: projectile.destination.x,
          y: projectile.destination.y,
          splashRadius: radius.radius,
        },
      ],
    });
  },
};
