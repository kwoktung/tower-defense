import { describe, expect, it } from 'vitest';
import { createServices } from '../create-services';
import { createLocalLevelRepository } from './local-level-repository';
import level1 from '../../../content/levels/level-1.json';
import units from '../../../content/units.json';

const repoWith = (overrides: { level?: unknown; units?: unknown }) =>
  createLocalLevelRepository({
    levels: { broken: overrides.level ?? level1 },
    units: overrides.units ?? units,
  });

const messageOf = (promise: Promise<unknown>) =>
  promise.then(
    () => '',
    (e: Error) => e.message,
  );

describe('local LevelRepository', () => {
  it('loads the bundled level and Unit catalog through the composition root', async () => {
    const { levels } = createServices({ kind: 'local' });

    const level = await levels.getLevel('level-1');
    const catalog = await levels.getUnitCatalog();

    expect(level.id).toBe('level-1');
    expect(level.grid).toEqual({ cols: 15, rows: 10, tileSize: 64 });
    expect(level.slots).toHaveLength(12);
    expect(level.waves).toHaveLength(3);
    expect(Object.keys(catalog.enemies)).toEqual(['normal', 'fast']);
    expect(Object.keys(catalog.towers)).toEqual(['basic', 'splash']);
  });

  it('rejects an unknown level id', async () => {
    const { levels } = createServices({ kind: 'local' });

    await expect(levels.getLevel('nope')).rejects.toThrow('Unknown level "nope"');
  });

  it('rejects invalid fields and names their paths', async () => {
    const level = { ...level1, startLives: 0, grid: { ...level1.grid, tileSize: 'big' } };

    const message = await messageOf(repoWith({ level }).getLevel('broken'));

    expect(message).toContain('Invalid level "broken"');
    expect(message).toContain('grid.tileSize');
    expect(message).toContain('startLives');
  });

  it('rejects diagonal path segments and slots placed on the path', async () => {
    const level = {
      ...level1,
      path: [
        { col: 0, row: 0 },
        { col: 3, row: 0 },
        { col: 5, row: 2 },
      ],
      slots: [{ id: 'on-path', col: 1, row: 0 }],
    };

    const message = await messageOf(repoWith({ level }).getLevel('broken'));

    expect(message).toContain('path[2]');
    expect(message).toContain('must share a row or a column');
    expect(message).toContain('slots[0]');
    expect(message).toContain('overlaps the path');
  });

  it('rejects waves that spawn an enemy kind missing from the Unit catalog', async () => {
    const level = {
      ...level1,
      waves: [{ groups: [{ kind: 'dragon', count: 1, intervalSec: 1 }] }],
    };

    const message = await messageOf(repoWith({ level }).getLevel('broken'));

    expect(message).toContain('Unknown enemy kind "dragon"');
    expect(message).toContain('waves[0].groups[0].kind');
  });

  it('rejects an invalid Unit catalog and names the field', async () => {
    const broken = { ...units, enemies: { normal: { ...units.enemies.normal, speed: -1 } } };

    const message = await messageOf(repoWith({ units: broken }).getUnitCatalog());

    expect(message).toContain('Invalid unit catalog');
    expect(message).toContain('enemies.normal.speed');
  });

  it('rejects a splash tower without a radius', async () => {
    const broken = {
      ...units,
      towers: {
        bomb: {
          name: 'bomb',
          levels: [{ ...units.towers.basic!.levels[0], attack: { mode: 'splash' } }],
        },
      },
    };

    const message = await messageOf(repoWith({ units: broken }).getUnitCatalog());

    expect(message).toContain('towers.bomb.levels[0].attack.radius');
  });
});
