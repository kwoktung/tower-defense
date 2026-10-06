import type { Fixture } from '../fixtures/scenario';
import { buildMenuModelOf, createBuildMenu, createBuildPreview } from '../render/build-menu';
import { createHud, hudModelOf } from '../render/hud';
import { createTowerPanel, createTowerSelection, towerPanelModelOf } from '../render/tower-panel';
import {
  clickBuildOption,
  createUiState,
  hoverBuildOption,
  slotHoverFor,
} from '../scenes/ui-state';
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
  /** Show the Build menu open on this Slot, optionally previewing a kind's range. */
  buildMenu?: { slotId: string; previewKind?: string };
  /** Placed tower whose panel and range circles are shown. */
  selectedTowerId?: number;
  /** Show the panel's sell button waiting for its confirming second press. */
  confirmingSell?: boolean;
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
  const uiState = {
    ...createUiState(),
    buildMenu: ui.buildMenu
      ? {
          slotId: ui.buildMenu.slotId,
          previewKind: ui.buildMenu.previewKind ?? null,
          hoverKind: null,
        }
      : null,
    selectedTowerId: ui.selectedTowerId ?? null,
    confirmingSell: ui.confirmingSell ?? false,
  };
  const { advanceTicks = 0, running = false, speed = 1 } = playback;

  return mountPhaserStory({
    skin: args.skin,
    debug: args.debug,
    build: ({ scene, skin, debug }) => {
      const sim = createSimulation(fixture);
      if (advanceTicks > 0) sim.advance(advanceTicks);

      skin.createMap(scene, fixture.level).setHover(slotHoverFor(sim, hoverSlot ?? null));
      const runner = createWorldRunner(scene, { sim, skin, debug });
      runner.render(effects);

      const hudView = hud
        ? createHud(scene, skin, {
            onStartNextWave: () => sim.startNextWave(),
            onRestart: () => {},
          })
        : null;
      const selection = createTowerSelection(scene, skin.theme, fixture.level);
      const panel = createTowerPanel(scene, skin, fixture.level, {
        onUpgrade: (towerId) => sim.upgradeTower(towerId),
        onSell: (towerId) => sim.sellTower(towerId),
      });
      const buildPreview = createBuildPreview(scene, skin.theme, fixture.level);
      const buildMenu = createBuildMenu(scene, skin, fixture.level, {
        onOption: (kind) => clickBuildOption(sim, uiState, kind),
        onHover: (kind) => hoverBuildOption(uiState, kind),
      });
      const drawUi = () => {
        hudView?.update(hudModelOf(sim));
        const menu = buildMenuModelOf(sim, uiState.buildMenu);
        buildPreview.update(menu);
        buildMenu.update(menu);
        const model = towerPanelModelOf(sim, uiState.selectedTowerId, uiState.confirmingSell);
        selection.update(model);
        panel.update(model);
      };
      drawUi();
      hudView?.playEvents(effects);
      if (effects.length) {
        // Freeze tweens and timers so flashes, pulses and floats stay at their first frame.
        scene.tweens.pauseAll();
        scene.time.paused = true;
      }

      if (running) {
        scene.events.on('update', (_time: number, deltaMs: number) => {
          const events = runner.tick(deltaMs, speed);
          drawUi();
          hudView?.playEvents(events);
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
