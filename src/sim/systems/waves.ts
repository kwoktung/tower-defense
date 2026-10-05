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

/** Starts the next Wave (the caller has checked it may start); any Auto start countdown ends. */
export function startNextWave(state: SimState, trigger: 'player' | 'auto'): SimEvent {
  state.wave = {
    index: state.wave.index + 1,
    spawning: { groupIndex: 0, spawnedInGroup: 0, cooldownTicks: 0 },
    autoStartTicks: null,
  };
  return { type: 'waveStarted', index: state.wave.index, trigger, bonus: 0 };
}

/**
 * Auto start: once a Wave after the first is cleared, counts down the level's auto-start time
 * and then starts the next Wave. The countdown ends with the game.
 */
export function autoStart(state: SimState, ctx: SimContext, events: SimEvent[]): void {
  const { wave } = state;
  if (state.outcome !== 'playing') {
    wave.autoStartTicks = null;
    return;
  }
  if (wave.autoStartTicks === null) {
    if (wave.index >= 0 && canStartNextWave(state, ctx)) {
      wave.autoStartTicks = secondsToTicks(ctx.level.autoStartSec);
    }
    return;
  }
  if (--wave.autoStartTicks <= 0) events.push(startNextWave(state, 'auto'));
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
