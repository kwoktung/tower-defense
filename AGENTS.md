## Agent skills

### Issue tracker

Issues are tracked as local markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Uses the default five triage roles (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`), recorded as `Status:` lines. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Development commands

| Command                              | What it does                                                                                                                                                                                                        |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm dev`                           | Run the game at <http://localhost:5173>. Dev-only URL params: `?skin=<id>`, `?debug`, `?level=<id>` (see below)                                                                                                     |
| `pnpm test`                          | All tests: `unit` (Simulation, services) and `storybook` (every story renders, no `console.error`)                                                                                                                  |
| `pnpm test:unit`                     | Unit tests only (fast, Node)                                                                                                                                                                                        |
| `pnpm test:stories`                  | Story smoke tests only (headless Chromium)                                                                                                                                                                          |
| `pnpm typecheck`                     | TypeScript type check                                                                                                                                                                                               |
| `pnpm lint`                          | ESLint, including the layering rules from ADR-0001                                                                                                                                                                  |
| `pnpm format`                        | Prettier                                                                                                                                                                                                            |
| `pnpm storybook`                     | Storybook at <http://localhost:6006>                                                                                                                                                                                |
| `pnpm shots [filter] [--skip-build]` | Build Storybook and screenshot every story (or those whose id/title contains `filter`, e.g. `pnpm shots splash`) into `.shots/`. Prints the files written. A full run takes about a minute; filter while iterating. |
| `pnpm balance`                       | Balance report (not a test, ~20 s): leaks of more level-1 towers vs one upgraded tower at their best Slots, and level 1 played by scripted strategies. Run after changing Unit catalog numbers.                     |

Shot file names: `<story-id>.png`, `<story-id>--debug.png` (Debug overlay on), and for stories declaring `parameters.shots.ticks`, `<story-id>--t<ticks>.png` / `--debug--t<ticks>.png` — the same Scenario fast-forwarded, so you can see how it plays out.

The URL params are development and debugging aids, not player features: `?skin=` picks a registered Skin, `?debug` starts with the Debug overlay on, and `?level=` loads another bundled level by id. Level selection for players is still out of MVP scope — don't build UI on `?level`.

In game, press `D` to toggle the Debug overlay. In dev builds the running game is on `window.__GAME__`; e.g. `__GAME__.scene.getScene('Game').runner.sim.state` reads the live SimState from DevTools or the Chrome MCP tools.

## Working conventions

- Before writing code, read `CONTEXT.md` and `docs/adr/`. The Simulation must stay free of Phaser, rendering, scenes and services (ADR-0001).
- Test game rules through the Simulation's public API, building start states from Fixtures. Don't unit-test internal systems or rendering.
- Every new visual element gets a story backed by a Fixture. Add named Fixtures in `src/fixtures/named.ts` (builder: `scenario().withTower(…).withEnemies(…).advance(ticks).build()`) and a matching `Scenarios` story.
- Event-driven visuals (flashes, pulses, explosions) are shown in stories by passing `effects` to `mountFixtureStory`, which freezes them at their first frame for stable Shots.
- Scenario stories have `running`, `speed` and `advanceTicks` controls; declare `parameters.shots.ticks` to get a timeline of Shots.
- After changing rendering, run `pnpm shots` (with a filter if you can) and look at the screenshots, with and without the Debug overlay.
- For interactive debugging, open `pnpm storybook` or `pnpm dev` with the Chrome DevTools MCP tools.
- Before finishing a ticket, run `pnpm typecheck && pnpm lint && pnpm test`.
