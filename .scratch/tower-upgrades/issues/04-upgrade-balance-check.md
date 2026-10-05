# 04 — 升级数值验证

**What to build:** 用 Fixture 和 Shots 时间线验证"铺塔"和"升级"两种花法都说得通，然后调整 `content/units.json` 里的升级数值。这张 ticket 的产出是调好的数值和一份记录，不是新功能。

参考 spec：`../spec.md` 的初始数值表；路线图的背景数据（整关总收入 344 金）见 `../../playability-roadmap/roadmap.md`。

**Blocked by:** 01 — Simulation：塔等级、升级与卖塔

**Status:** ready-for-agent

- [ ] 写一个对比测试或脚本：花费大致相同的金币，分别花在"多建同种塔"和"升级一座塔"上，用同一波敌人跑完，比较漏怪数和击杀耗时。basic、splash 各比一组（例如 3 座 Lv1 basic，共 150 金，对 1 座 Lv3 basic，共 160 金）
- [ ] 两种花法的差距在合理范围内：升级略优但不碾压。如果一边倒，调升级费用或属性，然后重跑
- [ ] 确认按调整后的数值，整关（344 金）能把至少一座塔升到 Lv3
- [ ] 为对比场景做具名 Fixture 和带 `parameters.shots.ticks` 的 Scenarios story，看时间线截图
- [ ] 在 ticket 评论里记录最终数值和对比结果；如果改了数值，同步更新 spec 里的数值表
