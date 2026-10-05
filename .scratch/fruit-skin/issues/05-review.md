# 05 — 整体验收

**What to build:** 用户在 `pnpm dev`（`?skin=fruit`）和 Storybook 里看完整套水果皮肤，提出修改意见；按意见修改后，由用户决定是否把 fruit 设为默认皮肤。

参考 spec：`../spec.md` 的"Testing Decisions"和"Out of Scope"。

**Blocked by:** 04 — 实现水果皮肤

**Status:** ready-for-human

- [ ] 准备一份验收清单：要看的 story（对比 Polygon 和 fruit）、要在游戏里试的操作（建塔、升级、卖出、提前叫波、被减速、护甲敌人）
- [ ] 用 Playwright 在 `pnpm dev` 里用 `?skin=fruit` 打一局，截几张关键时刻的图，控制台没有报错
- [ ] 用户试玩并给出意见；逐条修改，或者记为后续事项
- [ ] 用户决定是否把 fruit 设为默认皮肤。如果要设为默认：
  - 改默认皮肤 id
  - 确认截图脚本和 story 的基线仍然清楚（Polygon 仍可选）
  - 更新 AGENTS.md 里关于 `?skin=` 的说明
- [ ] 更新路线图：记录水果皮肤已完成，并列出后续可能做的美术（逐帧动画、特效美术、路段图块）
