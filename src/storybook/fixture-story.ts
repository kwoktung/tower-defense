import type { Fixture } from '../fixtures/scenario';
import { createDebugOverlay } from '../render/debug-overlay';
import { createHud, hudModelOf } from '../render/hud';
import { WorldRenderer } from '../render/world-renderer';
import { buildPath, cellCenter, poseAt, type Point } from '../sim/path';
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
}

/** Renders one Fixture moment through the same Map, WorldRenderer, Debug overlay and HUD the game uses. */
export function mountFixtureStory(
  args: BaseStoryArgs,
  fixture: Fixture,
  options: FixtureStoryOptions = {},
): HTMLElement {
  const { hud = false, hoverSlot, focus, zoom = 3, effects = [] } = options;
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
      const map = skin.createMap(scene, level);
      if (hoverSlot) {
        const range = selectedTower ? (units.towers[selectedTower]?.range ?? null) : null;
        map.setHover({ slotId: hoverSlot, rangePreview: range });
      }
      new WorldRenderer(scene, skin, level).render(sim.state, effects);
      if (effects.length) scene.tweens.pauseAll();
      createDebugOverlay(scene, level, units, debug).sync(sim.state);
      if (hud) {
        createHud(scene, skin.theme, {
          onSelectTower: () => {},
          onStartNextWave: () => {},
          onRestart: () => {},
        }).update(hudModelOf(sim, selectedTower));
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
    return initialState.projectiles.find((p) => p.id === focus.projectileId);
  }
  const slot = level.slots.find((s) => s.id === focus.slotId);
  return slot && cellCenter(slot, level.grid.tileSize);
}
