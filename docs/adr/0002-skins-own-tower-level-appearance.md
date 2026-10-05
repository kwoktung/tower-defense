# ADR-0002: Skins decide how each tower level looks; content stays art-free

- Status: accepted
- Date: 2026-10-05

## Context

Towers gain levels (1–3) that change their stats, and players must be able to tell a tower's kind and level at a glance. The Polygon skin is a stand-in: once the game is more playable, real art (sprites, atlases, animations) will replace it. That swap should touch only the Skin and its assets.

Three things could break that:

- art references (texture names, frames) written into the Unit catalog, tying content to one skin;
- the render layer rebuilding a tower's view on every level change, which rules out skins that animate the change and drops view state such as turret rotation;
- a new skin quietly missing art for some (kind, level), which nobody notices until it is played.

## Decision

- The **Unit catalog describes play only.** It holds no art fields. A Skin maps (kind, level) to its own assets.
- **A tower's view handles its own level.** `createTowerView(scene, kind)` stays as it is. `EntityView<Tower>.sync(tower)` sees `tower.level` and updates the visual when it changes: the Polygon skin redraws, while a sprite skin might swap a texture or play a transformation. The WorldRenderer never recreates a view because of a level change.
- **One-off visuals follow the existing Effect rules.** `towerUpgraded` concerns a living tower, so it goes to that tower's view through `onEvent`. `towerSold` happens after the tower is gone, so it goes to `Skin.playEffect`.
- **A Skin must cover every (kind, level) in the Unit catalog.** If it lacks one, it still renders a fallback, so the game keeps running, but it reports `console.error`. The `allTowerLevels` Scenario renders every combination, so the story smoke test (no `console.error`) fails before a gap ships.
- Views may read other entities of the same snapshot through the sync context (today: an enemy's position, so a tower can face its target). It is read-only and per frame; views still never change the Simulation. Added for the fruit skin, 2026-10-05.
- The selection ring, range circles and the tower panel are HUD/UI. They use Theme tokens only and are not part of any EntityView.

## Consequences

- Good: replacing art means writing a Skin and its assets and checking `allTowerLevels`. Content, Simulation and scenes stay unchanged.
- Good: skins are free to animate level changes.
- Cost: every tower view has to remember the level it last drew and compare it in `sync`.
- Cost: adding a level or tower kind to the catalog makes the story test fail until every Skin covers it. This is intended.
- Revisit if: the level of a tower stops being the only thing that decides its look (e.g. branching upgrades), in which case the view should key on the full upgrade path instead of the level number.
