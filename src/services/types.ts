import type { LevelDef } from '../content/schemas';

/** Source of level definitions. Local today; may be backed by a server later. */
export interface LevelRepository {
  getLevel(id: string): Promise<LevelDef>;
}

export interface Services {
  levels: LevelRepository;
}

export type ServicesEnv = { kind: 'local' };
