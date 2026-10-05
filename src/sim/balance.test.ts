import { describe, expect, it } from 'vitest';
import { towerInvestment, type WaveDef } from '../content/schemas';
import { scenario } from '../fixtures/scenario';
import { createSimulation, type Simulation } from './simulation';

/**
 * Balance report, not a rule test: it plays whole Waves and is slow (about a minute), so it only
 * runs with `pnpm balance`. It compares spending gold on more level-1 towers against upgrading one
 * tower, each at its best placement, and plays level 1 with scripted strategies, marking each
 * against the level's acceptance criteria.
 */
const STRESS_WAVES: Record<string, WaveDef> = {
  stressNormal: { groups: [{ kind: 'normal', count: 40, intervalSec: 0.4 }] },
  stressFast: { groups: [{ kind: 'fast', count: 40, intervalSec: 0.3 }] },
  hardNormal: { groups: [{ kind: 'normal', count: 60, intervalSec: 0.25 }] },
  hardFast: { groups: [{ kind: 'fast', count: 60, intervalSec: 0.15 }] },
};

const base = scenario().withLives(999).build();
const slotIds = base.level.slots.map((s) => s.id);

/** Leaks while one Wave plays out against towers of `kind` and `level` on `slots`. */
function leaksOf(kind: string, level: number, slots: string[], wave: WaveDef): number {
  let builder = scenario().withLives(999);
  for (const slot of slots) builder = builder.withTower(kind, slot, level);
  const fixture = builder.build();
  const sim = createSimulation({ ...fixture, level: { ...fixture.level, waves: [wave] } });
  sim.startNextWave();
  let leaks = 0;
  while (sim.state.outcome === 'playing') {
    leaks += sim.advance(60).filter((e) => e.type === 'enemyLeaked').length;
  }
  return leaks;
}

function combinations(n: number, from = 0): string[][] {
  if (n === 0) return [[]];
  return slotIds
    .slice(from)
    .flatMap((slot, i) => combinations(n - 1, from + i + 1).map((rest) => [slot, ...rest]));
}

/** Fewest leaks over `waves` for `count` towers at their best Slots. */
function bestLeaks(kind: string, count: number, level: number, waves: string[]): number {
  return Math.min(
    ...combinations(count).map((slots) =>
      waves.reduce((sum, w) => sum + leaksOf(kind, level, slots, STRESS_WAVES[w]!), 0),
    ),
  );
}

type Bot = (sim: Simulation) => void;
const SLOT_ORDER = [
  'slot-3',
  'slot-7',
  'slot-6',
  'slot-5',
  'slot-2',
  'slot-10',
  'slot-4',
  'slot-9',
];
const build =
  (kind: string): Bot =>
  (sim) => {
    const slot = [...SLOT_ORDER, ...slotIds].find((s) => sim.canPlaceTower(s, kind).ok);
    if (slot) sim.placeTower(slot, kind);
  };
/** Builds up to `count` towers, then puts all gold into upgrades. */
const upgradeAfter =
  (kind: string, count: number): Bot =>
  (sim) => {
    if (sim.state.towers.length < count) return build(kind)(sim);
    const tower = sim.state.towers.find((t) => sim.canUpgradeTower(t.id).ok);
    if (tower) sim.upgradeTower(tower.id);
  };
/** Steps strictly in order: "kind@slot" builds there, "up@slot#n" upgrades that tower to level n. */
const plan =
  (steps: string[]): Bot =>
  (sim) => {
    for (const step of steps) {
      const [what, rest] = step.split('@') as [string, string];
      const [slot, target] = rest.split('#') as [string, string | undefined];
      const tower = sim.state.towers.find((t) => t.slotId === slot);
      if (what === 'up') {
        if (!tower || tower.level >= Number(target ?? 3)) continue;
        if (sim.canUpgradeTower(tower.id).ok) sim.upgradeTower(tower.id);
        return;
      }
      if (tower) continue;
      if (sim.canPlaceTower(slot, what).ok) sim.placeTower(slot, what);
      return;
    }
  };
/** About one slow tower per four; once there are three towers, raise the lowest before building. */
const balanced: Bot = (sim) => {
  const towers = sim.state.towers;
  if (towers.length >= 3) {
    const lowest = [...towers].sort((a, b) => a.level - b.level)[0]!;
    if (lowest.level < 3) {
      if (sim.canUpgradeTower(lowest.id).ok) sim.upgradeTower(lowest.id);
      if (towers.length >= 8 || lowest.level < 2) return;
    }
  }
  const slows = towers.filter((t) => t.kind === 'slow').length;
  build(slows < Math.floor((towers.length + 1) / 4) ? 'slow' : 'basic')(sim);
};

const MIXED_A = [
  'basic@slot-3',
  'slow@slot-7',
  'basic@slot-6',
  'up@slot-3#2',
  'splash@slot-5',
  'up@slot-6#2',
  'up@slot-3#3',
  'up@slot-7#2',
  'basic@slot-2',
  'up@slot-6#3',
  'up@slot-5#2',
  'basic@slot-10',
  'up@slot-2#3',
  'up@slot-5#3',
  'up@slot-10#3',
  'slow@slot-4',
  'up@slot-4#2',
  'basic@slot-9',
  'up@slot-9#3',
  'basic@slot-11',
  'up@slot-11#3',
  'up@slot-7#3',
];
const MIXED_B = [
  'basic@slot-3',
  'basic@slot-6',
  'slow@slot-5',
  'up@slot-3#3',
  'up@slot-6#3',
  'splash@slot-7',
  'basic@slot-2',
  'up@slot-2#3',
  'up@slot-7#2',
  'slow@slot-10',
  'basic@slot-4',
  'up@slot-4#3',
  'up@slot-5#3',
  'up@slot-7#3',
  'basic@slot-9',
  'up@slot-9#3',
];

interface Result {
  outcome: string;
  lives: number;
  /** Waves fully cleared. */
  cleared: number;
}

/** The acceptance criteria for level 1 (armor-and-slow spec), per strategy. */
const STRATEGIES: { name: string; bot: Bot; expect: string; ok: (r: Result) => boolean }[] = [
  {
    name: 'basic, 1 tower then upgrade',
    bot: upgradeAfter('basic', 1),
    expect: 'loses',
    ok: (r) => r.outcome === 'lost',
  },
  {
    name: 'basic, 2 towers then upgrade',
    bot: upgradeAfter('basic', 2),
    expect: 'loses',
    ok: (r) => r.outcome === 'lost',
  },
  {
    name: 'basic, build only',
    bot: build('basic'),
    expect: 'loses or ≤ 3 lives',
    ok: (r) => r.outcome === 'lost' || r.lives <= 3,
  },
  {
    name: 'splash, build only',
    bot: build('splash'),
    expect: 'clears wave 1',
    ok: (r) => r.cleared >= 1,
  },
  {
    name: 'mixed plan A',
    bot: plan(MIXED_A),
    expect: 'wins, ≥ 7 lives',
    ok: (r) => r.outcome === 'won' && r.lives >= 7,
  },
  {
    name: 'mixed plan B',
    bot: plan(MIXED_B),
    expect: 'wins, ≥ 7 lives',
    ok: (r) => r.outcome === 'won' && r.lives >= 7,
  },
  {
    name: 'balanced, with slow towers',
    bot: balanced,
    expect: 'wins, ≥ 7 lives',
    ok: (r) => r.outcome === 'won' && r.lives >= 7,
  },
  {
    name: 'mixed plan A, no slow towers',
    bot: plan(MIXED_A.map((s) => s.replace(/^slow@/, 'basic@'))),
    expect: '(for reference)',
    ok: () => true,
  },
];

function playLevel(bot: Bot): Result & { towers: string } {
  const sim = createSimulation(scenario().build());
  while (sim.state.outcome === 'playing') {
    bot(sim);
    if (sim.canStartNextWave()) sim.startNextWave();
    sim.advance(30);
  }
  const { wave, outcome, lives } = sim.state;
  const cleared = outcome === 'won' ? wave.index + 1 : wave.index;
  const towers = sim.state.towers.map((t) => `${t.kind} Lv${t.level}`).join(', ');
  return { outcome, lives, cleared, towers };
}

describe.runIf(process.env.BALANCE)('balance report', () => {
  it('compares more towers against upgrades, and plays level 1', () => {
    const lines: string[] = [];
    for (const waves of [
      ['stressNormal', 'stressFast'],
      ['hardNormal', 'hardFast'],
    ]) {
      lines.push(`Leaks at best placement, waves ${waves.join(' + ')}:`);
      for (const kind of Object.keys(base.units.towers)) {
        const cell = (count: number, level: number) => {
          const gold = count * towerInvestment(base.units, kind, level);
          return `${count}×Lv${level} (${gold}g) ${bestLeaks(kind, count, level, waves)}`;
        };
        lines.push(
          `  ${kind.padEnd(7)} ${cell(2, 1)} vs ${cell(1, 2)}   |   ${cell(3, 1)} vs ${cell(1, 3)}`,
        );
      }
    }

    const waves = base.level.waves.length;
    lines.push(`Level 1 (${waves} waves) with scripted strategies:`);
    for (const { name, bot, expect: wanted, ok } of STRATEGIES) {
      const r = playLevel(bot);
      const mark = ok(r) ? 'ok  ' : 'FAIL';
      lines.push(
        `  ${mark} ${name.padEnd(30)} want ${wanted.padEnd(18)} got ${r.outcome}, lives ${r.lives}, cleared ${r.cleared}/${waves}: ${r.towers}`,
      );
    }

    process.stdout.write(`\n${lines.join('\n')}\n`);
    expect(lines.length).toBeGreaterThan(0);
  }, 600_000);
});
