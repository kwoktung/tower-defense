import type { SimContext } from '../context';
import { TICK_RATE } from '../time';
import type { SimEvent, SimState } from '../types';

/** Advances every enemy along the Path; enemies reaching its end Leak and cost lives. */
export function moveEnemies(state: SimState, ctx: SimContext, events: SimEvent[]): void {
  state.enemies = state.enemies.filter((enemy) => {
    const def = ctx.units.enemies[enemy.kind]!;
    enemy.pathT += def.speed / TICK_RATE;
    if (enemy.pathT < ctx.path.length) return true;
    state.lives = Math.max(0, state.lives - def.leakDamage);
    events.push({ type: 'enemyLeaked', id: enemy.id, livesLost: def.leakDamage });
    return false;
  });
}
