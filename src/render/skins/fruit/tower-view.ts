import type * as Phaser from 'phaser';
import { poseAt, slotCenter, type PathGeometry, type Point } from '../../../sim/path';
import type { Tower } from '../../../sim/types';
import { colorNumber, type EntityView } from '../../skin';
import { ART_SCALE, ATLAS, hasFrame } from './atlas';
import { ring } from './effects';
import { palette } from './palette';

/**
 * Extra growth per Tower level on top of the art's own (index = level − 1), so levels read apart
 * even where the drawn levels are close in size.
 */
const LEVEL_SCALE = [1, 1.06, 1.12];
/** Fruit stand a little low in their soil bed, feet near its lower edge. */
const FOOT_OFFSET = 14;
/**
 * A target within this horizontal distance (world units) of the tower, i.e. nearly straight
 * above or below it, keeps the current facing, so the tower doesn't flicker as a bug passes.
 */
const FACING_DEAD_ZONE = 12;
/** How near (in tiles) the Path must come for a tower to watch for enemies there. */
const WATCH_RADIUS_TILES = 2.5;
const WATCH_STEP = 8;

/**
 * Before it has a target, a tower faces where enemies will first appear near it: the first point
 * along the Path within its watch radius (the nearest point if none is that close).
 */
function watchFacingLeft(path: PathGeometry, at: Point, radius: number): boolean {
  let nearest = { d: Infinity, x: at.x };
  for (let t = 0; t <= path.length; t += WATCH_STEP) {
    const p = poseAt(path, t);
    const d = Math.hypot(p.x - at.x, p.y - at.y);
    if (d <= radius) return p.x < at.x - FACING_DEAD_ZONE;
    if (d < nearest.d) nearest = { d, x: p.x };
  }
  return nearest.x < at.x - FACING_DEAD_ZONE;
}

const frameOf = (kind: string, level: number) => `tower-${kind}-${level}`;

/**
 * One atlas frame per (kind, level); `sync` swaps it when the level changes (ADR-0002). The art
 * faces right; the tower turns (flips) to face its current target, keeps its last facing once
 * the target is gone, and starts out facing where enemies will come from.
 */
export function createFruitTowerView(scene: Phaser.Scene, kind: string): EntityView<Tower> {
  const body = scene.add.image(0, 0, ATLAS).setOrigin(0.5, 1).setDepth(5);
  const fallback = scene.add.graphics().setDepth(5).setVisible(false);
  let drawnLevel = 0;
  let baseScale = ART_SCALE;
  let facingLeft: boolean | null = null;

  const showLevel = (level: number) => {
    const frame = frameOf(kind, level);
    if (!hasFrame(scene, frame)) {
      console.error(`Fruit skin has no look for "${kind}" level ${level}`);
      body.setVisible(false);
      fallback
        .clear()
        .fillStyle(colorNumber(palette.fallback))
        .fillCircle(0, -18, 16)
        .setVisible(true);
      return;
    }
    baseScale = ART_SCALE * (LEVEL_SCALE[Math.min(level, LEVEL_SCALE.length) - 1] ?? 1);
    body.setFrame(frame).setScale(baseScale).setVisible(true);
    fallback.setVisible(false);
  };

  return {
    sync(tower, { level, path, enemyPosition }) {
      const c = slotCenter(level, tower.slotId);
      if (c) {
        facingLeft ??= watchFacingLeft(path, c, level.grid.tileSize * WATCH_RADIUS_TILES);
        body.setPosition(c.x, c.y + FOOT_OFFSET);
        fallback.setPosition(c.x, c.y + FOOT_OFFSET);
        const target = tower.targetId === null ? undefined : enemyPosition(tower.targetId);
        if (target && target.x < c.x - FACING_DEAD_ZONE) facingLeft = true;
        else if (target && target.x > c.x + FACING_DEAD_ZONE) facingLeft = false;
        body.setFlipX(facingLeft);
      }
      if (tower.level === drawnLevel) return;
      drawnLevel = tower.level;
      showLevel(tower.level);
    },
    onEvent(event) {
      if (event.type === 'towerFired') {
        // A quick squash as it spits.
        scene.tweens.killTweensOf(body);
        body.setScale(baseScale * 1.12, baseScale * 0.86);
        scene.tweens.add({
          targets: body,
          scaleX: baseScale,
          scaleY: baseScale,
          duration: 140,
          ease: 'Back.easeOut',
        });
      } else if (event.type === 'towerUpgraded') {
        scene.tweens.killTweensOf(body);
        body.setScale(baseScale * 1.3);
        scene.tweens.add({ targets: body, scale: baseScale, duration: 280, ease: 'Back.easeOut' });
        ring(scene, body.x, body.y - 22, palette.gold, 26, 52, 340);
      }
    },
    destroy: () => {
      scene.tweens.killTweensOf(body);
      body.destroy();
      fallback.destroy();
    },
  };
}
