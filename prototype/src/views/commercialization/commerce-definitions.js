export const modules = {
  products:{title:'Products',singular:'Product',description:'Membership access and monthly grants; independent credit packs.',notes:[
    {title:'商品交付什么',rule:'会员商品绑定 Base Suit，开通访问权并逐月发放 Credits。额度包只发指定类型的 Credits，不开通会员。',interaction:'报价锁定商品、SKU 和 Suit 版本；已支付订单按购买快照履约。'},
    {title:'月度额度',rule:'按月、按年付费均从订阅开始日，按原订阅时区逐月发放。月赠余额不结转，自购额度无到期日。',interaction:'价格和数量是本地评审参数，正式定价仍待定义。'},
    {title:'升级',rule:'升级立即生效并开启新周期；剩余价值抵扣和应付金额仍待定义。',interaction:'已有付费会员升级暂不结算，显示待定原因，不生成错误订单。'}]},
  content:{title:'Course Management',singular:'Content',description:'Existing Course Management extended with Course, World Tour and Training Program access scopes.',notes:[
    {title:'内容归属',rule:'单内容归属一个 Scope；Suit 多选 Scope。没有 ALL，新 Scope 不自动加入既有套餐。',interaction:'浏览和预览开放。课程、实景、动作在 Start 校验；训练包在 Select 校验。'},
    {title:'限时挑战',rule:'Challenge Access 只控制 Join 资格；开放时间、目标、进度和奖励由挑战业务管理。',interaction:'Join 检查资格和时间，不伪造训练完成或奖励。'},
    {title:'独立兑换',rule:'Content Credits 确认兑换成功后永久解锁；重复播放不扣额，会员到期不撤销。',interaction:'价格未配置时不能兑换。下架处理仍待定义；历史兑换保留原合同。'},
    {title:'训练包成员',rule:'先验证训练包的 Select 权限，再按获得的授权启动实际成员课程。',interaction:'伪造训练包 ID 不能绕过权限；历史兑换保留成员快照。'}]},
  pricing:{title:'Service Rules',singular:'Service',description:'Feature authorization and user-turn consumption are separate.',notes:[
    {title:'功能授权',rule:'计划激活、训练 AI 洞察和周报 AI 洞察只校验功能权益，不消耗 Credits；基础数据和模板周报免费。',interaction:'功能加入 Suit 即有权限，无须配置 ON、Unlimited 或 Quota。'},
    {title:'AI 请求',rule:'AI 对话和计划讨论按用户发起的 User Turn 消耗 AI Coach Credits，内部模型和工具调用不重复计费。',interaction:'每次具体消耗仍待定义；示例金额仅用于验证。未配置消耗时不报价、不预留。'},
    {title:'预留与结算',rule:'先预留同类额度，成功结算一次，实际失败释放。先消耗最早到期批次，自购无期限额度最后消耗。',interaction:'不同 Credit Type 不互补。主动取消、部分成功的退款规则仍待定义。'}]},
  campaigns:{title:'Campaigns & Compensation',singular:'Campaign',description:'Additional access and independently tracked credit grants.',notes:[
    {title:'附加权益',rule:'Base 和 Additional 的内容、功能权限取并集；Additional 不覆盖 Base。更细合并规则仍待定义。',interaction:'可发 Additional Suit 或独立 Credits；每批保留来源和有效期。'},
    {title:'重复保护',rule:'同一活动对同一用户发放一次，补偿按案件编号防重。',interaction:'选择用户并填写原因，结果展示权益版本和额度批次。'},
    {title:'发放时间',rule:'活动在开放窗口内发放，已授予权益不因后续停用活动自动撤销。',interaction:'草稿、发布、发放分开；批次来源区分会员、购买、活动、补偿。'}]}
}
export const labels={name:'Name',code:'Code',status:'Status',description:'Description',kind:'Kind',suitId:'Entitlement Suit',upgradeRule:'Upgrade Rule',credits:'Purchased Credits',skus:'SKUs',entitlementCode:'Access Entitlement',scope:'Scope',contentScope:'Content Scope',freeScope:'Free Content Pool',contentType:'Content Type',tier:'Access Type',recommended:'Editorial Pick',redemptionCredits:'Content Credits per unlock',redemptionValidityDays:'Historical unlock validity',durationMinutes:'Duration',members:'Included Workouts',grantDurationDays:'Grant Duration',creditAmount:'Extra Credits',creditValidityDays:'Extra Credits Validity',maxRecipients:'Recipient Limit',startsAt:'Starts',endsAt:'Ends',servicePurpose:'Service Purpose',creditType:'Credit Type',billingModel:'Authorization / Consumption',unit:'Consumption Unit'}
export const typeLabel=value=>({free_content:'Free Content',youtube:'YouTube',membership:'Membership',credits:'Credits',course:'Course',world_tour:'World Tour',training_program:'Training Program',movement:'Movement',limited_challenge:'Limited Challenge',free:'Free',premium:'Premium',featured:'Independent unlock',base:'Base',additional:'Additional',active:'Active',disabled:'Disabled',draft:'Draft',immediate:'Immediate · new cycle',next_cycle:'Historical · period end',not_allowed:'Blocked during a paid period',billing_cycle:'Per billing cycle',monthly:'Monthly',one_time:'One time',campaign:'Campaign',compensation:'Compensation',feature:'Feature access · no Credits',user_turn:'Per user turn',AI_COACH_CREDIT:'AI Coach Credits',CONTENT_CREDIT:'Content Credits'}[value]||value)
export const defaults=entity=>{
  const common={name:'',code:'',status:'active',description:'',policyVersion:20261014}
  if(entity==='products')return {...common,kind:'membership',suitId:'',upgradeRule:'immediate',credits:{creditType:'',amount:0,validityDays:null},skus:[{id:'sku_'+Date.now(),channel:'web_demo',storeCode:'',priceCents:0,currency:'USD',durationDays:30,billingPeriod:'monthly',status:'active'}]}
  if(entity==='content')return {...common,contentType:'course',entitlementCode:'course_access',contentScope:'',freeScope:'free_content',tier:'free',redemptionCredits:null,redemptionValidityDays:null,durationMinutes:20,members:[]}
  if(entity==='pricing')return {...common,servicePurpose:'ai_chat',entitlementCode:null,scope:null,creditType:'AI_COACH_CREDIT',billingModel:'user_turn',unit:'user_turn',credits:null}
  return {...common,kind:'campaign',creditType:'',suitId:null,grantDurationDays:30,creditAmount:0,creditValidityDays:14,maxRecipients:100,startsAt:null,endsAt:null}
}

