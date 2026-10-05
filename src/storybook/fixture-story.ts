import type { Fixture } from '../fixtures/scenario';
import { createHud, hudModelOf } from '../render/hud';
import { defaultSelectedTower, slotHoverFor } from '../scenes/ui-state';
import { createWorldRunner } from '../scenes/world-runner';
import { buildPath, poseAt, slotCenter, type Point } from '../sim/path';
import { createSimulation } from '../sim/simulation';
import type { SimEvent } from '../sim/types';
import type { BaseStoryArgs } from './args';
import { mountPhaserStory } from './mount-phaser-story';

export type StoryFocus = { enemyId: number } | { slotId: string } | { projectileId: number };

/** What the player-facing UI shows. */
export interface StoryUi {
  /** Draw the HUD over the world. */
  hud?: boolean;
  /** Tower kind selected on the HUD and used for the hover range preview. Default: the first kind. */
  selectedTower?: string | null;
  /** Show the pointer over this Slot (highlighted only if free, as in the game). */
  hoverSlot?: string;
}

/** Zooms the camera onto an entity (Entities stories). */
export interface StoryCamera {
  focus: StoryFocus;
  /** Default 3. */
  zoom?: number;
}

/** How the Simulation moves after the Fixture is loaded. */
export interface StoryPlayback {
  /** Fast-forward this many ticks before the first frame (events from the skipped ticks are not shown). */
  advanceTicks?: number;
  /** Keep the Simulation running at a fixed step after the first frame. */
  running?: boolean;
  /** Game-time multiplier while running. */
  speed?: number;
}

export interface FixtureStoryOptions {
  ui?: StoryUi;
  camera?: StoryCamera;
  /**
   * One-off Effects to show (e.g. a splash explosion), frozen at their first frame so the
   * picture is stable for Shots.
   */
  effects?: SimEvent[];
  playback?: StoryPlayback;
}

/**
 * Renders one Fixture moment through the same Map, WorldRunner and HUD the game uses, so a
 * story looks and (when running) plays exactly like the game.
 */
export function mountFixtureStory(
  args: BaseStoryArgs,
  fixture: Fixture,
  { ui = {}, camera, effects = [], playback = {} }: FixtureStoryOptions = {},
): HTMLElement {
  const { hud = false, hoverSlot } = ui;
  const selectedTower =
    ui.selectedTower === undefined ? defaultSelectedTower(fixture.units) : ui.selectedTower;
  const { advanceTicks = 0, running = false, speed = 1 } = playback;

  return mountPhaserStory({
    skin: args.skin,
    debug: args.debug,
    build: ({ scene, skin, debug }) => {
      const sim = createSimulation(fixture);
      if (advanceTicks > 0) sim.advance(advanceTicks);

      skin
        .createMap(scene, fixture.level)
        .setHover(slotHoverFor(sim, hoverSlot ?? null, selectedTower));
      const runner = createWorldRunner(scene, { sim, skin, debug });
      runner.render(effects);
      if (effects.length) {
        // Freeze tweens and timers so flashes and pulses stay at their first frame.
        scene.tweens.pauseAll();
        scene.time.paused = true;
      }

      const hudView = hud
        ? createHud(scene, skin.theme, {
            onSelectTower: () => {},
            onStartNextWave: () => sim.startNextWave(),
            onRestart: () => {},
          })
        : null;
      hudView?.update(hudModelOf(sim, selectedTower));

      if (running) {
        scene.events.on('update', (_time: number, deltaMs: number) => {
          runner.tick(deltaMs, speed);
          hudView?.update(hudModelOf(sim, selectedTower));
        });
      }

      const target = camera && focusPoint(fixture, camera.focus);
      if (camera && target) {
        const { cols, rows, tileSize } = fixture.level.grid;
        scene.cameras.main
          .setBounds(0, 0, cols * tileSize, rows * tileSize)
          .setZoom(camera.zoom ?? 3)
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
