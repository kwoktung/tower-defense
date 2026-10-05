# 01 — Simulation：塔等级、升级与卖塔

**What to build:** 单位目录支持每种塔 3 个等级，Simulation 提供升级、卖塔的动作和只读查询，发出 `towerUpgraded` / `towerSold` 事件。这张 ticket 不涉及 UI 和外形，但要让现有游戏照常可玩（所有塔都是 Lv1）。

参考 spec：`../spec.md` 的"单位目录""Simulation""Testing Decisions"。

**Blocked by:** None — can start immediately

**Status:** done

- [x] schema：每种塔改为 `name` + `levels[]`，每级是完整属性；顶层加 `sellRefundRatio`。`content/units.json` 按 spec 的初始数值表填写
- [x] 所有读塔属性的地方（塔开火、子弹、HUD 的造价、悬停射程预览等）改为按等级查 `levels[level - 1]`；建议在 Simulation 里提供一个统一的"按 kind + level 查属性"函数，供 UI 复用
- [x] `Tower` 加 `level`，新建的塔是 1；`Projectile` 记录开火时的塔等级
- [x] `canUpgradeTower` / `upgradeTower` / `sellValue` / `sellTower`，失败原因见 spec；动作复用查询里的判断
- [x] 新 SimEvent `towerUpgraded`、`towerSold`，字段见 spec
- [x] Fixture builder：`withTower` 支持指定等级
- [x] 测试（通过公开 API）：spec "Testing Decisions" 里列的所有情况
- [x] CONTEXT.md 的 Tower / Unit catalog 条目如有需要随实现微调

## Comments

- 2026-10-05 完成。
  - **验证**：`pnpm typecheck`、`pnpm lint` 通过；`pnpm test` 共 115 个测试通过（unit 78 个，其中新增 18 个；其余是 story 冒烟测试）。
  - **和 ticket 不一致的地方**：
    - "按 kind + level 查属性"的函数放在 `src/content/schemas.ts`（`towerStats`、`towerInvestment`），而不是 Simulation 里。它只读单位目录，Simulation 和 UI 都能直接用，不必经过 Simulation 实例。
    - `canUpgradeTower` / `upgradeTower` 返回同一个 `UpgradeCheck` 类型；`sellTower` 成功时返回 `{ ok: true, refund }`。
  - **顺带的改动**：Debug overlay 的塔标签加上了等级（`#id kind L2`）。
  - **测试写法**：升级相关的测试从单位目录读数值，不写死，所以 04 调数值时不会让规则测试失败。
  - **CONTEXT.md**：不需要再改，grilling 时加的 Tower level、Sell value 和 Unit catalog 的描述与实现一致。
