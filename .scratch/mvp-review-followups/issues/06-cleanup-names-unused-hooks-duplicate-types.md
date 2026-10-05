# 06 — 清理：命名、用不到的扩展点、重复的类型定义

**What to build:** 去掉代码审查里发现的小毛病，让代码读起来名副其实，并且没有用不到的东西：
- 改两个容易误解的名字；
- 删掉没有调用方的方法和参数；
- 删掉从未被调用的 `destroy` 方法（Phaser 关闭场景时本来就会销毁这些显示对象）；
- 进度存储里"胜 / 负"的类型只保留一份定义；
- 修正调色板注释里关于塔的过时说法。

行为不变。

来源：MVP 代码审查的 Standards 部分，包括 Mysterious Name、Speculative Generality 和 Primitive Obsession 中关于"胜 / 负"重复定义的部分。

**Blocked by:** 03 — Game 场景和 Scenario story 共用同一套运行逻辑（会改到同几个文件，放在它之后，避免来回改动）

**Status:** done

- [x] 溅射爆炸 story 里装着整个攻击配置的变量，改成名副其实的名字，不再出现 `radius.radius` 这样的写法
- [x] 溅射测试里构造局面的辅助函数改名，让人一看就知道参数是"敌人之间的间距"
- [x] 删掉 Fixture builder 里没有调用方的"切换关卡"方法，以及多边形填充函数里从来没有被传过值的透明度参数
- [x] 删掉 WorldRenderer、HUD、Debug overlay 上从未被调用的 `destroy`，以及接口里对应的声明。如果 03 之后某个 `destroy` 已经有了调用方，就保留它，并在 ticket 评论里说明
- [x] 进度存储里"最好结果"的类型由它的 zod schema 推导，接口类型和 schema 只保留一份定义
- [x] Polygon 皮肤调色板文件顶部的注释还写着塔"以后才有（later）"，塔早已实现，把这句过时的说法改掉（2026-10-05 用户要求一并处理）
- [x] typecheck、lint、所有测试都通过，Shots 全部成功

## Comments

- 2026-10-05 完成。
  - **命名**：
    - 溅射爆炸 story 里的变量 `radius` 改名为 `splashAttack`，现在写作 `splashAttack.radius`。
    - 溅射测试的辅助函数 `splashAt` 改名为 `splashTowerVsEnemiesSpaced`。
  - **删掉的、没人用的东西**：
    - Fixture builder 的 `withLevel`。
    - `fillPolygon` 的 `alpha` 参数。
    - `WorldRenderer.destroy`，以及它内部 ViewSet 的整体销毁。
    - `Hud.destroy`、`DebugOverlay.destroy`，以及接口里对应的声明。
    - 03 完成之后，这些 `destroy` 仍然没有任何调用方，所以全部删掉；场景关闭时，Phaser 会自己销毁这些显示对象。
    - 单个实体视图的 `destroy` **保留**：实体从快照中消失时，WorldRenderer 会调用它。
  - **进度类型只保留一份定义**：新增 `src/services/level-progress.ts`，里面的 `LevelProgressSchema` 是唯一定义，`LevelProgress` 和 `GameResult` 都由它推导。`services/types.ts` 只是转出这两个类型；本地存储用同一个 schema 校验读到的记录，删掉了原来自己的那份 schema。
  - **调色板注释**：去掉了"towers (later)"里的 "later"。
  - **验证**：
    - typecheck、lint、Prettier 都通过；97 个测试全部通过，其中包括进度存储的 9 个测试。
    - 改动前后各一次完整 Shots，94/94 张逐字节一致。
    - AGENTS.md、CONTEXT.md、ADR 里都没有提到被删掉的 API。
  - **范围之外，留作记录**：`MapView.destroy` 同样没有调用方（场景里也是靠 Phaser 统一销毁），但它不在本 ticket 列出的三项里，所以没有动。如果要做，可以按同样的方式删除。
- 2026-10-05 补充核查（应用户要求，确认删掉 `destroy` 后没有内存泄漏）。
  - **源码依据**（Phaser 4.2.1）：
    - 重启的路径：`ScenePlugin.restart` 是先 stop 再 start；`launch` 遇到正在运行的场景会先 shutdown。所以每次重来都会走场景的 shutdown。
    - `DisplayList.shutdown` 会对每个顶层对象调用 `destroy(true)`。Container 默认是 exclusive 的，销毁时会连带销毁子对象。
    - `InputPlugin.shutdown` 和 `KeyboardPlugin.shutdown` 都会调用 `removeAllListeners()`。
    - `Clock.shutdown` 会销毁所有计时器，`TweenManager.shutdown` 会调用 `killAll()`。
    - 唯一不会被自动清掉的，是用户自己在场景事件上注册的监听（`Systems.shutdown` 只移除 transition 相关的监听）。我们的游戏代码没有注册这类监听；只有 Storybook 的 fixture story 注册过一个 `update` 监听，而 story 的 game 会整个 destroy，`Systems.destroy` 会对场景事件调用 `removeAllListeners()`。
  - **实测**（dev 页面，开启 Debug overlay）：
    - 一共重启 200 次。每轮都先造 3 座塔、开波、塞进 8 个敌人，在局面最忙的时候重启：最多有 2 发子弹在飞、1 个受击闪白计时器在走、2 个 tween 在播放、9 个敌人在场。
    - 第 1、10、25、50、100、200 次重启后，以下计数每次都完全相同：Game 场景 3 个显示对象、2 个输入监听、1 个键盘监听、47 个场景事件监听，tween 和计时器都是 0；Hud 场景 1 个显示对象；game 级事件 19 个监听；1 个 canvas。
    - 堆快照（拍摄前会强制 GC）对比：第 50、100、200 次重启后，Graphics 一直是 11 个，Container 10 个，Text 38 个，WorldRenderer 1 个，ViewSet 3 个，canvas 和 WebGL context 各 1 个，Tween 和 TimerEvent 都是 0。
    - 普通 Object 和 Array：第 50 到 100 次重启之间多了 84 个和 28 个；第 100 到 200 次之间都是 0。增长没有随重启次数累积，所以判断是一次性的预热分配，不是泄漏。
  - **结论**：删掉 WorldRenderer、HUD、Debug overlay 的 `destroy` 不会导致泄漏，旧局的对象在重启后都被回收了。
