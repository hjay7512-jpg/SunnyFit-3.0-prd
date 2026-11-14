# Storyboard — revision in progress

主视觉依据：[V3.0 Alpha / SunnyFit Web / 575:1660](https://www.figma.com/design/t7g261XYs61EdvYzIZn5YL/V3.0-Alpha?node-id=575-1660)。汇总参考保存在 `alpha-reference.png`。品牌产品上下文采用用户提供的 Constitution Draft 摘要；不能把候选宣传文案当成正式批准。

| 幕 | 时间 | 源节点 | 当前连接方式 |
| --- | --- | --- | --- |
| Home Gym | 0–8 | 576:1661 | 照片和托架上的屏幕共享相机投影，近景校正透视；重点重做中 |
| Home + AI | 8–16 | 578:2220 | 相同 Home 放大至推荐区域，持久小球靠近建议 |
| Workout | 16–24 | 578:2747 | 相同封面展开为 812:375 横屏，UI 不拉伸；使用静态跑步图 |
| Result | 24–33 | 581:2863 / 582:4141 | 封面收为 hero、数据完成、RPE 7、Insight；工作稿 |
| Adaptation | 33–48 | 583:6157 / 584:6618 / 583:5287 | 同一个 Home 更新日期、建议及已完成记录；工作稿 |
| Weekly | 48–60 | Base 7697:14248 / 6976:13221 | Ready card 展开、图表、Insight、同一分享画布；工作稿 |
| SunnyFam | 60–67 | 585:8127 | 分享画布进入帖子，气泡与数值受相同时间控制；工作稿 |
| Brand | 67–72 | 585:8777 / 585:8741 / 585:8788 | 同一球体放大到标识收尾；工作稿 |

24 个关键状态及 7 个转场时间见 `src/story/scene-manifest.cjs`。字幕/旁白候选见 `src/story/narration.cjs`：先出现实际操作/数据，再补充短句，不让旁白引入画面没有证据的新能力。没有配音音轨；网页静止时字幕也静止。

数据链：Nov 2 跑步 30 min / 210 kcal / 2.50 mi / RPE 7 → Nov 4 Mobility 20 min / 65 kcal → Nov 6 Strength 25 min / 120 kcal → Nov 9 生成 Nov 2–8 周报：3 workouts / 3 active days / 75 min / 395 kcal。Nov 9 发帖展示上一周成果。

目前优先验证 0–24 秒是否具有空间与物体连续性。完整八幕不能仅凭数据/浏览器测试判定视觉验收通过。
