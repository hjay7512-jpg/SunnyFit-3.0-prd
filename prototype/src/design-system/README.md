# SunnyFit UI 组件维护约定

这里维护前台共用的基础样式和组件。业务规则、购买和额度请求继续使用项目现有业务代码；后台继续使用原后台组件体系。

## 来源与状态

`sources.cjs` 记录组件来源、页面迁移状态和正式稿到 Alpha 副本的映射。读取上下文与通过视觉验收是两个状态，不能混用。正式稿与副本发生差异时，记录差异后再确定页面基线。

正式 V3.0 是视觉依据。Alpha 的个人中心和 Membership 内容是业务原型，不再作为组件的视觉规范。已有按钮与标题使用正式稿几何；稿件缺失的控件和状态依据 Apple 指南补齐，并在 `guidelines.cjs` 中记录。AI Ball 是用户授权延展的动态组件，不能当成原稿静态资源的逐像素复刻。

## 组件接口

| 组件 | 输入 | 输出 | 已接入位置 |
| --- | --- | --- | --- |
| SfButton | 默认 v3-full；glass、text、旧 commerce；block、compact、disabled、loading | click | 会员、加购、正式首页与组件展示；compact 保留 32px 视觉和 44px 触控区域 |
| SfMenuRow | label、description、icon（可选）、accessory slot、href / target、staticRow、disabled | 可用行的 click 事件；外链为原生 a | 个人中心、既有二级菜单与 Membership & Usage 原菜单 |
| SfUsageMeter | remaining、total、label | 无业务事件 | 包含 AI Coach 次数的剩余量 |
| SfSectionTitle | 文本 slot | 无业务事件 | 正式首页、组件展示 |
| SfIcon / SfHeader | 图标；标题、返回、玻璃材质和 trailing slot | back | 账户页面、实验工具 |
| SfBottomNavigation | items、active、homeIndicator、accessory slot | select(item) | 正式首页；四个原入口及独立 AI Ball |
| SfCourseCard | title、duration、level、image、imageStyle、appearance | 调用方提供动作 | 正式首页推荐课程；原稿照片裁切与动态内容 |
| SfPlanCard | empty、title、description、image、progressText、details、valueSize、progress slot | action | 正式首页空状态；工作台 AI / 课程计划参考状态 |
| SfProgressCard | title、detail、chartLabel、arrow、chart slot | action | 正式首页 Workout / Body 参考卡 |
| SfPhotoEmptyState | image、mask、imageStyle、title、actionLabel | action | My Courses 照片空状态 |
| SfSegmentedControl | items、value、disabled、pills | input / change | 场景与组件展示；方向键、Home/End |
| SfSwitch / SfChoice | value、label、description、disabled | input | 表单；开关、原生复选框与单选框 |
| SfField / SfSearchField | value、label、help、error、type 等 | input | 常规输入、密码显示、搜索清除 |
| SfSlider / SfStepper | value、min、max、step、label | input | 范围、数量与边界交互 |
| SfBadge / SfCard / SfAvatar | 状态、内容 slots、动态头像与姓名 | 展示 | 内容表面、状态与用户身份 |
| SfSkeleton / SfFeedback | 加载、空、失败、成功和操作文案 | action | 通用反馈 |
| SfToast | open、message、tone、duration | input / dismiss | 非阻断通知；交互时暂停计时 |
| SfSheet / SfDialog | open、busy、dismissible、contained、detent 等 | input / close | 商业化弹层与开发场景 |
| SfAiBall | state、size、variant、gaze、reduceMotion、motionPolicy、blinkToken、fit | blink / settled | 首页既有 AI 入口、AI Coach、动效工作台 |
| SfAmbientBackdrop / SfPageLayout | 原资源函数、title、header/trailing/footer slots、滚动与系统区域 | back | Workout、计划、课程、Program、对话历史 |
| SfRoundAction | size、layers、contentId、action、disabled | action | 原 48 / 72px Go，课程 ID 由调用方传回控制器 |
| SfStageCard | stageNumber、title、dayLabel、description、progress、divider | 展示 | 计划阶段卡；真实阶段数据尚待接入 |
| SfDayStrip | value、days、原图标 | input | 五日预览；方向键、Home / End |
| SfCoachWorkoutCard | message、courses、goLayers | open-course / start-course | 计划 Coach 建议；动态名称、时长与内容身份 |
| SfWorkoutCarousel | content、image、backImage、imageStyle、goLayers | start | 正式 Workout 的 Course 模式 |
| SfChatGreeting | name | 展示 | AI Coach；正式 3602:11542 的渐变标题，名称来自 API |
| SfMessageBubble | text、role | 展示 | 当前消息与保存对话；正文按纯文本渲染 |
| SfMessageComposer | value、disabled、placeholder | input / send / resize | AI Coach；Enter 发送、Shift + Enter 换行、输入法保护、等待时冻结草稿 |
| SfInsightCard | body、saved、busy、rpe、chargeLabel | generate / ask | Workout Data；保存报告自然增长，按钮使用原生成和 Ask Coach 链路 |
| SfUserToolbar | avatar、badge、profileLabel、actions、slot | action(id) | 正式首页与实际 Workout；36px 独立玻璃表面、44px 触控区域 |
| SfWorkoutRecommendation | course 视图模型、quickActions、disabled、badge slot | action(id) | 四个首页状态和实际首页；复用课程卡、按钮与 AI Ball |
| SfPlanProgress | mode、layers | 展示 | 原四个旋转阶段弧段，或百分比圆环三层；SVG 保留根尺寸 |

组件置于 `.sf-ui` 根元素下，以取得 `tokens.css` 的局部变量。组件负责展示和基本交互语义，页面决定导航目标；组件不得自行发起购买、服务请求或直接读取 Vuex 商业化状态。

默认按钮使用正式稿的 48 px 最小高度、12 px 圆角、18 / 26 字体。旧 `commerce` 仅用于历史兼容。长文本自然增长，不截断操作文案。

材质集中在 `materials.css`：导航和操作使用带边缘反光的玻璃，内容使用可读表面。支持暗色、放大文字、减少透明度、减少动态及不支持背景模糊的浏览器。共享组件不引入产品入口。

个人中心菜单图标为统一 22 px 的单色线性图标；会员皇冠放在 40 px 的玻璃底座内，以小面积品牌色强调。文字标签、Free / Premium 状态和 API 用量同时保留，窄屏自然换行。`SfMenuRow.icon` 仅补充视觉提示，静态行继续保持原有不可操作语义。用户要求新增的八个图标使用本地原始 Lucide SVG，通过 `SfIcon` 的 CSS mask 跟随文字颜色；资产清单固定上游版本与 SHA-256，原始许可证保存在 `public/assets/icons/profile-menu/LICENSE`，不冒充正式 Figma 资源或 Apple SF Symbols。

个人中心二级清单由 `app/profile-menu.js` 管理：每项保留原文、节点和链接。Settings 选择正式稿完整的 `6977:11258` 版本，Preferences 使用其同组两项；`7694:8502` 另一版的末尾有 Share your week 覆盖，不将两版混合。菜单列表组合现有组件，属于原功能层级的迁移，未宣称所有详情逐像素完成。单位和健身目标的本地预览分账号保存；设备授权、社交、推送、账号操作与缓存服务未接入，不能填入稿件示例数值或伪造成功。

## AI Ball 动作约定

球体为 56 × 56 坐标系内的 40 px 球壳。内部色团约束在 32 px 内圈，玻璃罩覆盖色团，眼睛在玻璃罩外且保持清晰。默认正视采用原稿 04/06：两眼 4 × 9、左上角 x22/30、y26。左上侧脸采用 01，右上侧脸采用 07。侧脸眼睛端点依据截图校准，尤其右侧节点的坐标包含反射，不能把元数据的 y 当成视觉顶部。

同一个 yaw/pitch 头部朝向驱动内部色团与外部眼睛。`ai-ball-motion.js` 分别计算两层的球面投影，眼睛倾斜跟随球面视角，玻璃壳固定。眨眼发生在各自眼睑上，不改变整张脸的位置。待命的观察间隔与单次动作速度分开：转头约 1.4 秒、停留 0.9 秒、回正 1.3 秒，动作之间安静停留；使用逐帧连续曲线与自然减速。离屏暂停保留进度，恢复时不跳过隐藏期间的动作。

六个状态是 idle、listening、thinking、responding、success、error，由调用方的真实业务生命周期控制。组件不自行把 Loading 切成成功，不编造生成百分比。当前 Demo 服务非流式，因此实际聊天返回后直接进入 success；responding 保留给真实内容流或输出场景。

默认遵循系统减少动态偏好。用户明确选择本地 Demo 的“完整动效预览”后，`src/demo/ai-motion.js` 保存当前站点预览偏好，允许首页和动效工作台播放；组件的 `reduceMotion` 仍优先于完整预览。`motionPolicy` 可指定 inherit、system、full、reduce，默认 inherit，未配置的宿主策略是 system。离屏或页面隐藏时暂停动画。用户当前 Chrome 的系统减少动态为开启，此情况必须覆盖在回归中。

## 新功能迭代

1. 指明对应设计节点、已有产品入口与业务状态。
2. 优先配置、组合已有组件；确有重复结构时再提炼新组件。
3. 保存上下文与原始静态资源，记录 token 来源；不把截图作为产品 UI。
4. 将已有状态及新增状态加入组件展示和场景工具。实验差异集中声明，不复制业务判断。
5. 在与设计稿相同的宽度、内容和状态下检查截图，再检查真实任务链。共享组件改变时回归其受影响页面。

运行 `npm run demo:components` 打开组件与来源，`npm run test:components` 检查控件和弹层，`npm run test:foundation` 检查实验快照，`npm run test:ai-ball` 检查真实动态画面、脸部同步与系统偏好。现有业务回归为 `npm run test:consumer`；页面适配回归为 `npm run test:layout`；聊天和结果卡片专项回归为 `npm run test:ai-ui`；原生课程与计划回归为 `npm run test:native-ui`。

当前公开组件共 41 个。`SfHeader.glass` 仅给返回和操作控件应用玻璃材质，标题容器保持透明；页面不得再用覆盖样式把整条顶栏包成胶囊。两侧采用对称网格，长标题增加顶栏高度，账户正文随之下移。

浏览器展示的等比适配属于 Demo 外壳，由 `src/demo/fit-preview.js` 和 `views/app/preview-fit.css` 处理；组件内的布局单位与资产根尺寸不变。页面内容和评审侧栏独立滚动，窗口充足时恢复原大小。组件工作台保留原尺寸进行设计对照。`npm run test:preview-fit` 覆盖完整视口、内部滚动、缩放后弹层与聊天草稿。

`SfUserToolbar` 的 leading 槽位承接头像旁的签到反馈，右侧操作固定。首页签到只在触发后展开 3 秒，重复触发重新计时；组件销毁、账号或参考场景变化清理计时器。`checkInStreak` / `checkInReward` 为展示数据，当前默认值沿用原稿 Demo，组件不发放积分。Workout 顶栏宽度必须扣除左右外边距，不能设置成页面 100% 后再增加边距。运行 `npm run test:toolbar` 检查 320 至 430 px 的完整触控边界与计时行为。

正式首页默认状态已读取完整上下文与截图，31 项资源存于 `public/assets/figma/v3/home`；计划参考状态资源分别存于 `home-ai-plan` 和 `home-course-plan`。SVG 保留根尺寸，裁切与原始图层变换由外部布局负责。原稿截图仅用于开发对照，产品页面由可交互组件渲染。

SF Pro 在 Windows 上仍使用系统字体回退，完整视觉验收尚未完成。首页数据图表、签到、个人计划和课程历史仍缺少完整业务数据契约；My Courses 原稿的 History 选中态却用了 Favorites 空文案，当前业务预览按标签修正文案，参考预览保留原稿。活跃计划的 75% 与完成 20 / 剩余 5 也不一致，不能直接作为实际业务数据。后续页面迁移仍需继续，资源已可读取不等于整个设计已验收。

AI Coach 和 Workout Data 当前为部分组件接入：正式问候标题使用完整上下文；消息、输入和结果卡片沿用既有结构与资源，并补齐原生交互。正式 Coach 顶栏四个独立操作、麦克风和结果页全套资源尚未读取完成，不能标成整页高保真验收通过。结果摘要、心率图和 RPE 仍是设计参考数据。

计划四态由 `assets/plan-states.js` 的正式上下文参考驱动；暂停仅允许在 `reference` 工作台下展示。`SfStageCard` 共用正常与暂停排版，原 SVG 标记保持根尺寸；暂停正文为 14/22，正常正文为 16/24。Stage I 与第二段进度等原稿矛盾仅限参考快照。`SfCoachWorkoutCard.compactCopy` 承接暂停的 14/22 文本，不更改额度或生成流程。暂停缓存顶栏图标与当前截图含义不一致，保留既有 More 操作组件，待新资源恢复再核对。

套餐、账单和 Credits 页复用基础卡片、按钮、状态标签及空状态；`consumer-pages.css` 由账户样式统一加载，实际页面与 A/B 工作台共享同一实现。现行方案与已购权益快照继续由 API 分别提供，未增添商品或产品入口。运行 `npm run test:plan-states` 和 `npm run test:commerce-ui` 检查本批来源、几何、键盘状态与响应布局。

首页四态由 `src/design-system/assets/home-states.js` 的正式快照驱动，仅供工作台视觉对照；`V3Home.activePlans` 接受真实计划的视图模型，当前 storefront 没有个人计划与训练历史字段，实际账号页面不会自动接入参考快照。运行 `npm run test:home-states` 检查四态原始资源、准确槽位、字体变体和本地预览事件。
