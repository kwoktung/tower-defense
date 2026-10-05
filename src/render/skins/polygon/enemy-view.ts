import type * as Phaser from 'phaser';
import { poseAt } from '../../../sim/path';
import type { Enemy } from '../../../sim/types';
import { colorNumber, type EntityView } from '../../skin';
import { enemyColor, palette } from './palette';
import { fillPolygon, strokePolygon } from './shapes';

/** Outline points around the origin, facing +x. Colours come from `enemyColor`. */
type EnemyOutline = [number, number][];

const OUTLINES: Record<string, EnemyOutline> = {
  normal: [
    [14, 0],
    [0, 12],
    [-14, 0],
    [0, -12],
  ],
  fast: [
    [12, 0],
    [-8, 8],
    [-8, -8],
  ],
  /** Bigger and blunter than `normal`: a slow, heavy octagon. */
  armored: Array.from({ length: 8 }, (_, i): [number, number] => {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    return [Math.cos(a) * 15, Math.sin(a) * 15];
  }),
};

/** Kinds drawn with the armour outline. */
const ARMORED = new Set(['armored']);

/** Unknown kinds still render (reporting the gap), so new content shows up before its look exists. */
const FALLBACK_OUTLINE: EnemyOutline = [
  [10, 0],
  [0, 10],
  [-10, 0],
  [0, -10],
];

const HIT_FLASH_MS = 80;
const BAR_WIDTH = 24;
const BAR_HEIGHT = 4;
const BAR_OFFSET_Y = -20;
/** Radius of the icy ring around a slowed enemy. */
const SLOW_RADIUS = 19;

export function createEnemyView(scene: Phaser.Scene, kind: string): EntityView<Enemy> {
  if (!OUTLINES[kind]) console.error(`Polygon skin has no look for enemy kind "${kind}"`);
  const outline = OUTLINES[kind] ?? FALLBACK_OUTLINE;
  const root = scene.add.container(0, 0).setDepth(10);

  const body = scene.add.graphics();
  fillPolygon(body, outline, colorNumber(enemyColor(kind)));
  if (ARMORED.has(kind)) strokePolygon(body, outline, 3, colorNumber(palette.armorTrim));

  const flash = scene.add.graphics().setVisible(false);
  fillPolygon(flash, outline, colorNumber(palette.hitFlash));
  const bar = scene.add.graphics();
  // Drawn under the body so the enemy stays readable.
  const frost = scene.add.graphics().setVisible(false);
  frost.fillStyle(colorNumber(palette.slowed), 0.25);
  frost.fillCircle(0, 0, SLOW_RADIUS);
  frost.lineStyle(2, colorNumber(palette.slowed), 0.9);
  frost.strokeCircle(0, 0, SLOW_RADIUS);
  root.add([frost, body, flash, bar]);
  let flashTimer: Phaser.Time.TimerEvent | null = null;

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
      flash.setRotation(pose.angle);
      drawBar(Math.max(0, enemy.hp / enemy.maxHp));
      frost.setVisible(enemy.slow !== null);
    },
    onEvent(event) {
      if (event.type !== 'enemyDamaged') return;
      flash.setVisible(true);
      flashTimer?.remove();
      flashTimer = scene.time.delayedCall(HIT_FLASH_MS, () => flash.setVisible(false));
    },
    destroy: () => {
      flashTimer?.remove();
      root.destroy();
    },
  };
}
