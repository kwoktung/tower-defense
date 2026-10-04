import type { SimContext } from '../context';
import type { SimEvent, SimState } from '../types';

/** Lost the moment lives reach zero; won once the last Wave has fully spawned and the field is clear. */
export function resolveOutcome(state: SimState, ctx: SimContext, events: SimEvent[]): void {
  if (state.outcome !== 'playing') return;
  if (state.lives <= 0) {
    state.outcome = 'lost';
    events.push({ type: 'gameEnded', outcome: 'lost' });
  } else if (
    state.wave.index === ctx.level.waves.length - 1 &&
    state.wave.spawning === null &&
    state.enemies.length === 0
  ) {
    state.outcome = 'won';
    events.push({ type: 'gameEnded', outcome: 'won' });
  }
}
