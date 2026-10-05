import * as Phaser from 'phaser';
import { poseAt } from '../../../sim/path';
import type { Enemy } from '../../../sim/types';
import { colorNumber, type EntityView } from '../../skin';
import { ART_SCALE, ATLAS, hasFrame } from './atlas';
import { palette } from './palette';

const HIT_FLASH_MS = 80;
const BAR_WIDTH = 26;
const BAR_HEIGHT = 4;
/** Above the tallest bug's head (frames are bottom-anchored at the enemy's position). */
const BAR_OFFSET_Y = -52;
/** Bugs stand on the path: their feet a little below its centre line. */
const FOOT_OFFSET = 10;
/** Walking bob: height in world units, and one hop per this many units travelled. */
const BOB_HEIGHT = 3;
const BOB_STRIDE = 18;
const SOUR_RADIUS = 17;
/** Pale sour wash over a slowed bug (multiplied with the art). */
const SOUR_TINT = 0xe9ffb0;

/**
 * A bug drawn facing right, never rotated: it turns to face left on leftward runs and keeps its
 * last facing on vertical ones. It bobs as it walks; the bob follows distance travelled, so fast
 * bugs hop faster and a frozen frame is stable.
 */
export function createFruitEnemyView(scene: Phaser.Scene, kind: string): EntityView<Enemy> {
  const frame = `enemy-${kind}`;
  const known = hasFrame(scene, frame);
  if (!known) console.error(`Fruit skin has no look for enemy kind "${kind}"`);

  const root = scene.add.container(0, 0).setDepth(10);
  const sour = scene.add.graphics().setVisible(false);
  sour.fillStyle(colorNumber(palette.sour), 0.28);
  sour.fillEllipse(0, 0, SOUR_RADIUS * 2.4, SOUR_RADIUS * 1.1);
  sour.lineStyle(2.5, colorNumber(palette.sour), 0.95);
  sour.strokeEllipse(0, 0, SOUR_RADIUS * 2.4, SOUR_RADIUS * 1.1);
  const body = known
    ? scene.add.image(0, 0, ATLAS, frame).setOrigin(0.5, 1).setScale(ART_SCALE)
    : scene.add.circle(0, -12, 12, colorNumber(palette.fallback));
  const bar = scene.add.graphics();
  root.add([sour, body, bar]);

  let facingLeft = false;
  let slowed = false;
  let flashing = false;
  let flashTimer: Phaser.Time.TimerEvent | null = null;
  const applyTint = () => {
    if (!(body instanceof Phaser.GameObjects.Image)) return;
    if (flashing) body.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    else if (slowed) body.setTint(SOUR_TINT).setTintMode(Phaser.TintModes.MULTIPLY);
    else body.clearTint();
  };

  let lastRatio = -1;
  const drawBar = (ratio: number) => {
    if (ratio === lastRatio) return;
    lastRatio = ratio;
    bar.clear();
    bar.fillStyle(colorNumber(palette.hpBarEmpty));
    bar.fillRoundedRect(-BAR_WIDTH / 2, BAR_OFFSET_Y, BAR_WIDTH, BAR_HEIGHT, 2);
    bar.fillStyle(colorNumber(palette.hpBar));
    bar.fillRoundedRect(
      -BAR_WIDTH / 2,
      BAR_OFFSET_Y,
      Math.max(BAR_WIDTH * ratio, 1),
      BAR_HEIGHT,
      2,
    );
  };

  return {
    sync(enemy, { path }) {
      const pose = poseAt(path, enemy.pathT);
      root.setPosition(pose.x, pose.y + FOOT_OFFSET);
      const dx = Math.cos(pose.angle);
      if (dx < -0.1) facingLeft = true;
      else if (dx > 0.1) facingLeft = false;
      if (body instanceof Phaser.GameObjects.Image) body.setFlipX(facingLeft);
      body.y = -Math.abs(Math.sin((enemy.pathT / BOB_STRIDE) * Math.PI)) * BOB_HEIGHT;
      drawBar(Math.max(0, enemy.hp / enemy.maxHp));
      if (slowed !== (enemy.slow !== null)) {
        slowed = enemy.slow !== null;
        sour.setVisible(slowed);
        applyTint();
      }
    },
    onEvent(event) {
      if (event.type !== 'enemyDamaged') return;
      flashing = true;
      applyTint();
      flashTimer?.remove();
      flashTimer = scene.time.delayedCall(HIT_FLASH_MS, () => {
        flashing = false;
        applyTint();
      });
    },
    destroy: () => {
      flashTimer?.remove();
      root.destroy();
    },
  };
}
