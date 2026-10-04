import type * as Phaser from 'phaser';
import type { SimEvent } from '../../../sim/types';
import { colorNumber } from '../../skin';
import { palette } from './palette';

const KILL_MS = 250;

/** An expanding, fading ring at the given point. */
function ring(scene: Phaser.Scene, x: number, y: number, color: string, from: number, to: number) {
  const g = scene.add.graphics().setDepth(20).setPosition(x, y);
  const state = { r: from, alpha: 1 };
  const draw = () => {
    g.clear();
    g.lineStyle(2, colorNumber(color), state.alpha);
    g.strokeCircle(0, 0, state.r);
  };
  draw();
  scene.tweens.add({
    targets: state,
    r: to,
    alpha: 0,
    duration: KILL_MS,
    ease: 'Quad.easeOut',
    onUpdate: draw,
    onComplete: () => g.destroy(),
  });
}

export function playEffect(scene: Phaser.Scene, event: SimEvent): void {
  if (event.type === 'enemyKilled') {
    const color = event.kind === 'fast' ? palette.enemyFast : palette.enemyNormal;
    ring(scene, event.x, event.y, color, 6, 22);
  }
}
