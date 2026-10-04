import type * as Phaser from 'phaser';
import type { LevelDef } from '../content/schemas';
import type { PathGeometry } from '../sim/path';
import type { Enemy, SimEvent } from '../sim/types';

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
    overlay: string;
  };
  fonts: {
    ui: string;
  };
}

export interface MapView {
  setSlotHover(slotId: string | null): void;
  destroy(): void;
}

/** Everything an EntityView may need, besides the entity itself, to place itself. */
export interface SyncContext {
  level: LevelDef;
  path: PathGeometry;
}

/** Identifies which view to create. Towers and projectiles join this union in later tickets. */
export type EntityRef = { type: 'enemy'; kind: string; id: number };

/** The view of one entity. Synced from the snapshot every frame; never changes the Simulation. */
export interface EntityView<E = Enemy> {
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
  createView(scene: Phaser.Scene, ref: EntityRef): EntityView;
}

/** Converts a `#rrggbb` token to the number form Phaser's Graphics API expects. */
export function colorNumber(token: string): number {
  return Number.parseInt(token.slice(1), 16);
}
