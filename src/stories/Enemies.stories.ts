import type { Meta, StoryObj } from '@storybook/html-vite';
import { scenario, type Fixture } from '../fixtures/scenario';
import { createSimulation } from '../sim/simulation';
import type { SimEvent } from '../sim/types';
import { baseArgs, baseArgTypes, enemyKinds, type BaseStoryArgs } from '../storybook/args';
import { mountFixtureStory } from '../storybook/fixture-story';

interface EnemyArgs extends BaseStoryArgs {
  kind: string;
  /** Show the hit flash, as on an enemyDamaged event. */
  hit: boolean;
  hpRatio: number;
  /** Where along the Path to stand; changes the heading on turns. */
  pathT: number;
}

const meta: Meta<EnemyArgs> = {
  title: 'Entities/Enemies',
  args: { ...baseArgs, kind: 'normal', hpRatio: 1, pathT: 400, hit: false },
  argTypes: {
    ...baseArgTypes,
    kind: { control: 'select', options: enemyKinds },
    hpRatio: { control: { type: 'range', min: 0, max: 1, step: 0.05 } },
    pathT: { control: { type: 'range', min: 0, max: 2432, step: 8 } },
    hit: { control: 'boolean' },
  },
  render: (args) => {
    const fixture = scenario()
      .atWave(0)
      .withEnemies(args.kind, 1, { atPathT: args.pathT, hpRatio: args.hpRatio })
      .build();
    const id = fixture.initialState.enemies[0]!.id;
    return mountFixtureStory(args, fixture, {
      camera: { focus: { enemyId: id } },
      effects: args.hit ? [{ type: 'enemyDamaged', id, amount: 0 }] : [],
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
/** The white hit flash, frozen. */
export const NormalHit: Story = { args: { hit: true, hpRatio: 0.6 } };
export const FastHit: Story = { args: { kind: 'fast', pathT: 860, hit: true, hpRatio: 0.6 } };
/** Under a Slow: the icy ring. */
export const NormalSlowed: Story = {
  render: (args) => {
    const fixture = scenario()
      .atWave(0)
      .withEnemies(args.kind, 1, {
        atPathT: args.pathT,
        hpRatio: args.hpRatio,
        slow: { factor: 0.4, durationSec: 2 },
      })
      .build();
    return mountFixtureStory(args, fixture, {
      camera: { focus: { enemyId: fixture.initialState.enemies[0]!.id } },
    });
  },
};
export const ArmoredSlowed: Story = { ...NormalSlowed, args: { kind: 'armored' } };
/** Darker, bigger octagon with a grey armour outline. */
export const Armored: Story = { args: { kind: 'armored' } };
export const ArmoredHit: Story = { args: { kind: 'armored', hit: true, hpRatio: 0.6 } };

const KILL_SLOT = 'slot-3';

/**
 * A real kill: a basic tower on slot-3 shoots a weak enemy until the Simulation reports
 * `enemyKilled`. Returns the state right after the kill (the enemy already gone) and that event.
 */
function killMoment(kind: string): {
  fixture: Fixture;
  killed: Extract<SimEvent, { type: 'enemyKilled' }>;
} {
  const fixture = scenario()
    .atWave(0)
    .withTower('basic', KILL_SLOT)
    .withEnemies(kind, 1, { atPathT: 600, hpRatio: 0.25 })
    .build();
  const sim = createSimulation(fixture);
  for (let tick = 0; tick < 120; tick++) {
    const killed = sim.advance(1).find((e) => e.type === 'enemyKilled');
    if (killed)
      return { fixture: { ...fixture, initialState: structuredClone(sim.state) }, killed };
  }
  throw new Error(`The ${kind} enemy was not killed within 2 s`);
}

/** The kill ring, frozen at its first frame where the enemy just died. */
const killedStory = (kind: string, effectKind = kind): Story => ({
  args: { kind },
  render: (args) => {
    const { fixture, killed } = killMoment(kind);
    return mountFixtureStory(args, fixture, {
      camera: { focus: { slotId: KILL_SLOT } },
      effects: [{ ...killed, kind: effectKind }],
    });
  },
});

export const NormalKilled: Story = killedStory('normal');
export const FastKilled: Story = killedStory('fast');
/** A kind the skin has no colour for: the ring uses the shared fallback colour. */
export const UnknownKindKilled: Story = killedStory('normal', 'unknown');
