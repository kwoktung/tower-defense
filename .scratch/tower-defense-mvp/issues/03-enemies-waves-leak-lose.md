# 03 — 敌人：开波、沿路径行进、漏怪与失败

**What to build:** 玩家点 HUD 上的"开始下一波"后，敌人按波次配置陆续出现，沿路径前进，漏过时扣生命。生命归零时游戏判负，显示失败浮层，可以点"重来"。两种敌人都用红色系多边形表示，头上有血条。开发者可以用 Fixture 直接构造"敌人即将漏过"这样的局面，用来测试，也用来在 story 里查看。

参考 spec：`../spec.md`，包括"Simulation"（规则和占位数值）、"Phaser 场景"（HUD 场景）、"Fixture 与可视化"几节。

**Blocked by:** 02 — 地图链路

**Status:** ready-for-agent

- [ ] 单位目录 schema 加入敌人（normal、fast，字段按 spec 的数值表）。关卡配置加入 3 波的出怪组。加载时校验：波次引用的敌人 kind 必须在单位目录里存在
- [ ] Simulation 以固定 60Hz 步长运行，随机数用带种子的 RNG。`advance(ticks)` 返回这段时间内产生的 SimEvent
- [ ] `startNextWave` 按 spec 的开波条件返回成功或失败。开波后按出怪组的顺序和间隔出怪，新敌人从 pathT = 0 出发
- [ ] 敌人每个 tick 按自己的速度前进。走到终点时扣漏怪伤害、敌人移除，并产生对应事件
- [ ] 生命 ≤ 0 时立刻判负，之后 `advance` 不再改变状态
- [ ] Game 场景用固定步长累加器驱动 Simulation；WorldRenderer 按实体 id 对比上一帧，负责新建、同步、销毁视图
- [ ] Polygon 皮肤：normal 是正红菱形，fast 是亮玫红小三角形并朝向前进方向；头顶有绿色血条，掉血部分为深灰
- [ ] HUD 场景和 Game 场景并行，全部用 Phaser 绘制，颜色和字体取自皮肤 token。显示生命和"第 n / N 波"；"开始下一波"按钮在不能开波时变灰
- [ ] 判负时显示失败浮层，点"重来"后恢复成初始局面
- [ ] Debug overlay 显示敌人的 id 和 hp/maxHp
- [ ] Fixture builder 第一版：可以选关卡、设种子、在路径指定位置按指定间距放敌人。具名 Fixture 有 `oneOfEachEnemy` 和 `enemyLeaking`
- [ ] Story：Entities/Enemies（满血、残血）、Scenarios（上面两个 Fixture 各一个）、HUD（正常、不能开波）、失败浮层
- [ ] 测试（Seam 1）：开波条件的每一项、出怪数量和间隔、移动、漏怪扣生命、判负、结束后状态冻结
