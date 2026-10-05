import type * as Phaser from 'phaser';
import { createFixedStep } from '../game-loop';
import { createDebugOverlay, type DebugOverlay } from '../render/debug-overlay';
import type { Skin } from '../render/skin';
import { WorldRenderer } from '../render/world-renderer';
import type { Simulation } from '../sim/simulation';
import type { SimEvent } from '../sim/types';

/**
 * Runs a Simulation on screen: the fixed-step clock, the world views and the Debug overlay.
 * The Game scene and running Scenario stories share it, so they always play the same way.
 */
export interface WorldRunner {
  readonly sim: Simulation;
  readonly debugOverlay: DebugOverlay;
  /** Draws the current snapshot; `events` play as one-off Effects. */
  render(events?: readonly SimEvent[]): void;
  /**
   * Converts a frame's elapsed real time (scaled by `speed`) into fixed ticks, advances the
   * Simulation, draws the result and returns the SimEvents it produced.
   */
  tick(deltaMs: number, speed?: number): SimEvent[];
}

export function createWorldRunner(
  scene: Phaser.Scene,
  { sim, skin, debug }: { sim: Simulation; skin: Skin; debug: boolean },
): WorldRunner {
  const world = new WorldRenderer(scene, skin, sim.level);
  const debugOverlay = createDebugOverlay(scene, sim.level, sim.units, debug);
  const fixedStep = createFixedStep();

  const render = (events: readonly SimEvent[] = []) => {
    world.render(sim.state, events);
    debugOverlay.sync(sim.state);
  };

  return {
    sim,
    debugOverlay,
    render,
    tick(deltaMs, speed = 1) {
      const events = sim.advance(fixedStep.consume(deltaMs, speed));
      render(events);
      return events;
    },
  };
}
