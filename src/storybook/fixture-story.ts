import type { Fixture } from '../fixtures/scenario';
import { createFixedStep } from '../game-loop';
import { createDebugOverlay } from '../render/debug-overlay';
import { createHud, hudModelOf } from '../render/hud';
import { WorldRenderer } from '../render/world-renderer';
import { buildPath, poseAt, slotCenter, type Point } from '../sim/path';
import { createSimulation } from '../sim/simulation';
import type { SimEvent } from '../sim/types';
import type { BaseStoryArgs } from './args';
import { mountPhaserStory } from './mount-phaser-story';

export type StoryFocus = { enemyId: number } | { slotId: string } | { projectileId: number };

export interface FixtureStoryOptions {
  /** Draw the HUD over the world. */
  hud?: boolean;
  /** Tower kind shown as selected on the HUD and used for the hover range preview. Default: the first kind. */
  selectedTower?: string | null;
  /** Show the pointer over this Slot, previewing the selected tower's range. */
  hoverSlot?: string;
  /** Zoom the camera onto an entity (Entities stories). */
  focus?: StoryFocus;
  zoom?: number;
  /**
   * One-off effects to show (e.g. a splash explosion), frozen at their first frame so the
   * picture is stable for Shots.
   */
  effects?: SimEvent[];
  /** Fast-forward this many ticks before the first frame (events from the skipped ticks are not shown). */
  advanceTicks?: number;
  /** Keep the Simulation running at a fixed step after the first frame. */
  running?: boolean;
  /** Game-time multiplier while running. */
  speed?: number;
}

/** Renders one Fixture moment through the same Map, WorldRenderer, Debug overlay and HUD the game uses. */
export function mountFixtureStory(
  args: BaseStoryArgs,
  fixture: Fixture,
  options: FixtureStoryOptions = {},
): HTMLElement {
  const { hud = false, hoverSlot, focus, zoom = 3, effects = [] } = options;
  const { advanceTicks = 0, running = false, speed = 1 } = options;
  const selectedTower =
    options.selectedTower === undefined
      ? (Object.keys(fixture.units.towers)[0] ?? null)
      : options.selectedTower;

  return mountPhaserStory({
    skin: args.skin,
    debug: args.debug,
    build: ({ scene, skin, debug }) => {
      const { level, units } = fixture;
      const sim = createSimulation(fixture);
      if (advanceTicks > 0) sim.advance(advanceTicks);
      const map = skin.createMap(scene, level);
      if (hoverSlot) {
        const range = selectedTower ? (units.towers[selectedTower]?.range ?? null) : null;
        map.setHover({ slotId: hoverSlot, rangePreview: range });
      }
      const world = new WorldRenderer(scene, skin, level);
      world.render(sim.state, effects);
      if (effects.length) {
        // Freeze tweens and timers so flashes and pulses stay at their first frame.
        scene.tweens.pauseAll();
        scene.time.paused = true;
      }
      const overlay = createDebugOverlay(scene, level, units, debug);
      overlay.sync(sim.state);
      const hudView = hud
        ? createHud(scene, skin.theme, {
            onSelectTower: () => {},
            onStartNextWave: () => sim.startNextWave(),
            onRestart: () => {},
          })
        : null;
      hudView?.update(hudModelOf(sim, selectedTower));

      if (running) {
        const fixedStep = createFixedStep();
        scene.events.on('update', (_time: number, deltaMs: number) => {
          const events = sim.advance(fixedStep.consume(deltaMs, speed));
          world.render(sim.state, events);
          overlay.sync(sim.state);
          hudView?.update(hudModelOf(sim, selectedTower));
        });
      }
      const target = focus && focusPoint(fixture, focus);
      if (target) {
        const { cols, rows, tileSize } = level.grid;
        scene.cameras.main
          .setBounds(0, 0, cols * tileSize, rows * tileSize)
          .setZoom(zoom)
          .centerOn(target.x, target.y);
      }
    },
  });
}

function focusPoint({ level, initialState }: Fixture, focus: StoryFocus): Point | undefined {
  if ('enemyId' in focus) {
    const enemy = initialState.enemies.find((e) => e.id === focus.enemyId);
    return enemy && poseAt(buildPath(level), enemy.pathT);
  }
  if ('projectileId' in focus) {
    return initialState.projectiles.find((p) => p.id === focus.projectileId)?.position;
  }
  return slotCenter(level, focus.slotId);
}
