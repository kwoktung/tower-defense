import type * as Phaser from 'phaser';
import type { Projectile } from '../../../sim/types';
import { colorNumber, type EntityView } from '../../skin';
import { ART_SCALE, ATLAS, hasFrame } from './atlas';
import { juiceColor } from './palette';

/** Lobbed chunks tumble; small shots fly straight. */
const SPIN_PER_TICK: Record<string, number> = { splash: 0.18 };

/** `kind` is the kind of the tower that fired: a blueberry, a pineapple chunk or a lemon drop. */
export function createFruitProjectileView(
  scene: Phaser.Scene,
  kind: string,
): EntityView<Projectile> {
  const frame = `projectile-${kind}`;
  const shot = hasFrame(scene, frame)
    ? scene.add.image(0, 0, ATLAS, frame).setScale(ART_SCALE)
    : scene.add.circle(0, 0, 4, colorNumber(juiceColor(kind)));
  shot.setDepth(15);
  const spin = SPIN_PER_TICK[kind] ?? 0;
  return {
    sync: ({ position }) => {
      shot.setPosition(position.x, position.y);
      if (spin) shot.rotation += spin;
    },
    destroy: () => shot.destroy(),
  };
}
