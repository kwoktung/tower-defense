import type * as Phaser from 'phaser';
import type { SimEvent } from '../../../sim/types';
import { colorNumber } from '../../skin';
import { enemyColor, palette, towerColor, uiFont } from './palette';

const KILL_MS = 250;
const SPLASH_MS = 200;
const SOLD_MS = 600;

/** An expanding, fading ring at the given point. */
export function ring(
  scene: Phaser.Scene,
  x: number,
  y: number,
  color: string,
  from: number,
  to: number,
  duration = KILL_MS,
) {
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
    duration,
    ease: 'Quad.easeOut',
    onUpdate: draw,
    onComplete: () => g.destroy(),
  });
}

/**
 * A translucent ring at the splash radius that fades out. The fill stays faint so the red
 * enemies underneath don't read as orange.
 */
function splash(scene: Phaser.Scene, x: number, y: number, radius: number) {
  const g = scene.add.graphics().setDepth(18).setPosition(x, y);
  g.fillStyle(colorNumber(palette.splash), 0.08);
  g.fillCircle(0, 0, radius);
  g.lineStyle(3, colorNumber(palette.splash), 0.85);
  g.strokeCircle(0, 0, radius);
  scene.tweens.add({
    targets: g,
    alpha: 0,
    duration: SPLASH_MS,
    ease: 'Quad.easeIn',
    onComplete: () => g.destroy(),
  });
}

/** The sold tower's colour collapses inward while the refund floats up in gold. */
function sold(scene: Phaser.Scene, x: number, y: number, kind: string, refund: number) {
  const g = scene.add.graphics().setDepth(18).setPosition(x, y);
  g.fillStyle(colorNumber(towerColor(kind)), 0.6);
  g.fillCircle(0, 0, 20);
  scene.tweens.add({
    targets: g,
    scale: 0.2,
    alpha: 0,
    duration: SOLD_MS / 2,
    ease: 'Quad.easeIn',
    onComplete: () => g.destroy(),
  });
  const label = scene.add
    .text(x, y - 8, `+${refund}`, {
      fontFamily: uiFont,
      fontSize: '18px',
      fontStyle: 'bold',
      color: palette.gold,
    })
    .setOrigin(0.5)
    .setDepth(21);
  scene.tweens.add({
    targets: label,
    y: y - 36,
    alpha: 0,
    duration: SOLD_MS,
    ease: 'Quad.easeOut',
    onComplete: () => label.destroy(),
  });
}

export function playEffect(scene: Phaser.Scene, event: SimEvent): void {
  if (event.type === 'projectileHit' && event.splashRadius) {
    splash(scene, event.x, event.y, event.splashRadius);
  } else if (event.type === 'enemyKilled') {
    ring(scene, event.x, event.y, enemyColor(event.kind), 6, 22);
  } else if (event.type === 'towerSold') {
    sold(scene, event.x, event.y, event.kind, event.refund);
  }
}
