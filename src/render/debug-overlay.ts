import type * as Phaser from 'phaser';
import { towerStats, type LevelDef, type UnitCatalog } from '../content/schemas';
import { buildPath, poseAt, slotCenter } from '../sim/path';
import { TICK_RATE } from '../sim/time';
import type { SimState } from '../sim/types';

/** Fixed, skin-independent look so debug marks never read as game content. */
const COLOR = 0x22d3ee;
const TEXT_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: '11px',
  color: '#22d3ee',
};

export interface DebugOverlay {
  readonly visible: boolean;
  setVisible(visible: boolean): void;
  /** Updates the per-entity labels from a snapshot. */
  sync(state: Readonly<SimState>): void;
}

/**
 * Draws path waypoints, Slot ids and grid coordinates, each tower's range, id and target line,
 * each enemy's id and hp, and each projectile's id, above the world.
 */
export function createDebugOverlay(
  scene: Phaser.Scene,
  level: LevelDef,
  units: UnitCatalog,
  visible: boolean,
): DebugOverlay {
  const root = scene.add.container(0, 0).setDepth(1000);
  const { tileSize } = level.grid;
  const path = buildPath(level);

  const lines = scene.add.graphics();
  lines.lineStyle(1, COLOR);
  root.add(lines);

  path.points.forEach((p, i) => {
    const next = path.points[i + 1];
    if (next) lines.lineBetween(p.x, p.y, next.x, next.y);
    lines.strokeCircle(p.x, p.y, 4);
    root.add(scene.add.text(p.x + 6, p.y + 4, `P${i}`, TEXT_STYLE));
  });

  for (const slot of level.slots) {
    const x = slot.col * tileSize;
    const y = slot.row * tileSize;
    root.add(scene.add.text(x + 8, y + 8, slot.id, TEXT_STYLE));
    root.add(scene.add.text(x + 8, y + 22, `${slot.col},${slot.row}`, TEXT_STYLE));
  }

  const ranges = scene.add.graphics();
  root.add(ranges);
  const labels = new Map<number, Phaser.GameObjects.Text>();
  const label = (id: number, x: number, y: number, text: string) => {
    let t = labels.get(id);
    if (!t) {
      t = scene.add.text(0, 0, '', TEXT_STYLE).setOrigin(0.5, 0);
      labels.set(id, t);
      root.add(t);
    }
    t.setPosition(x, y).setText(text);
  };

  root.setVisible(visible);

  return {
    get visible() {
      return root.visible;
    },
    setVisible: (v) => root.setVisible(v),
    sync(state) {
      const seen = new Set<number>();
      ranges.clear();
      ranges.lineStyle(1, COLOR, 0.8);
      for (const tower of state.towers) {
        const c = slotCenter(level, tower.slotId);
        const def = towerStats(units, tower.kind, tower.level);
        if (!c) continue;
        if (def) ranges.strokeCircle(c.x, c.y, def.range);
        const target = state.enemies.find((e) => e.id === tower.targetId);
        if (target) {
          const t = poseAt(path, target.pathT);
          ranges.lineBetween(c.x, c.y, t.x, t.y);
        }
        seen.add(tower.id);
        label(tower.id, c.x, c.y + 20, `#${tower.id} ${tower.kind} L${tower.level}`);
      }
      for (const enemy of state.enemies) {
        const pose = poseAt(path, enemy.pathT);
        seen.add(enemy.id);
        const armor = units.enemies[enemy.kind]?.armor ?? 0;
        const hp = `#${enemy.id} ${Math.ceil(enemy.hp)}/${enemy.maxHp}`;
        const slow = enemy.slow ? ` slow ${(enemy.slow.ticksLeft / TICK_RATE).toFixed(1)}s` : '';
        label(enemy.id, pose.x, pose.y + 16, `${hp}${armor > 0 ? ` armor ${armor}` : ''}${slow}`);
      }
      for (const projectile of state.projectiles) {
        seen.add(projectile.id);
        const { x, y } = projectile.position;
        label(projectile.id, x, y + 6, `#${projectile.id}`);
      }
      for (const [id, text] of labels) {
        if (!seen.has(id)) {
          text.destroy();
          labels.delete(id);
        }
      }
    },
  };
}
