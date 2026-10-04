import type * as Phaser from 'phaser';
import { poseAt } from '../../../sim/path';
import type { Enemy } from '../../../sim/types';
import { colorNumber, type EntityView } from '../../skin';
import { palette } from './palette';
import { fillPolygon } from './shapes';

interface EnemyShape {
  color: string;
  /** Outline points around the origin, facing +x. */
  points: [number, number][];
}

const SHAPES: Record<string, EnemyShape> = {
  normal: {
    color: palette.enemyNormal,
    points: [
      [14, 0],
      [0, 12],
      [-14, 0],
      [0, -12],
    ],
  },
  fast: {
    color: palette.enemyFast,
    points: [
      [12, 0],
      [-8, 8],
      [-8, -8],
    ],
  },
};

/** Unknown kinds still render, so new content shows up before its skin entry exists. */
const FALLBACK: EnemyShape = {
  color: palette.enemyUnknown,
  points: [
    [10, 0],
    [0, 10],
    [-10, 0],
    [0, -10],
  ],
};

const BAR_WIDTH = 24;
const BAR_HEIGHT = 4;
const BAR_OFFSET_Y = -20;

export function createEnemyView(scene: Phaser.Scene, kind: string): EntityView<Enemy> {
  const shape = SHAPES[kind] ?? FALLBACK;
  const root = scene.add.container(0, 0).setDepth(10);

  const body = scene.add.graphics();
  fillPolygon(body, shape.points, colorNumber(shape.color));

  const bar = scene.add.graphics();
  root.add([body, bar]);

  let lastRatio = -1;
  const drawBar = (ratio: number) => {
    if (ratio === lastRatio) return;
    lastRatio = ratio;
    bar.clear();
    bar.fillStyle(colorNumber(palette.hpBarEmpty));
    bar.fillRect(-BAR_WIDTH / 2, BAR_OFFSET_Y, BAR_WIDTH, BAR_HEIGHT);
    bar.fillStyle(colorNumber(palette.hpBar));
    bar.fillRect(-BAR_WIDTH / 2, BAR_OFFSET_Y, BAR_WIDTH * ratio, BAR_HEIGHT);
  };

  return {
    sync(enemy: Enemy, { path }) {
      const pose = poseAt(path, enemy.pathT);
      root.setPosition(pose.x, pose.y);
      body.setRotation(pose.angle);
      drawBar(Math.max(0, enemy.hp / enemy.maxHp));
    },
    destroy: () => root.destroy(),
  };
}
