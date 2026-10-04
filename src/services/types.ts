import type { LevelDef, UnitCatalog } from '../content/schemas';

/** Source of level definitions and the Unit catalog. Local today; may be backed by a server later. */
export interface LevelRepository {
  /** Resolves a level validated against the Unit catalog. */
  getLevel(id: string): Promise<LevelDef>;
  getUnitCatalog(): Promise<UnitCatalog>;
}

export interface Services {
  levels: LevelRepository;
}

export type ServicesEnv = { kind: 'local' };
