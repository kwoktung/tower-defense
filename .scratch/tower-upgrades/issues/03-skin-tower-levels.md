# 03 — Skin：按等级显示塔的外形与升级 / 卖出特效

**What to build:** 塔的外形随等级变化，升级和卖出时有一次性特效。按 ADR-0002 的约定实现：Skin 接口签名不变，view 在 `sync` 里自己处理等级变化；Skin 缺某个 (kind, level) 组合时报 `console.error`。

参考 spec：`../spec.md` 的"渲染与皮肤""Fixture 与 story"，以及 `docs/adr/0002-skins-own-tower-level-appearance.md`。

**Blocked by:** 01 — Simulation：塔等级、升级与卖塔

**Status:** ready-for-agent

- [ ] Polygon 皮肤的塔 view 在 `sync` 里发现等级变化就重画：基础形状不变，按等级放大（约 1.0 / 1.1 / 1.2 倍）、Lv2 起加描边、塔下方显示等级标记点
- [ ] 塔 view 在 `onEvent` 里处理 `towerUpgraded`，播放升级特效（比如一圈向外扩散的光环）；确认 WorldRenderer 把这个事件转给了对应的塔 view
- [ ] `Skin.playEffect` 处理 `towerSold`，在原位置播放卖出特效（比如塔形淡出 + 金币色的 `+X`）
- [ ] Polygon 皮肤遇到超出它能画的等级时，按 ADR-0002 画回退外形并报 `console.error`
- [ ] 更新 `src/render/skin.ts` 里 `createTowerView` 的注释，写明 view 要在 `sync` 里处理等级
- [ ] 具名 Fixture `allTowerLevels`（所有塔种 × 所有等级并排）和对应的 Scenarios story；Entities/Towers 的 story 增加 level 控件
- [ ] 升级和卖出特效的 story，通过 `effects` 冻结在第一帧
- [ ] `pnpm shots` 过滤相关 story，带和不带 Debug overlay 各看一遍，确认三个等级一眼能区分
- [ ] 在 ticket 评论里记录：如果以后换成精灵图皮肤，需要改动哪些文件。如果超出"新 Skin + 资源"，说明原因或提出 prefactor
