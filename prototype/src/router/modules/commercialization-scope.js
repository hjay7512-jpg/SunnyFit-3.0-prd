// Review annotations describe implementation placement, not production menus.
export const implementationScopes = {
  catalog: { kind: 'new', label: '建议新增模块', title: '权益管理 · 权益目录', priority: 'MVP', priorityNote: 'MVP 先用固定目录定义内容、功能和额度项；可视化维护目录属于 P1。', description: '系统能力的只读目录；与权益套餐同属权益管理。能力定义由代码维护。' },
  suits: { kind: 'new', label: '建议新增模块', title: '权益管理 · 权益套餐', priority: 'P1', priorityNote: 'MVP 需预置 Free / Premium 组合；完整的套餐管理后台列为 P1。', description: '配置内容 Scope、功能项、Credits 发放规则和发布版本。', businessTopic: 'composition', businessNode: 'suit' },
  products: { kind: 'new', label: '建议新增模块', title: '商业商品管理', priority: 'MVP', priorityNote: 'MVP 覆盖会员商品与 Apple / Google SKU 关联；单独销售的 Credits 商品是 P2。', description: '管理会员及 Credits 商品；SKU 放在商品详情内。如原后台已有商品管理，扩展原模块。', businessTopic: 'orders', businessNode: 'membership_product' },
  pricing: { kind: 'new', label: '建议新增配置', title: 'Credits 服务计价', priority: 'P1', priorityNote: 'AI Credits 额度授予、报价和消费闭环列为 P1；具体服务扣额仍待业务定义。', description: '配置用户操作与 Credits 价格的对应关系；独立菜单是方案，可并入商业化配置。', businessTopic: 'credits', businessNode: 'consume_policy' },
  content: { kind: 'extension', label: '扩展现有模块', title: '课程管理 · Course / World Tour / Training Program', priority: 'MVP', priorityNote: 'MVP 在现有列表与编辑页维护 Course、World Tour、Program 的范围标记，支持单条与批量编辑；Content Credits 兑换与限时挑战授权是 P3。', description: '在现有课程管理列表、编辑页增加内容范围标记、筛选与批量设置；内容创建、基础资料和 Training Program 编排继续复用原功能。', businessTopic: 'content', businessNode: 'content', links: [{ path: 'redemptions', title: '兑换记录样例' }] },
  users: { kind: 'extension', label: '扩展现有模块', title: '用户管理 · 用户详情', priority: 'MVP', priorityNote: 'MVP 查询有效会员权益并支持基础订单 / 权益异常处理；Credits Wallet、批次和消费明细列为 P1。', description: '增加权益、Credits 余额 / 批次 / 流水、兑换和消费查询。本页仅展示商业化部分；保留原用户资料及管理功能。', businessTopic: 'relations', businessNode: 'access_grant', links: [{ path: 'ledger', title: '流水查询样例' }, { path: 'redemptions', title: '兑换查询样例' }, { path: 'usage', title: '服务消费查询样例' }] },
  orders: { kind: 'extension', label: '合并到交易管理', title: '订单管理', priority: 'MVP', priorityNote: 'MVP 校验 Apple / Google 会员订单完整生命周期；独立购买 Credits 商品的订单是 P2。原型中的交易均为本地模拟。', description: '增加商品类型、支付 / 履约状态、购买快照和失败补发。复用原订单模块；没有对应模块时再新增。', businessTopic: 'orders', businessNode: 'order' },
  subscriptions: { kind: 'extension', label: '合并到订阅管理', title: '订阅管理', priority: 'MVP', priorityNote: 'MVP 覆盖订阅购买、续费、取消、过期、退款 / 撤销和恢复校验；本原型不连接真实商店。', description: '增加已购权益版本、周期和续订状态；复用原订阅模块。后台取消 / 恢复续订需按现有渠道能力确认。', businessTopic: 'orders', businessNode: 'fulfillment' },
  campaigns: { kind: 'optional', label: '可选运营方案', title: '活动发放 / 补偿', priority: 'P3', priorityNote: '活动权益及 Credits 发放和活动管理均为 P3。', description: '展示非购买来源的权益和 Credits 发放。独立活动管理不是六条规则直接要求的新增模块，可复用原活动 / 客服补偿能力。', businessTopic: 'credits', businessNode: 'campaign_source', links: [{ path: 'campaign-runs', title: '发放记录样例' }] },
  wallets: { kind: 'support', label: '辅助查询样例', title: '用户详情 · Credits', priority: 'P1', priorityNote: '会员额度周期发放、钱包余额和批次查询列为 P1。该独立页只是用户详情能力的评审样例。', description: '独立列表用于演示。正式以用户详情的钱包 / 批次为入口，不要求另建 Credits Wallets 菜单。', businessTopic: 'credits', businessNode: 'wallet' },
  ledger: { kind: 'support', label: '辅助查询样例', title: '用户详情 · Credits 流水', priority: 'P1', priorityNote: 'Credits 发放、预留、消费、退款和过期流水列为 P1；该独立全量列表不是必需的新菜单。', description: '流水数据和追溯能力需要实现；此独立全量列表不是必需的新菜单，用户详情已有对应 Tab。', businessTopic: 'credits', businessNode: 'transaction' },
  redemptions: { kind: 'support', label: '辅助查询样例', title: '用户详情 / 内容管理 · 兑换记录', priority: 'P3', priorityNote: 'Content Credits 购买、兑换和永久解锁列为 P3；记录可以嵌入用户或内容详情。', description: '记录独立内容权益及来源；可嵌入原用户或内容详情，不要求另建 Redemptions 菜单。', businessTopic: 'content', businessNode: 'saved_asset' },
  usage: { kind: 'support', label: '辅助查询样例', title: '用户详情 · 服务消费记录', priority: 'P1', priorityNote: 'AI Credits 报价、预留、结算、释放与消费查询列为 P1；服务回调负责完成或失败。', description: '保留报价、预留、结算与结果引用的查询。完成 / 失败由业务服务回调处理，人工模拟在 Flow Preview。', businessTopic: 'credits', businessNode: 'consume_policy' },
  'campaign-runs': { kind: 'support', label: '辅助查询样例', title: '活动 / 补偿 · 发放记录', priority: 'P3', priorityNote: '活动发放记录属于 P3，可并入现有活动或客服补偿模块。', description: '作为发放操作的历史记录；可并入原模块，不要求另建 Delivery Records 菜单。', businessTopic: 'credits', businessNode: 'campaign_source' },
  audit: { kind: 'support', label: '辅助查询样例', title: '现有操作日志', priority: 'MVP', priorityNote: 'MVP 需要基本订单 / 会员 / 权益异常查询和人工补发能力；审计日志复用现有操作日志。', description: '商业化操作需要记审计事件。此列表展示追溯样例；如已有操作日志，扩展事件和业务引用即可。', businessTopic: 'versions', businessNode: 'user_transactions' },
  overview: { kind: 'prototype', label: '仅评审工具', title: 'Demo 场景概览', priority: 'Review', priorityNote: '仅用于原型走查，不对应产品迭代阶段。', description: '查看本地样例数据和业务流程入口。全局业务定义与关系图已移至独立的“业务规则”页面。', businessTopic: 'relations', businessNode: 'entitlement', links: [{ path: 'wallets', title: '独立钱包样例' }, { path: 'audit', title: '审计记录样例' }] },
  operations: { kind: 'prototype', label: '仅评审工具', title: 'Flow Preview', priority: 'Demo', priorityNote: '仅模拟购买、履约和额度操作，不调用 Apple / Google、支付渠道或 AI 服务。', description: '模拟购买、支付失败、请求完成 / 释放和强制到期。用于走查业务状态，不交付为正式后台管理功能。', businessTopic: 'relations', businessNode: 'order' }
}

export const scopeForPath = path => implementationScopes[path.split('/')[2]]

export const priorityForPath = path => {
  const section = path.split('/')[2]
  const scope = implementationScopes[section]
  return scope ? { code: scope.priority, note: scope.priorityNote } : { code: 'Review', note: '' }
}

const item = (path, title, icon, priority = implementationScopes[path] && implementationScopes[path].priority) => ({ path: '/commercialization/' + path, title, icon, priority })
export const sidebarGroups = [
  { key: 'commerce', title: 'Commercialization', icon: 'el-icon-money', items: [
    item('catalog', 'Entitlement Catalog', 'el-icon-collection'),
    item('suits', 'Entitlement Suits', 'el-icon-files'),
    item('products', 'Products', 'el-icon-goods'),
    item('pricing', 'Service Pricing', 'el-icon-coin')
  ] },
  { key: 'extensions', title: 'Existing Modules', icon: 'el-icon-folder-opened', items: [
    item('content', 'Course Management', 'el-icon-video-camera'),
    item('users', 'User Rights & Credits', 'el-icon-user'),
    item('orders', 'Orders', 'el-icon-shopping-bag-1'),
    item('subscriptions', 'Subscriptions', 'el-icon-refresh')
  ] },
  { key: 'optional', title: 'Optional Operations', icon: 'el-icon-present', items: [
    item('campaigns', 'Campaigns & Grants', 'el-icon-present')
  ] },
  { key: 'prototype', title: 'Review Tools', icon: 'el-icon-monitor', items: [
    item('overview', 'Demo Overview', 'el-icon-data-analysis'),
    item('operations', 'Flow Preview', 'el-icon-monitor')
  ] }
]
