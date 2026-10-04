## Agent skills

### Issue tracker

Issues are tracked as local markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Uses the default five triage roles (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`), recorded as `Status:` lines. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Development commands

| Command                              | What it does                                                                                                                                                                      |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm dev`                           | Run the game at <http://localhost:5173>. URL params: `?skin=<id>`, `?debug`, `?level=<id>`                                                                                        |
| `pnpm test`                          | All tests: `unit` (Simulation, services) and `storybook` (every story renders, no `console.error`)                                                                                |
| `pnpm test:unit`                     | Unit tests only (fast, Node)                                                                                                                                                      |
| `pnpm test:stories`                  | Story smoke tests only (headless Chromium)                                                                                                                                        |
| `pnpm typecheck`                     | TypeScript type check                                                                                                                                                             |
| `pnpm lint`                          | ESLint, including the layering rules from ADR-0001                                                                                                                                |
| `pnpm format`                        | Prettier                                                                                                                                                                          |
| `pnpm storybook`                     | Storybook at <http://localhost:6006>                                                                                                                                              |
| `pnpm shots [filter] [--skip-build]` | Build Storybook and screenshot every story (or those whose id/title contains `filter`) into `.shots/<story-id>.png` and `.shots/<story-id>--debug.png`. Prints the files written. |

In game, press `D` to toggle the Debug overlay. In dev builds the running game is on `window.__GAME__`; e.g. `__GAME__.scene.getScene('Game').sim.state` reads the live SimState from DevTools or the Chrome MCP tools.

## Working conventions

- Before writing code, read `CONTEXT.md` and `docs/adr/`. The Simulation must stay free of Phaser, rendering, scenes and services (ADR-0001).
- Test game rules through the Simulation's public API, building start states from Fixtures. Don't unit-test internal systems or rendering.
- Every new visual element gets a story backed by a Fixture.
- After changing rendering, run `pnpm shots` (with a filter if you can) and look at the screenshots, with and without the Debug overlay.
- For interactive debugging, open `pnpm storybook` or `pnpm dev` with the Chrome DevTools MCP tools.
- Before finishing a ticket, run `pnpm typecheck && pnpm lint && pnpm test`.
