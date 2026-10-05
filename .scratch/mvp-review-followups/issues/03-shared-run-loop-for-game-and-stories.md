# 03 — Game 场景和 Scenario story 共用同一套运行逻辑

**What to build:** 游戏和运行中的 Scenario story 驱动画面的方式完全相同：同一段"推进 Simulation → 渲染世界 → 同步 Debug overlay"的每帧逻辑；同一个"默认选中第一种塔"的规则；同一套悬停射程预览。这样以后改运行方式时只需要改一处，Storybook 里看到的行为也和游戏保证一致。Fixture story 的选项按职责拆分，不再一个对象里同时塞进 HUD、悬停、聚焦、特效和运行控制。

来源：MVP 代码审查的 Standards 部分（每帧循环、默认选中的塔、射程预览各重复两处；`FixtureStoryOptions` 有 Divergent Change 的问题）。

**Blocked by:** 01 — 建造规则只放在 Simulation 里；02 — 统一几何计算：Slot 中心坐标和 Point 类型

**Status:** ready-for-agent

- [ ] 有一个共用的运行单元：持有 Simulation、WorldRenderer、Debug overlay 和固定步长累加器，提供"按经过的时间推进一帧"的方法，支持速度倍数，并返回这一帧的事件。Game 场景和运行中的 Scenario story 都使用它
- [ ] "默认选中第一种塔"只定义一处，Game 场景和 story 都调用它
- [ ] 悬停射程预览（悬停在空 Slot 上时，按所选塔的射程画圈）只定义一处，依赖 01 提供的查询来判断 Slot 是否为空
- [ ] Fixture story 的选项按职责拆开，比如画面内容、镜头、特效、运行控制分开。现有 story 迁移过来，story 的 id 和截图文件名都不变
- [ ] 游戏行为不变：开波、造塔、悬停预览、`D` 键、重来、进度保存都在 dev 里实际验证过
- [ ] 开着 `running` 的 Scenario story 行为不变：`speed` 和 `advanceTicks` 生效，HUD 的"开始下一波"可用
- [ ] WebGL 不泄漏的检查仍然通过：真实切换 30 次以上 story，包括 `Game/Playable` 和运行中的 Scenario，没有 context 警告
- [ ] 所有测试通过，Shots 全部成功
