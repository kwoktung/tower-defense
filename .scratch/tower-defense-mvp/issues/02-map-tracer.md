# 02 — 地图链路：从关卡配置到画面、Story 和 Shots

**What to build:** 第一条完整链路。关卡配置经过 schema 校验，由 LevelRepository 读取，用组合根组装服务，再创建初始 Simulation。Polygon 皮肤的 MapView 把地图画在 Game 场景里。开发者可以在游戏里按 `D`，或在 Storybook 里切换 Controls，查看 Debug overlay。agent 可以用一条命令生成全部 story 的截图。之后所有 ticket 都在这条链路上往里加内容。

参考 spec：`../spec.md`，包括"配置 schema""数据服务""渲染与皮肤""Phaser 场景""Fixture 与可视化"几节。

**Blocked by:** 01 — 工程脚手架与项目文档

**Status:** ready-for-agent

- [ ] 用 zod 写关卡定义的 schema，TS 类型由 schema 推导。第一关的配置包含：15×10 格、格子大小 64、从左进右出的 S 形路径、约 12 个和路径相邻的 Slot、初始金币 120、初始生命 10
- [ ] 本地 LevelRepository 以异步方式读取打包的配置并校验；校验失败时抛出带字段路径的错误
- [ ] 组合根按环境（local）返回全部服务
- [ ] 能从关卡定义加种子创建 Simulation，初始 SimState 的金币和生命正确
- [ ] Skin 接口和皮肤注册表已建好，包含 Polygon 皮肤。Boot 场景按 URL 参数选皮肤，默认是 polygon
- [ ] Game 场景显示深石板灰背景、沙土色路径带、暗灰绿描边的 Slot；鼠标悬停 Slot 时它会变亮
- [ ] Debug overlay（青色细线加等宽字体）显示路径折线、拐点编号、Slot id 和格子坐标；游戏里按 `D` 开关
- [ ] Storybook 挂载辅助函数：把 Phaser 挂到 story 的节点上；切换 story 或改参数时销毁实例；第一次渲染后设置"已就绪"标记；连续切换 30 次 story 没有 WebGL context 警告
- [ ] 有 Map 的两个 story："空地图"和"Slot 悬停"，都有 `skin` 和 `debug` 两个 Controls
- [ ] 配好 Storybook 的 vitest 插件：每个 story 渲染时不抛异常、没有 console.error，这一项是测试的一部分
- [ ] shots 命令为每个 story 生成"无 Debug"和"有 Debug"两张截图，写入一个不进 git 的目录；支持按名称筛选；运行结束时打印文件列表
- [ ] 测试（Seam 2）：合法配置能加载；非法字段被拒绝，错误里带路径
- [ ] 测试（Seam 1）：初始 SimState 的金币、生命、tick、结果都符合配置
- [ ] AGENTS.md 的 shots 命令说明已更新
