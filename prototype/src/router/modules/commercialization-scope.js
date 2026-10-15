// Review annotations describe implementation placement, not production menus.
export const implementationScopes = {
  catalog: { kind: 'new', label: '建议新增模块', title: '权益管理 · 权益目录', description: '系统能力的只读目录；与权益套餐同属权益管理。能力定义由代码维护。' },
  suits: { kind: 'new', label: '建议新增模块', title: '权益管理 · 权益套餐', description: '配置 Base / Additional、功能范围、Credits 福利和发布版本。' },
  products: { kind: 'new', label: '建议新增模块', title: '商业商品管理', description: '管理会员及 Credits 商品；SKU 放在商品详情内。如原后台已有商品管理，扩展原模块。' },
  pricing: { kind: 'new', label: '建议新增配置', title: 'Credits 服务计价', description: '配置用户操作与 Credits 价格的对应关系；独立菜单是方案，可并入商业化配置。' },
  content: { kind: 'extension', label: '扩展现有模块', title: '课程 / World Tour / Training Program 管理', description: '在原列表、编辑页增加内容标签、兑换价格、有效期和批量操作。本页统一展示三类样例；内容创建、基础资料及 Program 编排复用原功能。', links: [{ path: 'redemptions', title: '兑换记录样例' }] },
  users: { kind: 'extension', label: '扩展现有模块', title: '用户管理 · 用户详情', description: '增加权益、Credits 余额 / 批次 / 流水、兑换和消费查询。本页仅展示商业化部分；保留原用户资料及管理功能。', links: [{ path: 'ledger', title: '流水查询样例' }, { path: 'redemptions', title: '兑换查询样例' }, { path: 'usage', title: '服务消费查询样例' }] },
  orders: { kind: 'extension', label: '合并到交易管理', title: '订单管理', description: '增加商品类型、支付 / 履约状态、购买快照和失败补发。复用原订单模块；没有对应模块时再新增。' },
  subscriptions: { kind: 'extension', label: '合并到订阅管理', title: '订阅管理', description: '增加已购权益版本、周期和续订状态；复用原订阅模块。后台取消 / 恢复续订需按现有渠道能力确认。' },
  campaigns: { kind: 'optional', label: '可选运营方案', title: '活动发放 / 补偿', description: '展示非购买来源的权益和 Credits 发放。独立活动管理不是六条规则直接要求的新增模块，可复用原活动 / 客服补偿能力。', links: [{ path: 'campaign-runs', title: '发放记录样例' }] },
  wallets: { kind: 'support', label: '辅助查询样例', title: '用户详情 · Credits', description: '独立列表用于演示。正式以用户详情的钱包 / 批次为入口，不要求另建 Credits Wallets 菜单。' },
  ledger: { kind: 'support', label: '辅助查询样例', title: '用户详情 · Credits 流水', description: '流水数据和追溯能力需要实现；此独立全量列表不是必需的新菜单，用户详情已有对应 Tab。' },
  redemptions: { kind: 'support', label: '辅助查询样例', title: '用户详情 / 内容管理 · 兑换记录', description: '记录独立内容权益及来源；可嵌入原用户或内容详情，不要求另建 Redemptions 菜单。' },
  usage: { kind: 'support', label: '辅助查询样例', title: '用户详情 · 服务消费记录', description: '保留报价、预留、结算与结果引用的查询。完成 / 失败由业务服务回调处理，人工模拟在 Flow Preview。' },
  'campaign-runs': { kind: 'support', label: '辅助查询样例', title: '活动 / 补偿 · 发放记录', description: '作为发放操作的历史记录；可并入原模块，不要求另建 Delivery Records 菜单。' },
  audit: { kind: 'support', label: '辅助查询样例', title: '现有操作日志', description: '商业化操作需要记审计事件。此列表展示追溯样例；如已有操作日志，扩展事件和业务引用即可。' },
  overview: { kind: 'prototype', label: '仅评审工具', title: '业务定义与 Demo 概览', description: '权益类型、关系、组合、商品与订单、额度资产和 Open 决策的图形化评审；另保留场景数据和流程入口。', links: [{ path: 'wallets', title: '独立钱包样例' }, { path: 'audit', title: '审计记录样例' }] },
  operations: { kind: 'prototype', label: '仅评审工具', title: 'Flow Preview', description: '模拟购买、支付失败、请求完成 / 释放和强制到期。用于走查业务状态，不交付为正式后台管理功能。' }
}

export const scopeForPath = path => implementationScopes[path.split('/')[2]]

const item = (path, title, icon) => ({ path: '/commercialization/' + path, title, icon })
export const sidebarGroups = [
  { key: 'commerce', title: 'Commercialization', icon: 'el-icon-money', items: [
    item('catalog', 'Entitlement Catalog', 'el-icon-collection'),
    item('suits', 'Entitlement Suits', 'el-icon-files'),
    item('products', 'Products', 'el-icon-goods'),
    item('pricing', 'Service Pricing', 'el-icon-coin')
  ] },
  { key: 'extensions', title: 'Existing Modules', icon: 'el-icon-folder-opened', items: [
    item('content', 'Content Labels', 'el-icon-video-camera'),
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
