import type * as Phaser from 'phaser';
import type { LevelDef } from '../content/schemas';
import type { PathGeometry, Point } from '../sim/path';
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

/** The HUD's icons. A Skin draws every one of them, in its own style. */
export const ICON_NAMES = ['heart', 'coin', 'flag', 'play', 'retry', 'upgrade'] as const;
export type IconName = (typeof ICON_NAMES)[number];

/** What the pointer is over: a free Slot, highlighted as clickable. */
export interface SlotHover {
  slotId: string;
}

export interface MapView {
  setHover(hover: SlotHover | null): void;
}

/** Everything an EntityView may need, besides the entity itself, to place itself. */
export interface SyncContext {
  level: LevelDef;
  path: PathGeometry;
  /**
   * Where an enemy of the current snapshot stands, e.g. so a tower can face its target;
   * undefined for an id not on the field.
   */
  enemyPosition(id: number): Point | undefined;
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
  /**
   * One view per tower, chosen by kind. The view handles its own Tower level: `sync` sees
   * `tower.level` and updates the look when it changes (redraw, swap texture, animate); it is
   * never recreated for a level change. A Skin must cover every (kind, level) in the Unit
   * catalog: for one it can't draw it still renders a fallback, but reports console.error so
   * story smoke tests catch the gap (ADR-0002).
   */
  createTowerView(scene: Phaser.Scene, kind: string): EntityView<Tower>;
  createEnemyView(scene: Phaser.Scene, kind: string): EntityView<Enemy>;
  /** `kind` is the kind of the tower that fired it. */
  createProjectileView(scene: Phaser.Scene, kind: string): EntityView<Projectile>;
  /**
   * One-off effects not owned by a living entity, e.g. a kill burst after the enemy's view is gone
   * or a projectile's impact. Events the skin doesn't care about are ignored.
   */
  playEffect(scene: Phaser.Scene, event: SimEvent): void;
  /**
   * A HUD icon about `size` world units across, centred on its origin. For a name it can't
   * draw a Skin still renders a fallback, but reports console.error (ADR-0002).
   */
  createIcon(scene: Phaser.Scene, name: IconName, size: number): Phaser.GameObjects.Container;
}

/** Converts a `#rrggbb` token to the number form Phaser's Graphics API expects. */
export function colorNumber(token: string): number {
  return Number.parseInt(token.slice(1), 16);
}
