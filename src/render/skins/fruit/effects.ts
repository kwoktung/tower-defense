import type * as Phaser from 'phaser';
import type { SimEvent } from '../../../sim/types';
import { colorNumber } from '../../skin';
import { enemyColor, juiceColor, palette, uiFont } from './palette';

/** An expanding, fading ring. */
export function ring(
  scene: Phaser.Scene,
  x: number,
  y: number,
  color: string,
  from: number,
  to: number,
  duration = 280,
): void {
  const g = scene.add.graphics().setDepth(20).setPosition(x, y);
  const state = { r: from, alpha: 1 };
  const draw = () => {
    g.clear();
    g.lineStyle(3, colorNumber(color), state.alpha);
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

/** Juice drops flying out from a point and fading. */
function burst(
  scene: Phaser.Scene,
  x: number,
  y: number,
  color: string,
  count: number,
  reach: number,
) {
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + 0.3;
    const drop = scene.add.circle(x, y, 3.5, colorNumber(color)).setDepth(19);
    scene.tweens.add({
      targets: drop,
      x: x + Math.cos(angle) * reach,
      y: y + Math.sin(angle) * reach,
      alpha: 0,
      scale: 0.4,
      duration: 260,
      ease: 'Quad.easeOut',
      onComplete: () => drop.destroy(),
    });
  }
}

/** A juicy splash at the splash radius: a faint pool and a bright rim that fades. */
function splash(scene: Phaser.Scene, x: number, y: number, radius: number, color: string) {
  const g = scene.add.graphics().setDepth(18).setPosition(x, y);
  g.fillStyle(colorNumber(color), 0.18);
  g.fillCircle(0, 0, radius);
  g.lineStyle(3, colorNumber(color), 0.9);
  g.strokeCircle(0, 0, radius);
  scene.tweens.add({
    targets: g,
    alpha: 0,
    duration: 220,
    ease: 'Quad.easeIn',
    onComplete: () => g.destroy(),
  });
  burst(scene, x, y, color, 8, radius * 0.8);
}

/** The sold tower's juice collapses inward while the refund floats up in gold. */
function sold(scene: Phaser.Scene, x: number, y: number, kind: string, refund: number) {
  const g = scene.add.graphics().setDepth(18).setPosition(x, y);
  g.fillStyle(colorNumber(juiceColor(kind)), 0.6);
  g.fillCircle(0, 0, 20);
  scene.tweens.add({
    targets: g,
    scale: 0.2,
    alpha: 0,
    duration: 300,
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
    .setDepth(21)
    .setStroke(palette.hudPanel, 3);
  scene.tweens.add({
    targets: label,
    y: y - 36,
    alpha: 0,
    duration: 600,
    ease: 'Quad.easeOut',
    onComplete: () => label.destroy(),
  });
}

export function playFruitEffect(scene: Phaser.Scene, event: SimEvent): void {
  if (event.type === 'projectileHit') {
    const color = juiceColor(event.kind);
    if (event.splashRadius) splash(scene, event.x, event.y, event.splashRadius, color);
    else burst(scene, event.x, event.y, color, 5, 12);
  } else if (event.type === 'enemyKilled') {
    burst(scene, event.x, event.y, enemyColor(event.kind), 8, 20);
    ring(scene, event.x, event.y, enemyColor(event.kind), 6, 20, 240);
  } else if (event.type === 'towerSold') {
    sold(scene, event.x, event.y, event.kind, event.refund);
  }
}
