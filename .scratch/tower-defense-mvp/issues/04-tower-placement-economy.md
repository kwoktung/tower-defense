# 04 — 造塔与经济

**What to build:** 玩家在 HUD 上选择 basic 塔，鼠标悬停 Slot 时能预览射程，点击空 Slot 就造出一座蓝色正方形的塔并扣钱。钱不够时按钮变灰，造塔失败。这一张里塔还不会攻击，攻击由 05 实现。

参考 spec：`../spec.md`，包括"Simulation"的公开 API 和造塔规则，以及"Phaser 场景"的 HUD 部分。

**Blocked by:** 03 — 敌人：开波、沿路径行进、漏怪与失败

**Status:** ready-for-agent

- [ ] 单位目录 schema 加入塔（basic：造价、射程、伤害、冷却、子弹速度、攻击方式为单体）
- [ ] `placeTower(slotId, kind)` 成功时扣造价，返回新塔的 id，并产生造塔事件；失败时返回原因：Slot 已被占用、金币不足、Slot 不存在、游戏已结束
- [ ] HUD 显示金币（琥珀色）。塔选择按钮显示名称和造价，选中的高亮，金币不足时变灰
- [ ] 鼠标悬停空 Slot 时高亮，并预览所选塔的射程；点击空 Slot 造塔；点击已有塔的 Slot 没有反应
- [ ] Polygon 皮肤：basic 塔是蓝色正方形
- [ ] Debug overlay 显示每座塔的射程圈
- [ ] Fixture builder 支持在指定 Slot 放塔、设置金币。具名 Fixture 有 `lowGold`
- [ ] Story：Entities/Towers（空闲、悬停射程）、HUD（金币不足）
- [ ] 测试（Seam 1）：造塔成功时扣钱、有事件，以及每一种失败原因
