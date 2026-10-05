# 02 — 统一几何计算：Slot 中心坐标和 Point 类型

**What to build:** 两处几何上的重复要收拢：
- "按 slotId 找到 Slot，再算出格子中心"这段逻辑，现在 Simulation、皮肤、Debug overlay 和 story 各写了一份。改成一个共用函数，这些地方都调用它。
- 子弹的当前位置和目标位置改用已有的 `Point` 类型表示，不再用四个零散的坐标字段。

这是一次纯重构，画面和规则都不变。

来源：MVP 代码审查的 Standards 部分（"按 slotId 找 Slot 再算格子中心"至少重复 5 次；子弹的坐标字段属于 Data Clumps）。

**Blocked by:** None — can start immediately

**Status:** done

- [x] 有一个由 Simulation 层提供的共用函数，根据关卡和 slotId 返回 Slot 中心的世界坐标。slotId 不存在时的行为要明确（返回 undefined 或抛错），并在调用处处理
- [x] Simulation 的塔位置计算、塔视图、地图的射程预览、Debug overlay、story 的镜头聚焦，都改为调用这个函数。全仓库不再有第二份同样的计算
- [x] SimState 里子弹的当前位置和目标位置使用 `Point` 类型。Simulation、子弹视图、Debug overlay、Fixture、story 都同步更新，SimState 仍然可以直接序列化
- [x] 原有测试全部通过（如果断言里写了坐标字段，按新结构更新断言，但断言的含义不变）
- [x] 全量 Shots 截图和改动前一致，抽查塔、子弹、溅射相关的截图

## Comments

- 2026-10-05 完成。
  - **Slot 中心坐标**：在路径几何模块里新增 `slotCenter(level, slotId)`，返回 Slot 中心的世界坐标；slotId 不存在时返回 `undefined`。塔的位置计算、塔视图、地图的射程预览、Debug overlay、story 的镜头聚焦都改为调用它。现在全仓库只有 `slotCenter` 自己在做"按 id 找 Slot 再算格子中心"。
    - 各调用处对 `undefined` 的处理：塔视图和 Debug overlay 跳过这座塔；射程预览不画；story 不聚焦镜头。
    - Simulation 里的 `towerPosition` 用了非空断言，因为塔只会建在存在的 Slot 上（`placeTower` 和 Fixture 都做了检查），注释里说明了这一点。
  - **子弹坐标改用 `Point`**：SimState 里的子弹不再用 `x/y/targetX/targetY` 四个字段，改为两个 `Point`：
    - `position`：子弹当前所在的位置。
    - `destination`：子弹正飞向的位置，也就是目标的位置；目标消失后是目标最后已知的位置。

    `destination` 没有叫 `target`，是为了不和已有的 `targetId`（目标敌人的 id）混淆。`projectileHit` 事件仍然带 `x`、`y` 两个字段，事件结构不在本 ticket 的范围内。
  - **验证**：
    - typecheck、lint 都通过；94 个测试全部通过（现有测试没有直接读取子弹的坐标字段，所以不需要改断言）。
    - 改动前后各跑一次完整的 `pnpm shots`，88 张截图逐字节对比，**88/88 完全一致**。
