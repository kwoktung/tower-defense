import { loadBundledLevel } from '../content/bundled';
import { scenario, type Fixture } from './scenario';

/** Index of the fast group in level 1's last Wave, which `finalWave` is caught spawning. */
const LAST_WAVE_FAST_GROUP = (() => {
  const index = loadBundledLevel('level-1')
    .waves.at(-1)!
    .groups.findIndex((g) => g.kind === 'fast');
  if (index < 0) throw new Error("finalWave: level 1's last Wave has no fast group");
  return index;
})();

/** Slots for `allTowerLevels`: one row per tower kind, one Slot per level. */
const ALL_LEVELS_ROWS = [
  ['slot-1', 'slot-2', 'slot-3'],
  ['slot-8', 'slot-6', 'slot-7'],
  ['slot-9', 'slot-10', 'slot-11'],
];

/**
 * Named Fixtures shared by tests and Scenario stories. Each is a function so callers
 * always get a fresh copy.
 */
export const fixtures = {
  /** The level as the player first sees it. */
  emptyMap: (): Fixture => scenario().build(),

  /** One of each enemy kind mid-path, one of them damaged. */
  oneOfEachEnemy: (): Fixture =>
    scenario()
      .atWave(0)
      .withEnemies('normal', 1, { atPathT: 900 })
      .withEnemies('fast', 1, { atPathT: 700, hpRatio: 0.5 })
      .build(),

  /** Not enough gold for any tower, with one tower already built. */
  lowGold: (): Fixture => scenario().withTower('basic', 'slot-2').withGold(30).build(),

  /** A basic tower shooting at a line of enemies, its first projectile in flight. */
  basicTowerFiring: (): Fixture =>
    scenario()
      .atWave(0)
      .withTower('basic', 'slot-3')
      .withEnemies('normal', 3, { atPathT: 560, spacing: 48 })
      .advance(4)
      .build(),

  /** A splash tower's shot in flight toward a tight cluster of enemies. */
  splashHittingCluster: (): Fixture =>
    scenario()
      .atWave(1)
      .withTower('splash', 'slot-3')
      .withEnemies('normal', 3, { atPathT: 600, spacing: 18 })
      .withEnemies('fast', 2, { atPathT: 548, spacing: 16 })
      .advance(6)
      .build(),

  /** One of each tower kind, idle. */
  oneOfEachTower: (): Fixture =>
    scenario().withTower('basic', 'slot-2').withTower('splash', 'slot-3').build(),

  /**
   * Every tower kind at every level, read from the Unit catalog so new kinds and levels appear
   * by themselves: one row of Slots per kind (top, middle, bottom), levels left to right.
   */
  allTowerLevels: (): Fixture => {
    const builder = scenario();
    const kinds = Object.entries(builder.units.towers);
    if (kinds.length > ALL_LEVELS_ROWS.length) {
      throw new Error('allTowerLevels: add a row of Slots for the new tower kind');
    }
    kinds.forEach(([kind, def], row) =>
      def.levels.forEach((_, i) => {
        const slot = ALL_LEVELS_ROWS[row]![i];
        if (!slot) throw new Error(`allTowerLevels: add a Slot for ${kind} level ${i + 1}`);
        builder.withTower(kind, slot, i + 1);
      }),
    );
    return builder.build();
  },

  /**
   * A line of armored enemies walking past a level-1 basic tower (slot-3) and then a top-level
   * one (slot-7): the level-1 shots barely dent them.
   */
  armoredWave: (): Fixture =>
    scenario()
      .atWave(2)
      .withTower('basic', 'slot-3', 1)
      .withTower('basic', 'slot-7', 3)
      .withEnemies('armored', 5, { atPathT: 300, spacing: 56 })
      .build(),

  /** Fast enemies streaming past a level-2 slow tower and a basic tower: the slowed ones show their icy ring. */
  slowingFastEnemies: (): Fixture =>
    scenario()
      .atWave(1)
      .withTower('slow', 'slot-3', 2)
      .withTower('basic', 'slot-7')
      .withEnemies('fast', 6, { atPathT: 420, spacing: 40 })
      .build(),

  /** A level-2 slow tower with gold for its upgrade, which brings a splash (open its panel in stories). */
  slowTowerSelected: (): Fixture => scenario().withGold(200).withTower('slow', 'slot-6', 2).build(),

  /** The first Wave still spawning: the next-wave button is disabled. */
  waveSpawning: (): Fixture =>
    scenario()
      .atWave(0)
      .withSpawning({ groupIndex: 0, spawnedInGroup: 3, cooldownTicks: 20 })
      .withEnemies('normal', 3, { atPathT: 160, spacing: 56 })
      .build(),

  /**
   * Wave 2 just finished spawning with a pack still on the field and a mixed defence up: the
   * next-wave button offers an Early call for the living enemies.
   */
  earlyCallReady: (): Fixture =>
    scenario()
      .atWave(1)
      .withGold(60)
      .withTower('basic', 'slot-3', 2)
      .withTower('slow', 'slot-7')
      .withTower('basic', 'slot-6', 2)
      .withEnemies('normal', 8, { atPathT: 500, spacing: 36 })
      .withEnemies('fast', 4, { atPathT: 160, spacing: 30 })
      .build(),

  /** Wave 2 cleared, the Auto start countdown running (2.5 s left). */
  waveCountdown: (): Fixture =>
    scenario().atWave(1).withTower('basic', 'slot-3', 2).withAutoStartIn(150).build(),

  /**
   * Two basic towers aiming opposite ways: slot-3's target is on the top run to its right,
   * slot-7's on the middle run to its left. Advanced one tick so both have acquired them.
   */
  towersFacingTargets: (): Fixture =>
    scenario()
      .atWave(0)
      .withTower('basic', 'slot-3')
      .withTower('basic', 'slot-7')
      .withEnemies('normal', 1, { atPathT: 682 })
      .withEnemies('normal', 1, { atPathT: 1296 })
      .advance(1)
      .build(),

  /** About 150 gold spent on three level-1 basic towers, facing a dense pack. Compare with spentOnUpgrade. */
  spentOnTowers: (): Fixture =>
    scenario()
      .atWave(2)
      .withTower('basic', 'slot-3')
      .withTower('basic', 'slot-7')
      .withTower('basic', 'slot-6')
      .withEnemies('normal', 12, { atPathT: 420, spacing: 24 })
      .withEnemies('fast', 8, { atPathT: 100, spacing: 20 })
      .build(),

  /** About 150 gold spent on one top-level basic tower, facing the same pack as spentOnTowers. */
  spentOnUpgrade: (): Fixture =>
    scenario()
      .atWave(2)
      .withTower('basic', 'slot-7', 3)
      .withEnemies('normal', 12, { atPathT: 420, spacing: 24 })
      .withEnemies('fast', 8, { atPathT: 100, spacing: 20 })
      .build(),

  /** A level-1 basic tower with gold for its upgrade, during a Wave (open its panel in stories). */
  towerSelected: (): Fixture =>
    scenario()
      .atWave(0)
      .withGold(120)
      .withTower('basic', 'slot-3')
      .withEnemies('normal', 3, { atPathT: 560, spacing: 48 })
      .build(),

  /** A level-2 basic tower whose next upgrade the gold doesn't cover. */
  towerSelectedLowGold: (): Fixture =>
    scenario().withGold(20).withTower('basic', 'slot-6', 2).build(),

  /** A top-level splash tower near the right edge, so its panel opens to the left. */
  towerSelectedMaxLevel: (): Fixture =>
    scenario().withGold(500).withTower('splash', 'slot-4', 3).build(),

  /** A group of enemies about to reach the end of the Path. */
  enemyLeaking: (): Fixture =>
    scenario()
      .atWave(0)
      .withLives(3)
      .withEnemies('normal', 3, { atPathT: 2380, spacing: 40 })
      .build(),

  /** Mid last Wave: the fast group still spawning, a defended line, lives running low. */
  finalWave: (): Fixture =>
    scenario()
      .withGold(40)
      .withLives(4)
      .withTower('basic', 'slot-2')
      .withTower('basic', 'slot-6')
      .withTower('splash', 'slot-5')
      .withTower('splash', 'slot-10')
      .atLastWave()
      .withEnemies('normal', 6, { atPathT: 1700, spacing: 40, hpRatio: 0.6 })
      .withEnemies('fast', 4, { atPathT: 900, spacing: 30 })
      .withSpawning({ groupIndex: LAST_WAVE_FAST_GROUP, spawnedInGroup: 4, cooldownTicks: 10 })
      .build(),

  /** The game just won: the last Wave cleared with towers still standing. */
  won: (): Fixture =>
    scenario()
      .atLastWave()
      .withLives(7)
      .withGold(85)
      .withTower('basic', 'slot-3')
      .withTower('basic', 'slot-7')
      .withTower('basic', 'slot-10')
      .withOutcome('won')
      .build(),

  /** The game just lost: lives at zero during the second Wave. */
  lost: (): Fixture =>
    scenario()
      .atWave(1)
      .withLives(0)
      .withOutcome('lost')
      .withEnemies('fast', 3, { atPathT: 2300, spacing: 60 })
      .withEnemies('normal', 4, { atPathT: 1500, spacing: 80 })
      .build(),
} satisfies Record<string, () => Fixture>;

export type FixtureName = keyof typeof fixtures;
