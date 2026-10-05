# 01 — 自动开波

**What to build:** 一波打完（全部出完、场上清空）后，开始 3 秒倒计时，到时自动开下一波；倒计时期间玩家可以点按钮立即开始。第 1 波仍然手动开。HUD 按钮显示"开始第 1 波 / 出怪中 / 下一波 N / 最后一波"。这张 ticket **不**放宽开波条件：场上有敌人时仍然不能开波，那是 02 的事。

参考 spec：`../spec.md` 的"关卡定义""Simulation 规则（自动开波倒计时、游戏状态、事件）""HUD""Debug overlay""Testing Decisions"。

**Blocked by:** None — can start immediately

**Status:** done

- [x] 关卡定义新增可选的自动开波倒计时秒数，默认 3；第 1 关不用改
- [x] 波次进度新增"距离自动开波还剩多少 tick"（没有倒计时时为 null）；Fixture builder 能构造倒计时中的状态
- [x] 规则：
  - 第 1 波之后，在"当前波出完、场上清空、还有下一波"三个条件同时满足的那个 tick 开始倒计时
  - 倒计时每 tick 减 1，到 0 时自动开波
  - 玩家在倒计时期间开波时，倒计时取消
  - 游戏结束时倒计时取消；最后一波之后没有倒计时
- [x] `waveStarted` 增加触发方式（玩家 / 自动）；`bonus` 字段先固定为 0，由 02 填上
- [x] 测试（通过公开接口，时长从关卡定义里读）：
  - 倒计时的开始时机和 tick 数，到 0 时自动开波
  - 第 1 波之前、最后一波之后都没有倒计时
  - 倒计时期间玩家开波
  - 游戏结束时倒计时取消
  - 关卡定义的默认值和自定义值
- [x] HUD：开波按钮按 spec 的状态表显示（这张 ticket 只做"开始第 1 波"、"出怪中"、"下一波 N"、"最后一波"四种；"提前开波"留给 02）。HUD 只读 Simulation 的状态和查询
- [x] Debug overlay：倒计时进行中时，显示剩余秒数
- [x] story：HUD 的四种按钮状态各一个（需要的话加具名 Fixture，例如 `waveCountdown`）
- [x] `pnpm balance`：现有的脚本打法在新规则下仍然全部 ok（这时还不存在提前叫波，脚本打法本来就要等场上清空才能开波）
- [x] `pnpm shots` 过滤相关 story，带和不带 Debug overlay 各看一遍

## Comments

- 2026-10-05 完成。
  - **验证**：
    - `pnpm typecheck`、`pnpm lint` 通过；`pnpm test` 共 161 个测试通过，其中新增 7 个 Auto start 规则测试。
    - `pnpm balance` 的验收标准仍然全部 ok。
    - 截图看过 `pnpm shots hud`，按钮的 4 种状态和 Debug overlay 的倒计时行都正常。
    - 用 Playwright 在 `pnpm dev` 里开第 1 波：约 13 秒时场上清空，按钮显示"下一波 3"；约 16 秒时第 2 波自动开始，全程没有点按钮，控制台没有报错。
  - **规则的时机**：
    - 倒计时在场上清空的那一 tick 设为"秒数 × 60"，之后每 tick 减 1，减到 0 的那一 tick 自动开波。`waveStarted` 和玩家开波一样，出怪从下一 tick 开始。
    - 倒计时在 Simulation 每 tick 的最后一步处理，排在胜负判定之后，所以最后一波打完会直接判胜，不会出现倒计时。
  - **和 ticket 不一致的地方**：
    - 场上还有敌人、当前波已出完时，这张 ticket 里按钮显示"清场后开波"（灰色）。02 会把它换成"提前开波 +X"。
    - 按钮状态的判断顺序是"最后一波"在"出怪中"之前。最后一波出怪时也显示"最后一波"，和 spec 的表一致。一开始顺序写反了，看截图时发现的。
    - Debug overlay 在顶栏下方加了一行 `wave 2/5  auto start 2.5s`。
    - builder 新增 `withAutoStartIn(ticks)`；新增具名 Fixture `waveSpawning`、`waveCountdown`，以及 HUD 的 Wave Spawning、Auto Start Countdown 两个 story。
