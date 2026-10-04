import type { SimEvent, SimState } from '../types';

export function resolveOutcome(state: SimState, events: SimEvent[]): void {
  if (state.outcome === 'playing' && state.lives <= 0) {
    state.outcome = 'lost';
    events.push({ type: 'gameEnded', outcome: 'lost' });
  }
}
