# 06 — 溅射塔

**What to build:** 加入第二种塔，splash 溅射塔。它是青色六边形，命中时出现黄色爆炸圈，对爆炸半径内的所有敌人造成伤害。玩家可以在 HUD 上选择它。这张 ticket 也用来检验骨架的扩展性。

参考 spec：`../spec.md`，包括"Simulation"的溅射规则和数值表，以及"Further Notes"的扩展性标准。

**Blocked by:** 05 — 基础塔攻击、击杀奖励与胜利

**Status:** ready-for-agent

- [ ] 单位目录加入 splash 塔（造价 80、射程 128、伤害 8、冷却 1.2s、子弹速度 320、溅射半径 48），schema 支持"溅射"攻击方式
- [ ] 溅射子弹命中时，对命中点溅射半径内的所有敌人造成全额伤害；目标先死时，在目标最后已知的位置爆炸
- [ ] HUD 出现第二个塔选择按钮
- [ ] Polygon 皮肤：splash 塔是青色六边形；溅射爆炸是半透明黄色圆环，约 0.2s 淡出
- [ ] 具名 Fixture：`splashHittingCluster`、`oneOfEachTower`
- [ ] Story：Entities/Towers（splash 的各种状态）、Entities/Projectiles（溅射爆炸）、对应的 Scenarios
- [ ] 测试（Seam 1）：溅射半径内外的伤害、目标先死时仍会爆炸
- [ ] 扩展性检查：在 ticket 的评论里记录除"溅射规则"以外，加这种塔改动了哪些地方。如果超出了"配置、皮肤、story"三处，说明原因，或者提出一个 prefactor 建议
