# 08 — Scenario 播放控制、多 tick 截图与收尾

**What to build:** Scenario story 不只显示静态画面，还可以播放、调整速度、先快进 N 个 tick 再显示。agent 可以对同一个局面在多个时间点截图，观察局面怎么变化。补齐剩下的具名 Fixture 和 story，然后对照 spec 的验收标准逐条检查。

参考 spec：`../spec.md`，"Fixture 与可视化"和"Testing Decisions"两节。

**Blocked by:** 06 — 溅射塔

**Status:** done

- [x] Scenario story 增加 `running`、`speed`、`advanceTicks` 三个 Controls；默认是静态画面；`advanceTicks > 0` 时，先快进再画第一帧
- [x] story 可以在参数里声明截图用的 tick 列表，shots 命令按每个 tick 各拍一组（有 Debug 和无 Debug 两张），文件名里带 tick 数
- [x] 补齐具名 Fixture：`emptyMap`、`finalWave`、`lost`，确保 spec 列出的 Fixture 全部存在，每个都有对应的 Scenario story
- [x] Story：HUD（最后一波）、Game/Playable（完整可玩的游戏，使用本地服务）
- [x] 至少有两个 Scenario（比如 `splashHittingCluster` 和 `enemyLeaking`）声明了多个截图 tick
- [x] 全部 story 通过冒烟测试；全部 Seam 1 和 Seam 2 的测试通过；lint 通过
- [x] 逐条检查 spec 的验收要求（WebGL 不泄漏、配色和 spec 一致、Debug overlay 截图上能看到射程、id、hp、拐点、Slot 坐标），把检查结果写到本 ticket 的评论里
- [x] AGENTS.md 的开发命令和工作约定都是最新的

## Comments

- 2026-10-04 完成。
  - **新增内容**：
    - Scenario story 的 `running`、`speed`、`advanceTicks` 三个控件。
    - story 可以在 `parameters.shots.ticks` 里声明一组 tick 数，截图脚本按每个 tick 生成 `--t<ticks>` 截图（开和不开 Debug 各一张）。
    - 新的具名 Fixture `finalWave`，以及 builder 的 `withSpawning`。
    - 10 个具名 Fixture 每个都有对应的 Scenario story。
    - `HUD/FinalWave` 和 `Game/Playable` 两个 story。挂载辅助函数拆出了 `mountPhaserGame(scenes, isReady)`，用来挂载多场景的完整游戏。
  - **对照 spec 的验收检查**：
    - **测试**：86 个全部通过，其中 52 个单元测试（Seam 1 和 Seam 2）、34 个 story 冒烟测试。typecheck、lint、生产构建都通过。
    - **WebGL 不泄漏**：在 Storybook 里依次真实切换 32 次 story，包括多场景的 `Game/Playable`、开着 `running` 4 倍速运行的 Scenario、带冻结特效的 story，每次都渲染完成，始终只有 1 个 canvas，没有警告。
    - **配色**：palette 里的值逐项对照 spec 的表格，全部一致。敌人是红色系（#dc2626 / #fb7185），塔是冷色系（#3b82f6 / #06b6d4），调试层是 #22d3ee。
    - **Debug overlay**：截图里能看到射程圈、目标连线、塔、敌人和子弹的 id、hp、路径拐点编号、Slot id 和坐标（参见 `scenarios--final-wave--debug.png`）。
    - **Fixture**：spec 列出的 10 个具名 Fixture 全部存在，并且都有 Scenario story。
    - **Story 目录**：spec 列出的都已覆盖。其中"敌人受击"和"塔开火"原本缺少画面，本 ticket 用 `effects` 选项补上：受击闪白和开火放大会停在第一帧。
    - **截图**：88 张全部成功，耗时约 1 分钟。
    - **扩展性**：已在 06 中验证。
    - **AGENTS.md、CONTEXT.md 已更新**：截图命名规则、Scenario 控件、`effects` 的用法；术语表新增 Effect、UI state、Shot timeline。
    - **分层**：Simulation、配置、服务层都没有引入 phaser。lint 规则沿用 01 的配置，没有改动。
  - **实际操作验证**：以 2 倍速运行"敌人即将漏过"的 Scenario，2.5 秒内 3 个敌人全部漏过，生命 3 → 0，失败浮层出现。
  - **和 ticket 不一致的地方**：
    - 截图脚本是在 story 加载后读取 `window.__STORY_SHOTS__` 来获取 tick 列表的（由 `.storybook/preview` 的 `beforeEach` 发布），因为 Storybook 的 `index.json` 里不包含 parameters。
  - **留给以后的问题**（不在 MVP 范围内）：
    - 敌人挤在一起时，Debug 标签会互相重叠。
    - 目前偏简单：见 05 的通关检查，以及 06 的溅射半径观察。
    - 结束浮层上还没有显示历史最佳成绩。
    - 完整截图约 1 分钟；以后 story 多了，可以考虑并行截图。
