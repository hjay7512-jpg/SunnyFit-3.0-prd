// Prototype behavior and UX decisions. Editable copy lives in config/operations-copy.json.
const entry={
  title:'围绕当前任务解释订阅价值',
  diagnosis:'用户已选中内容，先说明这次订阅的作用，再提供完整权益介绍。',
  changes:['快速付费墙保留所选名称、时长或课表，说明对应场景的付费增量。','完整介绍用四类权益 Tab、明确标注的示例及 Free/Premium 对照帮助决策。','两条路径保留同一报价、活动资格、原任务、选中套餐及阅读位置。'],
  verify:'点击受限内容 → 直接选套餐或了解权益 → 返回 → 模拟购买。核对内容和套餐未变化，返回后无第二次确认弹窗。'
}
export const commerceReviews={
  profile:{title:'已有权益直接可见',diagnosis:'免费用户也有 AI Coach 额度，入口应帮助确认并使用已有权益。',changes:['Free、Premium 和已到期账户均直接显示当前额度，身份和有效期独立呈现。','卡片进入 Membership & Usage，不以宣传标题替代当前余额。'],verify:'切换免费、有效、到期及不同额度状态，免费余额无需展开或订阅即可看到。'},
  membership:{title:'先查看已有权益，再按需了解升级',diagnosis:'进入管理页不等于准备购买，账户用量与完整会员介绍需要有清楚分工。',changes:['账户与 AI Coach 额度置顶，免费用户直接可见；有额度时可直接进入对话。','下方用紧凑卡片介绍 Premium 增量，Explore Premium 进入完整介绍，View plans 直接选套餐。','会员显示已购功能入口及续订管理，支持发现和使用已有权益。'],verify:'先查额度并进入 AI Coach，再分别试 Explore 和 View plans；两条返回路径各自保持正确。'},
  course:entry,'world-tour':entry,program:entry,'movement-detail':entry,
  coach:{title:'使用时安心，决策时清楚',diagnosis:'额度入口和对话提醒承担不同任务，对话聚焦当前交流，购买处解释消耗规则。',changes:['发送新消息时判断 20% / 10% / 5% 阈值，只显示一行额度提醒及可选付费入口。','免费入口维持订阅优先，会员入口提供单购 Credits；免费账户仍可使用已购 Credits。单购推广策略本轮未扩展。','额度包展示当前消息单价，不擅自承诺固定次数；保留失败消息，购买后明确点击才发送。','计划预览的免费用户按钮直接显示 Activate with Premium，关闭付费墙不丢失计划和对话。'],verify:'低值 → 用尽 → 购买或关闭，确认没有重复消息、自动发送或重复扣款。'},
  result:{title:'保存感受，再按需理解训练',diagnosis:'运动记录、成就与分享独立成立，AI 分析是记录之后的可选增量。',changes:['保留完成、RPE、记录的现有分步，RPE 可跳过。','免费用户保存 RPE 后才展示分析入口，付费墙复用结果页的名称、时长和已保存评分。','会员保存 RPE 后自动分析，历史结果仍可读；购买后的分析由用户明确触发。'],verify:'未保存 RPE 时无付费入口，保存后数据与付费墙一致。当前为演示记录，尚未接入真实训练数据。'},
  weekly:{title:'从本周数据到训练复盘',diagnosis:'基础统计免费可用，会员增量解释训练组合与节奏。',changes:['保留本周报告上下文，完整介绍默认选中 Insights。','购买成功后直接回到原报告分析区，避免额外的通用成功确认。'],verify:'购买前后核对报告 ID 和基础数据，返回不发送消息或开始训练。'},
  plans:{title:'选定套餐后操作保持稳定',diagnosis:'滚动阅读不应改变已选方案或按钮含义。',changes:['月付与年付权益相同，展示完整费用和周期；试用仅在资格确认有效时出现。','完整介绍先提供 View plans，查看或选定套餐后，购买按钮和费用说明持续保留。','继续阅读或展开 FAQ 后仍保留原方案，新建购买流程重置介绍阶段。'],verify:'选年付 → 展开 FAQ → 滚到底再回顶部，套餐、购买按钮和完整年费保持一致。'}
}
