import type { Meta, StoryObj } from '@storybook/html-vite';
import { fixtures } from '../fixtures/named';
import { scenario, type Fixture } from '../fixtures/scenario';
import { createSimulation } from '../sim/simulation';
import type { SimEvent } from '../sim/types';
import {
  baseArgs,
  baseArgTypes,
  maxTowerLevel,
  towerKinds,
  type BaseStoryArgs,
} from '../storybook/args';
import { mountFixtureStory } from '../storybook/fixture-story';

interface TowerArgs extends BaseStoryArgs {
  kind: string;
  level: number;
}

const SLOT = 'slot-7';

const meta: Meta<TowerArgs> = {
  title: 'Entities/Towers',
  args: { ...baseArgs, kind: 'basic', level: 1 },
  argTypes: {
    ...baseArgTypes,
    kind: { control: 'select', options: towerKinds },
    level: { control: { type: 'number', min: 1, max: maxTowerLevel, step: 1 } },
  },
};
export default meta;

type Story = StoryObj<TowerArgs>;

export const Idle: Story = {
  render: (args) =>
    mountFixtureStory(args, scenario().withTower(args.kind, SLOT, Number(args.level)).build(), {
      camera: { focus: { slotId: SLOT } },
    }),
};

export const SplashIdle: Story = { ...Idle, args: { kind: 'splash' } };
export const Level2: Story = { ...Idle, args: { level: 2 } };
export const Level3: Story = { ...Idle, args: { level: 3 } };
export const SplashLevel3: Story = { ...Idle, args: { kind: 'splash', level: 3 } };

/** Just upgraded: the burst ring and the body's pop, frozen at their first frame. */
export const Upgraded: Story = {
  args: { level: 2 },
  render: (args) => {
    const fixture = scenario().withTower(args.kind, SLOT, Number(args.level)).build();
    const tower = fixture.initialState.towers[0]!;
    return mountFixtureStory(args, fixture, {
      camera: { focus: { slotId: SLOT } },
      effects: [{ type: 'towerUpgraded', id: tower.id, kind: tower.kind, level: tower.level }],
    });
  },
};

/** Just sold: the tower is gone, its colour collapsing and the refund floating up. */
export const Sold: Story = {
  args: { level: 3 },
  render: (args) => {
    const fixture = scenario().withTower(args.kind, SLOT, Number(args.level)).build();
    const sim = createSimulation(fixture);
    const result = sim.sellTower(sim.state.towers[0]!.id);
    if (!result.ok) throw new Error(`could not sell: ${result.reason}`);
    const effects = sim.advance(0);
    return mountFixtureStory(
      args,
      { ...fixture, initialState: structuredClone(sim.state) },
      {
        camera: { focus: { slotId: SLOT } },
        effects,
      },
    );
  },
};

/** The pointer over an empty Slot previews the selected tower's range before building. */
export const HoverRangePreview: Story = {
  render: (args) =>
    mountFixtureStory(args, scenario().build(), {
      ui: { buildKind: args.kind, hoverSlot: SLOT },
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
