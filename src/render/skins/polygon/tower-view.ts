import type * as Phaser from 'phaser';
import { cellCenter } from '../../../sim/path';
import type { Tower } from '../../../sim/types';
import { colorNumber, type EntityView } from '../../skin';
import { palette } from './palette';
import { fillPolygon } from './shapes';

interface TowerShape {
  color: string;
  points: [number, number][];
}

const SHAPES: Record<string, TowerShape> = {
  basic: {
    color: palette.towerBasic,
    points: [
      [-18, -18],
      [18, -18],
      [18, 18],
      [-18, 18],
    ],
  },
};

/** Unknown kinds still render, so new content shows up before its skin entry exists. */
const FALLBACK: TowerShape = {
  color: palette.towerUnknown,
  points: [
    [0, -18],
    [18, 18],
    [-18, 18],
  ],
};

export function createTowerView(scene: Phaser.Scene, kind: string): EntityView<Tower> {
  const shape = SHAPES[kind] ?? FALLBACK;
  const body = scene.add.graphics().setDepth(5);
  fillPolygon(body, shape.points, colorNumber(shape.color));

  return {
    sync(tower, { level }) {
      const slot = level.slots.find((s) => s.id === tower.slotId);
      if (!slot) return;
      const c = cellCenter(slot, level.grid.tileSize);
      body.setPosition(c.x, c.y);
    },
    onEvent(event) {
      if (event.type !== 'towerFired') return;
      scene.tweens.killTweensOf(body);
      body.setScale(1.2);
      scene.tweens.add({ targets: body, scale: 1, duration: 120, ease: 'Quad.easeOut' });
    },
    destroy: () => {
      scene.tweens.killTweensOf(body);
      body.destroy();
    },
  };
}
