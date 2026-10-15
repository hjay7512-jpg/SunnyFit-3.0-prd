# V3 组件材质与 AI Ball 更新

## 2026-10-14：商业化高保真页面与业务接入

本轮将正式周报 `7697:14248` 和现有 Challenge `266:41091` 接入共用 V3 页面、顶栏、玻璃卡片、按钮和 AI Ball。周报展示真实评审数据、免费基础分析、授权洞察和 PNG 分享；Challenge Join 只写参与资格，不伪造训练或奖励。独立资源存于 `public/assets/figma/commerce-mvp`，运行时不依赖远程 Figma 资源。

会员按三项功能与两种钱包重新组织；AI 对话和兑换确认明确对应 Credit Type，不使用会员回复配额解释新版规则。Movement / World Tour 从现有入口进入，其列表为共用组件延展，完整独立原稿尚未定位。浏览器在 375 / 390 / 430 像素与桌面尺寸核验页面和业务任务，详情见[当前交付](SunnyFit_V3_Optimized_Demo_Handoff.md)。以下组件与 AI Ball 的校准继续保留。

## 2026-10-14：个人中心图标与现有二级菜单

个人中心七项菜单增加统一的 22 px 单色线性图标，会员入口使用皇冠、40 px 玻璃底座与小面积品牌色。Free / Premium 和 API 用量继续用文字表达。新增图标使用八份本地原始 Lucide SVG，版本、哈希与许可证保存于 `public/assets/icons/profile-menu`；这部分是用户要求的视觉延展，未冒充 Figma 图标。

二级清单按已有菜单迁移，每项原文、来源节点和访问路径集中在 `src/views/app/profile-menu.js`。主菜单、详情和返回路径共用当前项目与组件。设备商城和社区隐私的跨入口返回保留原父级；列表滚动按账号、页面和菜单层级保存。手机外框继续等比适配浏览器一屏，正文内部滚动。

收尾视觉检查还修正了账户页的旧背景与文字颜色覆盖：正文透出主题背景，菜单表面跟随玻璃 token，身份和辅助文字使用语义颜色。Free / Premium 的暗色放大文字检查包含对比度验证与实际截图；这不代表所有原生整页已有暗色稿验收。

| 当前入口 | 二级项与来源 | 接入状态 |
| --- | --- | --- |
| Membership & Usage / My Orders | 原会员和订单任务链 | 现有 API 数据与业务规则 |
| Devices & Health | 原 Equipment & Service 的 My Equipment、Health App、Shop Sunny Equipment；Alpha 243:662 / 673 / 687 | 清单与返回已接通。设备、Bluetooth、健康授权服务仍未接入；不填入“已连接两台”的稿件样例 |
| Community & Privacy | 原 Snaps、Ranking 与 Settings 的 Privacy Settings | 隐私复用同一详情入口。社交与隐私保存接口未接入，状态提示不会冒充空账户数据或已保存权限 |
| Settings | [正式完整列表 6977:11258](https://www.figma.com/design/2AT0tm9mkFhes8T81YzA2L/V3.0?node-id=6977-11258)：My Profile、My Account、My Preferences、Privacy Settings、Language、Unit Setting、Push Notification Setting、User Agreement and Privacy Policy、Clear Cache、Update、About，以及 Log Out | 原项保留；Log Out 沿截图禁用状态，并说明 Demo 未接登录服务。没有使用 45M、123 等样例充当实际账户数据 |
| My Preferences | 同组 [6977:11115](https://www.figma.com/design/2AT0tm9mkFhes8T81YzA2L/V3.0?node-id=6977-11115) 的 My Fitness Goal、My Max Heart Rate | 目标四选项来自原稿；单位两选项来自 410:7304 / 1930:4439。仅按账号保存本地预览，未触发计划生成、设备单位修改或心率估算 |
| Help & Support | 原 Beginner Guide、FAQs、Support Equipment、Contact Us；Alpha 243:702 / 715 / 733 / 742 | 接已核实的官方指南、FAQ、设备兼容清单和邮箱；未自动发送消息 |
| Invite / Shop Sunny Equipment | 原 249:2174 / 2179 入口 | 复制官方 App 链接与浏览官方商店。邀请奖励接口、推荐码和器材 SKU 未补造 |

正式稿包含两份 Settings：Home `7694:8502` 的底部被 Share your week 按钮覆盖；另一份 `6977:11258` 清晰展示 11 项和 Log Out。本轮明确采用完整版本，未按节点编号推断批准先后，也未将两版按钮混合。元数据的节点名称可能仍为旧组件名，菜单文案以实际截图核对。读取记录和截图在 `docs/profile-menu-source`；完整设计上下文仍受 Figma 资源目录授权限制，所以菜单迁移不等于所有详情页完成逐像素验收。

可直接查看[个人中心](http://127.0.0.1:3012/?build=v3-profile-menus#/app/profile?user=DEMO-1003&review=0)和[Settings](http://127.0.0.1:3012/?build=v3-profile-menus#/app/settings?user=DEMO-1003&review=0)。按正常菜单逐层进入即可检查信息层级；评审侧栏显示本轮来源与能力边界。运行 `npm run test:profile` 复验。

| 验证 | 证据 |
| --- | --- |
| 个人中心来源清单、逐级返回、偏好隔离、外链、邀请、四种宽度、一屏展示及两类账号暗色文字可读性：20 项 | [账户流程与截图](profile-menu-validation/2026-10-14T02-25-38-515Z/results.json) |
| 商业化：23 项 | [隔离业务回归](optimized-demo-validation/2026-10-14T02-10-28-938Z-db77ad/results.json) |
| 共用控件、主题与放大文字：19 项 | [组件回归](component-validation/2026-10-14T02-10-28-945Z/results.json) |

## 2026-10-14：浏览器一屏预览

默认浏览器展示改为适配可用空间：`src/demo/fit-preview.js` 在手机框外根据窗口高度、宽度、评审留白与说明文字计算等比显示比例。窗口变化自动重算，空间足够时恢复原尺寸；手机内部仍使用原有布局单位和滚动。桌面用户模式的默认内容画布为正式稿的 375 × 812，评审模式保留边框。侧栏独立滚动，外层页面固定在浏览器一屏内。

例如 1280 × 720 浏览器中，首页显示约 332 × 720，内部画布仍为 375 × 812；原先 828 px 的固定外框不再超出窗口。移动端原生页面移除 600 px 最小高度，短窗口仍保留正常触控尺寸。组件基线工作台保留原稿尺寸用于几何对照，页面列表本身仍需浏览滚动。

| 验证 | 证据 |
| --- | --- |
| 三种桌面窗口 × 两种模式 × 八个页面；内部滚动、缩放搜索、放大恢复和三种移动窗口：12 组 | [适配与截图](preview-fit-validation/2026-10-14T01-11-48-248Z/results.json) |
| 商业化：23 项 | [隔离业务回归](optimized-demo-validation/2026-10-14T01-09-54-029Z-8973c3/results.json) |
| 原生页面：25 项 | [页面交互](native-page-validation/2026-10-14T01-09-56-998Z/results.json) |
| 签到与顶栏：11 项 | [顶栏专项](toolbar-validation/2026-10-14T01-09-56-925Z/results.json) |

直接查看[自适应首页](http://127.0.0.1:3012/?build=v3-fit-screen#/app/home?user=DEMO-1003&review=0)或[评审模式](http://127.0.0.1:3012/?build=v3-fit-screen#/app/home?user=DEMO-1003&review=1)。

## 2026-10-14：首页签到与 Workout 顶栏纠偏

依据本次业务澄清：首页默认展示紧凑签到状态，点击后只展开签到反馈胶囊，3 秒后自动收回。消息、日历、设备三个右侧入口始终可见，展开期间位置保持不变；再次触发重新计时，离开首页、切换账号或参考场景清除旧反馈。减少动态时取消宽度过渡，但保留 3 秒显示时间。原先以参考场景控制右侧入口和常驻奖励胶囊的实现已移除。

`SfUserToolbar` 增加 leading 槽位，头像、签到反馈和右侧操作分别布局。Workout 越界原因是 100% 宽度叠加左右 16 px 外边距；已将可用宽度设为 `calc(100% - 32px)`，保留独立的 44 px 触控区域，未通过裁切隐藏图标。

签到的连续天数与奖励为展示 props，默认沿用原稿 Demo 值 3 和 8；本批仅实现展示反馈和组件事件，没有新增签到积分接口或改动账户余额。消息、设备沿用现有模块入口的未展开反馈；日历保持既有计划相关入口。正式静态稿与本次明确交互需求存在差异时，以本次业务需求为准。

| 校验 | 证据 |
| --- | --- |
| 320/375/390/430 px、准确 3 秒、固定入口、搜索、重复与键盘触发、账号切换：11 项 | [顶栏专项与截图](toolbar-validation/2026-10-14T00-52-31-450Z/results.json) |
| 首页与账户导航、资源和滚动：10 项 | [首页 UI](home-ui-validation/2026-10-14T00-52-34-754Z/results.json) |
| 首页四态及参考切换：8 项 | [四态](home-state-validation/2026-10-14T00-52-34-502Z/results.json) |
| Workout、课程、计划与既有任务链：25 项 | [原生页面](native-page-validation/2026-10-14T00-47-26-068Z/results.json) |

打开[首页](http://127.0.0.1:3012/?build=v3-toolbar-fix#/app/home?user=DEMO-1003&review=0)，点击火焰签到状态查看；[Workout](http://127.0.0.1:3012/?build=v3-toolbar-fix#/app/workout?user=DEMO-1003&review=0)可直接校验图标边界。

## 2026-10-14：计划四态与消费页面接入

本轮继续复用现有 41 个公开组件。计划训练、恢复、完成与暂停状态均已进入工作台，依据各自的完整正式上下文和原始资源校准标题、阶段卡、进度标记、五日预览与 Coach 内容。阶段卡使用 12 px 圆角；暂停态为 184 px 高度、14/22 正文、黄色状态与进度，卡片之间为 24 px。页面内容保持自然流动，不固定裁切长文。

暂停态来自正式 `4281:6716`，13 项原资源已缓存。当前截图显示“更多”，旧上下文却导出了“关闭”图标；本轮保留现有共用 More 控件及既有动作，未使用含义不符的关闭资源。最新顶栏读取未及时返回。原稿的 Stage I 与第二段进度、Lgnition 拼写等矛盾仅保留在参考快照；它们不是实际计划记录。暂停、恢复、完成状态不写训练记录，没有接入不存在的暂停或恢复接口。

套餐、账单和 Credits 页已改用共用 `SfCard`、`SfButton`、`SfBadge` 和 `SfFeedback`。当前权益继续读取购买快照，销售方案读取现行商品；切换方案、续订管理和加购继续由原交易确认流程处理。已消除旧 Credits 卡片 CSS 对新按钮的覆盖，价格按钮保留至少 48 px 高度。消费页与 A/B 快照共用同一套样式。它们属于既有业务结构的 V3 材质适配，不作为正式 V3 视觉稿还原来宣称。

组件链接现在同时支持页面内导航和新标签页首次打开。已针对 Vue Router 3.1 初始 Hash 导航补齐定位，并等待异步页面挂载；其他页面仍按原有导航滚动。

可直接查看：[计划暂停态与四态预览](http://127.0.0.1:3012/?build=v3-page-followup#/demo/lab?tab=components&component=plan-paused)、[套餐](http://127.0.0.1:3012/?build=v3-page-followup#/app/plans?user=DEMO-1003&review=0)、[账单](http://127.0.0.1:3012/?build=v3-page-followup#/app/billing?user=DEMO-1003&review=0)、[Credits](http://127.0.0.1:3012/?build=v3-page-followup#/app/wallet?user=DEMO-1003&review=0)。

| 本轮验证 | 结果与截图 |
| --- | --- |
| 计划四态、原 SVG、卡片尺寸、首次定位、无业务写入：6 项 | [计划状态](plan-state-validation/2026-10-14T00-33-22-655Z/results.json) |
| 套餐、账单、Credits 三种宽度、空状态与键盘详情：11 项 | [消费页](commerce-ui-validation/2026-10-14T00-30-05-234Z/results.json) |
| 原生页面及课程、计划、Program 交互：25 项 | [原生交互](native-page-validation/2026-10-14T00-27-37-028Z/results.json) |
| 全部现有页面多尺寸布局：41 项 | [布局](layout-validation/2026-10-14T00-27-37-587Z/results.json) |
| 隔离数据库中的商业化流程：23 项 | [业务](optimized-demo-validation/2026-10-14T00-33-25-363Z-db8b43/results.json) |
| 共用控件、弹层、暗色与放大文字：19 项 | [组件](component-validation/2026-10-14T00-33-21-235Z/results.json) |
| A/B 快照：14 项浏览器检查 + 5 项规则 | [快照](ui-foundation-validation/2026-10-14T00-30-03-668Z/results.json) |
| 首页四态与直达：8 项 | [首页](home-state-validation/2026-10-14T00-30-05-575Z/results.json) |
| AI 草稿、额度确认、失败释放与结果布局：13 项 | [AI 页面](ai-ui-validation/2026-10-14T00-36-03-432Z/results.json) |

构建通过，剩余两类原资源体积警告。正式 Coach、结果整页与 World Tour / Free Mode 的剩余迁移，真实个人计划数据契约、SF Pro 字体回退及完整视觉验收仍未完成；自动化检查不代表欧美用户研究已完成。

当前维护 41 个公开组件，包含基础控件、首页业务卡片、页面框架、导航、反馈、弹层及 AI Ball。会员和个人中心沿用业务原型的功能层级，视觉依据正式 V3 与 Apple 指导重新处理。正式首页、Workout 的 Course 模式、计划、课程详情、既有 Program 和对话历史已接入共用组件；AI Coach 的问候、消息、输入与运动结果的分析卡片已部分接入；正式整页、其他训练模式、完整数据契约与视觉验收仍需继续。

## 正式首页四态与共用顶栏

正式四态已组合到同一个可交互首页：无计划 `7590:5619`、Dynamic Plan `7591:7185`、Custom Schedule `7618:8349`、Training Program `7618:8832`。日程完整设计代码此前已缓存，本次按其中提供的 URL 补齐 39 项原始资源，目录为 `public/assets/figma/v3/home-schedule`。三种有计划状态均重新读取正式截图，静态资源与 SVG 根尺寸已逐项核验。

新增 `SfUserToolbar`、`SfWorkoutRecommendation`、`SfPlanProgress`。前两者在实际首页和 Workout 中复用，保留原搜索、课程身份、Start、计划及个人中心动作。阶段环和百分比环使用原图层；计划卡根据具体稿件支持 16 / 24 与 20 / 28 数值样式。历史课程沿用 290 × 163 槽位、原始参与者图片和 View All 动作。

边框盒核验修正了 2px 偏差：375px 内容画布上的推荐封面为 327 × 245，计划卡为 183px 高，数据卡为 200 × 150。推荐区的快捷按钮保留原 38px 可视高度和 44px 触控区域。推荐样式归共用组件维护，页面中重复的同类样式已移除。

滚动状态补齐顶栏的阅读保护，并支持减少透明度；每个操作保留独立玻璃表面。此处将 [Apple Materials](https://developer.apple.com/design/human-interface-guidelines/materials) 关于滚动边缘与可读性的指导转译为网页渐变与模糊效果，属于缺失交互状态的扩展，未声称等同于原生 Liquid Glass 渲染。

工作台提供四态切换和直达链接：[日程状态](http://127.0.0.1:3012/?build=v3-home-states#/demo/lab?tab=components&component=home&homeState=schedule)、[AI 计划状态](http://127.0.0.1:3012/?build=v3-home-states#/demo/lab?tab=components&component=home&homeState=ai)、[课程计划状态](http://127.0.0.1:3012/?build=v3-home-states#/demo/lab?tab=components&component=home&homeState=program)。链接会自动定位首页组件区。

这些正式快照仅用于组件与页面视觉对照，预览动作只输出本地事件。个人计划、日程完成数与训练历史尚没有 API 契约；实际账号页面不会被参考快照覆盖。原稿的 75% 与 Completed 20 / Remaining 5 不一致，参考预览保留原值，真实计划需按确认后的业务口径提供。Windows 上仍有 SF Pro 字体回退，完整视觉验收和真人体验验证尚未完成。

| 本次验证 | 证据 |
| --- | --- |
| 四态、原始资源、槽位、直达与透明度：8 组 | [状态检查与截图](home-state-validation/2026-10-13T11-43-50-849Z/results.json) |
| 实际首页与账户顶栏：10 项 | [首页回归](home-ui-validation/2026-10-13T11-34-51-700Z/results.json) |
| 原生页面、课程、计划和 Program：25 项 | [页面回归](native-page-validation/2026-10-13T11-34-54-087Z/results.json) |
| 商业化与历史读取：23 项 | [隔离业务回归](optimized-demo-validation/2026-10-13T11-24-51-057Z-d10f66/results.json) |
| 组件交互、主题与放大文字：19 项 | [组件回归](component-validation/2026-10-13T11-26-24-798Z/results.json) |
| AI Ball：4 项规则 + 18 项浏览器 | [动作回归](ai-ball-validation/2026-10-13T11-24-53-489Z/results.json) |

构建通过，保留原资源体积警告。World Tour 的正式 `6741:6611` 本次读取再次返回目录权限限制；远程 Figma 插件仍未安装，未重复发送安装建议。World Tour / Free Mode、正式 Coach 与结果整页继续待完整上下文和资源恢复后迁移。

## 前批 AI Coach 与 Workout Data 接入

新增 `SfChatGreeting`、`SfMessageBubble`、`SfMessageComposer`、`SfInsightCard`，公开组件与来源台账均为 38 项。组件负责显示与原生交互，报价、包含次数、额外 Credits 确认、预留和失败释放继续走同一业务控制器。

- 问候标题已读取正式 3602:11542 的完整上下文与截图，保留 24 / 32、590 字重和原渐变；名称来自 API。完整 Coach 背景、顶栏和麦克风资源尚未读取完成。
- 输入框支持多行增长、Enter 发送、Shift + Enter 换行和输入法保护。等待报价和生成时冻结消息快照，取消或失败保留草稿；重复按键和确认只产生一个服务请求。基础 `SfField` 改为 DOM value 绑定，清空与恢复的多行内容可正确显示。
- 保存报告由真实账号与 workout objectKey 判定。切换记录时不沿用其他记录的状态；读取报告和 Ask Coach 不扣额度。长报告让卡片和后续图表自然增长，移除覆盖式正文和卡片内部滚动裁切。
- 浏览器切换记录会使未提交的旧报价失效。已经提交的请求仍完成结算或失败释放，旧报价、通知及错误不会出现在另一记录或账号上。

结果卡片沿用既有 `9:1517` 的原始 AI 图片和两个 16 × 16 SVG，以共用 Card / Button 完成状态接入。结果摘要、日期、RPE、图表与课程仍为设计参考数据，真实训练数据与正式整页视觉验收尚未完成。卡片和页面状态迁移不能等同于正式 V3 整页还原。

当前远程 Figma 插件未安装，已提供安装连接入口；桌面 MCP 可读取正式截图、层级和无静态资源的标题。资源型节点返回目录权限限制，结果子节点批量读取也发生超时。没有修改 Figma 权限设置，也没有用稀疏 metadata 或截图替代原始 UI 代码和资源。

直接打开：[AI Coach](http://127.0.0.1:3012/?build=v3-chat-insight#/app/coach?user=DEMO-1004&review=0)、[Workout Data](http://127.0.0.1:3012/?build=v3-chat-insight#/app/result?user=DEMO-1004&object=demo-workout-01&review=0)、[组件工作台](http://127.0.0.1:3012/?build=v3-chat-insight#/demo/lab?tab=components)。运行 `npm run test:ai-ui` 复验聊天和结果状态。

| 本次验证 | 证据 |
| --- | --- |
| 聊天、结果、多尺寸、延迟报价及失败：13 项 | [AI 页面检查与截图](ai-ui-validation/2026-10-13T10-50-18-812Z/results.json) |
| 共用组件和本地预览：19 项 | [组件交互](component-validation/2026-10-13T10-55-43-470Z/results.json) |
| 原生页面和原资源：25 项 | [页面检查](native-page-validation/2026-10-13T10-48-16-243Z/results.json) |
| 商业化与历史读取：23 项 | [隔离业务检查](optimized-demo-validation/2026-10-13T10-48-16-319Z-df8972/results.json) |
| 全部现有页面布局：41 项 | [多尺寸布局](layout-validation/2026-10-13T10-50-18-989Z/results.json) |
| AI Ball：4 项规则 + 18 项浏览器 | [动作与业务状态](ai-ball-validation/2026-10-13T10-45-55-022Z/results.json) |

构建通过，保留原有资源体积警告。写入型回归使用隔离数据库，未修改日常演示数据。这些检查验证本地实现和业务链路，完整视觉验收与欧美用户理解验证仍待完成。

## 前批页面接入与校验

| 页面 | 已接入行为 | 来源与边界 |
| --- | --- | --- |
| Workout · Course | 原始轮播、四项导航和独立 AI；课程搜索、Featured 切换；Go 使用真实课程 ID | 正式 6741:1367，全套资源缓存；World Tour / Free Mode 尚未展开 |
| Plan | 阶段、五日预览、Coach 建议；课程启动与返回；More 内保留 Adjust today | 正式 7652:9367；恢复日 7652:7214、完成态 7639:6783 在工作台预览。阶段、目标和训练主题仍是参考场景 |
| Course | 真实名称、说明、durationMinutes、授权标签；原 Invite / Calendar / Favorite / Music；热身和放松预览 | 正式 V3 详情未定位，沿用 6006:28045 的信息结构与原资源，按 V3 材质和控件完善。缺失指标显示空值 |
| 既有 Program | 按实际包内成员展示课程；Start 先校验 Program；子课程携带父授权并返回 Program | 复用正式首页 7618:8832 的计划卡及课程卡。完成数和进度没有数据，显示空值 |
| 对话历史 | 共用顶栏、列表与空状态；点击读取 API 保存资产，返回 AI Coach | 现有历史业务入口。没有新增产品导航或资产聚合页 |

新增 `SfAmbientBackdrop`、`SfPageLayout`、`SfRoundAction`、`SfStageCard`、`SfDayStrip`、`SfCoachWorkoutCard`、`SfWorkoutCarousel`。页面使用同一内容目录和原商业化控制器；业务适配校验课程 ID，保留 `courseOrigin` 和 Program 上下文。课程时长改用实际 `durationMinutes`，不再将 25 分钟课程显示为默认 15 分钟。

首页已有 Favorites 读取按账号/课程隔离的本地收藏，Redeemed 读取实际兑换权益。日期和音频设置保存在本地 Demo；取消音频设置不会隐式保存。分享链接只含课程 ID，不附带账号或 Program 授权。课程照片、教练与热身/放松图像尚为原稿参考资源；训练播放器、真实训练记录、外部日历和教练关注服务未接入。

移动端页面使用 375、390、430px 实际容器，滚动正文与底栏分离。截图检查发现 Workout 顶栏按钮伪元素缺少定位父级，导致三个按钮背景扩展为整体胶囊；已修复为每个 44px 触控区域内的 36px 独立玻璃圆形控件。

页面入口：[Workout](http://127.0.0.1:3012/#/app/workout?user=DEMO-1003&content=course_premium&review=0)、[课程详情](http://127.0.0.1:3012/#/app/course?user=DEMO-1003&content=course_premium&courseOrigin=workout&review=0)、[计划](http://127.0.0.1:3012/#/app/plan?user=DEMO-1003&content=course_premium&review=0)、[Program](http://127.0.0.1:3012/#/app/program?user=DEMO-1001&program=program_starter&content=course_premium&review=0)、[组件工作台](http://127.0.0.1:3012/#/demo/lab?tab=components)。

新增 `npm run test:native-ui`。本轮页面检查包含资源文件、SVG 原始尺寸、独立顶栏控件、固定底栏、真实时长、搜索、收藏隔离、分享链接、日历、音频保存/取消、日期键盘切换、计划上下文及 Program 返回。自动化验证属于本地 Demo，不代表完整视觉验收或欧美用户研究。

| 本轮验证 | 结果文件 |
| --- | --- |
| 新页面、状态与静态资源：25 项 | [页面检查与截图](native-page-validation/2026-10-13T09-41-23-315Z/results.json) |
| 商业化与保存对话读取：23 项 | [隔离业务检查](optimized-demo-validation/2026-10-13T09-42-29-789Z-df8fff/results.json) |
| 全部现有页面布局：41 项 | [多尺寸布局](layout-validation/2026-10-13T09-27-17-681Z/results.json) |
| 组件交互：18 项 | [组件检查](component-validation/2026-10-13T09-25-42-727Z/results.json) |
| 首页和账户顶栏：10 项 | [首页检查](home-ui-validation/2026-10-13T09-44-07-059Z/results.json) |
| A/B 工具：14 项浏览器 + 5 项规则 | [实验检查](ui-foundation-validation/2026-10-13T09-27-12-270Z/results.json) |

历史页实际任务检查发现，读取保存对话后仍同时显示当前会话，造成重复回复；现已让保存对话和当前消息分别显示。上述 23 项检查包含完整历史入口、读取实际资产和余额保持。最终构建通过，样式导入顺序冲突已消除，保留原有资源体积警告。

后续继续迁移 AI Coach、运动结果、World Tour / Free Mode 和其他既有页面。正式结果页 3486:2169 已读取截图与层级；其子节点的桌面 MCP 资源下载仍受 Allowed directories 限制，本轮没有用稀疏层级替代高保真设计代码。

## 本轮首页与顶栏纠偏

`SfHeader` 的标题区域改为透明，不再把整个顶栏包成长胶囊。返回与操作按钮单独使用玻璃表面，保留 44px 触控区域。标题两侧使用对称网格；长标题增加顶栏高度，账户正文随之下移。会员、权益、账单和 Credits 实际页及组件工作台都采用同一规则，依据 [Apple Toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars)。

正式首页上下文与截图现可通过已授权的远程 Figma 工具读取，31 项原始资源已本地缓存。新增 `SfBottomNavigation`、`SfCourseCard`、`SfPlanCard`、`SfProgressCard`、`SfPhotoEmptyState`，并在实际首页和组件工作台使用。首页导航和 AI 入口独立于内容滚动，原有动作仍进入既有控制器。较小按钮保持原稿视觉尺寸，同时扩展触控区域。

原稿存在 History 选中却显示 Favorites 空文案，以及 75% 和完成 20 / 剩余 5 不一致的问题。开发参考保留原稿供比对；实际 My Courses 按标签读取对应状态。收藏为本地 Demo 偏好，兑换来自实际权益；训练历史、签到、数据图表和个人计划仍缺少完整数据契约，不标记为已完成业务落地。

业务回归还发现包含额度的聊天自动执行时会短暂挂载确认弹层。现已取消这类自动聊天的弹层显示；额外 Credits 仍保留明确确认，后端预留、扣减和失败释放逻辑沿用现有规则。

新增 `npm run test:home-ui` 覆盖实际顶栏、长标题、首页资源、滚动、键盘和原稿 SVG 尺寸。当前证据：[10 项首页与顶栏](home-ui-validation/2026-10-13T08-11-39-060Z/results.json)、[18 项组件交互](component-validation/2026-10-13T08-11-35-736Z/results.json)、[41 项布局](layout-validation/2026-10-13T07-49-33-829Z/results.json)、[18 项 AI 动效](ai-ball-validation/2026-10-13T07-52-25-351Z/results.json)。

[21 项商业化回归](optimized-demo-validation/2026-10-13T08-05-19-646Z-2d80e6/results.json)包含整个聊天请求过程不挂载确认弹层的检查；[14 项实验浏览器检查](ui-foundation-validation/2026-10-13T08-05-32-727Z/results.json)与 5 项实验规则检查也通过。各检查使用本地 Demo；业务写入检查使用隔离数据库，不等同于真实用户研究或完整视觉验收。

## 本地查看

- [实际首页与 AI 入口](http://127.0.0.1:3012/?motion=full#/app/home?user=DEMO-1003&review=0)
- [AI Ball 动效、问卷和原稿姿态对照](http://127.0.0.1:3012/?motion=full#/demo/lab?tab=ai-ball)
- [基础组件与设计来源](http://127.0.0.1:3012/#/demo/lab?tab=components)
- [同一账户快照的 A/B 比较](http://127.0.0.1:3012/#/demo/lab)

## AI Ball 的结构与姿态

玻璃球壳固定。色团位于内部，和边缘保留间距，玻璃罩覆盖色团，清晰的眼睛在最外层。色团大小和通透度依据用户反馈调整，当前颜色属于授权延展，不宣称和原稿逐像素一致。

默认正视依据原稿 04/06；左上侧脸依据 01；右上侧脸依据 07。正视眼睛为 4 × 9、间隔 4，位于球体中线略下方。侧脸的位置与眼睛倾斜依据真实截图校准，右侧的 Figma 元数据包含反射坐标，不能直接用其 y 值作为实际视觉顶部。

- [正视原稿](figma-connection-recovery/266-43201-0.png)
- [左上原稿](figma-connection-recovery/266-43174-0.png)
- [右上原稿](figma-connection-recovery/266-43237-0.png)

同一个头部水平朝向和抬头程度驱动两层的球面投影。眼睛跟随球面视角，内部色团同步朝侧上方移动，产生两层合理的视差。眨眼只收合眼睑。此前将整张脸做平移和旋转的实现已替换。

待命动作之间有安静停留，单次转头约 1.4 秒、停留 0.9 秒、回正 1.3 秒。动作使用连续逐帧更新与平滑减速，观察间隔和动作速度分别维护。页面隐藏、离屏和减少动态时暂停。输入、真实生成、成功与失败由业务请求状态驱动；工作台问卷的生成明确标为模拟。

## 实际 Chrome 无动效的根因

用户实际 Chrome 返回 `prefers-reduced-motion: reduce`，旧实现将所有动画设为 `none`。此前自动化浏览器覆盖了这个偏好，造成了错误判断。诊断实际浏览器后确认：系统减少动态开启、CSS 动画 none、眨眼计数 0、眼睛与色团位移为 0。

已加入本地 Demo 的显式“完整动效预览”，并在当前站点保存选择；正式组件宿主默认遵循系统偏好。组件的 `reduceMotion` 仍优先于完整预览。回归包含系统减少动态开启时播放预览、重载保留及恢复静态三个场景。

## 组件和业务

控件和导航使用边缘反光、模糊与透明材质，内容使用可读表面。暗色、放大文字、减少透明度、减少动态及无背景模糊降级均有组件展示。来源与补齐规则存于 `src/design-system/sources.cjs`、`guidelines.cjs` 和维护 README。

会员基础功能免费、包含服务次数与额外 Credits 分离、超额明确确认、新加购 Credits 不过期、当前周期权益快照及 Program 授权保持现有业务逻辑。组件展示和原稿截图对照属于开发工具，没有新增产品入口。构建保留原有大资源警告；SF Pro 回退字体和完整页面视觉验收仍需继续完成。

材质依据 [Apple Materials](https://developer.apple.com/design/human-interface-guidelines/materials)，弹层与可访问性补齐依据 [Apple Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets) 和 [Apple Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)。

## 验证记录

- [AI 原稿姿态、连续中间帧、真实请求与减少动态：18 项](ai-ball-validation/2026-10-13T07-04-31-668Z/results.json)
- [控件、键盘、弹层、暗色和放大文字：17 项](component-validation/2026-10-13T06-07-33-292Z/results.json)
- [A/B 快照与组件展示：14 项浏览器检查](ui-foundation-validation/2026-10-13T06-07-32-416Z/results.json)
- [商业化真实 Demo 任务：21 项](optimized-demo-validation/2026-10-13T07-04-27-517Z-5b8936/results.json)
- [多尺寸布局与既有导航：41 项](layout-validation/2026-10-13T07-04-33-874Z/results.json)

另有 5 项实验规则检查和 4 项已通过的 AI 头部姿态模块检查，覆盖原稿端点、中间投影、待命间隔和过渡连续性。自动化检查不等同于欧美用户研究或视觉验收。
