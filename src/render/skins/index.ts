import type { Skin } from '../skin';
import { fruitSkin } from './fruit/fruit-skin';
import { polygonSkin } from './polygon/polygon-skin';

export const skins: Record<string, Skin> = {
  [polygonSkin.id]: polygonSkin,
  [fruitSkin.id]: fruitSkin,
};

export const DEFAULT_SKIN_ID = polygonSkin.id;
export const skinIds = Object.keys(skins);

/** Resolves a skin id, falling back to the default skin for unknown or missing ids. */
export function resolveSkin(id: string | null | undefined): Skin {
  if (id && id in skins) return skins[id]!;
  if (id) console.warn(`Unknown skin "${id}", using "${DEFAULT_SKIN_ID}"`);
  return skins[DEFAULT_SKIN_ID]!;
}
