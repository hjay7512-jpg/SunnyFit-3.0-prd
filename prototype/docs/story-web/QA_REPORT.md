# QA — technical checks, not visual approval

2026-11-14。当前八幕仍为工作稿；用户已否定首版的一镜到底和品牌执行。以下技术检查不能替代视觉验收。

## 静态入口修复

已复现：系统减少动效开启时，旧版直接显示 8 张静态卡片，滚轮只移动文档，时间轴始终为 0。旧截图脚本默认强制 `no-preference`，未覆盖真实用户这个入口；不能将之前的 render-mode 通过当成预览入口可用。

修复后增加静态提示、显式开启按钮、双向模式切换和 URL 选择保持。`motion=full` 在用户主动选择后优先于系统减少动效；默认入口仍尊重系统。

本地构建通过。`story-motion-entry-check.cjs` 在 1440×900 与 390×844 下均通过：系统减少动效 → 点击开启 → 实际滚轮推进/倒放 → 停滚静止 → 刷新保持 → 切回静态；直接运镜链接在系统减少动效开启时也通过。共 6 组真实滚轮检查，页面运行错误为 0。证据：`output/story-motion-entry/report.json`、同目录 before/forward 截图及 `docs/story-web/motion-entry-test.log`。

- Vue production build：通过；保留原有 bundle-size 警告。
- Story data / state：7 项通过，覆盖 ledger、无未来记录、2,160 帧反向复现、共享元素边界连续性、小球姿态、24 key states、照片与手机共用相机约束。
- Browser：1440×900、1366×768、1920×1080、390×844、375×812 的八幕无图片缺失/横向溢出；8 个重复帧允许极细微抗锯齿差异；停滚静止、反滚、Skip focus、8 张 reduced-motion cards 通过。
- 新修订截图：`output/story-revision-camera/`。旧 `output/story-keyframes/` 与 MP4 不代表当前方案。
- `test:components`：通过。
- `test:ai-ball`：运动单测及 7 项浏览器检查通过，后续失败在找不到「模拟 LLM 失败并释放额度」checkbox。
- `test:home-ui`：失败于现有 Home header `display:flex` 与旧测试期望 `grid` 不同。
- `test:prototype-flow`：前 2 项通过，后续等待 `Activate Plan` 按钮超时。

后三项失败已在 **修改前 c58bd62 源码的隔离 baseline** 重新构建并运行，复现相同失败点。未为通过这些测试改动商业规则、计划流程或 Home 布局。Baseline 使用独立临时数据库，证据记录在 `baseline-regression.json`。

原源码另有一个 `el-table-column` 缺少闭合标签，导致开发编译 overlay；本次只修复闭合标签，没有改变其业务逻辑。原始问题记录在仓库 `.loop/dev/notes/story-handoff-for-codex.md`。截图脚本已拒绝带编译 overlay 的页面。

视觉检查仍待完成：开场手机合成自然度、第一段运镜方向、后续转场节奏、App UI 保真、品牌视觉审核。没有将当前修订稿标为完成或发布。
