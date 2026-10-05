import type * as Phaser from 'phaser';
import type { LevelDef } from '../content/schemas';
import type { PathGeometry } from '../sim/path';
import type { Enemy, Projectile, SimEvent, Tower } from '../sim/types';

/** Named colours (`#rrggbb`) and fonts a Skin provides. The HUD reads only these. */
export interface SkinTheme {
  colors: {
    background: string;
    path: string;
    slot: string;
    slotHover: string;
    text: string;
    textMuted: string;
    gold: string;
    hudPanel: string;
    button: string;
    buttonHover: string;
    buttonDisabled: string;
    /** Outline of the selected build button and of the selected tower. */
    selection: string;
    /** Tower range circles drawn by the UI (selected tower, upgrade preview). */
    range: string;
    /** Warnings, such as an upgrade cost the gold doesn't cover. */
    danger: string;
    overlay: string;
  };
  fonts: {
    ui: string;
  };
}

/** What the pointer is over: an empty Slot, optionally previewing the selected tower's range. */
export interface SlotHover {
  slotId: string;
  /** Range of the tower that would be built here, in world units; null for no preview. */
  rangePreview: number | null;
}

export interface MapView {
  setHover(hover: SlotHover | null): void;
}

/** Everything an EntityView may need, besides the entity itself, to place itself. */
export interface SyncContext {
  level: LevelDef;
  path: PathGeometry;
}

/** The view of one entity. Synced from the snapshot every frame; never changes the Simulation. */
export interface EntityView<E> {
  sync(entity: E, ctx: SyncContext): void;
  /** One-off effects for SimEvents concerning this entity. */
  onEvent?(event: SimEvent): void;
  destroy(): void;
}

/**
 * How everything looks. Skins only draw; they never read services or change the Simulation.
 */
export interface Skin {
  readonly id: string;
  readonly theme: SkinTheme;
  /** Queue any assets on the scene's loader. */
  preload(scene: Phaser.Scene): void;
  createMap(scene: Phaser.Scene, level: LevelDef): MapView;
  /** One view per entity, chosen by kind. Unknown kinds must still render (a fallback shape). */
  createTowerView(scene: Phaser.Scene, kind: string): EntityView<Tower>;
  createEnemyView(scene: Phaser.Scene, kind: string): EntityView<Enemy>;
  /** `kind` is the kind of the tower that fired it. */
  createProjectileView(scene: Phaser.Scene, kind: string): EntityView<Projectile>;
  /**
   * One-off effects not owned by a living entity, e.g. a kill burst after the enemy's view is gone
   * or a projectile's impact. Events the skin doesn't care about are ignored.
   */
  playEffect(scene: Phaser.Scene, event: SimEvent): void;
}

/** Converts a `#rrggbb` token to the number form Phaser's Graphics API expects. */
export function colorNumber(token: string): number {
  return Number.parseInt(token.slice(1), 16);
}
