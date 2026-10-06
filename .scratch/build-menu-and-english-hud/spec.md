# Spec: 环形建造菜单与英文 HUD

Status: ready-for-agent

## Problem Statement

1. **建造交互依赖 hover，而且不是 Slot 制塔防的主流做法。** 现在的流程是：先在顶栏选塔种，然后鼠标悬停空 Slot 预览范围，点击就建造。在触屏上 hover 不存在，范围预览完全看不到。而 Slot 制塔防（Kingdom Rush 系列等）的主流做法是：点击建造点，弹出塔种菜单，在菜单里预览范围，再确认建造。
2. **HUD 和面板全是中文**，包括生命、金币、第 N 波、开始下一波、伤害、射速、升级、卖出等。塔名也是中文，写在 Unit catalog 里。这限制了游戏的受众。

## Solution

- 点空 Slot，在它周围弹出**环形建造菜单**，每个选项是塔的缩略图加费用。**点两次**建造：第一次预览范围，第二次确认。去掉顶栏的塔种按钮。
- 数值类信息用 **Skin 绘制的图标**加数字表示（生命、金币、波数），动作和属性用**英文短词**。所有文案集中到一张带类型的字符串表。不用 emoji。

平台定位：**触屏优先，桌面兼容**。必要信息都不依赖 hover。

## User Stories

### 玩家

1. 我希望点一个空 Slot，就在它周围看到所有可建的塔，每个都带缩略图和费用。
2. 我希望点一下某个塔选项就能看到它在这个 Slot 的射程圈，再点一次同一个选项才真正建造，这样在手机上也能先看范围再决定。
3. 我希望在一个选项预览中时点另一个选项，就直接切换到另一个塔的预览。
4. 我希望在桌面上悬停选项时也能看到射程圈。
5. 我希望买不起的塔照样显示在原位，变灰、费用标红，可以预览范围，但不能建。金币够了以后它马上变成可建。
6. 我希望点地图空白处或按 Esc 关闭菜单；点另一个空 Slot 时菜单直接移过去；点已建的塔时打开它的 panel。
7. 我希望点角落的 Slot 时菜单不会超出屏幕。
8. 我希望打开菜单时游戏不暂停。
9. 我希望顶栏用通用图标显示生命、金币和波数，不认识中文也能看懂。
10. 我希望开波按钮、结算画面和塔面板都用简短英文。

### 开发者 / 皮肤作者

11. 作为皮肤作者，我希望 HUD 图标由 Skin 提供，这样换皮肤时图标的画风也能跟着换。
12. 作为开发者，我希望所有显示文案集中在一个文件里，以后加语言时只需要改这一处。
13. 作为开发者，我希望有测试防止中文文案重新混进来。

## Implementation Decisions

### 字符串表

- 新文件 `src/render/strings.ts`，导出一个带类型的 `en` 对象。需要插值的条目写成函数，例如 `wave(n, total)`、`sell(v)`、`confirmSell(v)`。
- 不做运行时切换语言，也不引入 i18n 库。调用方直接 import `en`，或者 import 一个名为 `strings` 的别名。
- 塔名从 `content/units.json` 和它的 schema 中**删除 `name`**，改为字符串表里按 kind 取，例如 `towerName(kind)`。对未知 kind 返回 kind 本身。
  - basic → `Basic`，splash → `Splash`，slow → `Frost`。具体措辞由实现者定，保持简短即可。

### HUD 文案与图标

- 顶栏：`[heart] lives`、`[coin] gold`、`[flag] n/total`。
- 开波按钮的几种状态：
  - 未开始：`▶ Start`
  - 倒计时：`▶ 5`
  - 提前开波：`▶ +12`，带金币图标，保留 bonus 样式
  - 出怪中：置灰
  - 最后一波：**隐藏**按钮
- 结算画面：`Victory` / `Defeat`，重来按钮显示为 `[retry] Retry`。
- tower-panel：
  - 属性名：`DMG / RATE / RANGE / SPLASH / SLOW`，射速写成 `1.2/s`，减速写成 `40% · 2s`。
  - 按钮：`[up] 120`（升级）、`Sell +60`、`Confirm +60`、`MAX`。
- `▶ ↑ ↻` 这类符号**也由 Skin 画成图标**，不当作文字字符。只有字体一定能渲染的 ASCII 才直接写成文字。

### Skin

- `Skin` 接口新增 `createIcon(scene, name: IconName): Phaser.GameObjects.GameObject`（具体返回类型由实现者定，要能定位和缩放）。
  - `IconName` 包括 `'heart' | 'coin' | 'flag' | 'play' | 'retry' | 'upgrade'`，以后需要再扩充。
- polygon 和 fruit 两个皮肤都要实现。缺少的图标要渲染一个 fallback 并报 `console.error`，和 ADR-0002 对塔外观的约定一致。
- 修改 ADR-0002：在 Skin 的职责里补一句"HUD 图标属于 Skin"。
- `SlotHover.rangePreview` 删除。`MapView.setHover` 只负责高亮空 Slot，提示"这里可以点"。

### 交互（UI state）

- `UiState` 删除 `buildKind`，新增 `buildMenu: { slotId: string; previewKind: string | null } | null`。`buildMenu` 和 `selectedTowerId` 互斥。
- `clickMap(sim, ui, slotId)` 的行为：
  - 点到已建的塔：关闭菜单，选中这个塔。
  - 点到空 Slot：打开菜单，或者把菜单移到这里，`previewKind` 清空。同时取消已选中的塔。
  - 点到其他位置：关闭菜单，取消选中塔。不会因此建造。
- 新增 `clickBuildOption(sim, ui, kind)`：
  - 如果 `previewKind !== kind`：把 `previewKind` 设为 kind。
  - 如果 `previewKind === kind` 且买得起：调用 `sim.placeTower`，然后关闭菜单。
  - 如果 `previewKind === kind` 但买不起：不做任何事。
- 新增 `hoverBuildOption(ui, kind | null)`，供桌面端用。它只影响范围预览的显示，是否要单独加一个 `hoverKind`，还是复用 `previewKind`，由实现者定。原则是：悬停不能让一次点击直接变成"确认建造"。
- Esc 键关闭菜单，同时取消选中塔。
- 菜单打开期间，如果它所在的 Slot 被占用（例如以后加了别的建造方式）或者游戏已经结束，就自动关闭菜单。用一个类似 `dropStaleSelection` 的函数处理。
- 菜单打开时游戏照常运行。

### 渲染

- 新文件 `src/render/build-menu.ts`，皮肤无关，和 `tower-panel.ts` 同一层级，只读 Theme token。
  - 塔选项沿圆环均匀分布在 Slot 周围。整个菜单包括射程圈都要收在 960×640 画布内：靠近画布边缘时，选项整体往里推，射程圈可以被画布裁掉。
  - 每个选项：底盘、塔缩略图、费用文字加金币图标。
    - 缩略图复用 `skin.createTowerView(scene, kind)`，同步一个假的 level-1 Tower，然后缩小显示。
    - 买不起的选项：底盘变灰，费用用 `danger` 颜色。
    - 预览中的选项：用 `selection` 颜色描边，同时在 Slot 处画出这个塔的射程圈，样式和 tower-panel 的射程圈一致。
  - 每帧根据金币刷新"能不能买得起"。
- 输入：菜单选项的点击优先于地图点击，不能让一次点击既选中选项、又传到地图上把菜单关掉。
- HUD 删除塔种按钮，同时删掉 `HudActions.onChooseBuildKind` 和 HUD model 里的 `towers` 字段。

### Fixture 与 story

- `src/fixtures/named.ts` 新增 Fixture，`Scenarios` 新增对应的 story：
  - 菜单打开、没有预览
  - 预览中（显示射程圈）
  - 有买不起的选项
  - 角落 Slot（检查菜单往里推）
- `mountFixtureStory` 的 `ui` 参数用 `buildMenu` 替换 `hoverSlot` / `buildKind`。
- HUD stories 改成新样式，覆盖开波按钮的每个状态和结算画面。
- 新增一个 story 把 Skin 的全部图标并排列出，两个皮肤各一份。

### 文档

- 修改 CONTEXT.md：
  - **UI state** 条目改为"打开的建造菜单及其预览塔种、选中的塔……"。
  - **HUD** 条目去掉"build buttons"。
  - 新增 **Build menu** 条目：点空 Slot 弹出的环形菜单，点两次建造。_Avoid:_ build wheel, radial（只在描述形态时用 radial）。
  - 新增 **Strings** 条目，或者在 HUD 条目里提一句：显示文案的唯一来源是 `strings.ts`。
- 修改 ADR-0002：补一句"HUD 图标属于 Skin"。

## Testing Decisions

- 交互规则写成 `ui-state.ts` 里的纯函数，在 `ui-state.test.ts` 里用 Fixture 测试。必须覆盖：
  - 点空 Slot 打开菜单；点同一个选项两次才建造，第一次只预览
  - 选项之间切换预览
  - 买不起时第二次点击不建造；金币够了以后可以建造
  - 点另一个空 Slot，菜单移过去，预览清空
  - 点空白处关闭菜单，不建造
  - 菜单打开时点已建的塔，菜单关闭，panel 打开
  - Slot 被占用或游戏结束时，菜单自动关闭
- CJK 防回流：一个单元测试扫描 `src/render/**`（不含 stories）和 `content/**`，发现 `[一-鿿]` 就失败，失败信息里列出文件和行号。
- 渲染层不写单元测试。靠 story 冒烟测试（包括图标缺失时报 `console.error`）和 Shots 检查。每张票都要跑 `pnpm shots` 并检查截图，打开和关闭 Debug overlay 各看一遍。

## Out of Scope

- 已建塔的 panel 也改成环形，见 issue 03，`needs-triage`。
- 运行时切换语言、中文语言包。
- 暂停和倍速按钮。
- 键盘快捷键选择塔种（比如 1/2/3）。
- 属性图标（DMG/RATE 等这次先用文字）。

## Further Notes

- 这次的结论是：Slot 制塔防的主流做法并没有取消范围显示，只是把范围预览挪进了菜单。
- 选 Skin 画的图标而不用 emoji，是因为 emoji 在不同平台上渲染不一致，和皮肤画风也不搭。
