import type { LevelDef, UnitCatalog } from '../content/schemas';

/** Source of level definitions and the Unit catalog. Local today; may be backed by a server later. */
export interface LevelRepository {
  /** Resolves a level validated against the Unit catalog. */
  getLevel(id: string): Promise<LevelDef>;
  getUnitCatalog(): Promise<UnitCatalog>;
}

/** A player's best finished game on one level. */
export interface LevelProgress {
  bestOutcome: 'won' | 'lost';
  /** Lives left when that best result was reached. */
  bestLivesLeft: number;
  /** ISO timestamp of when the stored result was recorded. */
  updatedAt: string;
}

export type GameResult = Pick<LevelProgress, 'bestOutcome' | 'bestLivesLeft'>;

/** A player's best result per level. Local today; may be backed by a server later. */
export interface ProgressStore {
  /** Null when the level has no recorded result. */
  load(levelId: string): Promise<LevelProgress | null>;
  /**
   * Records a finished game, keeping it only if it beats the stored result:
   * a win beats a loss; with the same outcome, more lives left is better.
   * Resolves to the result now stored.
   */
  save(levelId: string, result: GameResult): Promise<LevelProgress>;
}

export interface Services {
  levels: LevelRepository;
  progress: ProgressStore;
}

/** The part of the Web Storage API the local ProgressStore needs. */
export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem'>;

export type ServicesEnv = {
  kind: 'local';
  /** Defaults to the browser's localStorage. */
  storage?: KeyValueStorage;
};
