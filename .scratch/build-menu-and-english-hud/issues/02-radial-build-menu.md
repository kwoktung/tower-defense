# 02 — 环形建造菜单

**What to build:** 点空 Slot，在它周围弹出环形建造菜单：塔缩略图加费用，点两次建造（第一次预览射程，第二次确认）。去掉顶栏的塔种按钮和 `buildKind`。桌面 hover 只高亮空 Slot；悬停菜单选项时也显示射程。

参考 spec：`../spec.md` 的"交互（UI state）""渲染""Fixture 与 story""文档""Testing Decisions"。

**Blocked by:** 01（要用到金币图标和 `towerName`）

**Status:** ready-for-agent

- [ ] `UiState`：删除 `buildKind`，新增 `buildMenu: { slotId; previewKind } | null`，和 `selectedTowerId` 互斥
- [ ] `clickMap`：点塔打开 panel；点空 Slot 打开菜单或把菜单移过去；点其他位置关闭菜单。点击地图永远不会直接建造
- [ ] `clickBuildOption`：第一次点预览，第二次点建造并关闭菜单；买不起时第二次点不做任何事
- [ ] 桌面悬停选项时显示射程，但悬停不能让一次点击直接确认建造
- [ ] Esc 关闭菜单；Slot 被占用或游戏结束时自动关闭（参考 `dropStaleSelection`）
- [ ] `src/render/build-menu.ts`：皮肤无关，只读 Theme token；选项均匀分布在环上，靠近画布边缘时往里推；缩略图复用 `createTowerView` 并缩小；买不起时变灰、费用标红；预览中的选项描边，并画出射程圈；每帧刷新"能不能买得起"
- [ ] 输入：选项点击不能传到地图上
- [ ] 删除 `SlotHover.rangePreview`；`setHover` 只做 Slot 高亮（两个皮肤都要改）
- [ ] 删除 HUD 塔种按钮、`onChooseBuildKind` 和 HUD model 的 `towers` 字段
- [ ] `mountFixtureStory` 的 `ui` 参数改用 `buildMenu`
- [ ] 新增 Fixture 和 Scenario stories：菜单打开、预览中、有买不起的选项、角落 Slot
- [ ] `ui-state.test.ts`：覆盖 spec "Testing Decisions" 里列的所有情况
- [ ] CONTEXT.md：修改 UI state 和 HUD 条目，新增 Build menu 条目
- [ ] `pnpm shots scenarios` 检查截图，打开和关闭 Debug overlay 各看一遍；用 `pnpm dev` 在触屏模拟下实际玩一局
- [ ] `pnpm typecheck && pnpm lint && pnpm test`

## Comments
