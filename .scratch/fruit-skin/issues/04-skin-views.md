# 04 — 实现水果皮肤

**What to build:** 用 03 生成的图集，把 fruit 皮肤做完整：

- 地图：草地、泥土小路、土坑
- 塔：按等级换帧，开火和升级有动画
- 敌人：翻转朝向、弹跳、闪白、酸汁减速效果
- 子弹和果汁配色的特效
- 果园配色的 Theme tokens

只新增 Skin 和资源，不改其他层。

参考 spec：`../spec.md` 的"fruit 皮肤""不变的部分"，以及 `docs/adr/0002-skins-own-tower-level-appearance.md`。

**Blocked by:** 02 — 素材生产线与皮肤骨架；03 — 生成全部素材

**Status:** done

- [x] 地图：草地纹理平铺铺满背景；路径的几何形状不变，填充改为泥土纹理；格子画土坑图，鼠标悬停时提亮；建造射程预览用代码画
- [x] 塔：每个 (kind, level) 一帧，`sync` 发现等级变化时换帧；开火时挤压一下；升级时弹一下并有金色闪光；缺帧时报 `console.error`
- [x] 敌人：
  - 不旋转；往左走时翻转，竖直路段保持之前的朝向
  - 走路时上下弹跳，频率随速度变化
  - 被打中时闪白（用着色或叠加实现），保留血条
  - 被减速时显示黄绿色的酸汁环，并叠一层淡黄绿色
  - 缺帧时报 `console.error`
- [x] 子弹：按塔种用对应的帧
- [x] 特效（用代码画）：
  - 命中和溅射：对应塔的果汁色
  - 击杀：汁滴或叶片散开
  - 卖出：保持"收缩 + 金币飘字"
- [x] Theme tokens：温暖的果园色调；确认 HUD、塔面板、射程圈、警示色在草地背景上都清楚
- [x] 缺帧检测：临时删掉图集里的一帧，确认对应的 story 失败；验证完恢复
- [x] Shots：用 fruit 皮肤截图，覆盖 spec 列出的 story（带和不带 Debug overlay），逐张看过
- [x] 扩展性检查：在评论里列出改动了哪些文件；如果超出"新 Skin + 资源 + 必要的生产线和截图脚本"，说明原因（这是对 ADR-0002 的检验）
- [x] `pnpm typecheck && pnpm lint && pnpm test` 通过

## Comments

- 2026-10-05 完成。
  - **验证**：
    - `pnpm typecheck`、`pnpm lint` 通过；`pnpm test` 共 172 个测试通过，其中新增 3 个 fruit 皮肤的 story。
    - 截图看过：`pnpm shots <filter> --skin=fruit`，覆盖 All Tower Levels、Slowing Fast Enemies、Armored Wave、HUD 的提前叫波。
    - 用 Playwright 在 `pnpm dev?skin=fruit` 里建 5 座塔、连开 4 波：画面正常，只有无头浏览器截图引起的 GPU 警告，没有游戏报错。
  - **缺口检测**：临时删掉图集 JSON 里的 `tower-slow-3`，"All Tower Levels Fruit" 这个 story 失败，报错是 `Fruit skin has no look for "slow" level 3`。之后用 `pnpm art:fruit` 恢复。
  - **新增的 fruit story**（Scenarios 下 All Tower Levels / One Of Each Enemy / Armored Wave 的 Fruit 版）：story 冒烟测试只渲染默认皮肤，加上这几个，冒烟测试才会覆盖到 fruit 皮肤。
  - **实现要点**：
    - **路径**：每一段直路和每个拐点各用一个 TileSprite，按世界坐标对齐纹理，所以拼接处是连续的，不需要遮罩。路径的边缘一开始用半透明色，拐角处叠加后会变深，改成了不透明色。
    - **敌人朝向**：不旋转；往左走时翻转，竖直路段保持之前的朝向。
    - **走路弹跳**：按走过的距离（pathT）计算，所以快的虫子弹得快，冻结的截图也稳定。
    - **闪白和减速**：被打中时闪白用 `setTint(白).setTintMode(FILL)`（Phaser 4 的写法）；被减速时叠一层淡黄绿色，脚下有一圈"酸汁"环。
    - **塔**：每级在原图大小之上再放大 1 / 1.06 / 1.12 倍；开火时挤压一下，升级时弹一下并有金色光环。
  - **扩展性检查（ADR-0002）**：
    - **新增**：`src/render/skins/fruit/`、素材、生产线脚本、清单和提示词记录、截图脚本的 `--skin` 参数。注册皮肤只改了一行。
    - **改动了其他层的唯一一处**：`projectileHit` 事件新增 `kind` 字段，记录开火的塔种。原来的事件不说明是哪种塔的子弹，皮肤就没法按塔种给命中特效配果汁色（Polygon 皮肤用的是同一种黄色，所以以前没暴露这个问题）。这是对事件的补充，原有的用法都不受影响。
