# 02 — 选中塔与升级 / 卖出面板

**What to build:** 玩家点击已建的塔就选中它：显示射程圈，塔旁边弹出浮动面板，可以升级、卖出（点两次确认），并预览下一级属性。所有判断都向 Simulation 查询，UI 不重复实现规则。

参考 spec：`../spec.md` 的"交互（UI state）""渲染与皮肤"。

**Blocked by:** 01 — Simulation：塔等级、升级与卖塔

**Status:** done

- [x] `UiState.selectedTower` 改名为 `buildKind`，新增 `selectedTowerId`
- [x] 点击有塔的 Slot 选中塔；选中时点空 Slot / 地图空白 / 按 Esc 只取消选中、不建塔；选建造塔种时取消选中；塔被卖掉后自动取消选中
- [x] 选中的塔显示射程圈（复用现有范围预览的画法，用 Theme tokens 着色）
- [x] 浮动面板锚在塔旁边，靠近画面边缘时翻到另一侧，不被裁掉。内容：
  - 塔名和当前等级
  - 升级按钮：显示费用；金币不足时置灰、费用标红；满级时显示"已满级"并置灰
  - 下一级属性预览：伤害、射速、射程，溅射塔加溅射半径（当前值 → 下一级值）；同时在地图上显示下一级的射程圈（可以用虚线或淡色）
  - 卖出按钮：显示 `+返还金额`；第一次点击变成"确认卖出 +X"，再点一次才卖；点别处或过几秒后恢复
- [x] 面板只用 Theme tokens，需要的话新增 `danger` 等 token，Polygon 皮肤提供取值
- [x] 面板的金币状态随金币变化实时刷新（波次中打怪拿钱后，升级按钮会变成可点）
- [x] 具名 Fixture `towerSelected`，以及面板各状态的 story：可升级、金币不足、已满级、确认卖出
- [x] 在 `pnpm dev` 里手动走一遍：建塔 → 选中 → 升两级 → 卖出 → 在原 Slot 重新建塔，控制台没有报错

## Comments

- 2026-10-05 完成。
  - **验证**：
    - `pnpm typecheck`、`pnpm lint` 通过；`pnpm test` 共 126 个测试通过，其中新增 7 个 UI state 单元测试（`src/scenes/ui-state.test.ts`）。
    - `pnpm shots tower-panel` 生成了 4 个面板状态的截图，带和不带 Debug overlay 都看过。
    - 用 Playwright 在 `pnpm dev` 里走了一遍：建塔 → 选中 → 升两级 → 满级时点升级无效 → 点面板背景不会取消选中 → 卖出要点两次 → 在原 Slot 重新建塔 → 点空 Slot、按 Esc、点建造按钮都会取消选中且不建塔 → 卖出确认 3 秒后自动恢复。金币变化都正确，控制台没有报错。Chrome DevTools MCP 被另一个浏览器实例占用，所以改用 Playwright。
  - **实现位置**：
    - 选中、点击地图、取消选中的规则在 `src/scenes/ui-state.ts`（`clickMap`、`chooseBuildKind`、`dropStaleSelection`、`selectTower`）。
    - 面板模型、射程圈和面板本身在 `src/render/tower-panel.ts`，和 Skin 无关。射程圈画在 Game 场景（depth 4，在塔下面），面板画在 HUD 场景。
    - 卖出确认的 3 秒计时在 `HudScene`。
  - **和 ticket 不一致的地方**：
    - 下一级射程用金色细圈表示，不是虚线（Phaser Graphics 没有虚线）。
    - 面板的 story 放在新的 `Tower panel` 分组（4 个：可升级、金币不足、满级且面板翻到左侧、确认卖出），没有加到 Scenarios。原因是 Scenarios 的 Fixture 只有 SimState，表达不了"选中了哪座塔"。
    - 为了用 Theme tokens 画射程圈和"金币不足"的红字，`SkinTheme` 新增了 `range` 和 `danger` 两个 token。
    - 选中一座塔时，悬停空 Slot 不再显示建造预览，因为这时点击只会取消选中。
  - **顺带修的文档**：AGENTS.md 里读 SimState 的写法 `getScene('Game').sim.state` 已经过时，改成了 `getScene('Game').runner.sim.state`。
