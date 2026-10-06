# 02 — 环形建造菜单

**What to build:** 点空 Slot，在它周围弹出环形建造菜单：塔缩略图加费用，点两次建造（第一次预览射程，第二次确认）。去掉顶栏的塔种按钮和 `buildKind`。桌面 hover 只高亮空 Slot；悬停菜单选项时也显示射程。

参考 spec：`../spec.md` 的"交互（UI state）""渲染""Fixture 与 story""文档""Testing Decisions"。

**Blocked by:** 01（要用到金币图标和 `towerName`）

**Status:** done

- [x] `UiState`：删除 `buildKind`，新增 `buildMenu: { slotId; previewKind } | null`，和 `selectedTowerId` 互斥
- [x] `clickMap`：点塔打开 panel；点空 Slot 打开菜单或把菜单移过去；点其他位置关闭菜单。点击地图永远不会直接建造
- [x] `clickBuildOption`：第一次点预览，第二次点建造并关闭菜单；买不起时第二次点不做任何事
- [x] 桌面悬停选项时显示射程，但悬停不能让一次点击直接确认建造
- [x] Esc 关闭菜单；Slot 被占用或游戏结束时自动关闭（参考 `dropStaleSelection`）
- [x] `src/render/build-menu.ts`：皮肤无关，只读 Theme token；选项均匀分布在环上，靠近画布边缘时往里推；缩略图复用 `createTowerView` 并缩小；买不起时变灰、费用标红；预览中的选项描边，并画出射程圈；每帧刷新"能不能买得起"
- [x] 输入：选项点击不能传到地图上
- [x] 删除 `SlotHover.rangePreview`；`setHover` 只做 Slot 高亮（两个皮肤都要改）
- [x] 删除 HUD 塔种按钮、`onChooseBuildKind` 和 HUD model 的 `towers` 字段
- [x] `mountFixtureStory` 的 `ui` 参数改用 `buildMenu`
- [x] 新增 Fixture 和 Scenario stories：菜单打开、预览中、有买不起的选项、角落 Slot
- [x] `ui-state.test.ts`：覆盖 spec "Testing Decisions" 里列的所有情况
- [x] CONTEXT.md：修改 UI state 和 HUD 条目，新增 Build menu 条目
- [x] `pnpm shots scenarios` 检查截图，打开和关闭 Debug overlay 各看一遍；用 `pnpm dev` 在触屏模拟下实际玩一局
- [x] `pnpm typecheck && pnpm lint && pnpm test`

## Comments

- 2026-10-06 完成。
  - **验证**：`pnpm typecheck`、`pnpm lint` 通过；`pnpm test` 191 个测试中 190 通过、1 跳过（balance 报告）。`ui-state.test.ts` 改写为 16 个用例，覆盖 spec 列出的全部情况。
  - **实机**：`pnpm dev` + Chrome 触屏模拟（960×640，mobile/touch），用真实 touch 事件验证：点 Slot 打开菜单 → 点一次预览 → 再点建造并关闭；点另一个 Slot 菜单移过去；点空地关闭；点选项不会穿透到地图。控制台无报错。
  - **Shots**：`build-menu` 全部 story 都检查过，打开和关闭 Debug overlay 各看一遍。
  - **和 ticket 不一致的地方**：
    - 再点一次菜单所在的 Slot 会关闭菜单（toggle）。ticket 没规定这一条，这是 KR 的做法。
    - 菜单状态是 `{ slotId, previewKind, hoverKind }`：悬停只写 `hoverKind`，范围圈显示 `hoverKind ?? previewKind`，确认建造只看 `previewKind`。
    - 菜单分两部分：世界层的 `createBuildPreview`（射程圈 + Slot 描边，在 Game scene，位于塔下面）和 HUD 层的 `createBuildMenu`（选项环，在 HUD scene），和 tower-panel 的 selection/panel 拆法一致。
    - 缩略图：先收集 `createTowerView` 画进场景的对象，再挪进一个 Container 并缩放（把整格缩成 44px）。没有用 `getBounds`，因为它对 Graphics 不可靠。
    - `UiState.buildKind`、`chooseBuildKind`、`createUiState(units)` 的参数都删了；`slotHoverFor(sim, slotId)` 只做高亮。
    - Towers stories 里的 `HoverRangePreview` 被 Build menu stories 取代。
    - **没验证到的地方**：level 1 里没有离屏幕边缘足够近的 Slot，所以 `buildMenuLayout` 往里推这段逻辑在截图里看不到，也没有单元测试（它是渲染代码，按约定不写单元测试）。以后出现贴边 Slot 的关卡时，再补一个 story。
