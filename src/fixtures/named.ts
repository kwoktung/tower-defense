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

  /** A group of enemies about to reach the end of the Path. */
  enemyLeaking: (): Fixture =>
    scenario()
      .atWave(0)
      .withLives(3)
      .withEnemies('normal', 3, { atPathT: 2380, spacing: 40 })
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
