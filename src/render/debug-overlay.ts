import type * as Phaser from 'phaser';
import type { LevelDef } from '../content/schemas';
import { buildPath } from '../sim/path';

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
  destroy(): void;
}

/** Draws path waypoints, Slot ids and grid coordinates above the world. */
export function createDebugOverlay(
  scene: Phaser.Scene,
  level: LevelDef,
  visible: boolean,
): DebugOverlay {
  const root = scene.add.container(0, 0).setDepth(1000);
  const { tileSize } = level.grid;

  const lines = scene.add.graphics();
  const { points } = buildPath(level);
  lines.lineStyle(1, COLOR);
  root.add(lines);

  points.forEach((p, i) => {
    const next = points[i + 1];
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

  root.setVisible(visible);

  return {
    get visible() {
      return root.visible;
    },
    setVisible: (v) => root.setVisible(v),
    destroy: () => root.destroy(),
  };
}
