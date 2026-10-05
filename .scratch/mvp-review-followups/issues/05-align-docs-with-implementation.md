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

**Status:** ready-for-agent

- [ ] ADR-0001 不再声称 Simulation 使用带种子的 RNG，改为说明：SimState 里预留了 `rngState`，等第一条需要随机的规则出现时，再加入带种子的 RNG，并补上"不同种子结果不同"的测试
- [ ] CONTEXT.md 里 Seed 的定义改为如实描述现状：它是预留的，目前只用来初始化 `rngState`
- [ ] 在 MVP spec 的 Further Notes 里（或者在对应 ticket 的评论里）记录：Boot 只启动 Game，HUD 由 Game 在每次创建时启动，并说明原因
- [ ] 在固定步长循环的代码注释和 ADR-0001 里写明：每帧最多补 15 个 tick，超出部分丢弃，所以帧率低于约 4fps 时，游戏时间会比真实时间慢。这是为了防止后台标签页切回来时一次补跑大量 tick
- [ ] AGENTS.md 里注明 `?level` 和 `?debug` 只用于开发和调试，不属于玩家功能；选关仍在 MVP 范围之外
- [ ] 改动后再检查一遍：ADR、CONTEXT.md、AGENTS.md 里没有和代码不一致的描述
