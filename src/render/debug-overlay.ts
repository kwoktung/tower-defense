import type * as Phaser from 'phaser';
import type { LevelDef } from '../content/schemas';
import { buildPath, poseAt } from '../sim/path';
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
  destroy(): void;
}

/**
 * Draws path waypoints, Slot ids and grid coordinates, plus each enemy's id and hp,
 * above the world.
 */
export function createDebugOverlay(
  scene: Phaser.Scene,
  level: LevelDef,
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

  const enemyLabels = new Map<number, Phaser.GameObjects.Text>();

  root.setVisible(visible);

  return {
    get visible() {
      return root.visible;
    },
    setVisible: (v) => root.setVisible(v),
    sync(state) {
      const seen = new Set<number>();
      for (const enemy of state.enemies) {
        seen.add(enemy.id);
        let label = enemyLabels.get(enemy.id);
        if (!label) {
          label = scene.add.text(0, 0, '', TEXT_STYLE).setOrigin(0.5, 0);
          enemyLabels.set(enemy.id, label);
          root.add(label);
        }
        const pose = poseAt(path, enemy.pathT);
        label.setPosition(pose.x, pose.y + 16);
        label.setText(`#${enemy.id} ${Math.ceil(enemy.hp)}/${enemy.maxHp}`);
      }
      for (const [id, label] of enemyLabels) {
        if (!seen.has(id)) {
          label.destroy();
          enemyLabels.delete(id);
        }
      }
    },
    destroy: () => root.destroy(),
  };
}
