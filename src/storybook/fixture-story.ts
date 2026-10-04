import { createDebugOverlay } from '../render/debug-overlay';
import { createHud, hudModelOf } from '../render/hud';
import { WorldRenderer } from '../render/world-renderer';
import type { Fixture } from '../fixtures/scenario';
import { buildPath, poseAt } from '../sim/path';
import { createSimulation } from '../sim/simulation';
import type { BaseStoryArgs } from './args';
import { mountPhaserStory } from './mount-phaser-story';

export interface FixtureStoryOptions {
  /** Draw the HUD over the world. */
  hud?: boolean;
  /** Zoom the camera onto this enemy (Entities stories). */
  focusEnemyId?: number;
  zoom?: number;
}

/** Renders one Fixture moment through the same Map, WorldRenderer, Debug overlay and HUD the game uses. */
export function mountFixtureStory(
  args: BaseStoryArgs,
  fixture: Fixture,
  { hud = false, focusEnemyId, zoom = 3 }: FixtureStoryOptions = {},
): HTMLElement {
  return mountPhaserStory({
    skin: args.skin,
    debug: args.debug,
    build: ({ scene, skin, debug }) => {
      const sim = createSimulation(fixture);
      skin.createMap(scene, fixture.level);
      new WorldRenderer(scene, skin, fixture.level).render(sim.state);
      createDebugOverlay(scene, fixture.level, debug).sync(sim.state);
      if (hud) {
        createHud(scene, skin.theme, { onStartNextWave: () => {}, onRestart: () => {} }).update(
          hudModelOf(sim),
        );
      }
      const focus = sim.state.enemies.find((e) => e.id === focusEnemyId);
      if (focus) {
        const pose = poseAt(buildPath(fixture.level), focus.pathT);
        const { cols, rows, tileSize } = fixture.level.grid;
        scene.cameras.main
          .setBounds(0, 0, cols * tileSize, rows * tileSize)
          .setZoom(zoom)
          .centerOn(pose.x, pose.y);
      }
    },
  });
}
