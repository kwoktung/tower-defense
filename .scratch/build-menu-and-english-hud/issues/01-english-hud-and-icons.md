# 01 — 英文 HUD、字符串表与 Skin 图标

**What to build:** 把 HUD、结算画面和 tower-panel 的中文全部换成"图标 + 数字 + 英文短词"。所有文案集中到 `src/render/strings.ts`。塔名从 Unit catalog 移到字符串表。Skin 新增 `createIcon`，polygon 和 fruit 都要实现。顶栏的塔种按钮这次**保留**（02 才删），但按钮文字改为 `towerName(kind)` 加金币图标和费用。

参考 spec：`../spec.md` 的"字符串表""HUD 文案与图标""Skin""文档""Testing Decisions"。

**Blocked by:** None — can start immediately

**Status:** done

- [x] `src/render/strings.ts`：带类型的 `en` 对象，插值用函数，并提供 `towerName(kind)`
- [x] `content/units.json` 和 schema 删除 `name`；所有读 `name` 的地方改为 `towerName(kind)`
- [x] `Skin.createIcon(scene, name)`，`IconName` 包括 `heart | coin | flag | play | retry | upgrade`；polygon 和 fruit 都实现；未知图标渲染 fallback 并报 `console.error`
- [x] 顶栏：`[heart] lives`、`[coin] gold`、`[flag] n/total`
- [x] 开波按钮：`▶ Start` / `▶ 5` / `▶ +12`（带金币图标）/ 出怪中置灰 / 最后一波隐藏；`▶` 用 `play` 图标画
- [x] 结算画面：`Victory` / `Defeat` + `[retry] Retry`
- [x] tower-panel：属性名 `DMG / RATE / RANGE / SPLASH / SLOW`，单位写 `/s`、`s`；按钮 `[upgrade] 120` / `Sell +60` / `Confirm +60` / `MAX`；面板标题显示塔名
- [x] 新增图标 story：两个皮肤各一份，并排列出全部图标
- [x] 更新 HUD / TowerPanel stories；`named.ts` 里的中文注释（例如"出怪中"）同步改掉
- [x] CJK 防回流单元测试：扫描 `src/render/**`（不含 stories）和 `content/**`
- [x] ADR-0002 补一句"HUD 图标属于 Skin"；CONTEXT.md 的 HUD 条目注明文案来源是 `strings.ts`
- [x] `pnpm shots hud`、`pnpm shots panel` 检查截图，打开和关闭 Debug overlay 各看一遍
- [x] `pnpm typecheck && pnpm lint && pnpm test`

## Comments

- 2026-10-06 完成。
  - **验证**：`pnpm typecheck`、`pnpm lint` 通过；`pnpm test` 177 个测试中 176 通过、1 跳过（原本就跳过的 balance 报告）。新增 1 个 CJK 测试和 4 个图标 story 冒烟测试。第一次跑 `pnpm test` 时有 2 个 story 文件没加载上，没有报错信息，像是 Vite 在为新 story 文件重新优化依赖；之后连续两次全部通过。
  - **Shots**：检查了 `icons`、`hud`、`panel`，打开和关闭 Debug overlay 各看一遍；fruit 皮肤抽查了 HUD 和面板。
  - **和 ticket 不一致的地方**：
    - 两个皮肤的图标形状放在共享的 `src/render/skins/vector-icons.ts`，每个皮肤只提供自己的 `IconStyle`（颜色；fruit 多一圈卡通描边）。以后换成精灵图皮肤时，改由自己的 `createIcon` 提供。
    - `createIcon(scene, name, size)` 返回一个以原点为中心的 Container。
    - 按钮和文字支持混排的 `Label`（文字和 `{ icon }` 组成的数组），由 `createLabel` 排版。`createButton`、`createHud`、`createTowerPanel` 改为接收 `UiSkin`（Skin 的 `theme` + `createIcon`）。`HudSceneData.theme` 改为 `skin`。
    - 出怪中时开波按钮只显示一个置灰的 `[play]`；最后一波时 `nextWave` 为 null，按钮隐藏。
    - 慢速塔的英文名定为 `Frost`。
    - CJK 测试豁免 `strings.ts` 本身，因为以后的翻译就放在那里。
