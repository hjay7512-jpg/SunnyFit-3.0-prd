const mvp = 'https://www.figma.com/design/94S2EVx6mOkJRj8P0VyRLx/V3.0-MVP?node-id=';
const alpha = 'https://www.figma.com/design/t7g261XYs61EdvYzIZn5YL/V3.0-Alpha?node-id=';
const formal = 'https://www.figma.com/design/2AT0tm9mkFhes8T81YzA2L/V3.0?node-id=';
export const pages = [['home', 'Home', '原稿'], ['workout', 'Workout · Course', '原稿'], ['course', '课程详情 · Start', '原稿'], ['program', 'Training Program 首页', '原稿'], ['weekly','Weekly Report · 基础与洞察','原稿'], ['challenge','Limited Challenge · Join','原稿'], ['movement','Movements · Start','组件延展'], ['world-tour','World Tour · Start','组件延展'], ['coach', 'AI Coach', '原稿'], ['result', 'Workout Data · Insight', '原稿'], ['plan', '当前 Plan 详情', '原稿'], ['profile','个人中心','原稿'], ['membership', 'Membership & Usage', '原稿'], ['billing','Billing History','原入口'], ['wallet', 'Credits · 加购', '新增']].map((item, index) => ({
  id: item[0],
  label: item[1],
  kind: item[2],
  number: String(index + 1).padStart(2, '0')
}));
export const titles = {
  home: 'Home',
  workout: 'Workout',
  course: 'Courses',
  program: 'Training Program',
  coach: 'AI Coach',
  result: 'Workout Data',
  plan: 'Plan',
  history: 'Dialogue with History',
  membership: 'Membership & Usage', plans:'Plan & Benefits', billing:'Billing History',
  wallet: 'Extra Credits', challenge:'Challenges',movement:'Movements','movement-training':'Movement training','world-tour':'World Tour','world-tour-detail':'World Tour', profile:'Personal center', library:'Workouts', unlocked:'Unlocked content', weekly:'Weekly report', 'program-detail':'Training Program'
};
export const notes = {
  'movement-detail':{title:'动作详情 · 动作清单与训练安排',url:'https://www.figma.com/design/Q2YjFPNeavj0zS6pHpr5Lk/SUNNYFIT?node-id=36-5886',lines:['View Workout 进入独立动作详情页，按 Warm-up / Workout / Cooldown 展示动作顺序及目标。Get Ready 再进入准备页。','详情可浏览；准备页的开始按钮才检查训练权限。']},
  'movement-training':{title:'动作训练 · 准备、训练与计划间歇',url:'https://www.figma.com/design/Q2YjFPNeavj0zS6pHpr5Lk/SUNNYFIT?node-id=36-5886',lines:['准备页保留预览、训练信息、独立 Heart Rate 入口及两种开始按钮。心率面板可打开，当前浏览器原型未接入蓝牙配对。','面板顶部横条支持点击及上下拖动。大小窗和面板偏好不随动作、倒计时或休息切换而重置。','每个动作开始前倒计时 3 秒；仅在生成组合配置 restSeconds 的位置休息，0 或缺省则直接衔接。休息可跳过，暂停冻结当前阶段；准备及休息不累计训练量。结束只确认一次。','视觉引导仅需持续检测到人 3 秒，然后进入动作准备倒计时。识别在本地进行。Studio 使用 8 段真人视频；弯举按识别计次，JM Press / High Pull / Woodchop 暂用计时。']},
  home: {
    title: 'Home · 原导航与入口',
    url: formal + '7590-5619',
    lines: ['首页恢复 Home / Workout / Challenge / Social，独立 AI 图标进入 AI Coach；My Progress 的 Plan 进入已有计划。', '推荐课程 Start Now 检查内容授权。新增内容标记可关闭对照原稿。']
  },
  weekly:{title:'Weekly Report · 正式新版',url:formal+'7697-14248',lines:['上周完整数据与固定模板免费；AI 个性化洞察按 Weekly Report AI Insight 授权，不扣 Credits。','首页未读卡替换推荐；Open / Maybe Later 标记已读。共享 PNG 只包含免费基础数据。训练为标记的本地验证样本。']},
  challenge:{title:'Limited Challenge · 现有 Join',url:alpha+'266-41091',lines:['保持原四个 Tab、分类、图片与 Join 结构；显示实际配置的开始/结束时间。','Join 检查 Scope 与活动时间，只记录加入资格，不生成训练进度或奖励。']},
  movement:{title:'Movements · 共用组件延展',url:formal+'4158-7827',lines:['沿用现有训练内容选择器的 Movements 入口；列表使用 V3 共用玻璃组件。未定位独立动作列表原稿，此页为评审设计延展。','浏览开放，Start 按 movement_access 的具体 Scope 校验。']},
  'world-tour':{title:'World Tour · 浏览与分类',url:'https://www.figma.com/design/Q2YjFPNeavj0zS6pHpr5Lk/SUNNYFIT?node-id=1025-16528',lines:['按指定参考稿呈现实景封面、Scene 与 Equipment。路线先进入详情，再进行开始或订阅。']},
  'world-tour-detail':{title:'World Tour · 路线详情',url:'https://www.figma.com/design/Q2YjFPNeavj0zS6pHpr5Lk/SUNNYFIT?node-id=1025-16528',lines:['从实景浏览页进入路线详情；沿用已有课程详情的信息层级，按路线配置展示底部 CTA。']},
  workout: {
    title: 'Workout · Course 模块',
    url: formal + '6741-1367',
    lines: ['Course 首屏迁移到共用页面、轮播、导航和独立顶栏控件；实际课程名称、时长与搜索来自同一目录 API。', 'World Tour 已通过原入口接入授权；Free Mode 保留现有入口。设备分类信息不齐，不能按器械完成完整筛选。']
  },
  course: {
    title: 'Courses · 原 Start 动作',
    url: 'https://www.figma.com/design/Q2YjFPNeavj0zS6pHpr5Lk/SUNNYFIT?node-id=6006-28045',
    lines: ['沿用课程详情既有信息结构与原资源，使用 V3 材质、共用顶栏与按钮。正式 V3 详情稿未定位，空缺指标显示空值。收藏、日期和音频偏好是按账号/课程隔离的本地 Demo 状态。', 'Start 判断内容标记。Featured 确认独立兑换；Program 子课程携带父授权。返回 Workout、计划或 Program 时保留来源，授权通过后只校验播放器入口，不产生训练记录。']
  },
  program: {
    title: 'Training Program · 首页已有状态',
    url: formal + '7618-8832',
    lines: ['既有 Program 页面复用正式课程计划卡、课程卡和按钮；按实际包内成员展示 Workouts，没有训练进度数据时显示空值。', 'Start 先查 Program，再进入所属课程；包内访问携带 Program 授权，不重复兑换。沿用既有路由，不增加底部 Tab。']
  },
  coach: {
    title: 'AI Coach · 发送时检查',
    url: formal + '4144-6773',
    lines: ['保留原工具栏、蓝色用户气泡、玻璃回复、输入框与历史入口，移除自创功能切换 Tab。', 'Send 使用普通聊天计价。输入跨会员/充值保留；已有对话免费读，新请求成功结算，失败释放。']
  },
  result: {
    title: 'Workout Data · 数据与分析',
    url: alpha + '9-1507',
    lines: ['基础运动指标免费。新版个性化洞察读取校验功能权益；历史已购结果保持原合同。', '训练 AI 洞察只检查功能权益，不消耗 Credits；基础数据始终免费。Ask Coach 返回普通聊天并带运动上下文。新增生成按钮位置是本次方案。']
  },
  plan: {
    title: 'Plan · 当前计划详情',
    url: formal + '7652-9367',
    lines: ['阶段、五日预览与 Coach 建议已组件化。训练日、恢复日和完成态在组件工作台展示；目标和阶段仍是参考场景，不写训练记录。', 'GO 检查真实课程身份；Adjust today 放在 More 中，计划讨论按 AI Coach User Turn 消耗；激活已有计划才检查 Dynamic Plan 权益，且不扣 Credits。']
  },
  history: {
    title: 'AI 对话历史 · 原记录入口',
    url: mvp + '864-3497',
    lines: ['通过顶部历史图标进入，读取真实演示资产，不消费 Credits。', '继续发送是新请求，重新检查权益和额度。']
  },
  membership: {
    title: 'Membership & Usage · 原二级页',
    url:alpha+'249-2183',
    lines: ['本期为 Free 免费用户 + 单一 Premium 付费会员；区分有效、关闭续订但有效、到期恢复 Free。', '会员与权益用量保持同一个入口；Free 与 Premium 都有有限额度。只有限时活动显示 Unlimited 和活动截止时间。月付与年付是同一等级的不同周期。购买与续订为前端模拟，不创建订单；不将会员生效自动视为无限量。']
  },
  profile:{title:'Personal Center · 原个人中心',url:alpha+'249-2123',lines:['保留既有一级分组，菜单图标使用共用组件。二级条目来自现有原菜单与正式 Settings 截图。','Rewards / Badges 与 Credits 分开；会员和订单使用现有接口，未接入的服务显示明确 Demo 状态。']},
  devices:{title:'Devices & Health · 原菜单映射',url:alpha+'243-662',lines:['My Equipment / Health App / Shop Sunny Equipment 来自原 Equipment & Service 分组。','现有 Demo 没有账户设备和健康授权接口；不填入示例已连接设备。设备商城沿官方网页访问。']},
  community:{title:'Community & Privacy · 原菜单映射',url:alpha+'249-2161',lines:['Snaps / Ranking 来自原侧栏；Privacy Settings 复用原设置项，同一详情通过两个入口访问。','当前无社交和隐私保存接口；没有补造帖子、排行或分享权限成功状态。']},
  settings:{title:'Settings · 既有完整列表',url:formal+'6977-11258',lines:['采用正式 6977:11258 的 11 项与 Log Out，My Preferences 采用同组 6977:11115 的两项。','Home 7694:8502 的底部有 Share your week 覆盖，两版存在差异；不混入其按钮。目标与单位仅保存本地预览；其它账号服务尚未接入。']},
  support:{title:'Help & Support · 原菜单映射',url:alpha+'243-702',lines:['保留 Beginner Guide / FAQs / Support Equipment / Contact Us 原项。','链接使用已核实的 Sunny 官方指南、FAQ、兼容清单和支持邮箱。没有模拟发送客服消息。']},
  invite:{title:'Invite Friends · 原入口',url:alpha+'249-2174',lines:['从现有邀请入口访问，复制官方 App 链接。','邀请奖励和计数接口尚未接入；没有生成推荐码或发放 Rewards / Credits。']},
  'equipment-shop':{title:'Shop Sunny Equipment · 原入口',url:alpha+'249-2179',lines:['保留现有设备商城入口，访问 Sunny 官方网站。','本地商业化 SKU 仅用于会员和 Credits；没有补造实体器材订单。']},
  plans:{title:'Plan & Benefits · 原入口内容',lines:['由 Membership & Usage 的原 Plan & Benefits / Explore Premium 进入，不新增一级入口。','查看当前权益快照、在售方案与订阅管理，内容 Scope、功能授权与额度发放分别呈现。']},
  billing:{title:'Billing History · 原交易入口',lines:['原 Membership & Usage / My Orders 入口读取同一账户订单。','历史延期订单保留原记录；新版即时升级的结算仍待定，因此不生成付款。']},
  wallet: {
    title: '新增 My Credits 页面',
    lines: ['AI Coach Credits 与 Content Credits 分开；自购永久有效，历史批次保留原期限；加购不要求先开会员。', '从受限入口加购后可返回原页面，保留输入和内容场景，不自动重试或扣费。']
  }
};

// Current frontend review definitions override older historical note text.
Object.assign(notes,{
  course:{...notes.course,lines:['保留原课程详情、预览与 Start。Free 可直接开始；Premium 内容在 Start 时展示场景化会员说明。','评审侧栏可切换 Free/Premium 内容、加载、失败和不可用。升级后回到原课程；开始训练不消耗对话用量。']},
  'world-tour':{...notes['world-tour'],lines:['参考稿提供 Scene / Equipment 浏览结构；视觉沿用 Demo 的 Workout 顶栏、红色分段控件、内容卡和底部导航。路线卡进入详情。Free 路线为本地评审样例，不写入内容目录。']},
  program:{...notes.program,url:'https://www.figma.com/design/Q2YjFPNeavj0zS6pHpr5Lk/SUNNYFIT?node-id=2816-29683',lines:['保留 Details / Schedule、封面与属性信息，使用 Demo 共用导航、分段控件、内容卡及课表行；文字颜色与层级读取 V3 UI token。','底部按访问权限和活动资格显示 Select Program 或付费引导；进入包内课程保留父级上下文。']},
  weekly:{...notes.weekly,lines:['基础周数据和固定分析保持免费；Premium 个性化 Insight 具有锁定、生成中、失败、已就绪与历史已保存状态。','历史已保存结果在过期后仍可读；升级返回原周报。评审参数只影响展示，不标记真实报告已读。']},
  coach:{...notes.coach,lines:['保留原聊天工具栏、输入框、历史与用量入口；0–100% 有限额度与限时无限量活动独立于会员身份。','额度不足统一进入 Membership & Usage 并保留草稿；AI 回复/失败为本地样例，不扣真实用量。Dynamic Plan 可讨论预览，Activate 时才检查会员权益。']},
  plan:{...notes.plan,lines:['保留原计划详情、五日预览与 More 操作。新增待激活与已激活状态，不新增一级入口。','Activate 检查 Premium；激活已有计划不消耗对话额度。无限量活动不授予会员功能。']}
})
