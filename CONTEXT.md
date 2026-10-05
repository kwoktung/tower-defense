# Tower Defense — Domain Glossary

Use these terms in code, tickets, commits and reviews. Avoid the listed synonyms.

## Simulation

- **Simulation** — The pure-TypeScript game logic. It owns all rules (spawning, movement, targeting, damage, economy, outcome) and never depends on Phaser, rendering or data services (ADR-0001). _Avoid:_ engine, model, world.
- **Tick** — One fixed step of the Simulation, 1/60 s. All durations are converted from seconds to ticks when entering the Simulation. _Avoid:_ frame (a frame is a render-side concept).
- **SimState** — The complete, serializable state of a Simulation at a given tick: gold, lives, wave progress, outcome, towers, enemies, projectiles. Also called the **snapshot** when handed to rendering. _Avoid:_ game state, store.
- **SimEvent** — A one-off occurrence emitted while advancing ticks (tower fired, projectile hit, enemy killed, enemy leaked, wave started, game ended…). Rendering uses events for effects; persistent facts live in SimState.
- **Seed** — The number a Simulation is created with. Reserved for randomness: it initialises SimState's `rngState`, but no rule is random yet, so today it does not affect play. Same seed + same actions ⇒ identical SimState.
- **Outcome** — `playing`, `won` or `lost`. Once not `playing`, the Simulation stops changing.

## Map and units

- **Path** — The fixed polyline enemies walk along, defined by grid-cell waypoints.
- **pathT** — Distance an enemy has travelled along the Path, in world units. Enemy position and heading are derived from it.
- **Slot** — A grid cell where a tower may be built. _Avoid:_ build spot, pad, tile (a tile is any grid cell).
- **Tower** — A placed defensive unit, identified by **kind** (`basic`, `splash`, `slow`).
- **Tower level** — A Tower's upgrade step, starting at 1. Its stats come from the Unit catalog entry for that kind and level; how it looks is up to the Skin (ADR-0002). _Avoid:_ tier, rank.
- **Sell value** — Gold returned when a Tower is sold: a fixed share (`sellRefundRatio`) of everything spent on it, i.e. build cost plus all upgrades. _Avoid:_ refund price, resale.
- **Enemy** — A unit walking the Path, identified by **kind** (`normal`, `fast`, `armored`).
- **Projectile** — A homing shot fired by a Tower. If its target dies first it continues to the target's last known position.
- **Splash** — Attack mode that damages every Enemy within a radius of the impact point.
- **Armor** — A flat reduction an Enemy applies to every hit: damage taken is the damage minus Armor, but never less than 20% of the damage. Defaults to 0. Applied per Enemy, so a Splash hit is reduced separately for each victim.
- **Slow** — An on-hit effect a Tower level may carry, independent of its attack mode: the Enemy hit moves at (1 − factor) of its speed for a duration. Slows don't stack: a hit at least as strong replaces the current Slow and restarts its duration; a weaker one is ignored. Armor reduces damage, never Slow. _Avoid:_ freeze, chill.
- **Wave** — One numbered round of enemies, started by the player. Made of ordered **spawn groups** (`kind`, `count`, `interval`).
- **Leak** — An Enemy reaching the end of the Path; costs lives. _Avoid:_ escape.
- **Unit catalog** — Config describing every Tower and Enemy kind's stats, per Tower level for Towers. It holds no art (ADR-0002).
- **Level definition** — Config describing the grid, Path, Slots, starting gold/lives and Waves.

## Rendering

- **Skin** — A pluggable implementation of how everything looks: it creates the MapView and EntityViews, plays one-off Effects, and provides Theme tokens. The MVP ships the **Polygon skin**. _Avoid:_ theme (that is only the token part), renderer.
- **EntityView** — The visual for one Tower, Enemy or Projectile. It syncs from the snapshot each frame and may react to SimEvents.
- **MapView** — The visual for the background, Path and Slots.
- **WorldRenderer** — Diffs each snapshot by entity id to create, sync and destroy EntityViews. It forwards SimEvents about a living entity (tower fired, enemy damaged) to that entity's view, and hands every other SimEvent to the Skin as an Effect.
- **Theme token** — A named colour or font provided by the Skin; the HUD reads only these.
- **HUD** — The Phaser-drawn overlay scene showing gold, lives, wave, the build / next-wave buttons and the end-of-game overlay. The Game scene launches it on every start, including restarts.
- **Effect** — A one-off visual for a SimEvent (fire pulse, hit flash, kill ring, splash ring). Effects never change the Simulation.
- **UI state** — Player choices that are not game state, such as the selected tower kind; shared by the Game and HUD scenes, never stored in SimState.
- **Debug overlay** — A skin-independent layer showing ranges, ids, hp, path waypoints and Slot coordinates. Toggled with `D` in game or the `debug` control in Storybook.

## Visual workflow

- **Fixture** — A named, builder-made SimState (plus level, catalog and seed) describing one moment of play. Shared by tests and stories.
- **Scenario** — A story that renders a Fixture, optionally advancing (`advanceTicks`) or running it.
- **Story** — A Storybook entry rendering one entity, map, HUD state, Scenario or the playable game.
- **Shots** — PNG screenshots of every story (with and without the Debug overlay), produced by one command so an agent can inspect them.
- **Shot timeline** — Extra Shots of one Scenario fast-forwarded by several tick counts (`parameters.shots.ticks`).

## Services

- **LevelRepository** — Async source of Level definitions and the Unit catalog. Local implementation reads bundled JSON; may later be a server.
- **ProgressStore** — Async store of a player's best result per level. Local implementation uses localStorage; may later be a server.
- **Composition root** — The single place that builds the services for an environment.
