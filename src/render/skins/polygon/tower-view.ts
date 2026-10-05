import type * as Phaser from 'phaser';
import { slotCenter } from '../../../sim/path';
import type { Tower } from '../../../sim/types';
import { colorNumber, type EntityView } from '../../skin';
import { ring } from './effects';
import { palette, towerColor } from './palette';
import { fillPolygon, strokePolygon } from './shapes';

type Points = [number, number][];

/** Outline of each kind at level 1; colours come from `towerColor`. */
const SHAPES: Record<string, Points> = {
  basic: [
    [-18, -18],
    [18, -18],
    [18, 18],
    [-18, 18],
  ],
  splash: Array.from({ length: 6 }, (_, i): [number, number] => {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    return [Math.cos(a) * 21, Math.sin(a) * 21];
  }),
  slow: [
    [0, -22],
    [20, 0],
    [0, 22],
    [-20, 0],
  ],
};

/** Unknown kinds still render (reporting the gap), so new content shows up before its look exists. */
const FALLBACK: Points = [
  [0, -18],
  [18, 18],
  [-18, 18],
];

/**
 * How each Tower level looks, from level 1: the same shape for a kind, growing, with an outline
 * from level 2 (gold at the top level). Levels beyond this list are not covered by this skin.
 */
const LEVELS: { scale: number; trim: string | null }[] = [
  { scale: 1, trim: null },
  { scale: 1.12, trim: palette.towerTrim },
  { scale: 1.24, trim: palette.towerTrimTop },
];

const PIP_RADIUS = 2.5;
const PIP_GAP = 8;
/** Pips sit on the lower part of the body, inside even the smallest level-1 shape. */
const PIP_Y = 10;

function drawBody(g: Phaser.GameObjects.Graphics, kind: string, level: number): void {
  const look = LEVELS[Math.min(level, LEVELS.length) - 1]!;
  const points: Points = (SHAPES[kind] ?? FALLBACK).map(([x, y]) => [
    x * look.scale,
    y * look.scale,
  ]);
  g.clear();
  fillPolygon(g, points, colorNumber(towerColor(kind)));
  if (look.trim) strokePolygon(g, points, 2, colorNumber(look.trim));
}

/** One dot per level, centred on the lower part of the tower. */
function drawPips(g: Phaser.GameObjects.Graphics, level: number): void {
  g.clear();
  g.fillStyle(colorNumber(palette.towerPip));
  const left = -((level - 1) * PIP_GAP) / 2;
  for (let i = 0; i < level; i++) g.fillCircle(left + i * PIP_GAP, PIP_Y, PIP_RADIUS);
}

export function createTowerView(scene: Phaser.Scene, kind: string): EntityView<Tower> {
  if (!SHAPES[kind]) console.error(`Polygon skin has no look for tower kind "${kind}"`);
  const body = scene.add.graphics().setDepth(5);
  const pips = scene.add.graphics().setDepth(6);
  let drawnLevel = 0;

  return {
    sync(tower, { level }) {
      const c = slotCenter(level, tower.slotId);
      if (c) {
        body.setPosition(c.x, c.y);
        pips.setPosition(c.x, c.y);
      }
      if (tower.level === drawnLevel) return;
      drawnLevel = tower.level;
      if (tower.level > LEVELS.length) {
        console.error(`Polygon skin has no look for "${kind}" level ${tower.level}`);
      }
      drawBody(body, kind, tower.level);
      drawPips(pips, tower.level);
    },
    onEvent(event) {
      if (event.type === 'towerFired') {
        scene.tweens.killTweensOf(body);
        body.setScale(1.2);
        scene.tweens.add({ targets: body, scale: 1, duration: 120, ease: 'Quad.easeOut' });
      } else if (event.type === 'towerUpgraded') {
        scene.tweens.killTweensOf(body);
        body.setScale(1.35);
        scene.tweens.add({ targets: body, scale: 1, duration: 260, ease: 'Back.easeOut' });
        ring(scene, body.x, body.y, palette.towerTrimTop, 32, 56, 320);
      }
    },
    destroy: () => {
      scene.tweens.killTweensOf(body);
      body.destroy();
      pips.destroy();
    },
  };
}
