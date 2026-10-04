# ADR-0001: Separate the Simulation from rendering

- Status: accepted
- Date: 2026-10-04

## Context

The game is built on Phaser 4. The idiomatic Phaser approach puts game logic inside Scenes and GameObjects. We will only ever render with Phaser, and the game logic will always run on the client — "server" in this project means data storage (levels, progress), not running the game.

So separation is **not** justified by swapping renderers or by server-side simulation. It is justified by two goals:

1. **Testability** — game rules should be verifiable with fast unit tests, without a browser.
2. **Agent-readable visuals** — an agent changing code should be able to build any moment of play from data (a Fixture), render it in Storybook, screenshot it, and line the picture up with the data and the test. That requires state that can be constructed directly instead of reached by playing the game.

## Decision

- The **Simulation** is pure TypeScript with a fixed 60 Hz tick and a seeded RNG. It must not import Phaser, rendering, scenes or services; ESLint enforces this.
- The Simulation exposes a serializable **SimState** snapshot and emits **SimEvents**. Rendering reads the snapshot each frame (diffing by entity id) and uses events for one-off effects.
- Player actions are method calls on the Simulation that return explicit success or failure reasons.
- Rendering is provided by a **Skin**; rendering never touches data services. Scenes wire Simulation, Skin and services together.

## Consequences

- Good: rules are unit-tested at a single seam (the Simulation API); Fixtures feed both tests and stories; reskinning touches only the view layer; screenshots are deterministic.
- Cost: an extra snapshot-to-view sync layer and its types.
- Cost: Phaser's physics, timers and tweens may be used only for presentation, never for rules. Tower defense needs little physics, so this is cheap.
- Revisit if: the snapshot sync becomes a measurable performance problem, or the project gains requirements this ADR assumed away.
