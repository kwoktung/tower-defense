# 03 — Skin：按等级显示塔的外形与升级 / 卖出特效

**What to build:** 塔的外形随等级变化，升级和卖出时有一次性特效。按 ADR-0002 的约定实现：Skin 接口签名不变，view 在 `sync` 里自己处理等级变化；Skin 缺某个 (kind, level) 组合时报 `console.error`。

参考 spec：`../spec.md` 的"渲染与皮肤""Fixture 与 story"，以及 `docs/adr/0002-skins-own-tower-level-appearance.md`。

**Blocked by:** 01 — Simulation：塔等级、升级与卖塔

**Status:** done

- [x] Polygon 皮肤的塔 view 在 `sync` 里发现等级变化就重画：基础形状不变，按等级放大（约 1.0 / 1.1 / 1.2 倍）、Lv2 起加描边、塔下方显示等级标记点
- [x] 塔 view 在 `onEvent` 里处理 `towerUpgraded`，播放升级特效（比如一圈向外扩散的光环）；确认 WorldRenderer 把这个事件转给了对应的塔 view
- [x] `Skin.playEffect` 处理 `towerSold`，在原位置播放卖出特效（比如塔形淡出 + 金币色的 `+X`）
- [x] Polygon 皮肤遇到超出它能画的等级时，按 ADR-0002 画回退外形并报 `console.error`
- [x] 更新 `src/render/skin.ts` 里 `createTowerView` 的注释，写明 view 要在 `sync` 里处理等级
- [x] 具名 Fixture `allTowerLevels`（所有塔种 × 所有等级并排）和对应的 Scenarios story；Entities/Towers 的 story 增加 level 控件
- [x] 升级和卖出特效的 story，通过 `effects` 冻结在第一帧
- [x] `pnpm shots` 过滤相关 story，带和不带 Debug overlay 各看一遍，确认三个等级一眼能区分
- [x] 在 ticket 评论里记录：如果以后换成精灵图皮肤，需要改动哪些文件。如果超出"新 Skin + 资源"，说明原因或提出 prefactor

## Comments

- 2026-10-05 完成。
  - **验证**：
    - `pnpm typecheck`、`pnpm lint` 通过；`pnpm test` 共 132 个测试通过。
    - 截图看过：`pnpm shots towers`、`pnpm shots all-tower-levels`，带和不带 Debug overlay 都看过。
    - 用 Playwright 在 `pnpm dev` 里把一座塔从 Lv1 连升到 Lv3：已有的 view 当场重画，播放升级光环，控制台没有报错。
    - **缺口检测**：临时删掉 Polygon 皮肤的第 3 级外形后，`pnpm test:stories` 有 4 个 story 失败（Scenarios/All Tower Levels、Towers/Level 3 等），报错是 `Polygon skin has no look for "basic" level 3`。之后已恢复。
  - **外形**：基础形状不变，三级的缩放是 1 / 1.12 / 1.24；Lv2 加浅色描边，Lv3 加金色描边；塔身下部画等级点（几级就几个点）。
    - 等级点一开始画在塔身下方，但 Lv3 时会和 Slot 的边框重叠，所以改到塔身上，用深色。
  - **和 ticket 不一致的地方**：
    - `towerSold` 事件加了 `x`、`y`（Slot 中心）。`Skin.playEffect` 拿不到关卡数据，没法自己算位置；这和 `enemyKilled` 带坐标是同一个做法。spec 和测试已同步。
    - Polygon 皮肤遇到未知塔种时，现在也报 `console.error`，不再静默画回退三角形。这样符合 ADR-0002"Skin 必须覆盖单位目录里每个 (kind, level)"。未知敌人种类的行为没变。
    - 塔种颜色 `towerColor` 和 UI 字体 `uiFont` 移到了 `palette.ts`，避免 tower-view 和 effects 互相引用。
  - **扩展性检查：以后换成精灵图皮肤需要改哪些地方**
    - 新增 `src/render/skins/<id>/`：实现 `Skin`。`preload` 加载图集；`createTowerView` 在 `sync` 里按 `(kind, level)` 换帧；`playEffect` 处理 `towerSold`；view 的 `onEvent` 处理 `towerUpgraded`；提供 Theme tokens（包括 02 新增的 `range`、`danger`）。
    - 在 `src/render/skins/index.ts` 注册这个皮肤。
    - 用 `?skin=<id>` 和 Scenarios/All Tower Levels 的 story 验收。
    - 不需要改 content、Simulation、WorldRenderer、场景、HUD 和面板。符合"新 Skin + 资源"的标准，不需要 prefactor。
