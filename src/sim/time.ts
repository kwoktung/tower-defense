/** Simulation ticks per second. One tick advances game time by 1 / TICK_RATE seconds. */
export const TICK_RATE = 60;

export function secondsToTicks(seconds: number): number {
  return Math.round(seconds * TICK_RATE);
}
