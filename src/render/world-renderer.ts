import type * as Phaser from 'phaser';
import type { LevelDef } from '../content/schemas';
import { buildPath } from '../sim/path';
import type { SimEvent, SimState } from '../sim/types';
import type { EntityView, Skin, SyncContext } from './skin';

/** Turns snapshots into views: creates, syncs and destroys one EntityView per entity id. */
export class WorldRenderer {
  private readonly views = new Map<number, EntityView>();
  private readonly ctx: SyncContext;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly skin: Skin,
    level: LevelDef,
  ) {
    this.ctx = { level, path: buildPath(level) };
  }

  render(state: Readonly<SimState>, events: readonly SimEvent[] = []): void {
    const seen = new Set<number>();
    for (const enemy of state.enemies) {
      seen.add(enemy.id);
      let view = this.views.get(enemy.id);
      if (!view) {
        view = this.skin.createView(this.scene, { type: 'enemy', kind: enemy.kind, id: enemy.id });
        this.views.set(enemy.id, view);
      }
      view.sync(enemy, this.ctx);
    }
    for (const [id, view] of this.views) {
      if (!seen.has(id)) {
        view.destroy();
        this.views.delete(id);
      }
    }
    for (const event of events) {
      if ('id' in event) this.views.get(event.id)?.onEvent?.(event);
    }
  }

  destroy(): void {
    for (const view of this.views.values()) view.destroy();
    this.views.clear();
  }
}
