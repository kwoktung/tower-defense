# 01 — 建造规则只放在 Simulation 里

**What to build:** 判断"这个 Slot 能不能造这种塔"的规则只在 Simulation 里实现一次。HUD 判断造塔按钮是否可点、Game 场景判断鼠标悬停的 Slot 是否为空，都改为向 Simulation 查询，不再在外面自己比较金币或检查 Slot 是否被占用。玩家能感知的行为保持不变。

来源：MVP 代码审查的 Standards 部分（"规则在 Simulation 之外重复实现"）。CONTEXT.md 规定 Simulation 掌管所有规则。

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [ ] Simulation 提供一个只读查询：给定 Slot 和塔的种类，返回能否建造；不能时返回原因，原因的取值和 `placeTower` 的失败原因一致（游戏已结束、Slot 不存在、种类不存在、Slot 已被占用、金币不足）。这个查询不修改状态，也不产生事件
- [ ] `placeTower` 内部复用同一个判断，不另写一份
- [ ] HUD 判断"买不买得起"改为调用这个查询，或者调用基于它的、不需要指定 Slot 的变体。HUD 代码里不再出现"金币和造价比较"
- [ ] Game 场景判断悬停的 Slot 是否为空，改为调用 Simulation 的查询。场景代码里不再自己遍历塔列表
- [ ] 通过 Simulation 的公开 API 测试这个查询：每种失败原因各一例，另有一例可以建造；并验证查询前后状态不变
- [ ] 原有测试全部通过；`HUD/LowGold`、`Entities/Towers` 的悬停射程预览等相关截图和改动前一致
