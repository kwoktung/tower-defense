import { describe, expect, it } from 'vitest';
import { createServices } from '../create-services';
import { createLocalLevelRepository } from './local-level-repository';
import level1 from '../../../content/levels/level-1.json';

describe('local LevelRepository', () => {
  it('loads the bundled level through the composition root', async () => {
    const { levels } = createServices({ kind: 'local' });

    const level = await levels.getLevel('level-1');

    expect(level.id).toBe('level-1');
    expect(level.grid).toEqual({ cols: 15, rows: 10, tileSize: 64 });
    expect(level.slots).toHaveLength(12);
  });

  it('rejects an unknown level id', async () => {
    const { levels } = createServices({ kind: 'local' });

    await expect(levels.getLevel('nope')).rejects.toThrow('Unknown level "nope"');
  });

  it('rejects invalid fields and names their paths', async () => {
    const broken = { ...level1, startLives: 0, grid: { ...level1.grid, tileSize: 'big' } };
    const repo = createLocalLevelRepository({ broken });

    const error = await repo.getLevel('broken').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain('Invalid level "broken"');
    expect((error as Error).message).toContain('grid.tileSize');
    expect((error as Error).message).toContain('startLives');
  });

  it('rejects diagonal path segments and slots placed on the path', async () => {
    const broken = {
      ...level1,
      path: [
        { col: 0, row: 0 },
        { col: 3, row: 0 },
        { col: 5, row: 2 },
      ],
      slots: [{ id: 'on-path', col: 1, row: 0 }],
    };
    const repo = createLocalLevelRepository({ broken });

    const message = await repo.getLevel('broken').catch((e: Error) => e.message);

    expect(message).toContain('path[2]');
    expect(message).toContain('must share a row or a column');
    expect(message).toContain('slots[0]');
    expect(message).toContain('overlaps the path');
  });
});
