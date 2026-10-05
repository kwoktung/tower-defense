# 05 — 文档与实现对齐

**What to build:** 让读文档的人（包括 agent）看到的就是代码实际的样子：
- RNG 只是预留，现在的规则里没有随机数。
- HUD 是由 Game 场景启动的，不是 Boot 启动的。
- 固定步长循环每帧最多补 15 个 tick，帧率极低时游戏会变慢。
- `?level` 和 `?debug` 只是开发辅助功能，不代表要做选关。

这一张只改文档和注释，不改行为。

来源：MVP 代码审查的 Spec 部分：
- (a) RNG 没有实现，但 ADR-0001 和 CONTEXT.md 写成了已经实现；
- (a) Boot 启动 HUD 的偏差没有记录；
- (c) 每帧最多补 15 个 tick 的上限没有写明；
- (b) `?level` 碰到了 Out of Scope 里的"选关、多关卡"。

**Blocked by:** None — can start immediately

**Status:** done

- [x] ADR-0001 不再声称 Simulation 使用带种子的 RNG，改为说明：SimState 里预留了 `rngState`，等第一条需要随机的规则出现时，再加入带种子的 RNG，并补上"不同种子结果不同"的测试
- [x] CONTEXT.md 里 Seed 的定义改为如实描述现状：它是预留的，目前只用来初始化 `rngState`
- [x] 在 MVP spec 的 Further Notes 里（或者在对应 ticket 的评论里）记录：Boot 只启动 Game，HUD 由 Game 在每次创建时启动，并说明原因
- [x] 在固定步长循环的代码注释和 ADR-0001 里写明：每帧最多补 15 个 tick，超出部分丢弃，所以帧率低于约 4fps 时，游戏时间会比真实时间慢。这是为了防止后台标签页切回来时一次补跑大量 tick
- [x] AGENTS.md 里注明 `?level` 和 `?debug` 只用于开发和调试，不属于玩家功能；选关仍在 MVP 范围之外
- [x] 改动后再检查一遍：ADR、CONTEXT.md、AGENTS.md 里没有和代码不一致的描述

## Comments

- 2026-10-05 完成。只改了文档和一处代码注释，行为没有变化。typecheck、lint 通过，94 个测试全部通过。
  - **`docs/adr/0001-sim-render-separation.md`**：
    - 删掉了"Simulation 使用带种子的 RNG"的说法，改为：`rngState` 是预留的，由 seed 初始化，目前没有任何规则读取它；第一条随机规则出现时，再加入 RNG，并补上"不同种子结果不同"的测试。
    - 新增固定步长累加器的说明：每帧最多补 15 个 tick，超出部分丢弃，所以低于约 4fps 时游戏时间比真实时间慢；结果只取决于 tick 数，因此仍然是确定性的。
    - 自查时额外修正了一处：原文写"玩家操作都返回明确的成功或失败原因"，但 `startNextWave` 只返回布尔值。改为分别说明 `placeTower` 和 `startNextWave` 的返回值，并列出只读查询 `canPlaceTower`、`canAfford`、`isSlotFree`、`canStartNextWave`。
  - **`CONTEXT.md`**：
    - Seed：改为如实描述，它目前只用来初始化预留的 `rngState`，不影响游戏过程。
    - 自查时额外修正了 4 处：
      - Skin：补上"播放一次性 Effect"。
      - WorldRenderer：原文写"把 SimEvent 转发给视图"，改为如实描述：只有开火、受击两类事件转给对应实体的视图，其余事件交给 Skin 作为 Effect 处理。
      - HUD：补上结束浮层，并说明 HUD 由 Game 场景在每次启动时（包括"重来"）拉起。
      - Fixture：补上它也包含 seed。
  - **`src/game-loop.ts`**：`MAX_TICKS_PER_FRAME` 的注释写明了 15 tick ≈ 250ms 的上限、超出部分被丢弃、低于约 4fps 会变慢，并指向 ADR-0001。
  - **`AGENTS.md`**：`pnpm dev` 那一行注明 URL 参数只用于开发；另外新增一段，说明 `?skin`、`?debug`、`?level` 都是开发和调试辅助，选关仍不在 MVP 范围内，不要基于 `?level` 做界面。
  - **`.scratch/tower-defense-mvp/spec.md` 的 Further Notes**：记录了 Boot 只启动 Game、HUD 由 Game 在每次创建时通过 `launch` 启动这一差异，以及原因；并引用 ticket 03 说明结束浮层放在 HUD 里。
