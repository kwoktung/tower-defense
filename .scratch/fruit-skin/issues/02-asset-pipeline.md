# 02 — 素材生产线与皮肤骨架

**What to build:** `pnpm art:fruit` 一条命令把原图处理成图集：去背、裁边、缩放、打包，输出图集 PNG、Phaser 图集 JSON 和平铺纹理。再加一个 fruit 皮肤的骨架：注册到皮肤表、在 `preload` 里加载图集，用占位外形先跑通。可以先用占位图开发，和 01 并行。

参考 spec：`../spec.md` 的"素材生产线""fruit 皮肤（注册、preload）""Testing Decisions"。

**Blocked by:** None — can start immediately

**Status:** done

- [x] 清单文件（提交到 git）：每个原图文件对应哪个帧名、目标尺寸（显示尺寸的 2 倍），以及它是精灵还是平铺纹理
- [x] 生产线脚本：调用 `magick` 完成以下步骤：
  - 去掉品红背景，并清理边缘残留
  - 裁掉多余的空白
  - 用 Lanczos 缩放到目标尺寸
  - 逐行排列打包成一张图集，输出图集 PNG 和 Phaser hash 格式的 JSON
  - 纹理图单独输出
  - 清单里标了 rembg 的图改用 rembg（rembg 没装时给出清楚的提示）
- [x] `package.json` 增加 `art:fruit` 命令；同样的输入跑两次，输出的文件完全相同
- [x] 占位原图：用 ImageMagick 生成品红背景加简单彩色形状的图，让整条流程在真素材到位之前就能跑通
- [x] fruit 皮肤骨架：
  - 注册到皮肤表，默认皮肤仍然是 Polygon
  - 图片通过模块导入获得地址，`preload` 里加载图集和纹理
  - 各个 view 先用图集里的帧显示，不做动画
  - 缺帧时画回退外形并报 `console.error`
- [x] 确认游戏（`?skin=fruit`）、Storybook（皮肤下拉框）和 `pnpm shots` 都能加载到图片；如果截图脚本只用默认皮肤，加一个指定皮肤的参数
- [x] `pnpm typecheck && pnpm lint && pnpm test` 通过

## Comments

- 2026-10-05 完成。
  - **`pnpm art:fruit`**（`scripts/art-fruit.ts`，清单 `art/fruit/manifest.json`）：
    1. 从左上角取背景色，全图按 22% 容差去掉，再把边缘收缩 1 像素。这样连被角色包围、和外围背景不相连的品红区域（比如腿之间、翅膀里）也能去掉。
    2. 按"空列"把一张图切成几帧（相距 24 像素以内的碎块算同一帧，例如菠萝手里的小块）。
    3. 裁掉空白。
    4. **同一张图里的帧用同一个缩放比例**，让最大的帧正好放进 box。这样 Lv3 不会比 Lv1 小，果蝇也比甲虫小。
    5. 用逐行排列打包成 512 宽的图集，输出 Phaser hash 格式的 JSON。
    6. 纹理裁成正方形，缩到 128×128。
  - **可复现**：连跑两次，四个输出文件的 md5 完全相同。办法是去掉 PNG 里的时间戳和元数据（`-strip`，再排除 date、time 块）。
  - **和 ticket 不一致的地方**：
    - 没有做占位图。01 当天就出了真图，所以直接用真图开发。
    - 皮肤骨架和 04 一起完成了。
    - 截图脚本加了 `--skin=<id>` 参数，输出文件名会带上 `--<id>` 后缀。
  - **rembg 没用上**：所有图用品红去背都干净（包括果蝇的半透明翅膀），所以脚本没有实现 rembg 分支。
