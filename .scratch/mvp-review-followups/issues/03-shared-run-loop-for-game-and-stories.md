# 03 — Game 场景和 Scenario story 共用同一套运行逻辑

**What to build:** 游戏和运行中的 Scenario story 驱动画面的方式完全相同：同一段"推进 Simulation → 渲染世界 → 同步 Debug overlay"的每帧逻辑；同一个"默认选中第一种塔"的规则；同一套悬停射程预览。这样以后改运行方式时只需要改一处，Storybook 里看到的行为也和游戏保证一致。Fixture story 的选项按职责拆分，不再一个对象里同时塞进 HUD、悬停、聚焦、特效和运行控制。

来源：MVP 代码审查的 Standards 部分（每帧循环、默认选中的塔、射程预览各重复两处；`FixtureStoryOptions` 有 Divergent Change 的问题）。

**Blocked by:** 01 — 建造规则只放在 Simulation 里；02 — 统一几何计算：Slot 中心坐标和 Point 类型

**Status:** done

- [x] 有一个共用的运行单元：持有 Simulation、WorldRenderer、Debug overlay 和固定步长累加器，提供"按经过的时间推进一帧"的方法，支持速度倍数，并返回这一帧的事件。Game 场景和运行中的 Scenario story 都使用它
- [x] "默认选中第一种塔"只定义一处，Game 场景和 story 都调用它
- [x] 悬停射程预览（悬停在空 Slot 上时，按所选塔的射程画圈）只定义一处，依赖 01 提供的查询来判断 Slot 是否为空
- [x] Fixture story 的选项按职责拆开，比如画面内容、镜头、特效、运行控制分开。现有 story 迁移过来，story 的 id 和截图文件名都不变
- [x] 游戏行为不变：开波、造塔、悬停预览、`D` 键、重来、进度保存都在 dev 里实际验证过
- [x] 开着 `running` 的 Scenario story 行为不变：`speed` 和 `advanceTicks` 生效，HUD 的"开始下一波"可用
- [x] WebGL 不泄漏的检查仍然通过：真实切换 30 次以上 story，包括 `Game/Playable` 和运行中的 Scenario，没有 context 警告
- [x] 所有测试通过，Shots 全部成功

## Comments

- 2026-10-05 完成。
  - **改动**：
    - 新增共用的运行单元 `createWorldRunner`（放在场景层）。它持有 Simulation、WorldRenderer、Debug overlay 和固定步长累加器，提供两个方法：
      - `render(events)`：画当前快照，`events` 作为一次性特效播放；
      - `tick(deltaMs, speed)`：把经过的时间换算成 tick，推进 Simulation，画出结果，并返回这一帧的事件。

      Game 场景和运行中的 Scenario story 都用它。现在 `fixedStep.consume` 只在它内部出现一次。
    - `ui-state.ts` 新增两个函数：
      - `defaultSelectedTower(units)`：默认选中单位目录里的第一种塔；
      - `slotHoverFor(sim, slotId, selectedTower)`：只有空 Slot 才高亮，射程取自所选塔。判断空位用的是 follow-up 01 的 `isSlotFree`。

      Game 场景和 fixture story 都调用这两个函数，原来的两份重复代码已删除。
    - `FixtureStoryOptions` 按职责拆成四组：`ui`（HUD、选中的塔、悬停）、`camera`（聚焦、缩放）、`effects`、`playback`（advanceTicks、running、speed）。所有 story 都已迁移，story 的 id 不变。
  - **行为上的一处细节**：fixture story 的 `hoverSlot` 现在也走"只有空 Slot 才高亮"的规则，和游戏一致。现有 story 悬停的都是空 Slot，所以截图没有变化。
  - **验证**：
    - typecheck、lint、Prettier 都通过；97 个测试全部通过。
    - 改动前后各跑一次完整 Shots，**94/94 张截图逐字节一致**。
    - 在 dev 里实际操作了：悬停空 Slot 时显示射程（基础塔 160，溅射塔 128）；造塔后该 Slot 不再高亮；点已占用的 Slot 没有反应；`D` 键能开关 Debug overlay；开波、判负、自动保存进度、"重来"都正常（换成新的 Simulation，HUD 也绑到新的上，Debug 开关状态保留）；控制台没有报错。
    - 在 Storybook 里以 4 倍速运行 Scenario，点 HUD 的"开始下一波"能出怪，HUD 正常刷新。
    - **WebGL**：在全新页面里，覆盖 `Game/Playable`、4 倍速运行中的 Scenario、击杀圈、Map 等 story，累计真实切换 108 次，没有警告，始终只有 1 个 canvas。
      - 第一次测试时出现过 2 条 "Too many active WebGL contexts"。那个标签页之前加载过 dev 游戏页面，又在 Storybook 里导航过好几次，之前页面的 context 还没被回收。
      - 为了排查，我用临时 worktree 在另一个端口启动了改动前（`61d525c`）的 Storybook，用同一个脚本、全新页面对比：改动前后都没有警告。所以判断不是这次改动引入的。
  - **测试时注意到的已有行为（不是这次引入的）**：点完 HUD 按钮后，紧接着的第一次鼠标移动不会进入 Game 场景的处理函数，这是 Phaser 在两个叠放场景之间分发输入的方式；第二次移动就正常了。真实使用中鼠标会连续产生移动事件，所以察觉不到。
