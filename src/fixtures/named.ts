import { scenario, type Fixture } from './scenario';

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
      .atWave(2)
      .withEnemies('normal', 6, { atPathT: 1700, spacing: 40, hpRatio: 0.6 })
      .withEnemies('fast', 4, { atPathT: 900, spacing: 30 })
      .withSpawning({ groupIndex: 1, spawnedInGroup: 4, cooldownTicks: 10 })
      .build(),

  /** The game just won: the last Wave cleared with towers still standing. */
  won: (): Fixture =>
    scenario()
      .atWave(2)
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
