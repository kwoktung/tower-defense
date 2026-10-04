import { TICK_RATE } from './sim/time';

const TICK_MS = 1000 / TICK_RATE;
/** Upper bound on catch-up after a stall (e.g. a background tab), so one frame never runs minutes of game. */
const MAX_TICKS_PER_FRAME = 15;

/** Converts variable frame times into a whole number of fixed Simulation ticks. */
export function createFixedStep() {
  let accumulator = 0;
  return {
    /** Adds a frame's elapsed milliseconds (scaled by `speed`) and returns the ticks to advance. */
    consume(deltaMs: number, speed = 1): number {
      accumulator += deltaMs * speed;
      const ticks = Math.min(Math.floor(accumulator / TICK_MS), MAX_TICKS_PER_FRAME);
      accumulator = ticks === MAX_TICKS_PER_FRAME ? 0 : accumulator - ticks * TICK_MS;
      return ticks;
    },
  };
}
