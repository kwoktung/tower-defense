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
}

/** Turns snapshots into views and forwards SimEvents to the views they concern. */
export class WorldRenderer {
  private readonly ctx: SyncContext;
  private readonly towers;
  private readonly enemies;
  private readonly projectiles;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly skin: Skin,
    level: LevelDef,
  ) {
    this.ctx = { level, path: buildPath(level) };
    this.towers = new ViewSet((kind) => skin.createTowerView(scene, kind));
    this.enemies = new ViewSet((kind) => skin.createEnemyView(scene, kind));
    this.projectiles = new ViewSet((kind) => skin.createProjectileView(scene, kind));
  }

  render(state: Readonly<SimState>, events: readonly SimEvent[] = []): void {
    this.towers.sync(state.towers, this.ctx);
    this.enemies.sync(state.enemies, this.ctx);
    this.projectiles.sync(state.projectiles, this.ctx);
    for (const event of events) {
      switch (event.type) {
        case 'towerFired':
          this.towers.views.get(event.towerId)?.onEvent?.(event);
          break;
        case 'towerUpgraded':
          this.towers.views.get(event.id)?.onEvent?.(event);
          break;
        case 'enemyDamaged':
          this.enemies.views.get(event.id)?.onEvent?.(event);
          break;
        default:
          this.skin.playEffect(this.scene, event);
      }
    }
  }
}
