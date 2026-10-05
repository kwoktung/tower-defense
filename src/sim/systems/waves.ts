import type { SimContext } from '../context';
import { secondsToTicks } from '../time';
import type { SimEvent, SimState } from '../types';

export function canStartNextWave(state: SimState, ctx: SimContext): boolean {
  return (
    state.outcome === 'playing' &&
    state.wave.spawning === null &&
    state.enemies.length === 0 &&
    state.wave.index + 1 < ctx.level.waves.length
  );
}

export function startNextWave(state: SimState): SimEvent {
  state.wave = {
    index: state.wave.index + 1,
    spawning: { groupIndex: 0, spawnedInGroup: 0, cooldownTicks: 0 },
  };
  return { type: 'waveStarted', index: state.wave.index };
}

/** Spawns at most one enemy per tick at the start of the Path, walking the Wave's spawn groups in order. */
export function spawnEnemies(state: SimState, ctx: SimContext, events: SimEvent[]): void {
  const cursor = state.wave.spawning;
  if (!cursor) return;
  if (cursor.cooldownTicks > 0) {
    cursor.cooldownTicks--;
    return;
  }

  const groups = ctx.level.waves[state.wave.index]!.groups;
  const group = groups[cursor.groupIndex]!;
  const def = ctx.units.enemies[group.kind]!;
  const id = state.nextId++;
  state.enemies.push({ id, kind: group.kind, hp: def.hp, maxHp: def.hp, pathT: 0, slow: null });
  events.push({ type: 'enemySpawned', id, kind: group.kind });

  // The gap before the next spawn is this group's interval, even when the next spawn opens a new group.
  cursor.cooldownTicks = secondsToTicks(group.intervalSec) - 1;
  cursor.spawnedInGroup++;
  if (cursor.spawnedInGroup >= group.count) {
    cursor.groupIndex++;
    cursor.spawnedInGroup = 0;
    if (cursor.groupIndex >= groups.length) state.wave.spawning = null;
  }
}
