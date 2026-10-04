# 03 — 敌人：开波、沿路径行进、漏怪与失败

**What to build:** 玩家点 HUD 上的"开始下一波"后，敌人按波次配置陆续出现，沿路径前进，漏过时扣生命。生命归零时游戏判负，显示失败浮层，可以点"重来"。两种敌人都用红色系多边形表示，头上有血条。开发者可以用 Fixture 直接构造"敌人即将漏过"这样的局面，用来测试，也用来在 story 里查看。

参考 spec：`../spec.md`，包括"Simulation"（规则和占位数值）、"Phaser 场景"（HUD 场景）、"Fixture 与可视化"几节。

**Blocked by:** 02 — 地图链路

**Status:** done

- [x] 单位目录 schema 加入敌人（normal、fast，字段按 spec 的数值表）。关卡配置加入 3 波的出怪组。加载时校验：波次引用的敌人 kind 必须在单位目录里存在
- [x] Simulation 以固定 60Hz 步长运行，随机数用带种子的 RNG。`advance(ticks)` 返回这段时间内产生的 SimEvent
- [x] `startNextWave` 按 spec 的开波条件返回成功或失败。开波后按出怪组的顺序和间隔出怪，新敌人从 pathT = 0 出发
- [x] 敌人每个 tick 按自己的速度前进。走到终点时扣漏怪伤害、敌人移除，并产生对应事件
- [x] 生命 ≤ 0 时立刻判负，之后 `advance` 不再改变状态
- [x] Game 场景用固定步长累加器驱动 Simulation；WorldRenderer 按实体 id 对比上一帧，负责新建、同步、销毁视图
- [x] Polygon 皮肤：normal 是正红菱形，fast 是亮玫红小三角形并朝向前进方向；头顶有绿色血条，掉血部分为深灰
- [x] HUD 场景和 Game 场景并行，全部用 Phaser 绘制，颜色和字体取自皮肤 token。显示生命和"第 n / N 波"；"开始下一波"按钮在不能开波时变灰
- [x] 判负时显示失败浮层，点"重来"后恢复成初始局面
- [x] Debug overlay 显示敌人的 id 和 hp/maxHp
- [x] Fixture builder 第一版：可以选关卡、设种子、在路径指定位置按指定间距放敌人。具名 Fixture 有 `oneOfEachEnemy` 和 `enemyLeaking`
- [x] Story：Entities/Enemies（满血、残血）、Scenarios（上面两个 Fixture 各一个）、HUD（正常、不能开波）、失败浮层
- [x] 测试（Seam 1）：开波条件的每一项、出怪数量和间隔、移动、漏怪扣生命、判负、结束后状态冻结

## Comments

- 2026-10-04 完成。
  - **验证**：
    - 22 个 Simulation 和服务的单元测试，11 个 story 冒烟测试，全部通过。
    - 在 dev 里实际操作过：开波后敌人每约 0.8 秒出现一个，速度 64/秒；改成 1 条命之后漏怪即判负，状态冻结；点"重来"回到初始状态，HUD 绑定新的 Simulation，还能再次开波。
  - **规则细节**：
    - 每个 tick 的顺序是：移动 → 出怪 → 判定。所以新出的敌人在出现的那个 tick 停在 pathT = 0。
    - 开波产生的 `waveStarted` 事件会在下一次 `advance` 时返回。
    - 两个出怪组之间的间隔，用的是前一组的间隔。
  - **和 spec 或 ticket 不一致的地方**：
    - **RNG**：现在的规则里没有任何随机，所以只在 SimState 里保存了 `rngState`（初始值是 seed），没有实现 RNG 函数。等第一条需要随机的规则出现时再加。
    - **结束浮层的位置**：放在了 HUD 里（HudScene / Storybook 的 HUD story），而不是 GameScene 里。这样浮层盖在 HUD 栏的上面，也能直接复用 HUD 的 story。
    - **`lost` Fixture 提前加了**：它原本计划在 08 加，因为失败浮层的 story 需要，所以提前了。
    - **`window.__GAME__`**：开发模式下把 game 实例挂到 `window.__GAME__`，方便 agent 调试。已写进 AGENTS.md。
  - **已知小问题**：敌人挤在一起时，Debug overlay 里的 `#id hp` 标签会相互重叠。不影响阅读单个敌人的信息，暂时不处理。
