# 01 — 护甲与护甲敌人

**What to build:** 敌人可以有护甲：每次命中按固定值减伤，最少造成原伤害的 20%。新增敌人种类 `armored`，它有自己的外形，Debug overlay 能显示护甲值。现有敌人默认护甲 0，玩法不变。

参考 spec：`../spec.md` 的"单位目录""Simulation 规则（护甲）""渲染与皮肤""Testing Decisions"。

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [ ] schema：敌人新增可选的 `armor`（≥ 0，默认 0）；`content/units.json` 加入 `armored`（护甲 6、血量 60、速度 48、击杀奖励 10、漏过扣 2 条命）
- [ ] 伤害结算：对每个受击敌人分别计算实际伤害 = max(伤害 − 护甲, 伤害 × 20%)，不取整；单体和溅射都适用；`enemyDamaged` 事件的伤害值是削减后的实际值
- [ ] 测试（通过公开 API，数值从单位目录读取）：
  - 护甲削减后的伤害
  - 伤害 ≤ 护甲时触发 20% 保底
  - 护甲为 0 的敌人不受影响
  - 溅射命中时，护甲敌人和普通敌人各自按自己的护甲扣血
- [ ] Polygon 皮肤：`armored` 是深红色、更大的八边形，外面一圈灰色护甲描边
- [ ] Polygon 皮肤：敌人 view 遇到不认识的敌人种类时，画回退外形并报 `console.error`（和塔一致）
- [ ] Debug overlay：护甲大于 0 的敌人，在标签里显示护甲值
- [ ] Fixture 与 story：
  - Entities/Enemies 加入 `armored`（kind 下拉框从单位目录读取，应该会自动出现；确认一下）
  - 具名 Fixture `armoredWave`：基础塔 Lv1 和 Lv3 面对一队护甲敌人
  - 对应的 Scenarios story，带 Shot 时间线
- [ ] `pnpm shots` 过滤相关 story，带和不带 Debug overlay 各看一遍
