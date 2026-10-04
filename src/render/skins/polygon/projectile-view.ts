import type * as Phaser from 'phaser';
import type { Projectile } from '../../../sim/types';
import { colorNumber, type EntityView } from '../../skin';
import { palette } from './palette';
import { fillPolygon } from './shapes';

const RADIUS = 4;
/** A small dot drawn as an octagon. */
const OCTAGON = Array.from({ length: 8 }, (_, i): [number, number] => {
  const a = (i / 8) * Math.PI * 2;
  return [Math.cos(a) * RADIUS, Math.sin(a) * RADIUS];
});

export function createProjectileView(scene: Phaser.Scene): EntityView<Projectile> {
  const dot = scene.add.graphics().setDepth(15);
  fillPolygon(dot, OCTAGON, colorNumber(palette.projectile));
  return {
    sync: (projectile) => void dot.setPosition(projectile.x, projectile.y),
    destroy: () => dot.destroy(),
  };
}
