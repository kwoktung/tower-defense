# 04 — 补齐两处 story 规范：击杀圈和 Map

**What to build:** 让 story 目录完全符合 AGENTS.md 的约定："每个视觉元素都有由 Fixture 驱动的 story"，并且"事件驱动的视觉要通过 `effects` 在 story 里展示"。具体是两件事：
- 敌人被击杀时的扩散圆环，要能在 Storybook 和 Shots 里看到。
- Map story 改为通过 Fixture 构造，不再直接读取打包的配置。

同时修正击杀圈的取色：改为和敌人视图共用同一张"敌人种类 → 颜色"的表，未知种类使用兜底颜色。

来源：MVP 代码审查的 Standards 部分，两项硬性违规（击杀圈没有 story、Map story 没有走 Fixture），以及 Repeated Switches（击杀圈和敌人视图各写了一套按种类取色的逻辑）。

**Blocked by:** None — can start immediately

**Status:** done

- [x] 新增一个展示击杀圈的 story（放在 Entities 下合适的分组里），通过 `effects` 触发一次击杀事件，并冻结在第一帧。normal 和 fast 两种敌人的击杀圈都能看到
- [x] Polygon 皮肤里，敌人种类到颜色的对应关系只有一处定义，敌人视图和击杀圈都从这里取色。未知种类的击杀圈使用和敌人视图相同的兜底颜色
- [x] Map 的两个 story（空地图、Slot 悬停）通过 `emptyMap` Fixture 构造。story 的 id 和截图文件名不变
- [x] Shots 截图里能看到新的击杀圈 story（开 Debug 和不开各一张），Map 的截图和改动前一致
- [x] 所有测试通过，包括新 story 的冒烟测试

## Comments

- 2026-10-05 完成。
  - **改动**：
    - **击杀圈 story**：`Entities/Enemies` 下新增 `NormalKilled`、`FastKilled`、`UnknownKindKilled` 三个 story。
      - 每个 story 都是真实击杀：从 Fixture 出发（basic 塔放在 slot-3，旁边一个低血量敌人），用 Simulation 推进到出现 `enemyKilled` 事件，再渲染击杀后的状态（敌人已经消失）。这个击杀事件通过 `effects` 播放，冻结在第一帧。镜头对准 slot-3。
      - `UnknownKindKilled` 用同一次击杀，只把事件里的种类换成不存在的 `unknown`，用来展示兜底颜色。
    - **敌人取色只有一处**：Polygon 皮肤的 palette 新增 `enemyColor(kind)`。敌人视图和击杀圈都从这里取色，未知种类统一回退到 `enemyUnknown`。敌人视图里按种类区分的只剩形状轮廓。
    - **Map story 走 Fixture**：Map 的两个 story 改为用 `emptyMap` Fixture，通过 `mountFixtureStory` 渲染。传入 `selectedTower: null`，所以悬停时只高亮 Slot，不显示射程预览，和原来一致。删掉了用不到的 `level` 参数。story id 不变。
  - **和 ticket 不一致的地方**：击杀圈 story 没有放进 `Scenarios`，也没有新增具名 Fixture。击杀后的状态和事件要靠运行 Simulation 才能得到，这一步写成了 Enemies story 里的辅助函数 `killMoment`，它的起点仍然是 Fixture builder。另外，我有意没有改 `fixture-story`（比如加一个"按坐标聚焦"的选项），以免和并行进行的 02 冲突。
  - **验证**：
    - typecheck、lint 都通过；97 个测试全部通过，新增 3 个 story 冒烟测试。
    - 全量 Shots 生成 94 张。和改动前的全量 88 张逐一比较，**全部逐字节一致**，包括 Map 的 4 张和敌人视图的全部截图。新增的只有 6 张击杀圈截图。
    - 逐张看过新截图：normal 的击杀圈是 #dc2626，fast 是 #fb7185，unknown 是兜底色 #991b1b，都清晰可见。
