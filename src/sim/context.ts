import type { LevelDef, UnitCatalog } from '../content/schemas';
import type { PathGeometry } from './path';

/** Read-only inputs every system needs. */
export interface SimContext {
  level: LevelDef;
  units: UnitCatalog;
  path: PathGeometry;
}
