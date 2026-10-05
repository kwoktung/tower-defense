# 02 — 素材生产线与皮肤骨架

**What to build:** `pnpm art:fruit` 一条命令把原图处理成图集：去背、裁边、缩放、打包，输出图集 PNG、Phaser 图集 JSON 和平铺纹理。再加一个 fruit 皮肤的骨架：注册到皮肤表、在 `preload` 里加载图集，用占位外形先跑通。可以先用占位图开发，和 01 并行。

参考 spec：`../spec.md` 的"素材生产线""fruit 皮肤（注册、preload）""Testing Decisions"。

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [ ] 清单文件（提交到 git）：每个原图文件对应哪个帧名、目标尺寸（显示尺寸的 2 倍），以及它是精灵还是平铺纹理
- [ ] 生产线脚本：调用 `magick` 完成以下步骤：
  - 去掉品红背景，并清理边缘残留
  - 裁掉多余的空白
  - 用 Lanczos 缩放到目标尺寸
  - 逐行排列打包成一张图集，输出图集 PNG 和 Phaser hash 格式的 JSON
  - 纹理图单独输出
  - 清单里标了 rembg 的图改用 rembg（rembg 没装时给出清楚的提示）
- [ ] `package.json` 增加 `art:fruit` 命令；同样的输入跑两次，输出的文件完全相同
- [ ] 占位原图：用 ImageMagick 生成品红背景加简单彩色形状的图，让整条流程在真素材到位之前就能跑通
- [ ] fruit 皮肤骨架：
  - 注册到皮肤表，默认皮肤仍然是 Polygon
  - 图片通过模块导入获得地址，`preload` 里加载图集和纹理
  - 各个 view 先用图集里的帧显示，不做动画
  - 缺帧时画回退外形并报 `console.error`
- [ ] 确认游戏（`?skin=fruit`）、Storybook（皮肤下拉框）和 `pnpm shots` 都能加载到图片；如果截图脚本只用默认皮肤，加一个指定皮肤的参数
- [ ] `pnpm typecheck && pnpm lint && pnpm test` 通过
