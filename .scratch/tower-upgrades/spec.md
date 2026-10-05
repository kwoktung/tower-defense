# Spec: 塔的升级与卖塔

Status: done

## Problem Statement

MVP 里塔建好就定死了。整关总收入只有 344 金，而 Slot 永远建不满，所以玩家的选择只有"在哪个 Slot 建哪种塔"。中后期金币没有别的用处，每局打法也基本一样。另外，放错的塔没法纠正。

## Solution

- 每种塔有 3 个**等级**，线性升级，每一级的属性更强，外形也随等级变化。
- 玩家可以**卖塔**，按累计投入返还 70%。
- 点击已建的塔会选中它：显示射程圈，旁边弹出浮动面板，上面有升级、卖出和下一级属性预览。
- 升级和卖塔在波次进行中也能做。

同时为以后接入美术资源做好抽象：内容数据不涉及美术，Skin 根据 (kind, level) 决定外形，并且必须覆盖全部组合（ADR-0002）。

## User Stories

### 玩家

1. 我希望点击已建的塔就能选中它，看到它的射程圈和一个操作面板。
2. 我希望面板上显示升级费用，以及升级后伤害、射速、射程（溅射塔还有溅射半径）的变化，这样我知道钱花得值不值。
3. 我希望钱不够时升级按钮置灰、费用标红；满级时按钮显示"已满级"并置灰。
4. 我希望升级后塔的外形立刻变化，并有一个升级特效，这样我一眼能看出哪些塔升过级、升到几级。
5. 我希望能卖掉塔，拿回累计投入的 70%，面板上直接显示能拿回多少。
6. 我希望卖塔要点两次确认，这样不会误卖高级塔。
7. 我希望卖掉后 Slot 立刻空出来，可以重新建塔。
8. 我希望点空白处、按 Esc 或选一个建造塔种时取消选中。
9. 我希望波次进行中也能升级和卖塔。

### 开发者 / 美术

10. 作为皮肤作者，我希望只需写一个新 Skin、按 (kind, level) 提供外形，就能替换全部塔的美术，不用改 content、Simulation 或场景。
11. 作为皮肤作者，我希望有一个 story 把所有塔种和等级并排列出，作为新皮肤的验收页；漏画了某个组合时，story 测试会失败。
12. 作为开发者，我希望升级和卖塔的规则通过 Simulation 的公开 API 测试，UI 只查询、不重复实现规则。

## Implementation Decisions

### 单位目录

- 每种塔的 `levels` 是一个数组，每一级写**完整属性**：`cost`、`range`、`damage`、`cooldownSec`、`projectileSpeed`、`attack`（溅射塔的 `radius` 也在这里）。`name` 留在塔种上。
- `levels[0]` 就是现在的数值，`levels[0].cost` 是建造费；`levels[i].cost`（i ≥ 1）是从第 i 级升到第 i+1 级的费用。
- 不写任何美术字段（ADR-0002）。
- 卖塔返还比例 `sellRefundRatio: 0.7` 放在单位目录顶层，方便调数值。
- 数值如下（04 号工单验证后的最终值；初始值见 git 历史）：

  | 塔 | 级 | 费用 | 伤害 | 冷却 | 射程 | 子弹速度 | 溅射半径 |
  |---|---|---|---|---|---|---|---|
  | basic | 1 | 50 | 10 | 0.5s | 160 | 480 | — |
  | basic | 2 | +40 | 20 | 0.5s | 168 | 480 | — |
  | basic | 3 | +70 | 26 | 0.4s | 176 | 520 | — |
  | splash | 1 | 80 | 8 | 1.2s | 128 | 320 | 48 |
  | splash | 2 | +60 | 14 | 1.2s | 136 | 320 | 48 |
  | splash | 3 | +100 | 20 | 1.2s | 136 | 360 | 50 |

  思路：同样的金币，升级一座塔和多建同级塔效果相当，升级略好但不碾压；`pnpm balance` 输出对比报告。

### Simulation

- `Tower` 新增 `level`（从 1 开始）。属性一律从单位目录的 `levels[level - 1]` 查，不在 SimState 里存属性副本。
- `Projectile` 记录开火时的塔等级，这样子弹在飞行途中，即使塔被升级或卖掉，伤害和溅射半径也不变。
- **Sell value** = `floor(累计投入 × sellRefundRatio)`。累计投入由等级和单位目录推算，不额外存。
- 新 API，风格和 `placeTower` / `canPlaceTower` 一致：
  - `canUpgradeTower(towerId)`：只读，返回能否升级；不能时返回原因：游戏已结束、塔不存在、已满级、金币不足。
  - `upgradeTower(towerId)`：复用同一个判断；成功时扣费、`level + 1`，发出 `towerUpgraded`。
  - `sellValue(towerId)`：只读，返回卖出能拿回的金币；塔不存在时返回 null。
  - `sellTower(towerId)`：成功时加金币、移除塔、Slot 变空，发出 `towerSold`；失败原因是游戏已结束或塔不存在。
- 新 SimEvent：
  - `{ type: 'towerUpgraded'; id; kind; level }`
  - `{ type: 'towerSold'; id; kind; level; slotId; refund; x; y }`（x、y 是 Slot 中心，供卖出特效定位）
- 升级不重置冷却，也不清除目标。
- 卖塔后，已经飞出的子弹照常飞行、命中。

### 交互（UI state）

- `UiState` 现在的 `selectedTower` 实际上是"要建造的塔种"。建议把它改名为 `buildKind`，再新增 `selectedTowerId: number | null`，避免两个"选中"混淆。
- 点击有塔的 Slot：选中那座塔。
- 塔被选中时，点击空 Slot、地图空白处或按 Esc：只取消选中，**不会**同时建塔，避免误建。
- 点击 HUD 上的建造塔种：取消选中塔。
- 选中的塔从 SimState 里消失（被卖掉）时，自动取消选中。
- 选中状态只存在 UI state，不进 SimState（ADR-0001）。

### 渲染与皮肤

见 ADR-0002。要点：

- `EntityView<Tower>.sync(tower)` 发现 `tower.level` 变化时，自己更新外形。Skin 接口签名不变。
- Polygon 皮肤：基础形状不变（basic 方形、splash 六边形），按等级依次放大（约 1.0 / 1.1 / 1.2 倍）、Lv2 起加一圈描边、塔下方显示等级标记点（几级就几个点）。
- `towerUpgraded` 是关于一座活着的塔的事件，WorldRenderer 转给那座塔的 view，由 view 播放升级特效。`towerSold` 发生时塔已经被移除，交给 `Skin.playEffect` 播放卖出特效。
- 浮动面板和射程圈属于 HUD / UI，只使用 Theme tokens。需要时新增 token，比如表示"金币不足"的红色 `danger`。

### Fixture 与 story

- builder 的 `withTower(kind, slotId)` 增加一个可选参数，用来指定等级。
- `allTowerLevels`：所有塔种 × 所有等级并排摆放。这是皮肤验收页。
- `towerSelected`：一座塔处于选中状态，射程圈和面板都显示出来。可以给不同面板状态（可升级、金币不足、已满级、确认卖出）各做一个 story。
- 升级和卖出特效通过 `mountFixtureStory` 的 `effects` 冻结在第一帧。

### 文档

- ADR-0002（已写好）：皮肤负责按等级决定外形，内容数据不涉及美术。
- CONTEXT.md 已加入 **Tower level**、**Sell value**。

## Testing Decisions

- 规则通过 Simulation 公开 API 测试，用 Fixture 构造初始状态。
- 必须覆盖：
  - 升级扣费、等级 +1、升级后属性生效（伤害和射程）
  - 满级、金币不足、塔不存在、游戏结束时不能升级；`canUpgradeTower` 和 `upgradeTower` 结果一致
  - 卖塔的返还金额（Lv1、Lv3 各一例）、Slot 空出后可以重新建塔
  - 子弹飞行途中塔被卖掉或升级，子弹仍按开火时的等级结算
  - 两个新事件的内容
- 渲染层不写单元测试。靠 story 冒烟测试（包括漏画组合时报 `console.error`）和 Shots 检查。

## Out of Scope

- 最后一级二选一的分支升级（数据结构不要挡住它就行）。
- 同一波内卖塔全额返还。
- 塔的目标策略切换。
- 精灵图皮肤本身。这次只做抽象和 Polygon 实现。
- 路线图里的其他项目，见 `../playability-roadmap/roadmap.md`。

## Further Notes

- Polygon 皮肤是临时方案，以后会接入美术资源。判断这次抽象做得好不好的标准是：新增一个精灵图皮肤时，只需要写 Skin 并让 `allTowerLevels` 显示正确，不用改其他任何层。
