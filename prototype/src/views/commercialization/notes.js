export const catalogNotes = [
  { title: '目录只读', rule: '权益项由服务端随业务能力初始化。后台不能创建、修改或删除权益项。', interaction: '没有 Add、Edit 或 Delete；View 打开只读详情。', api: 'GET /api/commercialization/catalog/{code}' },
  { title: '搜索和分类', rule: '按名称或 code 匹配，不区分大小写；分类与关键词同时生效。', interaction: 'Search 或 Enter 应用搜索，Reset 清空条件并回到第一页；无结果显示空状态。', api: 'GET /api/commercialization/catalog' },
  { title: '三类权益', rule: 'Content Access 选择内容 Scope；Feature Access 加入 Item 即授权；Consumable Credits 配置对应类型的发放规则。新模型不使用 ALL 或通用 Quota。', interaction: '内容 Scope 在内容管理中维护；功能不显示 Scope；额度类型有独立钱包。' },
  { title: '消费与待定规则', rule: 'Credits 是可消费资产，不是权限或功能次数。服务具体消耗单位、Additional 合并和主动取消退款等仍待定义。', interaction: '旧 Demo 价格仅供历史流程；新模型消费规则未定义时不给报价、不扣款。没有新增用户流水入口。' },
  { title: '加载与异常', rule: '页面数据来自 API，不从浏览器状态推断业务规则。', interaction: '首次加载显示 loading；请求失败显示 Retry；详情失败允许关闭和重试。' }
]
export const suitListNotes = [
  { title: '列表使用已发布配置', rule: '已发布套餐显示当前发布版本。Draft pending 表示另有未生效草稿。尚未发布的套餐显示 Draft。', interaction: '搜索、类型和状态筛选组合生效；修改筛选回到第一页。', api: 'GET /api/commercialization/suits' },
  { title: '新建套餐', rule: '新建首先保存草稿，不立即向用户授予权益。Code 全局唯一，创建后不可变。', interaction: 'New Suit 进入配置页；保存成功后进入该套餐的草稿详情。', api: 'POST /api/commercialization/suits' },
  { title: '引用和删除保护', rule: 'Free 系统默认套餐不可删除；关联商品或任意历史 Grant 的套餐不能删除。', interaction: '删除入口禁用并说明原因。可删除套餐需要确认，服务端再次校验引用。', api: 'DELETE /api/commercialization/suits/{id}' },
  { title: '配置入口', rule: 'Configure 打开草稿（若存在），否则打开当前发布配置；单纯查看不会创建草稿。', interaction: '列表返回后重新请求数据，显示最新版本、状态与更新时间。' }
]
export const suitDetailNotes = [
  { title: '保存草稿与发布', rule: 'Save Draft 不影响已发布配置。Publish 只发布已保存的变更，形成不可变的新版本。', interaction: '有未保存内容时不能发布；需要先保存。发布前确认生效范围。', api: 'PUT /suits/{id}; POST /suits/{id}/publish' },
  { title: '已购规则保护', rule: '已有有效 Grant 保持原版本。新版本供后续新授权使用，发布不改写原授权或已发放 Credits。', interaction: '侧栏展示产品引用及用户授权版本；发布后可打开 Versions 核对旧快照。', api: 'GET /api/commercialization/suits/{id}/impact' },
  { title: '按类型配置', rule: '内容项选择明确 Scope；选择全部只保存当前范围。功能项加入即授权，不配置 Scope、Quota 或 Access 开关。', interaction: '额度项加入独立 Credit Grants。至少配置一项访问权或额度发放。旧快照只读，新版本使用三类权益模型。' },
  { title: '额度发放与到期', rule: '每个 Credit Type 的数量、发放规则和到期规则独立配置。Monthly 是新增 Grant，不是清空钱包。', interaction: '支持会员周期结束、发放周期结束、固定天数或永久有效。新自购额度永久有效；历史额度不自动分类或延长有效期。' },
  { title: '默认和不可变字段', rule: 'Code 和 Type 创建后固定。Free 系统默认套餐始终保留并保持 Active；其 Item 配置可按规则调整。', interaction: '对应字段禁用并给出解释，API 同时强制检查。' },
  { title: '影响预览', rule: 'Preview Changes 比较当前表单与已发布版本，显示字段变更及已有授权的保留策略。', interaction: '预览可以读取未保存表单，但不会保存或发布。', api: 'POST /api/commercialization/suits/{id}/preview' },
  { title: '丢弃和离开', rule: 'Discard Draft 只删除已保存草稿，已发布版本保留；离开含未保存改动的页面需要确认。', interaction: '新建未发布套餐不能直接丢弃唯一草稿，可从列表删除。' },
  { title: '并发与重复点击', rule: '保存、发布、丢弃及删除携带 revision；过期 revision 返回 CONFIG_CHANGED。', interaction: '提交过程中禁用重复操作；冲突提示后保留表单，用户可选择重新加载，不能静默覆盖。' }
]
