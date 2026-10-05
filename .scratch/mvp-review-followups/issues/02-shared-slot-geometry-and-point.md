# 02 — 统一几何计算：Slot 中心坐标和 Point 类型

**What to build:** 两处几何上的重复要收拢：
- "按 slotId 找到 Slot，再算出格子中心"这段逻辑，现在 Simulation、皮肤、Debug overlay 和 story 各写了一份。改成一个共用函数，这些地方都调用它。
- 子弹的当前位置和目标位置改用已有的 `Point` 类型表示，不再用四个零散的坐标字段。

这是一次纯重构，画面和规则都不变。

来源：MVP 代码审查的 Standards 部分（"按 slotId 找 Slot 再算格子中心"至少重复 5 次；子弹的坐标字段属于 Data Clumps）。

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [ ] 有一个由 Simulation 层提供的共用函数，根据关卡和 slotId 返回 Slot 中心的世界坐标。slotId 不存在时的行为要明确（返回 undefined 或抛错），并在调用处处理
- [ ] Simulation 的塔位置计算、塔视图、地图的射程预览、Debug overlay、story 的镜头聚焦，都改为调用这个函数。全仓库不再有第二份同样的计算
- [ ] SimState 里子弹的当前位置和目标位置使用 `Point` 类型。Simulation、子弹视图、Debug overlay、Fixture、story 都同步更新，SimState 仍然可以直接序列化
- [ ] 原有测试全部通过（如果断言里写了坐标字段，按新结构更新断言，但断言的含义不变）
- [ ] 全量 Shots 截图和改动前一致，抽查塔、子弹、溅射相关的截图
