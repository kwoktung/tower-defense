import { describe, expect, it } from 'vitest';
import { towerInvestment, type WaveDef } from '../content/schemas';
import { scenario } from '../fixtures/scenario';
import { createSimulation, type Simulation } from './simulation';

/**
 * Balance report, not a rule test: it plays whole Waves and is slow (about a minute), so it only
 * runs with `pnpm balance`. It compares spending gold on more level-1 towers against upgrading one
 * tower, each at its best placement, and plays level 1 with a few scripted strategies.
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
const SLOT_ORDER = ['slot-3', 'slot-7', 'slot-6', 'slot-5', 'slot-2', 'slot-10', 'slot-4'];
const build =
  (kind: string): Bot =>
  (sim) => {
    const slot = SLOT_ORDER.find((s) => sim.canPlaceTower(s, kind).ok);
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

    lines.push('Level 1 with scripted strategies:');
    const bots: Record<string, Bot> = {
      'basic, build only': build('basic'),
      'basic, 1 tower then upgrade': upgradeAfter('basic', 1),
      'basic, 2 towers then upgrade': upgradeAfter('basic', 2),
      'splash, build only': build('splash'),
    };
    for (const [name, bot] of Object.entries(bots)) {
      const sim = createSimulation(scenario().build());
      while (sim.state.outcome === 'playing') {
        bot(sim);
        if (sim.canStartNextWave()) sim.startNextWave();
        sim.advance(30);
      }
      const towers = sim.state.towers.map((t) => `${t.kind} Lv${t.level}`).join(', ');
      lines.push(
        `  ${name.padEnd(30)} ${sim.state.outcome}, lives ${sim.state.lives}, gold left ${sim.state.gold}: ${towers}`,
      );
    }

    process.stdout.write(`\n${lines.join('\n')}\n`);
    expect(lines.length).toBeGreaterThan(0);
  }, 600_000);
});
