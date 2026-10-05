import { describe, expect, it } from 'vitest';
import { fixtures } from '../fixtures/named';
import { scenario } from '../fixtures/scenario';
import { towerStats } from '../content/schemas';
import { createSimulation } from './simulation';
import type { SimEvent } from './types';

const TICKS_PER_SECOND = 60;
const ofType = <T extends SimEvent['type']>(events: SimEvent[], type: T) =>
  events.filter((e): e is Extract<SimEvent, { type: T }> => e.type === type);

/** Ticks at which each enemySpawned event happened while advancing one tick at a time. */
function spawnTicks(sim: ReturnType<typeof createSimulation>, ticks: number) {
  const result: { tick: number; kind: string }[] = [];
  for (let i = 0; i < ticks; i++) {
    for (const e of ofType(sim.advance(1), 'enemySpawned')) result.push({ tick: i, kind: e.kind });
  }
  return result;
}

describe('createSimulation', () => {
  it("starts from the level's gold and lives, before the first Wave, still playing", () => {
    const sim = createSimulation(fixtures.emptyMap());

    expect(sim.state).toMatchObject({
      tick: 0,
      gold: 120,
      lives: 10,
      wave: { index: -1, spawning: null },
      outcome: 'playing',
      enemies: [],
    });
  });

  it('starts from a Fixture state without sharing it', () => {
    const fixture = scenario().withLives(4).build();

    const sim = createSimulation(fixture);
    fixture.initialState.lives = 0;

    expect(sim.state.lives).toBe(4);
  });
});

describe('starting a Wave', () => {
  it('is allowed before the first Wave and reports waveStarted on the next advance', () => {
    const sim = createSimulation(fixtures.emptyMap());

    expect(sim.startNextWave()).toBe(true);
    expect(sim.state.wave.index).toBe(0);
    expect(ofType(sim.advance(1), 'waveStarted')).toEqual([{ type: 'waveStarted', index: 0 }]);
  });

  it('is refused while the current Wave is still spawning', () => {
    const sim = createSimulation(fixtures.emptyMap());
    sim.startNextWave();
    sim.advance(1);

    expect(sim.canStartNextWave()).toBe(false);
    expect(sim.startNextWave()).toBe(false);
  });

  it('is refused while enemies are on the field', () => {
    const sim = createSimulation(fixtures.oneOfEachEnemy());

    expect(sim.startNextWave()).toBe(false);
  });

  it('is allowed again once the Wave has fully spawned and the field is clear', () => {
    const sim = createSimulation(scenario().atWave(0).build());

    expect(sim.startNextWave()).toBe(true);
    expect(sim.state.wave.index).toBe(1);
  });

  it('is refused after the last Wave', () => {
    const sim = createSimulation(scenario().atWave(2).build());

    expect(sim.startNextWave()).toBe(false);
  });

  it('is refused once the game has ended', () => {
    const sim = createSimulation(
      scenario().withLives(1).withEnemies('fast', 1, { atPathT: 2430 }).build(),
    );
    sim.advance(1);

    expect(sim.state.outcome).toBe('lost');
    expect(sim.startNextWave()).toBe(false);
  });
});

describe('spawning', () => {
  it("spawns each group's count at its interval, starting on the first tick", () => {
    const sim = createSimulation(fixtures.emptyMap());
    sim.startNextWave();

    const spawns = spawnTicks(sim, 10 * TICKS_PER_SECOND);

    // Wave 1: 8 normal, 0.8 s apart.
    expect(spawns.map((s) => s.tick)).toEqual([0, 48, 96, 144, 192, 240, 288, 336]);
    expect(spawns.every((s) => s.kind === 'normal')).toBe(true);
    expect(sim.state.wave.spawning).toBeNull();
  });

  it('walks the spawn groups in order, keeping the previous interval between groups', () => {
    const sim = createSimulation(scenario().atWave(0).build());
    sim.startNextWave();

    const spawns = spawnTicks(sim, 20 * TICKS_PER_SECOND);

    // Wave 2: 10 normal 0.7 s apart, then 6 fast 0.5 s apart.
    expect(spawns.map((s) => s.kind)).toEqual([
      ...Array(10).fill('normal'),
      ...Array(6).fill('fast'),
    ]);
    expect(spawns[9]!.tick - spawns[8]!.tick).toBe(42);
    expect(spawns[10]!.tick - spawns[9]!.tick).toBe(42);
    expect(spawns[11]!.tick - spawns[10]!.tick).toBe(30);
  });

  it('spawns new enemies at the start of the Path with full hp', () => {
    const sim = createSimulation(fixtures.emptyMap());
    sim.startNextWave();
    sim.advance(1);

    expect(sim.state.enemies).toEqual([{ id: 1, kind: 'normal', hp: 40, maxHp: 40, pathT: 0 }]);
  });
});

describe('movement and Leaks', () => {
  it('moves each enemy along the Path at its speed', () => {
    const sim = createSimulation(fixtures.oneOfEachEnemy());

    sim.advance(TICKS_PER_SECOND);

    const [normal, fast] = sim.state.enemies;
    expect(normal!.pathT).toBeCloseTo(900 + 64);
    expect(fast!.pathT).toBeCloseTo(700 + 128);
  });

  it('removes an enemy that reaches the end of the Path and takes its leak damage from lives', () => {
    const sim = createSimulation(fixtures.enemyLeaking());
    const [leader] = sim.state.enemies;

    const events = sim.advance(TICKS_PER_SECOND);

    expect(ofType(events, 'enemyLeaked')[0]).toEqual({
      type: 'enemyLeaked',
      id: leader!.id,
      livesLost: 1,
    });
    expect(sim.state.enemies.map((e) => e.id)).not.toContain(leader!.id);
    expect(sim.state.lives).toBe(3 - ofType(events, 'enemyLeaked').length);
  });
});

describe('losing', () => {
  it('ends the game as lost the moment lives reach zero', () => {
    const sim = createSimulation(
      scenario()
        .atWave(0)
        .withLives(1)
        .withEnemies('normal', 2, { atPathT: 2431, spacing: 300 })
        .build(),
    );

    const events = sim.advance(1);

    expect(sim.state.outcome).toBe('lost');
    expect(sim.state.lives).toBe(0);
    expect(ofType(events, 'gameEnded')).toEqual([{ type: 'gameEnded', outcome: 'lost' }]);
  });

  it('freezes the state once the game has ended', () => {
    const sim = createSimulation(
      scenario()
        .atWave(0)
        .withLives(1)
        .withEnemies('normal', 2, { atPathT: 2431, spacing: 300 })
        .build(),
    );
    sim.advance(1);
    const frozen = structuredClone(sim.state);

    const events = sim.advance(TICKS_PER_SECOND);

    expect(events).toEqual([]);
    expect(sim.state).toEqual(frozen);
  });
});

describe('determinism', () => {
  it('produces identical states for the same seed and actions', () => {
    const run = () => {
      const sim = createSimulation(scenario({ seed: 7 }).build());
      const events: SimEvent[] = [];
      for (let wave = 0; wave < 3 && sim.state.outcome === 'playing'; wave++) {
        sim.startNextWave();
        events.push(...sim.advance(90 * TICKS_PER_SECOND));
      }
      return { state: sim.state, events };
    };

    const first = run();
    expect(first.state.outcome).toBe('lost');
    expect(run()).toEqual(first);
  });
});

describe('building towers', () => {
  it('builds on an empty Slot, pays the cost and reports towerPlaced on the next advance', () => {
    const sim = createSimulation(fixtures.emptyMap());

    const result = sim.placeTower('slot-3', 'basic');

    expect(result).toEqual({ ok: true, id: expect.any(Number) });
    expect(sim.state.gold).toBe(120 - 50);
    expect(sim.state.towers).toEqual([
      {
        id: (result as { id: number }).id,
        kind: 'basic',
        slotId: 'slot-3',
        level: 1,
        cooldownTicks: 0,
        targetId: null,
      },
    ]);
    expect(ofType(sim.advance(1), 'towerPlaced')).toEqual([
      { type: 'towerPlaced', id: (result as { id: number }).id, kind: 'basic', slotId: 'slot-3' },
    ]);
  });

  it.each([
    ['slotOccupied', () => scenario().withTower('basic', 'slot-3').build(), 'slot-3', 'basic'],
    ['notEnoughGold', () => fixtures.lowGold(), 'slot-3', 'basic'],
    ['unknownSlot', () => fixtures.emptyMap(), 'slot-99', 'basic'],
    ['unknownKind', () => fixtures.emptyMap(), 'slot-3', 'laser'],
    ['gameOver', () => fixtures.lost(), 'slot-3', 'basic'],
  ] as const)('refuses with %s and leaves the state untouched', (reason, fixture, slotId, kind) => {
    const sim = createSimulation(fixture());
    const before = structuredClone(sim.state);

    expect(sim.placeTower(slotId, kind)).toEqual({ ok: false, reason });
    expect(sim.state).toEqual(before);
    expect(ofType(sim.advance(0), 'towerPlaced')).toEqual([]);
  });

  it('can spend exactly all of the gold', () => {
    const sim = createSimulation(scenario().withGold(50).build());

    expect(sim.placeTower('slot-1', 'basic').ok).toBe(true);
    expect(sim.state.gold).toBe(0);
  });
});

/** slot-3 sits at (544, 160). The first Path segment runs along y = 96 from x = -32, so x = pathT - 32. */
const SLOT_3 = 'slot-3';
/** pathT at which a first-segment enemy is exactly 160 (basic range) from slot-3: x = 544 - √(160² - 64²). */
const RANGE_EDGE_PATH_T = 544 - Math.sqrt(160 ** 2 - 64 ** 2) + 32;

describe('targeting', () => {
  it('aims at the enemy in range that has travelled furthest along the Path', () => {
    const sim = createSimulation(
      scenario()
        .atWave(0)
        .withTower('basic', SLOT_3)
        .withEnemies('normal', 3, { atPathT: 600, spacing: 50 })
        .build(),
    );
    const leaderId = sim.state.enemies[0]!.id;

    const events = sim.advance(1);

    expect(sim.state.towers[0]!.targetId).toBe(leaderId);
    expect(ofType(events, 'towerFired')).toEqual([
      expect.objectContaining({ towerId: sim.state.towers[0]!.id, targetId: leaderId }),
    ]);
  });

  it('treats an enemy exactly at the range edge as in range, and one just beyond as out', () => {
    const inside = createSimulation(
      scenario()
        .atWave(0)
        .withTower('basic', SLOT_3)
        .withEnemies('normal', 1, { atPathT: RANGE_EDGE_PATH_T + 0.01 })
        .build(),
    );
    const outside = createSimulation(
      scenario()
        .atWave(0)
        .withTower('basic', SLOT_3)
        .withEnemies('normal', 1, { atPathT: RANGE_EDGE_PATH_T - 0.01 })
        .build(),
    );

    expect(ofType(inside.advance(1), 'towerFired')).toHaveLength(1);
    expect(ofType(outside.advance(1), 'towerFired')).toHaveLength(0);
    expect(outside.state.towers[0]!.targetId).toBeNull();
  });

  it('fires again only after its cooldown', () => {
    const sim = createSimulation(
      scenario()
        .atWave(0)
        .withTower('basic', SLOT_3)
        .withEnemies('normal', 6, { atPathT: 700, spacing: 20 })
        .build(),
    );
    const fireTicks: number[] = [];

    for (let tick = 0; tick < 61; tick++) {
      if (ofType(sim.advance(1), 'towerFired').length) fireTicks.push(tick);
    }

    // 0.5 s cooldown = 30 ticks.
    expect(fireTicks).toEqual([0, 30, 60]);
  });
});

describe('projectiles and damage', () => {
  it('flies to its target and deals the tower damage on hit', () => {
    const sim = createSimulation(
      scenario()
        .atWave(0)
        .withTower('basic', SLOT_3)
        .withEnemies('normal', 1, { atPathT: 600 })
        .build(),
    );
    const enemyId = sim.state.enemies[0]!.id;

    const firstTick = sim.advance(1);
    expect(sim.state.projectiles).toHaveLength(1);
    const events = [...firstTick, ...sim.advance(20)];

    expect(ofType(events, 'enemyDamaged')[0]).toEqual({
      type: 'enemyDamaged',
      id: enemyId,
      amount: 10,
    });
    expect(sim.state.enemies[0]!.hp).toBe(30);
  });

  it('kills an enemy at zero hp, removing it and paying its reward', () => {
    const sim = createSimulation(
      scenario()
        .atWave(0)
        .withGold(0)
        .withTower('basic', SLOT_3)
        .withEnemies('normal', 1, { atPathT: 600, hpRatio: 0.25 })
        .build(),
    );
    const enemyId = sim.state.enemies[0]!.id;

    const events = sim.advance(30);

    expect(ofType(events, 'enemyKilled')).toEqual([
      expect.objectContaining({ id: enemyId, kind: 'normal', reward: 5 }),
    ]);
    expect(sim.state.enemies).toEqual([]);
    expect(sim.state.gold).toBe(5);
  });

  it("still flies to a dead target's last position, hitting nothing", () => {
    // Two towers fire at the same weak enemy; the first hit kills it.
    const sim = createSimulation(
      scenario()
        .atWave(0)
        .withTower('basic', SLOT_3)
        .withTower('basic', 'slot-2')
        .withEnemies('normal', 1, { atPathT: 500, hpRatio: 0.25 })
        .build(),
    );

    const events = sim.advance(40);

    expect(ofType(events, 'towerFired')).toHaveLength(2);
    expect(ofType(events, 'projectileHit')).toHaveLength(2);
    expect(ofType(events, 'enemyDamaged')).toHaveLength(1);
    expect(ofType(events, 'enemyKilled')).toHaveLength(1);
    expect(sim.state.projectiles).toEqual([]);
  });
});

describe('winning', () => {
  it('wins once the last Wave has fully spawned and the field is clear', () => {
    const sim = createSimulation(scenario().atWave(2).build());

    const events = sim.advance(1);

    expect(sim.state.outcome).toBe('won');
    expect(ofType(events, 'gameEnded')).toEqual([{ type: 'gameEnded', outcome: 'won' }]);
  });

  it('does not win while the last Wave still has enemies on the field', () => {
    const sim = createSimulation(
      scenario().atWave(2).withEnemies('normal', 1, { atPathT: 100 }).build(),
    );

    sim.advance(1);

    expect(sim.state.outcome).toBe('playing');
  });

  it('wins when towers kill the last enemy of the last Wave', () => {
    const sim = createSimulation(
      scenario()
        .atWave(2)
        .withTower('basic', SLOT_3)
        .withEnemies('normal', 1, { atPathT: 600, hpRatio: 0.25 })
        .build(),
    );

    const events = sim.advance(30);

    expect(ofType(events, 'enemyKilled')).toHaveLength(1);
    expect(sim.state.outcome).toBe('won');
    expect(sim.advance(30)).toEqual([]);
  });

  it('does not win before the last Wave', () => {
    const sim = createSimulation(scenario().atWave(1).build());

    sim.advance(1);

    expect(sim.state.outcome).toBe('playing');
  });
});

describe('splash', () => {
  /** A splash tower on slot-3 with a leader at pathT 600 and others `spacing` behind it on the same straight segment. */
  const splashTowerVsEnemiesSpaced = (spacing: number, count = 2) =>
    createSimulation(
      scenario()
        .atWave(0)
        .withTower('splash', SLOT_3)
        .withEnemies('normal', count, { atPathT: 600, spacing })
        .build(),
    );
  const hitUntilImpact = (sim: ReturnType<typeof createSimulation>) => {
    const events: SimEvent[] = [];
    for (let i = 0; i < 60 && !ofType(events, 'projectileHit').length; i++)
      events.push(...sim.advance(1));
    return events;
  };

  it('damages every enemy within the radius of the impact, each by the full damage', () => {
    const sim = splashTowerVsEnemiesSpaced(20, 3);
    const ids = sim.state.enemies.map((e) => e.id);

    const events = hitUntilImpact(sim);

    expect(ofType(events, 'projectileHit')[0]).toMatchObject({ splashRadius: 48 });
    expect(ofType(events, 'enemyDamaged')).toEqual(
      ids.map((id) => ({ type: 'enemyDamaged', id, amount: 8 })),
    );
  });

  it('includes an enemy just inside the radius and leaves one just outside untouched', () => {
    const inside = splashTowerVsEnemiesSpaced(47.5);
    const outside = splashTowerVsEnemiesSpaced(48.5);

    expect(ofType(hitUntilImpact(inside), 'enemyDamaged')).toHaveLength(2);
    expect(ofType(hitUntilImpact(outside), 'enemyDamaged')).toHaveLength(1);
  });

  it("still explodes at a vanished target's last position, damaging enemies near it", () => {
    const fired = splashTowerVsEnemiesSpaced(20);
    fired.advance(1);
    const [leader, follower] = fired.state.enemies;
    // Remove the target mid-flight, as if another tower had just killed it.
    const sim = createSimulation({
      ...scenario().build(),
      initialState: { ...structuredClone(fired.state), enemies: [structuredClone(follower!)] },
    });

    const events = hitUntilImpact(sim);

    expect(sim.state.enemies.map((e) => e.id)).not.toContain(leader!.id);
    expect(ofType(events, 'projectileHit')[0]).toMatchObject({ splashRadius: 48 });
    expect(ofType(events, 'enemyDamaged')).toEqual([
      { type: 'enemyDamaged', id: follower!.id, amount: 8 },
    ]);
  });
});

describe('build queries', () => {
  it.each([
    ['gameOver', () => fixtures.lost(), 'slot-3', 'basic'],
    ['unknownSlot', () => fixtures.emptyMap(), 'slot-99', 'basic'],
    ['unknownKind', () => fixtures.emptyMap(), 'slot-3', 'laser'],
    ['slotOccupied', () => scenario().withTower('basic', 'slot-3').build(), 'slot-3', 'basic'],
    ['notEnoughGold', () => fixtures.lowGold(), 'slot-3', 'basic'],
  ] as const)(
    'canPlaceTower reports %s exactly as placeTower would, without changing anything',
    (reason, fixture, slotId, kind) => {
      const sim = createSimulation(fixture());
      const before = structuredClone(sim.state);

      expect(sim.canPlaceTower(slotId, kind)).toEqual({ ok: false, reason });
      expect(sim.state).toEqual(before);
      expect(sim.placeTower(slotId, kind)).toEqual({ ok: false, reason });
    },
  );

  it('canPlaceTower allows a build that placeTower then performs, and reports no events', () => {
    const sim = createSimulation(fixtures.emptyMap());
    const before = structuredClone(sim.state);

    expect(sim.canPlaceTower('slot-3', 'splash')).toEqual({ ok: true });
    expect(sim.state).toEqual(before);
    expect(sim.advance(0)).toEqual([]);
    expect(sim.placeTower('slot-3', 'splash').ok).toBe(true);
  });

  it('canAfford compares gold with the cost of each kind, regardless of Slot', () => {
    const sim = createSimulation(scenario().withGold(60).build());

    expect(sim.canAfford('basic')).toBe(true);
    expect(sim.canAfford('splash')).toBe(false);
    expect(sim.canAfford('laser')).toBe(false);
  });

  it('isSlotFree is true only for an existing Slot without a tower', () => {
    const sim = createSimulation(scenario().withTower('basic', 'slot-3').build());

    expect(sim.isSlotFree('slot-2')).toBe(true);
    expect(sim.isSlotFree('slot-3')).toBe(false);
    expect(sim.isSlotFree('slot-99')).toBe(false);
  });
});

/** Catalog stats of a Tower level; tests read them so that tuning numbers doesn't break rules. */
const statsOf = (kind: string, level: number) =>
  towerStats(fixtures.emptyMap().units, kind, level)!;

describe('upgrading towers', () => {
  it('pays the next level’s cost, raises the level and reports towerUpgraded on the next advance', () => {
    const sim = createSimulation(scenario().withTower('basic', SLOT_3).withGold(200).build());
    const tower = sim.state.towers[0]!;

    expect(sim.upgradeTower(tower.id)).toEqual({ ok: true });

    expect(sim.state.gold).toBe(200 - statsOf('basic', 2).cost);
    expect(sim.state.towers[0]!.level).toBe(2);
    expect(ofType(sim.advance(1), 'towerUpgraded')).toEqual([
      { type: 'towerUpgraded', id: tower.id, kind: 'basic', level: 2 },
    ]);
  });

  it('keeps the cooldown and target', () => {
    const sim = createSimulation(
      scenario()
        .atWave(0)
        .withTower('basic', SLOT_3)
        .withEnemies('normal', 1, { atPathT: 600 })
        .withGold(200)
        .build(),
    );
    sim.advance(1);
    const { cooldownTicks, targetId } = sim.state.towers[0]!;

    sim.upgradeTower(sim.state.towers[0]!.id);

    expect(sim.state.towers[0]).toMatchObject({ cooldownTicks, targetId });
  });

  it("hits with the upgraded level's damage", () => {
    const sim = createSimulation(
      scenario()
        .atWave(0)
        .withTower('basic', SLOT_3, 2)
        .withEnemies('normal', 1, { atPathT: 600 })
        .build(),
    );

    const events = sim.advance(21);

    expect(ofType(events, 'enemyDamaged')[0]!.amount).toBe(statsOf('basic', 2).damage);
  });

  it("reaches an enemy beyond the old range but within the upgraded level's range", () => {
    const fixture = scenario()
      .atWave(0)
      .withTower('basic', SLOT_3)
      .withEnemies('normal', 1, { atPathT: RANGE_EDGE_PATH_T - 2 })
      .withGold(200)
      .build();
    expect(statsOf('basic', 2).range).toBeGreaterThan(statsOf('basic', 1).range + 2);
    const sim = createSimulation(fixture);
    const enemyId = sim.state.enemies[0]!.id;

    expect(ofType(createSimulation(fixture).advance(1), 'towerFired')).toHaveLength(0);
    sim.upgradeTower(sim.state.towers[0]!.id);

    expect(ofType(sim.advance(1), 'towerFired')).toEqual([
      expect.objectContaining({ targetId: enemyId }),
    ]);
  });

  it('can climb to the top level and no further', () => {
    const sim = createSimulation(scenario().withTower('splash', SLOT_3).withGold(1000).build());
    const id = sim.state.towers[0]!.id;

    expect(sim.upgradeTower(id)).toEqual({ ok: true });
    expect(sim.upgradeTower(id)).toEqual({ ok: true });

    expect(sim.state.towers[0]!.level).toBe(3);
    expect(sim.state.gold).toBe(1000 - statsOf('splash', 2).cost - statsOf('splash', 3).cost);
    expect(sim.upgradeTower(id)).toEqual({ ok: false, reason: 'maxLevel' });
  });

  it.each([
    ['gameOver', () => scenario().withTower('basic', SLOT_3).withOutcome('lost').build(), 0],
    ['unknownTower', () => scenario().withTower('basic', SLOT_3).build(), 999],
    ['maxLevel', () => scenario().withTower('basic', SLOT_3, 3).withGold(1000).build(), 0],
    ['notEnoughGold', () => scenario().withTower('basic', SLOT_3).withGold(39).build(), 0],
  ] as const)(
    'canUpgradeTower reports %s exactly as upgradeTower would, without changing anything',
    (reason, fixture, idOffset) => {
      const sim = createSimulation(fixture());
      const id = sim.state.towers[0]!.id + idOffset;
      const before = structuredClone(sim.state);

      expect(sim.canUpgradeTower(id)).toEqual({ ok: false, reason });
      expect(sim.upgradeTower(id)).toEqual({ ok: false, reason });
      expect(sim.state).toEqual(before);
      expect(sim.advance(0)).toEqual([]);
    },
  );

  it('can spend exactly all of the gold', () => {
    const cost = statsOf('basic', 2).cost;
    const sim = createSimulation(scenario().withTower('basic', SLOT_3).withGold(cost).build());
    const id = sim.state.towers[0]!.id;

    expect(sim.canUpgradeTower(id)).toEqual({ ok: true });
    expect(sim.upgradeTower(id)).toEqual({ ok: true });
    expect(sim.state.gold).toBe(0);
  });
});

describe('selling towers', () => {
  const ratio = fixtures.emptyMap().units.sellRefundRatio;

  it('refunds a share of the build cost for a level-1 tower and frees its Slot', () => {
    const sim = createSimulation(scenario().withTower('basic', SLOT_3).withGold(0).build());
    const tower = sim.state.towers[0]!;
    const refund = Math.floor(statsOf('basic', 1).cost * ratio);

    expect(sim.sellValue(tower.id)).toBe(refund);
    expect(sim.sellTower(tower.id)).toEqual({ ok: true, refund });

    expect(sim.state.gold).toBe(refund);
    expect(sim.state.towers).toEqual([]);
    expect(sim.isSlotFree(SLOT_3)).toBe(true);
    expect(ofType(sim.advance(1), 'towerSold')).toEqual([
      { type: 'towerSold', id: tower.id, kind: 'basic', level: 1, slotId: SLOT_3, refund },
    ]);
  });

  it('refunds a share of the build cost plus every upgrade for a top-level tower', () => {
    const sim = createSimulation(scenario().withTower('splash', SLOT_3, 3).withGold(0).build());
    const invested = [1, 2, 3].reduce((sum, level) => sum + statsOf('splash', level).cost, 0);

    expect(sim.sellTower(sim.state.towers[0]!.id)).toEqual({
      ok: true,
      refund: Math.floor(invested * ratio),
    });
  });

  it('lets a new tower be built on the freed Slot', () => {
    const sim = createSimulation(scenario().withTower('basic', SLOT_3).withGold(100).build());

    sim.sellTower(sim.state.towers[0]!.id);

    expect(sim.placeTower(SLOT_3, 'splash').ok).toBe(true);
  });

  it.each([
    ['gameOver', () => scenario().withTower('basic', SLOT_3).withOutcome('won').build(), 0],
    ['unknownTower', () => scenario().withTower('basic', SLOT_3).build(), 999],
  ] as const)('is refused with %s, changing nothing', (reason, fixture, idOffset) => {
    const sim = createSimulation(fixture());
    const id = sim.state.towers[0]!.id + idOffset;
    const before = structuredClone(sim.state);

    expect(sim.sellTower(id)).toEqual({ ok: false, reason });
    expect(sim.state).toEqual(before);
    expect(sim.advance(0)).toEqual([]);
  });

  it('has no Sell value for an unknown tower', () => {
    expect(createSimulation(fixtures.emptyMap()).sellValue(999)).toBeNull();
  });
});

describe('projectiles in flight', () => {
  /** A basic tower that has just fired at an enemy, its shot still flying. */
  const midFlight = () => {
    const sim = createSimulation(
      scenario()
        .atWave(0)
        .withTower('basic', SLOT_3)
        .withEnemies('normal', 1, { atPathT: 600 })
        .withGold(200)
        .build(),
    );
    sim.advance(1);
    expect(sim.state.projectiles).toHaveLength(1);
    return sim;
  };

  it('still hits after its tower is sold', () => {
    const sim = midFlight();

    sim.sellTower(sim.state.towers[0]!.id);
    const events = sim.advance(20);

    expect(ofType(events, 'enemyDamaged')).toEqual([
      expect.objectContaining({ amount: statsOf('basic', 1).damage }),
    ]);
  });

  it('keeps the damage of the level it was fired at when its tower is upgraded', () => {
    const sim = midFlight();
    const shotId = sim.state.projectiles[0]!.id;

    sim.upgradeTower(sim.state.towers[0]!.id);
    const events = sim.advance(20);
    const hitByShot = ofType(events, 'projectileHit').findIndex((e) => e.projectileId === shotId);

    expect(hitByShot).toBeGreaterThanOrEqual(0);
    expect(ofType(events, 'enemyDamaged')[0]!.amount).toBe(statsOf('basic', 1).damage);
  });
});
