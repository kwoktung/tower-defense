# 06 — 溅射塔

**What to build:** 加入第二种塔，splash 溅射塔。它是青色六边形，命中时出现黄色爆炸圈，对爆炸半径内的所有敌人造成伤害。玩家可以在 HUD 上选择它。这张 ticket 也用来检验骨架的扩展性。

参考 spec：`../spec.md`，包括"Simulation"的溅射规则和数值表，以及"Further Notes"的扩展性标准。

**Blocked by:** 05 — 基础塔攻击、击杀奖励与胜利

**Status:** done

- [x] 单位目录加入 splash 塔（造价 80、射程 128、伤害 8、冷却 1.2s、子弹速度 320、溅射半径 48），schema 支持"溅射"攻击方式
- [x] 溅射子弹命中时，对命中点溅射半径内的所有敌人造成全额伤害；目标先死时，在目标最后已知的位置爆炸
- [x] HUD 出现第二个塔选择按钮
- [x] Polygon 皮肤：splash 塔是青色六边形；溅射爆炸是半透明黄色圆环，约 0.2s 淡出
- [x] 具名 Fixture：`splashHittingCluster`、`oneOfEachTower`
- [x] Story：Entities/Towers（splash 的各种状态）、Entities/Projectiles（溅射爆炸）、对应的 Scenarios
- [x] 测试（Seam 1）：溅射半径内外的伤害、目标先死时仍会爆炸
- [x] 扩展性检查：在 ticket 的评论里记录除"溅射规则"以外，加这种塔改动了哪些地方。如果超出了"配置、皮肤、story"三处，说明原因，或者提出一个 prefactor 建议

## Comments

- 2026-10-04 完成。
  - **验证**：
    - 43 个单元测试、25 个 story 冒烟测试全部通过。
    - 在 dev 里点"溅射塔"按钮选中，造塔扣 80 金币，开波后命中时出现半径 48 的溅射，控制台没有报错。
    - 看过 50 张截图。
  - **扩展性检查**：加这种塔具体改了这些地方：
    - **配置**：`content/units.json` 加了一项。
    - **皮肤**：六边形形状和颜色；`playEffect` 加了溅射爆炸圈，因为这是新攻击方式的表现。
    - **story 和 Fixture**：`splashHittingCluster`、`oneOfEachTower`，以及 Towers、Projectiles、Scenarios 下的几个 story。
    - **测试**：溅射规则的 3 个测试；另外，数据服务测试里"单位目录里有哪些塔"的断言写死了 kind 列表，需要同步更新。
    - **没有改动**：Simulation（溅射结算在 05 里已经是按攻击方式写的）、HUD（按钮从单位目录生成）、WorldRenderer、场景。
    - **结论**：符合"配置、皮肤、story 三处"的标准。唯一额外的改动是那条写死 kind 列表的测试断言。
    - **顺带做的 prefactor**：Towers 和 Enemies story 的 kind 下拉选项改为从单位目录读取。以后新增种类时，Controls 里会自动出现。
  - **和 ticket 不一致的地方**：
    - `SplashExplosion` 这个 story 通过 fixture story 的 `effects` 选项手动触发一次 `projectileHit` 事件，并暂停 tween，让爆炸停在第一帧。这样截图是稳定的。
  - **自己发现并修掉的问题**：溅射爆炸一开始画成了实心半透明圆盘，叠在红色敌人上看起来像橙色。现在改成以描边圆环为主、填充透明度只有 0.08，和 spec 的"半透明圆环"一致。
  - **数值观察（不是 bug）**：
    - 第 1 波 normal 的出怪间隔约 51 单位（0.8 秒 × 64/秒），大于溅射半径 48，所以第 1 波里溅射每次只能打到 1 个敌人。第 2 波间隔 44.8，能一次打到 2 个。
    - 如果希望溅射塔在早期就有价值，可以调大半径，或缩短第 1 波的出怪间隔。
