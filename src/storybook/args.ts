import type { ArgTypes } from '@storybook/html-vite';
import { loadBundledUnits } from '../content/bundled';
import { DEFAULT_SKIN_ID, skinIds } from '../render/skins';

/** Kinds from the Unit catalog, so new content appears in the Controls without editing stories. */
export const towerKinds = Object.keys(loadBundledUnits().towers);
export const enemyKinds = Object.keys(loadBundledUnits().enemies);

/** Controls every story has. */
export interface BaseStoryArgs {
  skin: string;
  debug: boolean;
}

export const baseArgs: BaseStoryArgs = { skin: DEFAULT_SKIN_ID, debug: false };

export const baseArgTypes: Partial<ArgTypes<BaseStoryArgs>> = {
  skin: { control: 'select', options: skinIds, description: 'Skin to render with' },
  debug: { control: 'boolean', description: 'Show the Debug overlay' },
};
