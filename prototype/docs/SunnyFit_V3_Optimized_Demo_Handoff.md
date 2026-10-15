# SunnyFit V3 优化版 Demo 交付说明

## 2026-10-14 最新定义与商业化页面接入

本轮依据 [Entitlement Item List v10](https://sunnyfit.atlassian.net/wiki/x/CQAadg)、Entitlement Management v3、Product Management v3、Backend Definition v3 和 AI Weekly Report PRD v8。读取内容及版本存于 `latest-definition-review/sources.json`。下方旧配额、周期末切换和三类初版的记录为历史依据，不是当前 MVP 规则。

| 业务对象 | 当前行为 | 评审入口 |
| --- | --- | --- |
| Content Access | Course / World Tour / Movement 在 Start 校验；Program 在 Select 校验；Limited Challenge 在 Join 校验。单内容归属一个 Scope，Suit 多选，无 ALL。 | 原 Workout、Plan 内容选择和 Challenge 导航；后台 Content Scope / Suit |
| Feature Access | Dynamic Plan 激活、Workout AI Insight、Weekly Report AI Insight：加入 Suit 即授权，无 Quota，不消耗 Credits。基础数据和模板周报免费。 | 原计划 More、结果页分析、周报洞察 |
| AI Coach Credits | 开放 AI 请求按 User Turn 预留；成功结算一次，实际失败释放原批次。自购不要求会员。 | AI Coach Send → 明确确认 → 返回对话 |
| Content Credits | 确认兑换成功扣一次，创建永久 Content Unlock；会员到期保留，重复播放不收费。 | 原课程 Start → 兑换确认 |
| 会员月赠 | 从原订阅日期、按原订阅时区逐月发放；年费也逐月发放；前月未用余额到期、不结转。自购余额保留。 | Membership & Usage → 两种余额；后台批次和排期 |
| Additional | 内容与功能取并集，额度独立发放、保留来源。更细合并规则仍待定。 | 活动发放 → 用户有效权益 |
| 商品与订单 | 会员关联 Suit；额度商品只发指定类型。订单锁定版本，失败重试不重复交付。即时升级开启新周期，结算金额未定义时阻断付款。 | Products / SKU / Orders / Subscriptions |

新版场景：DEMO-2001（Free）、DEMO-2002（Premium）、DEMO-2003（Free + 自购 AI Credits）。价格、月赠数量、单次消耗和训练均为明确标记的本地评审数据，不是生产定价或真实完成训练；现有 DEMO-100x 历史合同保留。

- [前台评审](http://127.0.0.1:3012/#/app/home?user=DEMO-2002&review=1)
- [免费周报](http://127.0.0.1:3012/#/app/weekly?user=DEMO-2001&review=0) · [会员周报](http://127.0.0.1:3012/#/app/weekly?user=DEMO-2002&review=0)
- [会员与余额](http://127.0.0.1:3012/#/app/membership?user=DEMO-2002&review=0) · [Challenge](http://127.0.0.1:3012/#/app/challenge?user=DEMO-2002&review=0)
- [权益类型与业务关系](http://127.0.0.1:3012/#/commercialization/overview?tab=logic)

周报依据正式 V3 `7697:14248`，Challenge 依据 Alpha 中现有 `266:41091`，采用本地 Figma 资源、共用玻璃组件和原导航。Movement / World Tour 列表是共用组件延展，尚无独立完整 Frame 可验收，不宣称逐像素还原。周报数据按用户时区上一完整周生成评审样本，筛除周外和无效训练，至少两次有效训练才展示；正式训练数据读取和周一 01:00 的生产定时任务不在本地模拟服务中执行。Workout Review 的周报历史常驻入口按 PRD 暂不增加；评审目录可直接核验页面。

业务图保留七个主题，新增本轮月度规则、访问权并集、User Turn、永久解锁和即时升级待定说明。每个节点展示中文定义、具体示例与约束，支持当前节点链接、演示模式和 SVG 导出。Human Coach Credits 不在本轮 MVP，新售卖与发放入口不开放，历史记录保留。

仍待定义：正式价格与赠送数量、单次消耗数量、即时升级抵扣与结算、更细 Additional 合并规则、主动取消及部分成功退款、已兑换内容下架处理、用户侧新类型交易明细、Daily Adaptive Plan。无消耗配置时不报价、不预留、不扣额；未定升级结算不生成付款。真实商店支付、LLM 和训练播放器继续作为本地适配边界。

验证：`npm test` 55 项业务检查、`npm run test:mvp` 15 项新版浏览器检查、`npm run test:business-review` 10 项评审检查通过。旧前台流程也已回归通过。新版浏览器证据见 [结果](mvp-commercialization-validation/2026-10-14T14-28-54-670Z/results.json)，业务图见 [结果](business-review-validation/2026-10-14T14-17-10-136Z/results.json)。持久库历史版本与资产比对见 [记录](latest-definition-review/historical-record-check.json)，一致性备份路径记录在 `runtime/mvp-delivery-backup.json`。这些检查不替代欧美真实用户研究或最终设计验收。

代码：`server/entitlement-model.cjs`、`server/commerce.cjs`、`server/subscription-period.cjs`、`server/weekly-report.cjs`、`server/mvp-demo.cjs`；前台商业化流程与 `V3WeeklyReport`、`V3Challenge`、`V3ContentCollection` 均在同一项目，共用 API 与组件。`MVP_REVIEW_FIXTURES=0` 可关闭独立评审账号的自动初始化。重复启动不重置编辑、订单、余额或已读状态。

2026-10-14 权益架构更新：当前新配置改为 Content Access / Feature Access / Consumable Credits 三类模型，内容有 Scope 维护和单一归属，功能没有 Scope / Quota，额度分 Credit Type 管理。下文的旧次数和统一 Credits 方案保留为历史用户兼容背景；当前业务、Open 项及实现验证以[三类权益交付说明](SunnyFit_V3_Admin_Prototype_Handoff.md)为准。前台显示已购版本，后台新版本只影响后续购买。

更新日期：2026-10-12。当前交付为可运行的本地商业化原型，供产品、设计和开发共同评审。前台承诺、后台配置与服务端消费已使用同一组状态；生产支付、真实 AI 和欧美真人研究仍属于后续对接与验证。

最新前端状态见 [原稿对齐更新](SunnyFit_V3_Frontend_Source_Aligned_Update.md)：个人中心和 Membership & Usage 恢复原页面层级，41 项布局和 21 项交互回归通过。头像 SVG 仍受 Figma 目录授权阻止，原稿资源验收未完全完成。下方纠偏记录与较早测试为历史依据。

本轮纠偏：已撤回无原稿依据的 Browse all workouts、补造账户菜单、内容目录、已解锁目录、周报页面和 Program 详情页。相关旧链接返回原首页。会员与用量页保留为商业化评审页；入口来自原业务动作的权限或余额校验，不将评审目录视为正式应用导航。个人中心和 World Tour 完整原稿缺失的部分暂不补建。此前关于完整账户导航、已购内容发现任务和周报前台任务已完成的表述撤回；这些任务需要沿既有 UI 补齐依据后再验证。

当前修正版构建通过，32 项布局与撤回检查、17 项商业化回归通过：[布局证据](layout-validation/2026-10-12T10-29-13-776Z/results.json)、[交互证据](optimized-demo-validation/2026-10-12T10-29-15-469Z-cf15dd/results.json)。测试验证本地模拟行为，不证明设计符合原业务或欧美用户习惯。

## 浏览器入口

- [前台用户模式](http://127.0.0.1:3012/#/app/home?user=DEMO-1003&review=0)
- [前台评审模式](http://127.0.0.1:3012/#/app/home?user=DEMO-1003&review=1)
- [后台 Demo](http://127.0.0.1:3012/#/commercialization/overview)
- [本说明的浏览器预览](http://127.0.0.1:3110/docs/SunnyFit_V3_Optimized_Demo_Handoff.md)

在项目目录运行 `npm run demo:optimized`，会启动本地服务并打开前台。优化版数据保存在 `runtime/optimized-demo.sqlite`，不重置原 `runtime/sunnyfit-admin.sqlite`。服务重启保留编辑和操作记录；原库的配置、已购权益和批次不会被新种子覆盖。

文档预览使用 `npm run review`。修改文档后刷新浏览器即可。

## 本次已实现的更新

### 布局与侧栏修复（2026-10-12 补充）

评审侧栏对齐现有 SunnyFit Admin 的 `#304156` 背景、`#409eff` 选中态与字体，增加当前页面高亮。用户模式仍通过应用内导航访问内容，评审控制只在评审模式出现。

撤回首页新增入口，保留原导航和画布高度。修复结果页图表压住课程卡片和操作按钮、分析按钮长文案超出高度，以及课程长标题挤压下方内容。课程详情主体随内容自然增长，保留原有图片和操作样式；较长内容可在手机画布内滚动。会员与用量页补齐卡片内边距，套餐价格独占一行，弹层标题为关闭按钮预留空间。

`npm run test:layout` 在运行中的优化版服务上执行只读布局验证：375、390、430 像素宽度下的 9 个页面，以及长标题、评审侧栏、用户模式切换和自创入口撤回，共 32 项检查通过。下方旧截图是修复过程的历史证据，当前结果以顶部纠偏链接为准。

- [布局检查结果](layout-validation/2026-10-12T10-22-34-214Z/results.json)
- [修复后的侧栏](layout-validation/2026-10-12T10-22-34-214Z/review-sidebar.png)
- [首页](layout-validation/2026-10-12T10-22-34-214Z/390-home.png) · [课程详情](layout-validation/2026-10-12T10-22-34-214Z/390-course.png) · [结果页](layout-validation/2026-10-12T10-22-34-214Z/390-result.png) · [账户](layout-validation/2026-10-12T10-22-34-214Z/390-profile.png)
- [本轮 18 项商业化交互回归](optimized-demo-validation/2026-10-12T10-22-32-547Z-d1c463/results.json)

构建通过；依赖包及保留的原始图片体积警告仍在，后续资源瘦身需单独处理。

### 内容访问和用户导航

保留既有 Home、Workout、课程详情、Training Program、AI Coach、结果与 Plan 页面。课程 Start 和 Program Start Now 继续检查原业务访问权限；聊天历史使用 AI Coach 原工具栏入口。会员与 Credits 流程从受限动作进入，完成后回到原场景。此前补造的个人中心及列表导航已撤回，完整的已购内容发现路径尚未验证。

内容详情与兑换确认使用相同内容名称。访问标签显示 Free、Included with Premium、Unlock 或 Unlocked；编辑推荐通过独立 `recommended` 字段管理。已解锁内容再次 Start 不扣 Credits，到期后可从已解锁列表找到。

Training Program 的包内课程通过经过验证的父 Program 上下文访问，不要求重复兑换。服务端同时验证父级访问和成员范围；独立兑换使用兑换时成员快照，伪造父级或打开无关课程不会获得访问权。包内授权不生成新的独立课程兑换记录。

训练播放器沿用正式应用已有流程，本 Demo 只展示进入播放器前的访问确认，不模拟完成训练或产生真实训练记录。原 Figma 页面继续保留，账户、内容列表、Program 详情等新增页面明确属于本轮 Demo 提案。

### 会员包含服务与额外消费

包含服务配置绑定不可变 Suit 版本，分别记录包含数量、周期和是否允许超额。用户的实际用量读取已购授权版本，会员页将当前权益与最新在售权益分别展示。发布新版不会改变已有周期。

以下都是集中配置的演示数量，不是生产套餐承诺：

| 服务 | Premium 演示包含量 | 包含量耗尽后的演示行为 |
| --- | --- | --- |
| 普通文字聊天 | 每月 30 次回复 | 明确确认后每次 2 Credits。包含范围内点击 Send 直接继续对话。 |
| 训练结果分析 | 每月 2 次 | 明确确认后每次 8 Credits。 |
| 周报 | 每周 1 次 | 等待下一次重置，不消费额外 Credits。 |
| 计划预览 | 每月 2 次 | 明确确认后每次 3 Credits。 |
| 图片聊天 | 未包含次数 | 具备对应权限并明确确认后每次 4 Credits；当前前台未新增图片上传流程。 |
| 激活已有计划 | 不调用新 AI，消费价格为 0 | 仍检查 Dynamic Plan 权益；本轮保留已有计划页面，不另造完整计划编辑器。 |

周期从授权开始时间计算，月度采用日历月，周度为连续七天，到授权结束时截断。年付包含量按配置的服务周期计算，不要求用户等到下一年度重置。具体生产周期和次数仍需按业务定值。

一次业务请求预留一次包含用量或 Credits。成功结算一次，失败或超时释放原来源。包含报价失效时不会自动转为付费，额外消费必须携带明确确认。读取已有结果不扣费，新生成结果关联原训练或报告对象。

原有会员附赠 Credits 配置继续保留，可与包含服务并存，历史承诺不因此删除。演示种子仍提供每计费周期 150 Credits、30 天有效期的历史福利示例；数量、发放频率和是否继续赠送都可在 Suit 中配置，不代表推荐的最终套餐。

### 新加购 Credits 不过期

新加购商品的有效期为“不过期”，与会员状态独立。钱包主界面展示包含用量与 Credits，批次和预留记录收进详情。历史加购与赠送批次保留原期限，临期提醒明确来源；不能将所有旧余额说成永不过期。

存储兼容使用 `never_expires` 标志与内部远期日期，API 返回 `expiresAt: null` 和 `neverExpires: true`。消费排序优先处理有到期日期的有效批次，再处理无期限余额。到期维护和演示过期操作都不会清除不过期余额。旧待履约订单仍按购买快照发放。

### 订阅管理

会员页提供当前套餐、续费或结束日期、下一次付款、取消及恢复续费、恢复购买、待生效套餐切换。新购买的月付与年付按日历周期计算。

Demo 的切换策略为当前周期末生效。确认切换时不付款、不创建未来授权，保持同一个订阅 ID；模拟续费成功后按已确认快照创建新周期。取消续费会清除待生效切换，恢复续费不自动恢复此前切换。续费失败不发新权益，已有资产保留。

恢复购买只读取当前账户的已有购买和授权，不重新发放余额或权益。本原型没有接入真实商店凭证，不能据此宣称完成 Apple 或 Google 恢复购买。真实渠道的升级结算、价格变更同意和恢复策略仍需对接。

后台 Flow Preview 增加续费事件模拟器。先模拟当前周期结束，再选择成功或失败提交事件；正式用户页面不提供该模拟按钮。

### 后台配置与运营查询

Suit 配置增加 Included Services，可编辑服务、次数、周期和超额策略；草稿、预览、发布和历史版本继续沿用。服务计价显示额外消费价格，内容配置区分访问方式和编辑推荐，商品配置支持无期限余额及日历计费周期。

用户 Wallet 页展示包含量、已用、预留、可用和重置日期。服务请求记录展示消费来源、原对象和原周期，审计记录保存报价版本和额度来源。包含次数不伪装成 Credits 的 GRANT 或 SPEND 流水。

### 移动展示与资源

新增页面在 390px 视口下无页面水平溢出。确认弹层支持焦点进入、Tab 环绕、Escape 关闭和返回原控件。账户可选择美国、英国或德国的日期与币种格式，报价币种仍来自实际 SKU，不伪造当地价格。

9 张大图的展示版本已转换为 WebP，总大小从 22,137,083 字节降为 447,896 字节，约减少 98%。原 Figma PNG 保留用于追溯，构建仍会对这些原文件及原有 Vue 2 公共包给出体积告警；该优化不等于整体首屏速度提升 98%。

## 验证结果

| 检查 | 结果 | 范围 |
| --- | --- | --- |
| 领域测试 | 23 项通过 | 含原有 13 项与新增 10 项，覆盖权限版本、消费预留与释放、明确超额、无期限余额、Program 上下文、订阅切换与续费冲突。 |
| 新版浏览器任务 | 18 项通过 | 390px 用户任务、包含聊天、周报、额外分析、失败恢复、已解锁查找、恢复购买、快照展示、焦点与后台字段。 |
| 原有后台浏览器检查 | 通过 | 目录只读、筛选、Suit 草稿发布、版本保护、未保存提示与引用保护。 |
| 生产构建 | 成功 | 有原资源和公共包体积告警。 |

证据：[最终前台任务结果](optimized-demo-validation/2026-10-12T09-58-40-508Z-8650a4/results.json)、[原有后台检查结果](prototype-previews/browser-check.json)。本轮验证使用隔离测试数据库，不与运行中的优化版共享数据。

截图：[已解锁课程](optimized-demo-validation/2026-10-12T09-58-40-508Z-8650a4/02-unlocked-course.png)、[会员包含周报](optimized-demo-validation/2026-10-12T09-58-40-508Z-8650a4/04-weekly-included.png)、[用量和余额](optimized-demo-validation/2026-10-12T09-58-40-508Z-8650a4/07-usage-and-wallet.png)、[当前与在售权益](optimized-demo-validation/2026-10-12T09-58-40-508Z-8650a4/10-current-vs-sale-benefits.png)、[后台用量](optimized-demo-validation/2026-10-12T09-58-40-508Z-8650a4/08-admin-usage.png)。

```powershell
npm run build
npm test
npm run test:consumer
npm run test:browser
npm run demo:optimized
```

`scripts/consumer-review.cjs` 保留为第三轮旧基线脚本。当前源码使用 `npm run test:consumer` 验证新版，不再用旧页面与旧收费规则的断言验收新版。

## 建议评审路径

1. Alex 进入个人中心，再进入内容列表，单独解锁 Signature 课程；确认名称一致及 Unlocked 状态。
2. Casey 在训练结果页生成两次包含分析，第三次进入额外消费；钱包补充后返回同一训练对象，明确确认再生成。此前余额不足不影响两次包含服务。
3. Alex 在会员页查看当前权益、切换月付与年付、取消续费；从个人中心进入已解锁列表，确认独立内容保留。
4. 后台查看 Casey 的包含次数、额外余额与 Service Requests；修改 Suit 后发布，确认旧用户权益不变。
5. 后台 Flow Preview 模拟服务失败或周期结束，核对余额释放、资产保留和续费事件结果。

欧美真人任务测试仍未执行。下一步按三轮方案中的招募与任务协议，观察目标用户是否能在不接受概念讲解的情况下判断包含范围、完成额外使用，并解释取消后保留的内容。自动化通过不能替代这项理解验证。
