# 04 — 造塔与经济

**What to build:** 玩家在 HUD 上选择 basic 塔，鼠标悬停 Slot 时能预览射程，点击空 Slot 就造出一座蓝色正方形的塔并扣钱。钱不够时按钮变灰，造塔失败。这一张里塔还不会攻击，攻击由 05 实现。

参考 spec：`../spec.md`，包括"Simulation"的公开 API 和造塔规则，以及"Phaser 场景"的 HUD 部分。

**Blocked by:** 03 — 敌人：开波、沿路径行进、漏怪与失败

**Status:** done

- [x] 单位目录 schema 加入塔（basic：造价、射程、伤害、冷却、子弹速度、攻击方式为单体）
- [x] `placeTower(slotId, kind)` 成功时扣造价，返回新塔的 id，并产生造塔事件；失败时返回原因：Slot 已被占用、金币不足、Slot 不存在、游戏已结束
- [x] HUD 显示金币（琥珀色）。塔选择按钮显示名称和造价，选中的高亮，金币不足时变灰
- [x] 鼠标悬停空 Slot 时高亮，并预览所选塔的射程；点击空 Slot 造塔；点击已有塔的 Slot 没有反应
- [x] Polygon 皮肤：basic 塔是蓝色正方形
- [x] Debug overlay 显示每座塔的射程圈
- [x] Fixture builder 支持在指定 Slot 放塔、设置金币。具名 Fixture 有 `lowGold`
- [x] Story：Entities/Towers（空闲、悬停射程）、HUD（金币不足）
- [x] 测试（Seam 1）：造塔成功时扣钱、有事件，以及每一种失败原因

## Comments

- 2026-10-04 完成。
  - **验证**：
    - 30 个单元测试和 14 个 story 冒烟测试全部通过。造塔的单元测试覆盖了成功，以及 5 种失败原因（失败时状态不变）。
    - 在 dev 里实际操作过：造塔扣 50 金币；点已有塔的 Slot 没有反应；剩 20 金币时造不了；点非 Slot 的位置没有效果。
    - 看过 28 张截图。
  - **和 spec 或 ticket 不一致的地方**：
    - **`placeTower` 多了一种失败原因 `unknownKind`**（塔的 kind 不存在）。
    - **塔配置用 `attack: { mode: 'single' } | { mode: 'splash', radius }` 表示攻击方式**。溅射塔缺少 radius 会被 schema 拒绝，已有测试。
    - **塔的显示名 `name` 放在单位目录里**（"基础塔"），HUD 按钮直接读取。新增一种塔就不需要改 HUD 代码。
    - **Skin 接口拆成了 `createTowerView` 和 `createEnemyView` 两个方法**，替代原来的 `createView(ref)`，类型更明确。05 会再加一个子弹视图的方法。
    - **`MapView.setSlotHover(id)` 改成了 `setHover({ slotId, rangePreview })`**，由皮肤自己画射程预览。
    - **"选中了哪种塔"属于界面状态，不属于游戏状态**：它放在 Game 和 HUD 两个场景共享的 UiState 里，不在 SimState 里。默认选中单位目录里的第一种塔。
  - **已知小问题**：
    - 金币不足时，悬停 Slot 仍会显示射程预览。保留它是因为这只是信息提示。
    - 开 Debug 时，Slot 的 id 和坐标文字会压在塔身上。
