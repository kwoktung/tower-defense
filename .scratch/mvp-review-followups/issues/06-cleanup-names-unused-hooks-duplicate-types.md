# 06 — 清理：命名、用不到的扩展点、重复的类型定义

**What to build:** 去掉代码审查里发现的小毛病，让代码读起来名副其实，并且没有用不到的东西：
- 改两个容易误解的名字；
- 删掉没有调用方的方法和参数；
- 删掉从未被调用的 `destroy` 方法（Phaser 关闭场景时本来就会销毁这些显示对象）；
- 进度存储里"胜 / 负"的类型只保留一份定义。

行为不变。

来源：MVP 代码审查的 Standards 部分，包括 Mysterious Name、Speculative Generality 和 Primitive Obsession 中关于"胜 / 负"重复定义的部分。

**Blocked by:** 03 — Game 场景和 Scenario story 共用同一套运行逻辑（会改到同几个文件，放在它之后，避免来回改动）

**Status:** ready-for-agent

- [ ] 溅射爆炸 story 里装着整个攻击配置的变量，改成名副其实的名字，不再出现 `radius.radius` 这样的写法
- [ ] 溅射测试里构造局面的辅助函数改名，让人一看就知道参数是"敌人之间的间距"
- [ ] 删掉 Fixture builder 里没有调用方的"切换关卡"方法，以及多边形填充函数里从来没有被传过值的透明度参数
- [ ] 删掉 WorldRenderer、HUD、Debug overlay 上从未被调用的 `destroy`，以及接口里对应的声明。如果 03 之后某个 `destroy` 已经有了调用方，就保留它，并在 ticket 评论里说明
- [ ] 进度存储里"最好结果"的类型由它的 zod schema 推导，接口类型和 schema 只保留一份定义
- [ ] typecheck、lint、所有测试都通过，Shots 全部成功
