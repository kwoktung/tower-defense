# 07 — 进度保存

**What to build:** 每局结束（胜或负）时，玩家在这一关的最好成绩通过 ProgressStore 保存下来，刷新页面后还在。本地实现用 localStorage，以后可以换成 server，调用方不用改。

参考 spec：`../spec.md`，"数据服务"一节。

**Blocked by:** 05 — 基础塔攻击、击杀奖励与胜利

**Status:** done

- [x] ProgressStore 接口：按关卡 id 异步读取和保存进度（最好结果、最好结果时剩余的生命、更新时间）
- [x] 本地实现用 localStorage，key 带前缀；只有新结果更好时才覆盖（胜比负好，结果相同时剩余生命多的更好）
- [x] 组合根返回 ProgressStore；只有场景层使用它，Simulation 和渲染层不能接触
- [x] Game 场景在游戏结束时保存进度；刷新页面后可以在 localStorage 里看到记录
- [x] 测试（Seam 2，用内存版 localStorage）：没有记录时返回空、首次保存、更好的结果会覆盖、更差的结果不覆盖

## Comments

- 2026-10-04 完成。
  - **验证**：
    - 52 个单元测试（ProgressStore 新增 9 个）和 25 个 story 冒烟测试全部通过。
    - 在隔离的浏览器上下文里依次操作：输一局后记录为失败；赢一局后被覆盖为胜利、剩 10 条命；再输一局时没有覆盖；刷新页面后记录仍在；控制台没有报错。
  - **和 spec 不一致的地方**：
    - **`save` 的参数**：改为接收 `GameResult`（结果和剩余生命），`updatedAt` 由存储层生成，调用方不用自己传时间。
    - **`save` 的返回值**：会返回保存之后实际存着的记录，而不是 `void`。以后结束浮层想显示"最佳成绩"时可以直接用。
    - **存储可以注入**：`ServicesEnv` 增加了可选的 `storage`，测试里传内存实现。默认使用浏览器的 localStorage，但要到第一次读写时才去访问它，因为在 Node 里直接读 `globalThis.localStorage` 会打出一条 ExperimentalWarning，而且拿到的是 undefined。
    - **损坏的记录按"没有记录"处理**：比如 JSON 解析失败，下次保存时会被覆盖。
  - **没有做的**：结束浮层上还没有显示历史最佳成绩，这不在本 ticket 的验收范围内。
