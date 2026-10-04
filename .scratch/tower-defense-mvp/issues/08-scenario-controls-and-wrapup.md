# 08 — Scenario 播放控制、多 tick 截图与收尾

**What to build:** Scenario story 不只显示静态画面，还可以播放、调整速度、先快进 N 个 tick 再显示。agent 可以对同一个局面在多个时间点截图，观察局面怎么变化。补齐剩下的具名 Fixture 和 story，然后对照 spec 的验收标准逐条检查。

参考 spec：`../spec.md`，"Fixture 与可视化"和"Testing Decisions"两节。

**Blocked by:** 06 — 溅射塔

**Status:** ready-for-agent

- [ ] Scenario story 增加 `running`、`speed`、`advanceTicks` 三个 Controls；默认是静态画面；`advanceTicks > 0` 时，先快进再画第一帧
- [ ] story 可以在参数里声明截图用的 tick 列表，shots 命令按每个 tick 各拍一组（有 Debug 和无 Debug 两张），文件名里带 tick 数
- [ ] 补齐具名 Fixture：`emptyMap`、`finalWave`、`lost`，确保 spec 列出的 Fixture 全部存在，每个都有对应的 Scenario story
- [ ] Story：HUD（最后一波）、Game/Playable（完整可玩的游戏，使用本地服务）
- [ ] 至少有两个 Scenario（比如 `splashHittingCluster` 和 `enemyLeaking`）声明了多个截图 tick
- [ ] 全部 story 通过冒烟测试；全部 Seam 1 和 Seam 2 的测试通过；lint 通过
- [ ] 逐条检查 spec 的验收要求（WebGL 不泄漏、配色和 spec 一致、Debug overlay 截图上能看到射程、id、hp、拐点、Slot 坐标），把检查结果写到本 ticket 的评论里
- [ ] AGENTS.md 的开发命令和工作约定都是最新的
