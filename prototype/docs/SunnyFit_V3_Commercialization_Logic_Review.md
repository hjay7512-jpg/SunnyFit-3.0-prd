# SunnyFit 3.0 商业化逻辑审查与原型范围

状态：首轮审查记录。更新日期：2026-10-09。

用户已于 2026-10-09 确认会员与 Credits 独立、会员可附赠 Credits、Credits 可以加购且分批到期、先到期先消耗、已购周期保留原规则，以及到期后保留已有资产。当前业务规则与实施计划见 [SunnyFit 3.0 商业化业务规则与实施计划](SunnyFit_V3_Commercialization_Rules_And_Plan.md)。

本文保留最初的缺口和建议以便追溯。其中普通聊天仅按回合额度消费、Credits 是否进入本期，以及到期资产保留等旧讨论，已经由本次用户确认更新；后续需求和实现以新的规则稿为准。

SunnyFit 3.0 的权益、商品、交易和履约分层可以继续沿用，但会员与 Credits 的边界、内容授权、权益变更和订阅生命周期仍需补齐。原型应在这些规则对齐后，展示同一套配置如何影响后台管理和 App 的实际访问结果，供产品、设计及开发共同评审。

本文列出的建议尚未成为批准的产品规则。现有个人空间 PRD 标注为 Working Definition；最终决策需由 Owner 确认并记录到 SA 的需求或决策页。价格、赠送数量和额度均不在本文设定生产值。

## 现有后台可以沿用的结构

测试后台入口为 https://testing.sunnyfitapp.com/sunny-admin/index.html#/user/info 。已发布静态资源支持以下结论：

- Vue 2.6.10、Element UI 2.15.14；应用代码包含 vue-element-admin，以及 sidebar、navbar、tags-view、app-main 等布局名称。
- 表格、表单、弹窗和权限控制可沿用现有后台交互体系。路由通过 `meta.perms` 关联权限，部分详情及用户级入口标记为 `hidden`。
- `/proSubscription` 已包含 SKU、Campaign、Subscription、Ledger、Reconciliation、Discrepancy、Membership 等路由。流水、差异和会员页面中有隐藏路由，不能按全部为侧栏菜单理解。
- 发布包已存在订阅详情、活动发放、商店同步及对账相关界面代码。它们是复用候选，不能仅凭前端代码断言接口可用或业务已上线。

当前工作目录只有背景资料，没有后台源码。网址能够用于确认发布结构；直接复用源组件、路由封装和接口层，需要取得对应源码。Edge 当前没有开启调试端口，本轮也未找到可验证的已登录后台标签页，因此尚未核验账号实际可见的菜单和页面。

资源依据：[后台入口](https://testing.sunnyfitapp.com/sunny-admin/index.html)、[应用代码](https://testing.sunnyfitapp.com/sunny-admin/static/js/app.da02aa75.js)、[公共依赖](https://testing.sunnyfitapp.com/sunny-admin/static/js/chunk-libs.ed5a4709.js)、[Element UI 依赖](https://testing.sunnyfitapp.com/sunny-admin/static/js/chunk-elementUI.2ed0a445.js)。资源文件名属于本次发布快照，后续发布可能变化。

## 历史规则与当前提案的差异

| 背景 | 来源中的规则或状态 | 对本次需求的影响 |
| --- | --- | --- |
| 2022 年会员和积分体系 | 商品关联课程、Program、World Tour；套餐可用现金或积分；旧手册记录了下架后的有效权益保留，以及内容关联可能绕过兑换限制的问题。 | 迁移需要同时处理旧会员、套餐和单独兑换记录；内容授权应在统一的访问检查点执行。旧问题记录不能直接视为当前仍有漏洞。 |
| 2025 年 12 月 AI 会员草案 | 付费层命名为 AI Coach+，强调 AI 能力授权，并提出不使用 VIP、Pro、Premium。 | 与当前工作稿及 Alpha 中的 Premium 命名和内容组合存在差异，需要选定当前定位和统一称谓。 |
| 2026 年 6 月引擎计费联调 | 测试报告记录 Token Ledger、Credits Catalog、预扣和实扣日志、版本及模拟报价；计费包含 fixed_plus_token。 | 已有计费实现的背景需要纳入设计。先确认它是否对应用户余额及消费价值，或仅用于引擎计量，不能直接把内部动态成本展示为用户服务价格。该报告不证明当前生产可用。 |
| 2026 年 9 月商业化工作稿 | Item、Suit、Product、SKU、Order、Grant、Effective Entitlement 分层；Base Suit 替换；Additional Suit 可叠加。 | 作为当前工作模型继续补齐运行规则。 |
| 本地整理的 9 月 21 日讨论 | 会员加 Credits，候选内容分类为 Free、Premium、Featured，兼容历史 Star 兑换。 | 与现有商品必须关联 Suit 的模型、内容 Scope 和旧积分体系共同对齐。该讨论尚未作为批准规则落地。 |

历史依据：[旧会员使用手册](https://sunnyfit.atlassian.net/wiki/spaces/SA/pages/48627713)、[旧积分兑换需求](https://sunnyfit.atlassian.net/wiki/spaces/SA/pages/50102278)、[AI 会员规划草案](https://sunnyfit.atlassian.net/wiki/spaces/SA/pages/1484587022)、[引擎计费联调报告](https://sunnyfit.atlassian.net/wiki/spaces/SA/pages/1840545824)。

SA 中指定的 Business Context 页当前正文为空；本轮按商业化、权益、会员、Credits 等标题和关键词检索，没有找到可以取代个人空间工作稿的完整 V3.0 批准规格。因此不能仅凭页面所在空间提升某个历史草案的决策优先级。

## 可以继续沿用的工作模型

- Entitlement Item 是可独立检查的最小权益，Spec 使用 Scope 与 Quota；加入 Suit 表示具备该权益，不额外维护 Access 开关。
- Catalog 由服务端初始化，后台只读；Suit 可以配置。Scope 的 ALL 与具体选项互斥。
- 同一用户同时只有一个 Base Suit，可有多个 Additional Suit。Free Suit 作为默认 Base Suit 保留。
- 商品关联权益配置；SKU 定义渠道与销售规格；订单记录交易；Grant 记录授权。订单与 Grant 不能互相替代。
- 业务通过 Effective Entitlement 判断访问，不用会员身份或购买记录自行推断权限。
- 内容在 Start 或 Select 时校验；Dynamic Plan 在 Activate 时校验。Workout Result 与 Weekly Report 保留基础数据，AI 增强单独判断。
- AI Chat 按用户回合计量，不按内部模型或工具调用次数计量。
- Product 或 SKU 停售不能自动撤销已有 Grant，也不能自动等同于外部商店终止订阅。

依据：[商业化模型](https://sunnyfit.atlassian.net/wiki/spaces/~63b7cf11b790087ed712d207/pages/1979908100)、[权益模型](https://sunnyfit.atlassian.net/wiki/spaces/~63b7cf11b790087ed712d207/pages/1980366856)、[权益项清单](https://sunnyfit.atlassian.net/wiki/spaces/~63b7cf11b790087ed712d207/pages/1981415433)、[后台权益配置](https://sunnyfit.atlassian.net/wiki/spaces/~63b7cf11b790087ed712d207/pages/1982791683)、[商品和 SKU](https://sunnyfit.atlassian.net/wiki/spaces/~63b7cf11b790087ed712d207/pages/1983676417)。这些页面仍为工作定义。

## 原型设计前需要对齐的缺口

P0 表示会直接改变收费、授权或主要流程；P1 表示影响管理和开发交付完整性。下表中的补齐方式均为建议。

| 优先级 | 缺口 | 建议补齐的规则 | 对原型的影响 |
| --- | --- | --- | --- |
| P0 | 会员定位及命名不同 | 明确当前采用 AI 能力会员还是覆盖内容与能力的整体会员；统一 AI Coach+、Pro、Premium 的关系。 | 个人中心、权益对比、付费墙和后台商品名称一致。 |
| P0 | 会员 Quota 与 Credits 的关系未定 | 建立服务计费矩阵，逐项说明权限、包含额度及 Credits；普通对话是否另扣 Credits、服务是否可在 Chat 内购买，需要明确。避免一次行为出现未披露的双重收费。 | 用尽额度、余额不足及升级入口分别处理。 |
| P0 | 引擎 Credits 与用户 Credits 的单位及价格关系未定 | 对齐现有 Catalog、预扣及实扣日志与用户钱包的关系；明确用户确认价、最终扣费上限和失败释放规则。内部 Token 成本继续可审计。 | 用户显示可理解的服务价格；后台关联报价与扣费记录。 |
| P0 | 商品模型尚未覆盖 Credits 补充 | 若本期售卖 Credits，明确商品类型及履约目标。权益商品关联 Suit；Credits 商品需定义余额发放，不能用 Gift Duration 表达。 | 决定是否需要 Credits 商品与 Get Credits 流程。 |
| P0 | 内容 Tier 与 Scope ALL 存在潜在歧义 | 定义 Free、Premium、Featured 与内容池的映射，并明确 ALL 是否含 Featured。建议把 Featured 的兑换记录作为独立访问依据，避免会员 ALL 意外绕过兑换。 | 标签、列表、详情与实际 Start 校验一致。 |
| P0 | 已兑换内容及历史会员迁移未定 | 区分旧会员时效权益、旧单项兑换、积分余额；明确用户及内容映射、有效期和回放规则。 | 旧 Star 已兑换用户无需重复支付；旧会员不会凭身份直接映射到未定义的新权益。 |
| P0 | Suit 修改和 Product 换绑的生效方式未定 | 建议配置使用版本，区分保存草稿与发布；Grant 记录授予版本。旧用户迁移单独定义，避免保存表单即改变已购权益。 | 增加版本、生效范围、影响预览和发布结果。 |
| P0 | Additional Suit 合并及扣减来源未定 | 明确 Scope 如何组合，以及 Quota 按哪个授权和周期消耗。不要把不同 Scope 的额度无条件放进一个池；保留消费来源。 | 用户权益详情解释每项权益及剩余额度来源。 |
| P0 | Quota 周期及赠送 Credits 周期未定 | 明确周期锚点、时区、失败及重试计数、升级时额度处理；区分年付周期与可能按月发放的福利周期。 | 显示具体重置时间，而非模糊的 next cycle。 |
| P0 | 订阅生命周期和升级结算未定 | 区分取消续费、有效期结束、退款、续费失败及待验证；统一商店事件和会员状态。升级的计费和结算需按渠道契约确定。 | 管理订阅、取消后仍有效、付款处理中及恢复购买均有对应状态。 |
| P0 | 多渠道购买及恢复购买未定 | 明确商店购买与 SunnyFit 账号关联、已有会员再次购买、不同渠道有效订阅同时存在时的处理，维持唯一 Base Suit。 | 购买前提示当前渠道，恢复购买不会重复发放。 |
| P0 | 到期后的 Dynamic Plan 行为未定 | 明确已激活计划是否继续执行、是否暂停调整、历史任务及结果是否保留，并补齐终止入口。 | 到期不能只改 Free 标签；计划页需要真实的状态和后续行动。 |
| P0 | 服务失败与消费幂等未定 | 以用户业务请求关联报价、占用、完成或释放；重复提交、回调重试和服务失败不得重复扣费。恢复购买和周期福利也需防重复发放。 | 加载、重试、处理中及失败恢复均可演示。 |
| P1 | Order 与 Grant 的后台状态关联不完整 | 分开展示交易状态和履约状态，能查到已支付但未发放、补发成功及退款后调整结果。 | 扩展已有订阅详情及流水，而非只有一个订单成功标签。 |
| P1 | 用户有效权益缺少解释入口 | 在用户详情展示 Base、Additional、Grant、有效期、版本和消费来源，并提供指定功能的访问结果。 | 运营可以判断用户为何被拦截，减少人工猜测。 |
| P1 | 人工操作及配置保护未定 | 明确角色权限、修改原因和操作日志；Free Suit 除不可删除外，还要定义禁用及最低基础权益保护。 | 表单校验、人工补偿和审计流程完整。 |
| P1 | Credits 发放、调整及余额规则不完整 | 定义购买、赠送、补偿、消费、释放、退款、过期等流水类型；如有有效期或类别，明确扣减顺序和退款去向。 | 钱包与流水可解释余额变化，并能追溯发放来源。 |
| P1 | 内容下架和报告历史访问未定 | 区分商品停售与内容不可用；明确已兑换内容失效处理、已生成 Insight 的查看及重新生成是否消费。 | 避免所有不可用状态都导向升级或再次扣费。 |
| P1 | SKU 商店价格及展示信息未定 | 明确价格、币种、可售地区和商店同步的权威来源；补齐 App 展示名称、文案和本地化信息。 | 用户看到的价格及可购买项与商店一致。 |
| P1 | 限制入口缺少统一原因和返回路径 | 区分无权益、范围不匹配、额度用尽、余额不足、内容不可用和支付待处理；成功后返回原功能，保留用户输入和训练状态。 | CTA 指向真正能解决问题的操作。 |

## 建议对齐的用户行为矩阵

这张矩阵用于讨论，金额、额度、会员覆盖范围和 Credits 收费服务仍待确认。

| 用户行为 | 访问判断 | 消费规则建议 | 限制时的处理 |
| --- | --- | --- | --- |
| 免费内容 Start | 内容启用状态及有效的基础访问权益 | 不消费 Credits | 内容不可用时解释原因，不显示会员升级。 |
| Premium 内容 Start | 对应内容权益及 Scope；附加授权也参与判断 | 不因播放再次消费 Credits | 缺少权益时展示升级；已有附加权益时允许访问。 |
| Featured 内容首次兑换 | 内容可兑换状态、兑换记录及余额；是否另需会员待定 | 明示价格并确认，成功后形成访问记录 | 余额不足才显示补充路径；补充能力尚未提供时不能放空入口。 |
| Featured 内容再次播放 | 已有兑换记录及内容可用状态 | 同一有效兑换不重复收费 | 保留访问；内容失效按单独规则处理。 |
| 普通 AI Chat Send | Text、Image、Live 对应范围及用户回合额度 | 建议只消费明确配置的回合额度；若要另扣 Credits 必须单独对齐 | 提示重置时间或可解决该限制的方案，保留草稿。 |
| 独立个性化服务 | 服务资格、服务价格及余额；若在 Chat 内触发还需说明回合计数 | 独立确认后执行，失败按约定释放或返还 | 展示费用及失败恢复，不因内部工具调用增加用户回合。 |
| Dynamic Plan 预览及激活 | 预览与 Activate 分开判断 | 激活依据权益；个性化服务收费边界另定 | 激活缺少权益时升级，预览保持已定义的基础体验。 |
| Workout Result 及 Weekly Report | 基础信息可用，AI Insight 单独判断 | 生成、查看和重新生成分别定义 | 基础统计继续可读，受限模块解释增值内容。 |

## 后台原型模块及复用建议

优先保持现有后台布局、权限路由、搜索筛选、表格、分页、详情及弹窗风格。新增商业化配置与现有订阅运营页面共用用户和交易关联信息。

| 模块 | 主要页面及交互 | 现有结构的处理建议 |
| --- | --- | --- |
| Entitlement Catalog | 只读列表、分类筛选、详情、Supported Scope 与 Quota Definition。 | 新增配置查看页，不允许后台动态创造未实现的功能。 |
| Entitlement Suits | Base 与 Additional 列表；配置 Item、Scope、Quota；Free 保护；版本及影响预览。 | 新增配置页；发布机制依生效规则确认。 |
| Product Management | 商品列表及详情；Basic Information、Upgrade Rule、嵌套 SKUs；类型及履约目标。 | 与现有 SKU 模块建立映射，避免同一 SKU 两套独立写入入口；旧路由可保留兼容入口。 |
| Subscription 与 Order | 交易、渠道、有效期、付款及履约状态、Grant 关联、恢复或补发结果。 | 优先扩展 `/proSubscription/subscription` 及详情。 |
| 用户权益 | 在用户详情查看有效权益、授权来源、额度、版本及具体功能访问结果。 | 扩展 `/user/info` 的用户详情和隐藏的会员详情入口。 |
| Campaign 与补偿 | 选择授予权益或 Credits、时间、目标用户、预览、结果及重复发放保护。 | 优先扩展 `/proSubscription/campaign`；独立定义人工操作权限。 |
| 用户 Credits | 钱包、发放及消费流水、服务报价、交易关联和异常结果。 | 对齐引擎 Credits Catalog 与日志后决定代理或新增接口；不把 Token 流水替代用户钱包。 |
| 内容商业化配置 | Tier、内容池、兑换价格、上下架和兑换记录。 | 嵌入现有内容及商品管理的适当位置，统一访问判定。 |
| Ledger 与 Reconciliation | 订阅流水、对账、差异；关联异常交易及履约。 | 保留已有页面职责；商店资金流水、用户 Credits 流水和内部 Token 成本使用明确名称。 |

## App 原型入口及状态

现有 Alpha 设计已经包含个人中心、Membership & Usage、内容付费入口、Chat 低额度和耗尽、Dynamic Plan 激活限制。已读取的设计使用浅色背景、红色主要操作、圆角卡片，以及与 V3.0 一致的 AI Chat 布局。后续应沿用这些样式与组件，而不是重新建立视觉体系。

| 入口或页面 | 需要覆盖的状态 |
| --- | --- |
| 个人中心 | Free、付费有效、取消续费但仍有效、到期；会员入口；额度与余额清晰分开；保留 Rewards 和 Badges 的独立含义。 |
| Membership 与 Usage | 权益摘要、剩余回合、具体重置时间、管理订阅、恢复购买；有附加权益时能够解释。 |
| 会员对比与购买 | 商品与 SKU、渠道价格、购买前确认、模拟支付、待处理、成功、失败及返回原入口。 |
| 内容列表与详情 | Free、Premium、Featured、已兑换、旧兑换兼容、不可用；Start 或 Select 时进行实际校验。 |
| AI Chat | 正常、低额度、额度耗尽、范围不支持、服务报价、余额不足、处理中及失败恢复。 |
| Dynamic Plan | 预览、激活限制、激活成功、会员到期后的既有计划、终止入口。 |
| Workout Result 与 Weekly Report | 基础数据、受限 AI Insight、生成中、生成失败、已生成结果及重新生成。 |
| Credits 钱包及历史 | 余额、购买或赠送来源、消费、待结算或释放、退款及可能的到期信息。是否进入本期依模型确认。 |

已有草图的额度呈现还需统一：个人中心的百分比必须说明是已用还是剩余，并与 Membership 页的剩余回合及进度条保持一致。额度耗尽弹层标题应换行，避免当前截图中出现的文字截断；提示后保留对话草稿。

设计依据：[V3.0 MVP](https://www.figma.com/design/94S2EVx6mOkJRj8P0VyRLx/V3.0-MVP)、[个人中心](https://www.figma.com/design/t7g261XYs61EdvYzIZn5YL/V3.0-Alpha?node-id=249-2123)、[会员及额度](https://www.figma.com/design/t7g261XYs61EdvYzIZn5YL/V3.0-Alpha?node-id=249-2183)、[AI Chat 耗尽入口](https://www.figma.com/design/t7g261XYs61EdvYzIZn5YL/V3.0-Alpha?node-id=250-2506)。Alpha 作为设计参考，不自动代表对应业务规则已获批准。

## 首轮对齐顺序与开发交付

先确认会员定位、Credits 是否进入本期，以及各项服务的权限和消费矩阵。这三项会决定商品类型、后台模块和 App 主要入口。

随后确认内容授权与旧数据迁移、Suit 版本及合并、额度周期、订阅生命周期和失败处理。价格与赠送数量可以保留为演示配置，但上述状态转换需要明确预期，才能评审真实交互。

完成对齐后的交付包括：后台和 App 可交互原型、共用的演示数据与访问结果、页面和接口映射、字段校验与状态说明、异常场景及开发验收清单。所有未批准的数值集中标注为演示假设，支付与 AI 输出采用模拟实现。

本轮产出为逻辑审查和原型范围；尚未修改现有后台、Confluence 或 Figma，也未实施产品收费规则。
