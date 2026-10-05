import type { Meta, StoryObj } from '@storybook/html-vite';
import { fixtures } from '../fixtures/named';
import { scenario, type Fixture } from '../fixtures/scenario';
import type { SimEvent } from '../sim/types';
import { baseArgs, baseArgTypes, towerKinds, type BaseStoryArgs } from '../storybook/args';
import { mountFixtureStory } from '../storybook/fixture-story';

interface TowerArgs extends BaseStoryArgs {
  kind: string;
}

const SLOT = 'slot-7';

const meta: Meta<TowerArgs> = {
  title: 'Entities/Towers',
  args: { ...baseArgs, kind: 'basic' },
  argTypes: { ...baseArgTypes, kind: { control: 'select', options: towerKinds } },
};
export default meta;

type Story = StoryObj<TowerArgs>;

export const Idle: Story = {
  render: (args) =>
    mountFixtureStory(args, scenario().withTower(args.kind, SLOT).build(), {
      camera: { focus: { slotId: SLOT } },
    }),
};

export const SplashIdle: Story = { ...Idle, args: { kind: 'splash' } };

/** The pointer over an empty Slot previews the selected tower's range before building. */
export const HoverRangePreview: Story = {
  render: (args) =>
    mountFixtureStory(args, scenario().build(), {
      ui: { selectedTower: args.kind, hoverSlot: SLOT },
      camera: { focus: { slotId: SLOT }, zoom: 2 },
    }),
};

export const SplashHoverRangePreview: Story = { ...HoverRangePreview, args: { kind: 'splash' } };

/** Every tower kind side by side. */
export const AllKinds: Story = {
  render: (args) =>
    mountFixtureStory(args, fixtures.oneOfEachTower(), {
      camera: { focus: { slotId: 'slot-2' }, zoom: 2 },
    }),
};

/** Mid-shot: the projectile is in flight, and the tower's fire pulse is frozen at its peak. */
export const Firing: Story = {
  render: (args) => {
    const fixture = fixtures.basicTowerFiring();
    return mountFixtureStory(args, fixture, {
      camera: { focus: { slotId: 'slot-3' }, zoom: 2 },
      effects: firedEvents(fixture),
    });
  },
};

export const SplashFiring: Story = {
  render: (args) => {
    const fixture = fixtures.splashHittingCluster();
    return mountFixtureStory(args, fixture, {
      camera: { focus: { slotId: 'slot-3' }, zoom: 2 },
      effects: firedEvents(fixture),
    });
  },
};

/** A towerFired event for each projectile in flight, to show the fire pulse. */
function firedEvents({ initialState }: Fixture): SimEvent[] {
  return initialState.projectiles.map((p) => ({
    type: 'towerFired',
    towerId: p.towerId,
    projectileId: p.id,
    targetId: p.targetId ?? 0,
  }));
}
