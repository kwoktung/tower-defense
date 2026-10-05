# 01 — 建造规则只放在 Simulation 里

**What to build:** 判断"这个 Slot 能不能造这种塔"的规则只在 Simulation 里实现一次。HUD 判断造塔按钮是否可点、Game 场景判断鼠标悬停的 Slot 是否为空，都改为向 Simulation 查询，不再在外面自己比较金币或检查 Slot 是否被占用。玩家能感知的行为保持不变。

来源：MVP 代码审查的 Standards 部分（"规则在 Simulation 之外重复实现"）。CONTEXT.md 规定 Simulation 掌管所有规则。

**Blocked by:** None — can start immediately

**Status:** done

- [x] Simulation 提供一个只读查询：给定 Slot 和塔的种类，返回能否建造；不能时返回原因，原因的取值和 `placeTower` 的失败原因一致（游戏已结束、Slot 不存在、种类不存在、Slot 已被占用、金币不足）。这个查询不修改状态，也不产生事件
- [x] `placeTower` 内部复用同一个判断，不另写一份
- [x] HUD 判断"买不买得起"改为调用这个查询，或者调用基于它的、不需要指定 Slot 的变体。HUD 代码里不再出现"金币和造价比较"
- [x] Game 场景判断悬停的 Slot 是否为空，改为调用 Simulation 的查询。场景代码里不再自己遍历塔列表
- [x] 通过 Simulation 的公开 API 测试这个查询：每种失败原因各一例，另有一例可以建造；并验证查询前后状态不变
- [x] 原有测试全部通过；`HUD/LowGold`、`Entities/Towers` 的悬停射程预览等相关截图和改动前一致

## Comments

- 2026-10-05 完成。
  - **新增查询**：Simulation 增加了三个只读查询，都基于塔系统里同一组规则：
    - `canPlaceTower(slotId, kind)`：返回和 `placeTower` 相同的失败原因。`placeTower` 自己也先调用它。
    - `canAfford(kind)`：不需要指定 Slot，HUD 用来判断按钮是否可点。
    - `isSlotFree(slotId)`：Game 场景用来判断悬停的 Slot 是否为空。
  - **为什么是三个，不是一个**：`canPlaceTower` 必须指定 Slot 和种类，但 HUD 判断按钮时没有 Slot，悬停判断空位时也不应该受金币影响（金币不足时仍然要显示射程预览）。所以加了两个更窄的变体。三者共用同一组内部判断，金币比较和 Slot 占用检查在整个代码库里各只出现一次。
  - **验证**：
    - 94 个测试全部通过，新增 8 个查询测试：`canPlaceTower` 的 5 种失败原因与 `placeTower` 一致、可以建造时不改状态也不产生事件、`canAfford`、`isSlotFree`。
    - HUD 和塔相关的 26 张截图与改动前逐字节一致。
    - 在 dev 里实际操作：造塔、点已占用的 Slot、金币不足时尝试造两种塔，结果都和改动前一致，控制台没有报错。
