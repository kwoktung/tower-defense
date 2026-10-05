# 02 — 减速塔与减速效果

**What to build:** 新增减速塔 `slow`（3 级）。塔的每一级都可以带一个"命中时附带的减速"，它和攻击方式（单体、溅射）互相独立。被减速的敌人走得更慢，并显示冰蓝色效果。多个减速不叠加：取最强的一个，并刷新持续时间。

参考 spec：`../spec.md` 的"单位目录""Simulation 规则（减速、不叠加、移动、数据结构）""渲染与皮肤""Testing Decisions"。

**Blocked by:** None — can start immediately（和 01 并行；如果 01 先合入，减速对护甲敌人的测试就加上）

**Status:** done

- [x] schema：塔的每一级新增可选的 `slow: { factor, durationSec }`，其中 factor 在 0 到 1 之间（不含两端）；`content/units.json` 按 spec 数值表加入 `slow` 塔
- [x] 敌人加一个可空的减速状态（比例、剩余 tick 数）；Fixture builder 能构造被减速的敌人
- [x] 命中时，对每个受击敌人施加减速（单体只作用于目标，溅射作用于范围内的所有敌人）；这次命中打死的敌人跳过；减速参数按子弹记录的开火等级查
- [x] 不叠加：新的比例 ≥ 当前比例时，替换并重置持续时间；更弱的忽略
- [x] 移动：每个 tick 前进"速度 × (1 − 当前减速比例)"；剩余 tick 每 tick 减 1，到 0 时清除
- [x] 测试（通过公开 API，数值从单位目录读取）：
  - 命中后变慢，持续时间到了恢复原速
  - 更强的替换、更弱的忽略、同样强的刷新时间
  - Lv3 的溅射对范围内所有敌人都施加减速
  - 子弹飞行途中塔被升级或卖掉，减速参数仍按开火等级计算
  - 命中打死敌人时不报错
  - 如果 01 已合入：对护甲敌人照样减速
- [x] Polygon 皮肤：
  - 减速塔是紫色或靛蓝色的菱形，按等级变化的规则和现有塔一致（ADR-0002）
  - 减速塔的子弹是淡蓝色
  - 敌人 view 根据快照里的减速状态，画出或隐藏冰蓝色效果
- [x] 塔面板：有减速的塔多一行"减速 40% · 2秒"，并显示下一级的值
- [x] Debug overlay：被减速的敌人显示剩余减速秒数
- [x] Fixture 与 story：
  - 减速塔各等级（自动出现在"所有塔种 × 所有等级"验收页，确认一下）
  - 被减速的敌人
  - 减速塔面板
  - 具名 Fixture `slowingFastEnemies` 和对应的 Scenarios story，带 Shot 时间线
- [x] `pnpm shots` 过滤相关 story，带和不带 Debug overlay 各看一遍

## Comments

- 2026-10-05 完成。
  - **验证**：
    - `pnpm typecheck`、`pnpm lint` 通过；`pnpm test` 共 152 个测试通过，其中新增 7 个减速规则测试。
    - 截图看过 `pnpm shots slow`（Enemies/Normal Slowed、Armored Slowed，Scenarios/Slowing Fast Enemies 的时间线，Tower panel/Slow Tower），以及 All Tower Levels，带和不带 Debug overlay 都看过。
    - 用 Playwright 在 `pnpm dev` 里点"减速塔"建在 slot-3，开第 1 波：最前面的敌人出现冰蓝色环，后面的敌人追上了它，控制台没有报错。
  - **规则细节**：
    - 命中发生在敌人移动之前，所以命中那一 tick 敌人已经按减速走了一步，命中后剩余 tick 数是"持续时间 − 1"。整个减速正好持续 durationSec × 60 个移动 tick。
    - 伤害结算现在会返回"敌人是否活着"，被打死的敌人不再施加减速。
  - **和 ticket 不一致的地方**：
    - **All Tower Levels 并不会自动出现新塔种。** 原来的 Fixture 是手写塔种的，所以改成从单位目录生成：每种塔一行 Slot，从左到右依次是各个等级。以后塔种或等级超出预留的 Slot 时，会抛出一条写清楚该怎么做的错误。为此 `ScenarioBuilder.units` 改成了公开的只读字段。
    - **面板**：如果某个属性当前等级没有、下一级才有（例如减速塔 Lv2 → Lv3 才有溅射），现在也会显示一行"— → 40"。
    - **子弹颜色**：按塔种区分，减速塔的子弹是淡蓝色，其他塔仍是默认的黄色。
    - **建造栏**：HUD 自动出现第三个按钮"减速塔 60"，不需要改代码。
  - **数值**：初始数值按 spec。减速塔的子弹速度 spec 里没有写，取 400。
