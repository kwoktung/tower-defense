# 04 — 升级数值验证

**What to build:** 用 Fixture 和 Shots 时间线验证"铺塔"和"升级"两种花法都说得通，然后调整 `content/units.json` 里的升级数值。这张 ticket 的产出是调好的数值和一份记录，不是新功能。

参考 spec：`../spec.md` 的初始数值表；路线图的背景数据（整关总收入 344 金）见 `../../playability-roadmap/roadmap.md`。

**Blocked by:** 01 — Simulation：塔等级、升级与卖塔

**Status:** done

- [x] 写一个对比测试或脚本：花费大致相同的金币，分别花在"多建同种塔"和"升级一座塔"上，用同一波敌人跑完，比较漏怪数和击杀耗时。basic、splash 各比一组（例如 3 座 Lv1 basic，共 150 金，对 1 座 Lv3 basic，共 160 金）
- [x] 两种花法的差距在合理范围内：升级略优但不碾压。如果一边倒，调升级费用或属性，然后重跑
- [x] 确认按调整后的数值，整关（344 金）能把至少一座塔升到 Lv3
- [x] 为对比场景做具名 Fixture 和带 `parameters.shots.ticks` 的 Scenarios story，看时间线截图
- [x] 在 ticket 评论里记录最终数值和对比结果；如果改了数值，同步更新 spec 里的数值表

## Comments

- 2026-10-05 完成。
  - **方法**：`pnpm balance`（`src/sim/balance.test.ts`，平时的 `pnpm test` 会跳过它，单独运行约 20 秒）。
    - 用 4 种加压波次比较漏怪数：40 只 normal、40 只 fast，以及更密的 60 只 normal、60 只 fast。
    - 每种配置取**最佳摆放位置**：1 座塔试所有 Slot，2 座或 3 座塔试所有组合。手选位置的结果对 Slot 很敏感，不公平。
    - 再用脚本策略玩一遍第 1 关。
  - **原数值的问题**：
    - **basic Lv2 太弱**（漏怪 50，2 座 Lv1 只漏 19）。伤害 17 低于 fast 的 20 血，打一只 fast 仍要两枪，升级等于白花钱。
    - **splash Lv3 碾压**（漏怪 0，3 座 Lv1 漏 9 到 12）。伤害 24 把打死 normal 需要的次数从 5 次降到 2 次，打 fast 只要 1 次。
  - **调整**：
    - basic Lv2：伤害 17 → 20，冷却 0.45 → 0.5。
    - splash Lv2：伤害 14 不变，溅射半径 56 → 48。
    - splash Lv3：伤害 24 → 20，冷却 1.1 → 1.2，射程 144 → 136，溅射半径 64 → 50。
    - 没有采用"让 splash Lv3 射速变慢"的方案。它在数值上也平衡，但面板上会显示"射速下降"，很别扭。现在所有属性随等级只升不降（有几项持平）。
  - **结果**（漏怪数，越少越好）：

    | 波次 | basic 2×Lv1 vs 1×Lv2 | basic 3×Lv1 vs 1×Lv3 | splash 2×Lv1 vs 1×Lv2 | splash 3×Lv1 vs 1×Lv3 |
    |---|---|---|---|---|
    | 加压 | 19 vs 9 | 0 vs 0 | 56 vs 62 | 9 vs 7 |
    | 更密 | 79 vs 70 | 35 vs 34 | 64 vs 60 | 12 vs 4 |

    升级大致相当或略好。basic Lv2 在加压波次里优势稍大（单塔放在最佳 Slot，能同时覆盖两段路）；splash Lv3 在敌人非常密的波次里优势明显。这些都在"略优但不碾压"的范围内，可以接受。
  - **整关检查**：只建 1 座基础塔、然后一直升级，就能把它升到 Lv3 并满血通关，满足"整关 344 金能升出至少一座 Lv3"。
  - **story**：新增具名 Fixture `spentOnTowers`、`spentOnUpgrade`，以及对应的 Scenarios story（Shot 时间线：0、120、300、600 tick）。到第 600 tick，两边累计金币 154 对 148，过程几乎一样。
  - **发现（不在本 ticket 范围内）**：
    - 第 1 关太简单，"铺塔还是升级"不影响胜负。
    - 只用溅射塔的话第 1 波就守不住。
    - 两条都已记到 `../../playability-roadmap/roadmap.md`。
