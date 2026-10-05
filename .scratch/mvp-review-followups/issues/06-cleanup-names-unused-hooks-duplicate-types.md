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
