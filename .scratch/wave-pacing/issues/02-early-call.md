# 02 — 提前叫波

**What to build:** 当前波全部出完后，即使场上还有敌人，也能提前叫下一波，奖励 = 场上存活敌人数 × 每只奖励（关卡定义，默认 1）。HUD 按钮显示"提前开波 +X"；拿到奖励时，金币数旁边飘出"+X"。

参考 spec：`../spec.md` 的"关卡定义""Simulation 规则（能不能开下一波、提前叫波、公开接口、事件）""HUD""Testing Decisions"。

**Blocked by:** 01 — 自动开波

**Status:** done

- [x] 关卡定义新增可选的每只存活敌人的奖励金币，默认 1
- [x] 能开下一波的条件放宽：游戏进行中、当前波已全部出完、还有下一波（不再要求场上没有敌人）
- [x] `startNextWave()` 成功时返回本次奖励，并把奖励加到金币上；`waveStarted.bonus` 填入实际奖励
- [x] 新增只读查询"现在叫下一波能拿多少奖励"，不能开波时返回 0
- [x] 测试（通过公开接口，系数从关卡定义里读）：
  - 出怪中不能开波；出完后场上有敌人也能开波
  - 奖励金额正确，金币立即增加；奖励只读查询和实际奖励一致
  - 倒计时期间开波没有奖励
  - 把现有的"场上有敌人时不能开波"测试改成表达新规则
- [x] HUD：
  - 按钮在"出怪完毕、场上还有敌人"时显示"提前开波 +X"，用金币色
  - 由 `waveStarted` 的奖励触发，在金币数旁边飘出"+X"，约 0.6 秒后淡出，只用 Theme tokens
- [x] story：
  - "提前开波 +X"按钮状态
  - 金币飘字，用 `effects` 冻结在第一帧
  - 具名 Fixture `earlyCallReady`：当前波刚出完、场上还有一群敌人；以及对应的 Scenarios story，带 Shot 时间线
- [x] `pnpm balance`：现有脚本打法要显式等场上清空再开波，保持原来的含义（否则在新规则下它们会变成每次都提前叫波）；确认验收标准仍然全部 ok
- [x] `pnpm shots` 过滤相关 story，带和不带 Debug overlay 各看一遍

## Comments

- 2026-10-05 完成。
  - **验证**：
    - `pnpm typecheck`、`pnpm lint` 通过；`pnpm test` 共 169 个测试通过，其中新增 6 个 Early call 规则测试。
    - `pnpm balance` 的验收标准仍然全部 ok。
    - 截图看过 `pnpm shots early-call`：HUD/Early Call、Early Call Bonus（金币飘字冻结在第一帧），以及 Scenarios/Early Call Ready 的时间线。
    - 用 Playwright 在 `pnpm dev` 里操作：第 1 波出完后，场上有 8 只敌人，点"提前开波"，金币 40 → 48，金币旁边飘出"+8"，第 2 波开始出怪，控制台没有报错。
  - **接口**：
    - `startNextWave()` 成功时返回 `{ ok: true, bonus }`，失败时返回 `{ ok: false }`，和 `placeTower` 的写法一致。
    - 新增 `nextWaveBonus()`。
    - 奖励 = floor(存活敌人数 × 系数)，所以系数可以是小数，留给 03 号工单调。
  - **自动开波**：倒计时的开始条件现在显式要求"场上清空"。开波条件放宽后，不能再直接用"能不能开下一波"来判断。
  - **HUD 的事件通路**：
    - 金币飘字需要 SimEvent，但只有 Game 场景拿得到。现在 Game 场景每局新建一个 EventEmitter，通过 `HudSceneData.simEvents` 交给 HUD 场景；每帧有事件时就把它们发出去，HUD 调 `hud.playEvents(events)`。
    - 每局都是新的 emitter，所以重开游戏后，HUD 不会收到旧 Simulation 的事件。
  - **顺带修的问题**：story 里冻结 tween 的时机原来在 HUD 创建之前，HUD 后来加的 tween（金币飘字）不会被冻结。现在改到 HUD 播放完 effects 之后再冻结。running 的 story 改为把每个 tick 的事件交给 HUD。
  - **`pnpm balance`**：脚本打法改为"只在场上清空时开波"，加了注释，保持它们原来的含义（不提前叫波）。
  - **观察（不是 bug）**：当前波出完的那一帧，按钮从"出怪中"变成"提前开波"。如果玩家正好在同一瞬间点击，这次点击不算。这和其他按钮的禁用行为一致。
