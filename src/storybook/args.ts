import type { ArgTypes } from '@storybook/html-vite';
import { DEFAULT_SKIN_ID, skinIds } from '../render/skins';

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
