# SunnyFit Web — work in progress

当前状态：首版被用户否定，**不视为官网交付完成**。用户要求先确认页面，暂停视频制作。旧 MP4 与旧 `story-keyframes` 只属于被否定的首版，不代表当前视觉。

## 当前评审入口

在 `prototype/` 运行 `npm run story:dev`，打开：

- `http://127.0.0.1:8097/#/demo/story-web?review=opening`：当前优先评审的 0–24 秒开场。
- `http://127.0.0.1:8097/#/demo/story-web?review=opening&debug=1`：开场时间轴。
- `http://127.0.0.1:8097/#/demo/story-web`：八幕工作稿，后续镜头尚未完成视觉验收。

### 静态与滚动模式

此前浏览器开启 `prefers-reduced-motion` 时，页面无提示地切成多张静态 Scene Cards，这是用户看不到运镜的原因。现在默认尊重系统偏好，同时提供显式切换：

- 静态版顶部说明当前模式，并提供 **Enable scroll experience** 按钮。
- 导航的 **Motion: on / off** 可双向切换；选择保存到 URL，刷新后保留。
- 直接运镜预览：`http://127.0.0.1:3198/?v=motion-mode-fixed#/demo/story-web?motion=full`。
- 单独评审开场：在 story route 查询参数加 `review=opening&motion=full`。
- `motion=reduce` 明确进入静态版；没有 `motion` 参数时跟随系统。开启运镜不会自动播放，向下滚动推进、向上滚动倒放、停滚静止。
- 模式切换验证：`node scripts/story-motion-entry-check.cjs --url http://127.0.0.1:3198`。测试通过真实鼠标滚轮检查相机矩阵变化，不只调用 seek API。

保留原 Vue 2.6 工程、路由与 Demo。无需登录即可观看 story route。当前机器另有基于 `dist/` 的本地预览 `http://127.0.0.1:3198/#/demo/story-web`；它使用隔离的测试数据库，不是线上地址。

## 本轮修正

原版把照片缩放和手机移动分开实现，缺乏空间连续性，还加入了无依据的大幅边栏文案。当前重构为原始照片坐标系：1832×859 图像、托架上的固定屏幕四角、共用相机单应矩阵，以及投影到同一屏幕的实际 Vue UI。房间和手机共享镜头推进，屏幕在接近后校正透视。推荐封面沿同一持久元素进入横屏；手机通过连续裁切遮挡退出。

移除侧栏标题和粉紫外围背景。浅底 Logo 只把原 SVG 的 FIT 三个字母从白色改为黑色，保留红色标记与白色人物；这是对比度适配版本，仍需品牌确认。顶部导航为轻量玻璃样式。

## 结构与复用

| 文件 / 模块 | 职责 |
| --- | --- |
| `src/views/web/StoryHome.vue` | 原 Vue Router 下独立 route，真实滚动、debug、reduced motion |
| `src/story/scenario.cjs` | Alex 的唯一训练记录和周报统计 |
| `src/story/story-state.cjs` | 确定性时间、UI、相机、共享元素状态 |
| `src/story/projection.cjs` | 同一坐标系的投影与四角求解 |
| `src/story/StoryStage.vue` | 常驻场景与原组件的展示适配层 |
| `SfCard / SfButton / SfCourseCard / SfBottomNavigation / SfInsightCard` | 直接复用原组件，局部 CSS 覆写 |
| `SfAiBall` | 原形象与头部投影；可选外部时间/姿态输入，默认 Demo 行为保留 |
| `share-weekly-report.js` | 抽取原 Canvas 绘制函数；分享和社区复用同一张画布 |

数据、推荐、评论均为模拟提案。没有后台训练写入、真实发帖或生产 AI 调用。静态播放器由用户明确允许；仍待真实运动资源替换。

## 检查命令

```sh
npm run build
npm run story:verify
npm run story:browser
npm run story:screenshots
```

截图/浏览器脚本支持 `--url http://127.0.0.1:3198`；浏览器可通过 `--browser-executable` 或 `STORY_BROWSER` 指定。导出代码保留，但在页面效果确认前不再执行。参见 `QA_REPORT.md`、`STORYBOARD.md`、`ASSET_GAPS.md`。
