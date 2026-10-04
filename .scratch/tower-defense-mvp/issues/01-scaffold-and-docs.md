# 01 — 工程脚手架与项目文档

**What to build:** 把空仓库变成可以开发的工程。开发者和 agent 能运行开发服务器、测试、lint、Storybook，并读到项目术语表、分层的架构决策和开发命令说明。这一张是 prefactor，不包含游戏功能，目的是让后面的链路 ticket 只需要专心打通功能。

参考 spec：`../spec.md`，包括"架构与分层"和"文档"两节。

**Blocked by:** None — can start immediately

**Status:** done

- [x] 用 pnpm 单包管理，配好 Vite、TypeScript strict、ESLint、Prettier、Vitest；依赖 `phaser@^4.2.1`
- [x] 运行 dev 后能看到一块 960×640 的空白 Phaser 画布，按 FIT 方式等比缩放，铺满窗口但不裁切
- [x] Simulation 模块的分层 lint 规则生效：在 Simulation 里引入 phaser、渲染层或数据服务时，lint 报错（用一个临时文件验证后删除）
- [x] 运行 test 能执行 Vitest，至少有一个占位测试通过
- [x] Storybook 10（HTML + Vite 框架）能启动，里面有一个占位 story
- [x] package.json 提供 dev、test、lint、storybook 四个脚本
- [x] CONTEXT.md 写好 spec 里列出的全部术语，每个术语一两句定义
- [x] ADR-0001 写明逻辑和渲染分层的原因（可测试、让 agent 能从固定状态得到画面），也写明不是什么原因（不是为了多渲染器，也不是为了服务端运行），以及代价
- [x] AGENTS.md 新增"开发命令"一节，写明现有命令和工作约定；shots 命令标注"由 02 提供"

## Comments

- 2026-10-04 完成。
  - TypeScript 锁在 `~6.0.3`：npm 上 latest 已是 7.0.2，但 typescript-eslint 8.71 的 peer 依赖要求 `<6.1`。
  - Prettier 忽略 `.scratch/`，避免格式化时改动 issue 文件。
  - 验证情况：在 1200×700 的窗口里，画布按 FIT 缩放到 1050×700 并居中；Storybook 的占位 story 正常渲染；分层 lint 规则会拒绝 Simulation 引入 phaser、render、services。
  - 已知问题：Storybook 预览页的 favicon 请求会返回 404（控制台显示为资源加载错误，不是代码里的 console.error）。02 做 story 冒烟测试时要留意，不要误判。
