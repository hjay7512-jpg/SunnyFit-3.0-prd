const state=(id,label,...description)=>({id,label,description})
const normal=state('default','正常页面','按当前页面结构展示内容。组件状态可在下方分别切换。')
const loading=state('loading','加载中','页面数据加载期间显示加载反馈，暂不呈现未取得的数据；加载完成后恢复页面。')
const error=state('error','加载失败','数据请求失败时提供重试入口；重试恢复当前页面，不丢失入口上下文。')
const empty=state('empty','暂无内容','当前没有可展示的内容，保留页面标题及返回入口，不显示伪造记录。')
const memberStates=[state('free','未订阅','显示 Free 账户及有限的 AI Coach 用量。可从原入口了解 Premium。'),state('active','会员有效','Premium 权益有效，显示续订日期。会员身份和对话剩余额度分别呈现。'),state('canceled','已关续订','当前周期内仍保留 Premium 权益；显示有效期，不视为已经过期。'),state('expired','会员已到期','恢复 Free 权限，保留已保存的历史内容；新请求按当前权限处理。')]
const quotaStates=[state('available','额度充足','剩余对话额度 65%；对话页以紧凑状态显示，会员中心的进度条与数值一致。'),state('low','额度较低','剩余 10% 时显示低额度提示，不影响已拥有的训练功能。'),state('empty','额度用尽','额度已用尽，聊天草稿保留，发送时引导查看用量或订阅。训练和已保存结果仍可使用。'),state('unknown','额度未知','未取得额度时不当作用尽，不展示付费引导；保留草稿并提供重试。'),state('campaign','限时无限量','活动期显示无限量和截止时间，会员功能授权保持独立。'),state('ended','活动已结束','取消无限量标记，恢复显示有限额度，不改变会员有效状态。')]
const insightStates=[state('locked','待解锁','基础数据可读；洞察区域展示 Premium 入口，点击后打开当前场景的订阅说明。'),state('ready','已就绪','Premium 可使用个性化洞察；运动结果页可点击生成，周报展示就绪内容，不消耗对话额度。'),state('insight-loading','生成中','仅洞察组件显示生成状态，基础数据继续可读；生成按钮避免重复提交。'),state('insight-error','生成失败','仅洞察组件显示失败与重试入口，基础数据不受影响。'),state('saved-insight','已保存','展示已保存的洞察。会员到期后，原结果仍可阅读。')]
const purchaseStates=[state('closed','收起','从原型中的 Premium 入口打开付费引导，保留当前内容、位置和聊天草稿。'),state('offer','付费引导','先承接原任务，提供直接订阅和了解完整权益两条路径。两种页面共用方案、优惠和购买处理，购买后返回原任务。'),state('processing','处理中','平台处理期间避免重复付款，等待当前请求确认。'),state('restoring','恢复购买','核对当前账户的已有订阅，避免重复购买；无有效订阅时保留当前方案和任务并显示结果。'),state('success','购买成功','展示成功反馈并保留原任务；点击继续后才开始训练或发送草稿。此状态只更新评审展示。'),state('failure','付款失败','展示付款失败与重试操作，保留原始任务，不自动开始训练或发送消息。'),state('cancelled','取消付款','取消后保留原内容与草稿，可返回页面或重新选择方案。'),state('pending','待确认','付款待确认时不重复下单，提供查询结果入口。')]
const offerStates=[state('standard','常规订阅','没有适用试用活动时，按在售 SKU 展示真实周期与价格。默认月付；切换方案同步更新按钮及扣费说明。'),state('trial','30 天试用','评审示例：已核实当前账户符合活动资格，仅年付方案享 30 天免费。默认选中年付，按钮为 Start 30-day free trial；显示今天 $0 和试用后的完整年费。切换月付恢复常规订阅。'),state('ineligible','无试用资格','活动仍有效，但当前账户没有试用资格；展示常规订阅，不保留免费标签或免费按钮。'),state('unknown','资格未知','资格尚未核实，展示常规订阅。只有平台确认有效资格后才允许承诺试用。'),state('expired','活动已失效','活动过期后回落到常规方案；付款前重新核对活动、资格、SKU 与价格，变化时要求重新选择。'),state('unavailable','方案不可用','方案未取得时禁止付款，保留原任务并提供重新加载入口。')]
const eventLabels={paywall_view:'付费引导曝光',paywall_offer_selected:'选择方案',paywall_details_view:'进入权益说明',paywall_quick_return:'返回快速订阅',paywall_benefit_explored:'了解具体权益',paywall_purchase_started:'发起购买',paywall_purchase_result:'购买结果',paywall_dismissed:'关闭付费墙',paywall_continue:'继续原任务',paywall_restore_started:'恢复购买',paywall_restore_result:'恢复结果'}
function wallSections(vm,items){
  if(!items.some(item=>item.id==='purchase'))return items
  if(['usage','unknown','credits'].includes(vm.mvpGate?.kind)||vm.screen==='coach'&&vm.mvpMember.active)return items
  const wall=vm.mvpWall,flow=vm.mvpGate,events=(vm.paywallEvents||[]).slice(-5).reverse()
  const offer={id:'offer',title:'活动与试用匹配',states:offerStates,active:vm.$route.query.reviewOffer||'standard',disabled:!!vm.mvpPendingPurchase||['processing','restoring'].includes(flow?.stage)}
  offer.description=offerStates.find(item=>item.id===offer.active)?.description||offerStates[0].description
  const tracking={id:'paywall-events',title:'入口与转化事件',description:['同一付费墙使用不同入口标识匹配首屏内容：受限权益 → 场景主张 → 其他 Premium 价值 → 方案 → 继续原任务。','曝光、方案选择、购买结果、关闭和继续原任务均关联同一次流程；不记录聊天原文。当前为本地事件预览，真实发布时由分析 SDK 适配器接收。'],facts:wall?[['基座',wall.id+' · v'+wall.version],['入口',wall.placementId],['受限权益',wall.entitlementCode||'主动了解会员'],['匹配活动',wall.campaignId||'常规订阅'],['资格判定',wall.eligibility.reason],['当前方案',flow?.offer?.offerId||wall.defaultOfferId||'无可用方案']]:[],events:events.map(event=>({id:event.eventId,label:eventLabels[event.type]||event.type,detail:[event.placementId,event.result,event.billingPeriod,event.trialDays?event.trialDays+' 天试用':null].filter(Boolean).join(' · ')}))}
  const view=flow?.view||(['membership','plans'].includes(vm.screen)?'benefits':'quick'),locked=flow&&flow.stage!=='offer'
  const paths={id:'purchase-view',title:'用户决策路径',states:[state('quick','A · 快速订阅','用户已经倾向付费：先承接选中的内容、计划或草稿，回答“订阅后我现在能做什么”；简要说明整体会员价值，再展示价格和直接订阅按钮。','“See what Premium includes”为明确的次入口，给仍犹豫的用户继续了解，不强制每个人先读完整权益页。'),state('benefits','B · 了解权益','用户仍在判断是否值得付费：完整权益页先保留原任务，再用训练、计划、洞察和 AI Coach 的使用场景解释长期价值，提供 Free/Premium 对比及常见疑问。','按来源默认选中最相关的权益。可在此直接订阅，也可返回快速订阅；方案、优惠、原任务和阅读位置保留。返回按钮只退一层，关闭才返回原页面。')],active:view,disabled:!!locked||!!vm.mvpPendingPurchase}
  paths.description=paths.states.find(item=>item.id===view).description
  if(['membership','plans'].includes(vm.screen)&&view==='benefits')paths.description=['从会员中心主动点击 Explore Premium，直接进入完整会员介绍，展示整体权益、Free/Premium 对比及订阅方案；不经过单内容的快速拦截页。','此入口不显示选中内容提示；返回直接回会员中心。课程、路线等内容拦截继续使用先承接当前内容的快速订阅路径。']
  const education=wall&&view==='benefits'?{id:'benefit',title:'会员权益场景',states:wall.education.stories.map(story=>state(story.id,story.label,story.description,story.detail)),active:flow?.benefitTab||wall.entry.defaultBenefit}:null
  if(education)education.description=education.states.find(item=>item.id===education.active)?.description||[]
  tracking.description=['两条决策路径共用同一个基座、报价和购买流程。当前任务 → 直接订阅，或当前任务 → 了解完整权益 → 订阅；成功后显式继续原任务。','分别记录引导曝光、进入权益说明、了解具体权益、返回快速订阅和购买结果，均使用同一个 flowId；不记录聊天原文。当前是本地事件预览，发布接入由分析 SDK 适配器承接。']
  tracking.events=events.map(event=>({id:event.eventId,label:eventLabels[event.type]||event.type,detail:[event.view==='benefits'?'权益说明':'快速订阅',event.placementId,event.benefitId,event.result,event.billingPeriod].filter(Boolean).join(' · ')}))
  const index=items.findIndex(item=>item.id==='purchase');return [...items.slice(0,index+1),paths,...(education?[education]:[]),offer,tracking,...items.slice(index+1)]
}
const accessStates=[state('locked','未解锁','浏览详情开放；执行 Start / Join / Activate 时才检查权限，并保留原任务用于订阅后返回。'),state('unlocked','已解锁','当前功能权限通过，可执行对应操作；开始训练或激活计划不消耗对话额度。')]
const sections={
  quota:{id:'quota',title:'AI Coach 用量',states:quotaStates},
  'coach-membership':{id:'coach-membership',title:'付费承接',states:[state('free','免费用户','低额度提醒可了解 Premium；额度用尽后的失败消息提供 Upgrade to send。订阅成功后，由用户点击 Resend message 重发原消息。'),state('active','会员有效','低额度提醒和失败消息提供 Add credits，进入一次性 AI Coach 额度包。加购不变更会员状态、不重置订阅额度；付款后由用户确认重发原消息。'),state('canceled','已关续订','会员有效期内保留权益；额度不足时仍按一次性加购承接，不要求重开订阅。'),state('expired','会员到期','历史对话保留。额度用尽后的失败消息引导续订，成功后由用户确认重发，不重复追加同一条消息。')]},
  purchase:{id:'purchase',title:'Premium 付费墙',states:purchaseStates},
  access:{id:'access',title:'功能权限与开始操作',states:accessStates},
  'content-offer':{id:'content-offer',title:'详情页底部 CTA',states:[state('standard','常规引导','未解锁 Premium 内容显示 Unlock with Premium，文案读取统一配置；点击后承接当前内容进入快速订阅。Free 内容或已获授权的内容保留 Start / Select Program。'),state('trial','可用试用','只有活动及资格均确认有效时，底部按钮才显示 Start 30-day free trial；进入付费墙后匹配同一试用方案和价格。切换此状态只更新页面，不自动打开弹层。'),state('ineligible','无试用资格','不符合活动资格时回落到常规付费引导，不显示免费试用承诺。'),state('unknown','资格未知','资格尚未确认时显示常规付费引导。'),state('expired','活动已失效','过期活动不再用于底部 CTA，点击时按当前有效报价处理。')]},
  'program-panel':{id:'program-panel',title:'Program 详情与课表',states:[state('details','Details','按参考稿展示封面、Program 属性与训练团队；内容权限只在封面保留一处精简标签。'),state('schedule','Schedule','按顺序查看包内课程，点击进入对应课程详情，保留父 Program 的授权上下文。')]},
  insight:{id:'insight',title:'AI 个性化洞察',states:insightStates},
  content:{id:'content',title:'内容范围',states:[state('all','全部','显示目录中的内容，保留 Free / Premium 标记。'),state('content-free','Free 内容','只展示 Free 内容；无需订阅即可开始。'),state('content-premium','Premium 内容','展示 Premium 内容，开始权限由下方功能状态独立决定。')]},
  reply:{id:'reply',title:'聊天回复',states:[state('default','正常对话','输入草稿可编辑，发送后进入回复状态。用量与会员状态分别检查。'),state('thinking','回复中','输入和发送暂时锁定，显示回复中的反馈。其他组件状态保持不变。'),state('chat-error','回复失败','显示失败和重试，保留草稿，不扣除本次失败请求的用量。')]},
  plan:{id:'plan',title:'Dynamic Plan 卡片',states:[state('default','未生成','普通会话中不显示计划卡，保留原聊天工具栏。'),state('plan-preview','待激活','展示计划预览，允许讨论；点击 Activate 才检查 Premium 权限。'),state('plan-active','已激活','计划卡显示激活结果，避免重复激活，不消耗对话额度。')]},
  event:{id:'event',title:'挑战卡与报名操作',states:[state('default','报名开放','活动时间内允许报名；Join 检查当前权益，只记录参与资格。'),state('upcoming','尚未开始','显示活动开始日期，报名入口不可用。'),state('joined','已报名','显示已加入状态，避免重复报名；不生成训练进度或奖励。'),state('ended','已经结束','显示活动结束状态，停止接受报名。')]},
  workouts:{id:'workouts',title:'Program Workouts 列表',states:[state('default','有课程','展示该 Program 的包内课程；进入课程时保留父 Program 的授权上下文。'),state('empty','无课程','只替换课程列表为空态，保留 Program 标题和介绍，不把整个详情页替换掉。')]},
  cycle:{id:'cycle',title:'订阅周期',states:[state('monthly','月付','同一 Premium 等级的月付周期，显示对应续订日期。'),state('annual','年付','年付周期不改变会员等级；有限对话额度仍按既定规则刷新。')]}
}
export const reviewGroups=[
  {label:'训练与内容',pages:[['home','首页'],['workout','课程列表'],['course','课程详情'],['program','训练 Program'],['world-tour','World Tour'],['world-tour-detail','实景详情'],['challenge','限时挑战'],['movement','动作训练'],['movement-detail','动作详情'],['movement-training','动作训练过程']]},
  {label:'AI 与运动数据',pages:[['coach','AI Coach'],['plan','Dynamic Plan'],['weekly','每周报告'],['result','运动结果']]},
  {label:'账户与会员',pages:[['profile','个人中心'],['membership','会员与用量'],['plans','方案与权益'],['billing','账单记录'],['wallet','Credits']]}
]
const catalog={
  home:{title:'首页',description:['保留原有导航、推荐课程、My Progress 和独立 AI Coach 入口。'],sections:[{id:'entry',title:'原有入口',description:['课程 Start Now 进入对应内容；Plan 打开现有计划，AI 图标进入 AI Coach。']},{id:'weekly-entry',title:'每周报告入口',description:['有完整周报时展示入口；基础周数据免费，个性化洞察在报告中按权限展示。']}]},
  workout:{title:'课程列表',description:['沿用既有课程、World Tour 与 Movements 入口。'],sections:['content',{id:'navigation',title:'课程与分类',description:['课程卡进入详情；World Tour 和 Movements 进入对应列表，不增加底部导航项。']}]},
  course:{title:'课程详情',states:[normal,loading,error,state('unavailable','内容不可用','内容已不可用时停止开始操作，提供返回入口。')],description:['保留课程预览与原有操作；封面只显示一处简短标识，正文不再重复 Free/Premium 说明。'],sections:['content','access','content-offer','purchase']},
  'world-tour':{title:'World Tour',states:[normal,loading,error,empty],description:['保留参考稿的 Scene / Equipment 浏览结构，顶栏、红色选中 Tab、实景卡片和底部导航沿用 Demo 共用组件。路线卡先进入详情，在详情页开始或订阅。'],sections:['content',{id:'route-navigation',title:'路线浏览与详情',description:['封面及路线卡进入同一条路线的详情。Scene / Equipment 组合筛选当前目录；无匹配结果时显示空态。']}]},
  'world-tour-detail':{title:'实景详情',states:[normal,loading,error,state('unavailable','内容不可用','当前路线不可用时停止开始操作，提供返回入口。')],description:['展示当前路线封面、基本信息与底部 CTA。权限标识只保留在封面；返回 World Tour 浏览页。'],sections:['content','access','content-offer','purchase']},
  program:{title:'Training Program',states:[normal,loading,error],description:['保留参考稿的 Details / Schedule、封面和属性信息；导航、Tab、属性卡和课表使用 Demo 共用组件与文字规范。底部提供 Select Program 或匹配活动的付费引导。'],sections:['content','access','program-panel','workouts','content-offer','purchase']},
  weekly:{title:'每周报告',states:[normal,state('empty','训练不足','训练不足以生成完整周报时展示空态。'),loading,error],description:['周统计与固定分析免费；AI 个性化洞察作为独立组件展示。'],sections:[{id:'stats',title:'基础数据与分享',description:['图表、训练统计及固定模板对所有账户开放。Share your week 仅导出免费基础数据。']},'insight','purchase']},
  result:{title:'运动结果',description:['基础指标、图表与训练信息始终可读，洞察组件独立变化。'],sections:[{id:'results',title:'训练数据',description:['保留已有结果结构；展示完成训练的数据，不由权限或洞察状态替换。']},'insight','purchase']},
  challenge:{title:'限时挑战',states:[normal,empty,loading,error],description:['保留原有分类与活动列表，报名时段和报名结果挂在挑战组件下。'],sections:['event','access','purchase']},
  coach:{title:'AI Coach',description:['页面专注对话，输入区与顶栏均不常驻展示额度；仅在发送新消息时核对余额。','低额度提示跟随触发它的消息；余额为 0 时先显示未发送消息，再由用户选择升级或加购。购买后重发原消息，不自动发送，也不重复创建一条。'],sections:['reply','quota','coach-membership','plan','purchase']},
  plan:{title:'Dynamic Plan',states:[state('plan-preview','待激活计划','展示五日预览与计划建议，Activate 时检查 Premium。'),state('plan-active','已激活计划','展示当前已激活计划及训练入口，激活已有计划不消耗对话额度。'),loading,error],sections:['access',{id:'plan-actions',title:'计划操作',description:['GO 打开对应课程；More 中的 Adjust today 返回 AI Coach 讨论计划。']},'purchase']},
  profile:{title:'个人中心',states:memberStates,sections:[{id:'member-entry',title:'会员与用量入口',description:['同一张卡展示会员有效状态、有效期和对话剩余额度；点击进入 Membership & Usage。']},'quota',{id:'profile-menu',title:'原有功能分组',description:['设备、健康、订单、设置和帮助保留原入口，Rewards / Badges 与 Credits 分开。']}]},
  membership:{title:'会员与用量',states:memberStates,sections:['quota','cycle','purchase',{id:'benefits',title:'会员权益',description:['Free 和单一 Premium 分开展示。课程、计划等功能权限不等于无限对话量。']}]},
  plans:{title:'方案与权益',states:memberStates,sections:['cycle','purchase',{id:'benefits',title:'方案与权益清单',description:['从会员页原入口查看在售方案与权益快照，月付和年付属于同一 Premium 等级。']}]},
  billing:{title:'账单记录',description:['从原订单入口读取当前演示数据中的账单，不通过状态切换创建订单。'],sections:[{id:'orders',title:'历史记录',description:['保留历史订单、金额和周期信息。没有数据时展示空记录。']}]},
  wallet:{title:'Credits',description:['AI Coach Credits 与 Content Credits 分别显示，自购和历史批次保留原有有效期。'],sections:[{id:'credits',title:'加购与返回',description:['加购入口不要求先订阅；完成后可返回原内容或对话，不自动重试原请求。']}]},
  movement:{title:'动作训练列表',description:['浏览训练组合，通过 View Workout 查看详情，再进入运动准备页。'],sections:['access',{id:'training-group',title:'训练组合与视觉能力',description:['视觉支持在组合生成时配置，准备页再按设备性能决定是否显示可用的视觉开始入口。']}]},
  'movement-detail':{title:'动作训练详情',description:['按 Warm-up / Workout / Cooldown 展示动作顺序、目标和计划休息。Get Ready 进入准备页。'],sections:[{id:'steps',title:'动作清单',description:['使用实际视频及目标，不在准备页重复堆叠动作列表。']},{id:'recovery',title:'计划间歇',description:['读取生成组合的 restSeconds，0 或缺省直接衔接，不统一插入固定休息。']}]}
}
function quotaActive(member){return member.unlimited?'campaign':member.percent===null?'unknown':member.campaignEnded?'ended':member.percent===0?'empty':member.percent<=20?'low':'available'}
function movementModel(vm){
  const view=vm.movementView,player=vm.$refs.movement,q=vm.$route.query
  const states=[state('prepare','运动准备','保留预览、训练信息及心率入口。支持视觉识别的组合提供两种开始方式，不显示设备连接入口。'),state('setup','入镜引导','视觉模式默认竖屏，以识别区域和半透明剪影引导摆放手机。连续检测到人 3 秒后进入动作倒计时。'),state('countdown','动作倒计时','每个动作开始前准备 3 秒，仅显示数字；不遮罩或模糊画面，不累计训练量。'),state('training','正式训练','视觉计次动作按真实执行次数推进；计时动作只计时。可手动跳过剩余目标，窗口偏好不随动作切换重置。'),state('rest','计划休息','只在生成组合安排了 restSeconds 的位置休息。可暂停或跳过，结束后进入下一动作倒计时。'),state('summary','运动结果','展示目标完成情况和本次训练量。结束只确认一次；此处结果为演示数据，不新增训练记录。')]
  const active=states.find(item=>item.id===view.stage)||states[0]
  const live=['countdown','training','rest'].includes(active.id),mode=player?.mode||q.reviewMode||'regular'
  const list=active.id==='prepare'?[{id:'start',title:'开始方式',description:['底部提供常规跟练和视觉识别两种开始按钮，用户直接选择开始方式。']}]:[{id:'training-mode',title:'训练模式',states:[state('regular','常规跟练','播放动作视频并按默认节奏计次，支持横竖屏。'),state('vision','视觉识别','默认摄像头为大窗，动作视频为小窗；Warm-up / Cooldown 的计时动作不识别次数。')],active:mode}]
  if(active.id==='prepare')list.push({id:'device',title:'机型性能',states:[state('auto','支持视觉模式','训练组支持视觉时，同时展示常规和视觉开始按钮；开始前还会检查运行性能。'),state('low','低性能机型','低性能机型禁用视觉入口，常规视频跟练仍可开始。')],active:vm.movementReview.performance},{id:'heart-rate',title:'心率连接入口',description:['独立入口保留在准备页，可打开连接面板。当前浏览器原型不模拟蓝牙配对成功。']})
  if(active.id==='prepare')list.push({...sections.access,title:'训练访问权限',active:vm.mvpMember.active?'unlocked':'locked'})
  if(live&&mode==='vision')list.push({id:'device',title:'运行性能',states:[state('auto','正常运行','保持当前训练和识别流程。'),state('low','性能不足','暂停当前阶段并提示回退常规跟练，已完成的次数及窗口偏好保留。')],active:vm.movementReview.performance})
  if(mode==='vision'||['prepare','setup'].includes(active.id))list.push({id:'camera',title:'摄像头画面',states:[state('demo','示例画面','此画面用于状态评审，不产生真实识别结果。真实摄像头由另一状态显式开启，图像在本地处理。'),state('camera','真实摄像头','请求浏览器摄像头权限，使用本地模型检测入镜；允许访问后进入真实识别流程。')],active:vm.movementReview.source})
  if(active.id==='setup'&&vm.movementReview.source==='demo')list.push({id:'framing',title:'人物入镜',states:[state('out-of-view','未入镜','未检测到人时等待，不累计入镜时间。'),state('in-view','已入镜','检测到人连续 3 秒后进入动作倒计时，离开画面会重新计时。')],active:vm.movementReview.framed?'in-view':'out-of-view'})
  if(live&&mode==='vision')list.push({id:'windows',title:'大小窗切换',states:[state('camera','摄像头大窗','点击动作视频小窗，切换为动作视频大窗。'),state('trainer','视频大窗','点击摄像头小窗，切换回摄像头大窗；动作衔接时保留选择。')],active:player?.cameraMain===false?'trainer':'camera'})
  if(live)list.push({id:'panel',title:'数据与操作面板',states:[state('expanded','展开','显示当前动作、目标、暂停、跳过和下一动作预告。'),state('collapsed','收起','保留动作名、核心计数及暂停，把更多空间留给视频。顶部横条负责展开和收起。')],active:player?.immersive?'collapsed':'expanded'})
  if(live&&mode==='regular')list.push({id:'orientation',title:'屏幕方向',states:[state('portrait','竖屏','视频位于上方，数据与操作集中在底部面板。'),state('landscape','横屏','视频与展开面板左右布局；收起面板时扩大视频显示区域。')],active:view.landscape?'landscape':'portrait'})
  if(live||active.id==='setup')list.push({id:'movement-flow',title:'阶段衔接',description:[vm.movementReview.pinned?'当前固定在所选阶段供评审，视频仍可播放。运行流程后恢复入镜检测、倒计时和动作自动衔接。':'当前为交互流程，页面状态会随入镜、倒计时、休息和完成同步更新。'],actions:vm.movementReview.pinned?[{id:'movement-run',label:'运行此流程'}]:[]})
  if(active.id==='training'&&vm.movementReview.source==='demo'){
    const actions=player?.current.kind==='time'?[{id:'simulate-timer',label:'计时动作 · 剩余 1 秒'}]:mode==='vision'?[{id:'simulate-rep',label:'模拟识别 +1 次'},{id:'simulate-target',label:'模拟识别至本动作目标'}]:[]
    if(actions.length)list.push({id:'recognition-events',title:'演示推进',description:['向本地演示会话发送事件；真实摄像头模式使用模型输出。'],actions})
  }
  if(active.id==='prepare')list.push({...sections.purchase,active:vm.mvpGate?.stage||'closed'})
  return {title:'动作训练过程',states,active:active.id,description:active.description,sections:wallSections(vm,list.map(section=>({...section,description:section.states?.find(item=>item.id===section.active)?.description||section.description||[]})))}
}
export function reviewModel(vm){
  if(vm.screen==='movement-training')return movementModel(vm)
  const q=vm.$route.query,screen=vm.screen,config=catalog[screen]||{title:vm.screenTitle||'页面',description:vm.note.lines,sections:[]}
  let states=config.states||[normal],active=vm.reviewPageState
  if(['profile','membership','plans'].includes(screen))active=vm.mvpMember.state
  if(screen==='plan'&&!['loading','error'].includes(active))active=vm.mvpPlanState==='plan-active'?'plan-active':'plan-preview'
  const selected=states.find(item=>item.id===active)||states[0];active=selected.id
  const unavailable=['loading','error','unavailable','empty'].includes(active)
  const items=(config.sections||[]).filter(item=>item!=='cycle'||vm.mvpMember.active).map(item=>{
    let section=typeof item==='string'?sections[item]:item
    if(screen==='coach'&&section.id==='quota')section={...section,title:'发送时的额度检查',states:[state('available','额度充足','发送正常进行，不显示额度或付费提醒。'),state('low20','20%','发送新消息时首次达到 20% 或以下，在该消息下方轻提示；同一阈值不重复提醒。'),state('low10','10%','首次达到 10% 或以下时，在对应新消息下方提醒一次，回复照常进行。'),state('low5','5%','首次达到 5% 或以下时提醒一次；跨过多个阈值只提示当前最相关的一档。'),state('empty','额度为 0','点击发送后，原文出现在消息流并标记未发送，不生成 AI 回复；免费用户升级，会员单购额度。'),state('unknown','额度未知','点击发送后显示无法核对额度，可重试；不把查询失败当作用尽，不引导付款。'),state('campaign','活动无限量','活动期内正常发送，不显示额度提醒。'),state('ended','活动结束','发送时按当前剩余有限额度检查，不常驻展示活动或额度。')],actions:[{id:'chat-send-example',label:'发送示例消息'}]}
    if(screen==='coach'&&section.id==='purchase'&&(vm.mvpMember.active||vm.mvpGate?.kind==='credits'))section={...section,title:'一次性额度加购',states:purchaseStates.filter(s=>s.id!=='restoring').map(s=>s.id==='offer'?state('offer','额度包','仅展示当前在售 AI Coach 额度包及一次性价格；不推荐重复订阅。'):s.id==='success'?state('success','加购成功','新增自购额度，与订阅余额分开。用户确认后重发失败消息；重复确认同一笔结果不会重复到账。'):s)}
    if(section.id==='access')section={...section,title:{course:'Start 与课程访问',program:'Program 开始与授权','world-tour':'路线 Start',coach:'计划激活权限',plan:'计划激活权限',challenge:'Join 与参与资格',movement:'训练访问权限'}[screen]||section.title}
    if(section.id==='purchase'&&vm.mvpGate){
      const extra={refreshing:state('refreshing','刷新用量','正在核对当前用量，保留草稿，不发起新的付款。'),'access-error':state('access-error','内容不可用','会员已生效，但原内容暂不可用；保留会员并返回原页检查。'),'event-closed':state('event-closed','报名已结束','订阅后重新检查活动时段，已结束的挑战不自动报名。')}
      const current=extra[vm.mvpGate.stage];if(current)section={...section,states:[...section.states,current]}
      if(['usage','unknown'].includes(vm.mvpGate.kind))section={...section,title:'对话用量反馈',states:[state('closed','收起','关闭说明后保留当前草稿和对话。'),state('offer','用量说明',vm.mvpGate.kind==='usage'?'展示当前剩余额度；会员额度用尽时不要求重复订阅，有已知刷新时间才显示日期。':'暂时无法确认用量，保留草稿并提供重新查询入口。'),...(vm.mvpGate.kind==='unknown'?[state('refreshing','查询中','核对当前额度，保留草稿，不发起付款。'),state('success','额度已就绪','额度已确认可用；用户明确点击继续才发送草稿。')]:[])]}
    }
    if(section.id==='content'&&['course','program','world-tour-detail'].includes(screen))section={...section,states:section.states.filter(item=>item.id!=='all')}
    let value={quota:quotaActive(vm.mvpMember),'coach-membership':vm.mvpMember.state,cycle:q.membershipCycle||'monthly',content:vm.mvpContentState==='default'?'all':vm.mvpContentState,access:vm.mvpMember.active?'unlocked':'locked',insight:vm.mvpInsightState==='default'?(vm.mvpMember.active?'ready':'locked'):vm.mvpInsightState,reply:vm.mvpReplyState,plan:vm.mvpPlanState,event:vm.mvpEventState,workouts:q.reviewWorkouts||'default',purchase:vm.mvpGate?.stage||'closed','content-offer':q.reviewContentOffer||q.reviewOffer||'standard','program-panel':q.reviewProgramPanel||'details'}[section.id]
    if(section.id==='content'&&value==='all'&&['course','program','world-tour-detail'].includes(screen))value=(vm.data?(screen==='course'?vm.selectedContent:screen==='world-tour-detail'?vm.selectedWorldTour:vm.selectedProgram):null)?.tier==='free'?'content-free':'content-premium'
    let choice=section.states?.find(option=>option.id===value)||section.states?.[0]
    if(screen==='coach'&&section.id==='quota'){value=vm.mvpMember.unlimited?'campaign':vm.mvpMember.percent===null?'unknown':vm.mvpMember.campaignEnded?'ended':vm.mvpMember.percent===0?'empty':vm.mvpMember.percent<=5?'low5':vm.mvpMember.percent<=10?'low10':vm.mvpMember.percent<=20?'low20':'available';choice=section.states.find(s=>s.id===value)}
    if(section.id==='quota'&&typeof vm.mvpMember.percent==='number'&&['available','low'].includes(choice?.id))choice={...choice,description:choice.description.map(line=>line.replace(choice.id==='low'?'10%':'65%',vm.mvpMember.percent+'%'))}
    return {...section,active:choice?.id,description:choice?.description||section.description||[],disabled:unavailable}
  })
  return {title:config.title,states,active,description:selected.id==='default'?(config.description||selected.description):selected.description,sections:wallSections(vm,items)}
}
