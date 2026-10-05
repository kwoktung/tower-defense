# 04 — 补齐两处 story 规范：击杀圈和 Map

**What to build:** 让 story 目录完全符合 AGENTS.md 的约定："每个视觉元素都有由 Fixture 驱动的 story"，并且"事件驱动的视觉要通过 `effects` 在 story 里展示"。具体是两件事：
- 敌人被击杀时的扩散圆环，要能在 Storybook 和 Shots 里看到。
- Map story 改为通过 Fixture 构造，不再直接读取打包的配置。

同时修正击杀圈的取色：改为和敌人视图共用同一张"敌人种类 → 颜色"的表，未知种类使用兜底颜色。

来源：MVP 代码审查的 Standards 部分，两项硬性违规（击杀圈没有 story、Map story 没有走 Fixture），以及 Repeated Switches（击杀圈和敌人视图各写了一套按种类取色的逻辑）。

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [ ] 新增一个展示击杀圈的 story（放在 Entities 下合适的分组里），通过 `effects` 触发一次击杀事件，并冻结在第一帧。normal 和 fast 两种敌人的击杀圈都能看到
- [ ] Polygon 皮肤里，敌人种类到颜色的对应关系只有一处定义，敌人视图和击杀圈都从这里取色。未知种类的击杀圈使用和敌人视图相同的兜底颜色
- [ ] Map 的两个 story（空地图、Slot 悬停）通过 `emptyMap` Fixture 构造。story 的 id 和截图文件名不变
- [ ] Shots 截图里能看到新的击杀圈 story（开 Debug 和不开各一张），Map 的截图和改动前一致
- [ ] 所有测试通过，包括新 story 的冒烟测试
