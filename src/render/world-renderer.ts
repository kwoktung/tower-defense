import type * as Phaser from 'phaser';
import type { LevelDef } from '../content/schemas';
import { buildPath } from '../sim/path';
import type { SimEvent, SimState } from '../sim/types';
import type { EntityView, Skin, SyncContext } from './skin';

/** Keeps one view per entity id for a collection: creates new ones, syncs all, destroys the departed. */
class ViewSet<E extends { id: number; kind: string }> {
  readonly views = new Map<number, EntityView<E>>();

  constructor(private readonly create: (kind: string) => EntityView<E>) {}

  sync(entities: readonly E[], ctx: SyncContext): void {
    const seen = new Set<number>();
    for (const entity of entities) {
      seen.add(entity.id);
      let view = this.views.get(entity.id);
      if (!view) {
        view = this.create(entity.kind);
        this.views.set(entity.id, view);
      }
      view.sync(entity, ctx);
    }
    for (const [id, view] of this.views) {
      if (!seen.has(id)) {
        view.destroy();
        this.views.delete(id);
      }
    }
  }

  destroy(): void {
    for (const view of this.views.values()) view.destroy();
    this.views.clear();
  }
}

/** Turns snapshots into views and forwards SimEvents to the views they concern. */
export class WorldRenderer {
  private readonly ctx: SyncContext;
  private readonly towers;
  private readonly enemies;

  constructor(scene: Phaser.Scene, skin: Skin, level: LevelDef) {
    this.ctx = { level, path: buildPath(level) };
    this.towers = new ViewSet((kind) => skin.createTowerView(scene, kind));
    this.enemies = new ViewSet((kind) => skin.createEnemyView(scene, kind));
  }

  render(state: Readonly<SimState>, events: readonly SimEvent[] = []): void {
    this.towers.sync(state.towers, this.ctx);
    this.enemies.sync(state.enemies, this.ctx);
    for (const event of events) {
      if (!('id' in event)) continue;
      (this.towers.views.get(event.id) ?? this.enemies.views.get(event.id))?.onEvent?.(event);
    }
  }

  destroy(): void {
    this.towers.destroy();
    this.enemies.destroy();
  }
}
