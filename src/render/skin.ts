import type * as Phaser from 'phaser';
import type { LevelDef } from '../content/schemas';

/** Named colours (`#rrggbb`) and fonts a Skin provides. The HUD reads only these. */
export interface SkinTheme {
  colors: {
    background: string;
    path: string;
    slot: string;
    slotHover: string;
    text: string;
    gold: string;
  };
  fonts: {
    ui: string;
  };
}

export interface MapView {
  setSlotHover(slotId: string | null): void;
  destroy(): void;
}

/**
 * How everything looks. Skins only draw; they never read services or change the Simulation.
 * Entity views arrive with the tickets that introduce towers, enemies and projectiles.
 */
export interface Skin {
  readonly id: string;
  readonly theme: SkinTheme;
  /** Queue any assets on the scene's loader. */
  preload(scene: Phaser.Scene): void;
  createMap(scene: Phaser.Scene, level: LevelDef): MapView;
}

/** Converts a `#rrggbb` token to the number form Phaser's Graphics API expects. */
export function colorNumber(token: string): number {
  return Number.parseInt(token.slice(1), 16);
}
