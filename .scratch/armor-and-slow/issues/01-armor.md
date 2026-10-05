# 01 — 护甲与护甲敌人

**What to build:** 敌人可以有护甲：每次命中按固定值减伤，最少造成原伤害的 20%。新增敌人种类 `armored`，它有自己的外形，Debug overlay 能显示护甲值。现有敌人默认护甲 0，玩法不变。

参考 spec：`../spec.md` 的"单位目录""Simulation 规则（护甲）""渲染与皮肤""Testing Decisions"。

**Blocked by:** None — can start immediately

**Status:** done

- [x] schema：敌人新增可选的 `armor`（≥ 0，默认 0）；`content/units.json` 加入 `armored`（护甲 6、血量 60、速度 48、击杀奖励 10、漏过扣 2 条命）
- [x] 伤害结算：对每个受击敌人分别计算实际伤害 = max(伤害 − 护甲, 伤害 × 20%)，不取整；单体和溅射都适用；`enemyDamaged` 事件的伤害值是削减后的实际值
- [x] 测试（通过公开 API，数值从单位目录读取）：
  - 护甲削减后的伤害
  - 伤害 ≤ 护甲时触发 20% 保底
  - 护甲为 0 的敌人不受影响
  - 溅射命中时，护甲敌人和普通敌人各自按自己的护甲扣血
- [x] Polygon 皮肤：`armored` 是深红色、更大的八边形，外面一圈灰色护甲描边
- [x] Polygon 皮肤：敌人 view 遇到不认识的敌人种类时，画回退外形并报 `console.error`（和塔一致）
- [x] Debug overlay：护甲大于 0 的敌人，在标签里显示护甲值
- [x] Fixture 与 story：
  - Entities/Enemies 加入 `armored`（kind 下拉框从单位目录读取，应该会自动出现；确认一下）
  - 具名 Fixture `armoredWave`：基础塔 Lv1 和 Lv3 面对一队护甲敌人
  - 对应的 Scenarios story，带 Shot 时间线
- [x] `pnpm shots` 过滤相关 story，带和不带 Debug overlay 各看一遍

## Comments

- 2026-10-05 完成。
  - **验证**：`pnpm typecheck`、`pnpm lint` 通过；`pnpm test` 共 141 个测试通过，其中新增 4 个护甲规则测试。截图看过 `pnpm shots armored`（Enemies/Armored、Armored Hit，以及 Scenarios/Armored Wave 的时间线），带和不带 Debug overlay 都看过。
    - Armored Wave 的时间线：到第 1100 tick，Lv1 塔只把护甲敌人打到 28/60；Lv3 塔把剩下的清掉，第 1500 tick 判胜。
  - **实现**：
    - 减伤公式 `max(伤害 − 护甲, 伤害 × 20%)` 只写在 Simulation 的子弹结算里，是私有函数，只通过公开 API 测试。
    - schema 里 `armor` 默认为 0。
  - **和 ticket 不一致的地方**：
    - Debug overlay 里护甲写成 `armor 6`（英文），和其他调试标签的风格一致。
    - 未知敌人种类的回退颜色从 `#991b1b` 改成更暗的 `#7f1d1d`，好把 `armored` 的颜色让出来。这会改变 Enemies/Unknown Kind Killed 截图里光环的颜色。
  - **顺带改的测试**：数据服务测试里写死的"敌人种类列表""塔种列表""第 1 关波数"，改成和打包的 JSON 文件比较。原因是 tower-defense-mvp 06 号工单记录过这里会挡住新增内容；这次 02（加 `slow` 塔）和 03（改波数）都会撞上它。
