# 07 — 进度保存

**What to build:** 每局结束（胜或负）时，玩家在这一关的最好成绩通过 ProgressStore 保存下来，刷新页面后还在。本地实现用 localStorage，以后可以换成 server，调用方不用改。

参考 spec：`../spec.md`，"数据服务"一节。

**Blocked by:** 05 — 基础塔攻击、击杀奖励与胜利

**Status:** ready-for-agent

- [ ] ProgressStore 接口：按关卡 id 异步读取和保存进度（最好结果、最好结果时剩余的生命、更新时间）
- [ ] 本地实现用 localStorage，key 带前缀；只有新结果更好时才覆盖（胜比负好，结果相同时剩余生命多的更好）
- [ ] 组合根返回 ProgressStore；只有场景层使用它，Simulation 和渲染层不能接触
- [ ] Game 场景在游戏结束时保存进度；刷新页面后可以在 localStorage 里看到记录
- [ ] 测试（Seam 2，用内存版 localStorage）：没有记录时返回空、首次保存、更好的结果会覆盖、更差的结果不覆盖
