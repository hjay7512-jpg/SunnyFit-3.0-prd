# SunnyFit 3.0 商业化原型

在线原型独立部署于仓库的 `prototype/`：[前台](https://hjay7512-jpg.github.io/SunnyFit-3.0-prd/prototype/#/app/home?user=DEMO-2002&review=1)、[后台](https://hjay7512-jpg.github.io/SunnyFit-3.0-prd/prototype/#/commercialization/overview)、[业务关系](https://hjay7512-jpg.github.io/SunnyFit-3.0-prd/prototype/#/commercialization/overview?tab=logic)。使用与本地共用的业务代码，演示数据保存在当前浏览器。部署和迭代说明见 [GitHub Pages 原型](docs/GitHub_Pages_Prototype.md)。

完整后台 Demo + 按真实 Figma 页面还原的 App 样稿，共用 HTTP API 和持久化 SQLite 数据。页面业务文案使用英文，交互注释使用中文。

## 最新验证与更新方案

2026-10-14 已按 [Entitlement Item List v10](https://sunnyfit.atlassian.net/wiki/x/CQAadg) 和关联管理定义更新前后台。当前 MVP 是 **5 项 Content Access、3 项 Feature Access、2 种 Consumable Credits**。功能不扣额度；AI 开放请求按 User Turn 使用 AI Coach Credits；精品兑换使用 Content Credits，成功后永久解锁。会员月赠按原订阅日期和时区逐月刷新、不结转，自购永久有效。Base / Additional 访问权取并集，额度独立发放。

直接打开 [新版前台评审](http://127.0.0.1:3012/#/app/home?user=DEMO-2002&review=1)、[免费周报](http://127.0.0.1:3012/#/app/weekly?user=DEMO-2001&review=0)、[会员与两种余额](http://127.0.0.1:3012/#/app/membership?user=DEMO-2002&review=0)、[后台关系图](http://127.0.0.1:3012/#/commercialization/overview?tab=logic)。`npm run demo:optimized` 默认进入新版账号。DEMO-2001 是 Free、DEMO-2002 是 Premium、DEMO-2003 是 Free 加自购 AI Credits；DEMO-100x 保留为历史规则场景。

周报依据正式 V3 `7697:14248`，Challenge 依据 Alpha 现有 `266:41091`；保留原底部四项导航和个人中心菜单。Movement / World Tour 从原入口接入，未定位独立列表完整设计稿，当前为共用 V3 玻璃组件的评审延展。正式价格、赠送数量、单次消耗数量和即时升级结算仍标记为 Open。

本轮复现：`npm test`（55 项业务测试）、`npm run test:mvp`（15 项新版浏览器检查）、`npm run test:business-review`（10 项图形评审检查）。本地构建已通过，详见[当前交付与边界](docs/SunnyFit_V3_Optimized_Demo_Handoff.md)。以下为此前迭代的历史记录，以本段最新定义为准。

原型已加入图形化需求评审：[打开业务关系图](http://127.0.0.1:3012/?build=business-review#/commercialization/overview?tab=logic)。沿用 Review Tools → Demo Overview，提供权益类型、权益关系、权益组合、内容授权、套餐与订单、额度与消费、版本与 Open 七组图。节点可点选查看定义和关系约束，支持大屏演示、共享当前节点链接和 SVG 导出；“场景与数据”保留原概览。运行 `npm run test:business-review` 校验只读交互，详见[评审交付记录](docs/SunnyFit_V3_Admin_Prototype_Handoff.md)。

早期三类模型交付建立了 Scope、功能加入和额度分型，[权益目录](http://127.0.0.1:3012/#/commercialization/catalog) 与 [Suit 配置](http://127.0.0.1:3012/#/commercialization/suits) 继续使用原入口。当时关于服务单位与 Additional 合并的待定描述，已被本轮确认的 User Turn 和访问权并集覆盖；具体金额和更细合并规则仍待定。

早期展示修正记录（已由上述新模型覆盖）：目录去掉 `ALL` 标签、单一范围显示 `Default`。功能权益当前已完全移除 Scope / Quota 配置，内容 Scope 和额度类型按新模型执行；历史背景见[后台更新记录](docs/SunnyFit_V3_Admin_Prototype_Handoff.md)。

个人中心图标与既有二级菜单已接入：[打开个人中心](http://127.0.0.1:3012/?build=v3-profile-menus#/app/profile?user=DEMO-1003&review=0)。Settings 使用正式稿完整的 11 项和 Log Out，My Preferences 保留原两项；每项来源存于 `src/views/app/profile-menu.js`。原订单、会员仍走现有 API；未接入的设备、社交和账号服务显示明确状态。运行 `npm run test:profile` 验证清单、返回、账号隔离与布局。来源差异和验证证据见下方最新更新。

默认浏览器预览已支持一屏适配：手机框等比缩放，窗口变大时恢复原尺寸，页面与评审侧栏分别内部滚动。[打开自适应首页](http://127.0.0.1:3012/?build=v3-fit-screen#/app/home?user=DEMO-1003&review=0)；运行 `npm run test:preview-fit` 验证不同窗口及缩放操作。组件基线仍保留正式稿尺寸进行对照。

2026-10-14 本轮继续接入：计划训练、恢复、完成、暂停四态预览，以及套餐、账单和 Credits 页的共享卡片与操作控件。支持浏览器首次打开组件链接时自动定位。暂停态仅供正式稿参考，没有暂停或恢复业务接口。直接查看[计划四态](http://127.0.0.1:3012/?build=v3-page-followup#/demo/lab?tab=components&component=plan-paused)、[套餐](http://127.0.0.1:3012/?build=v3-page-followup#/app/plans?user=DEMO-1003&review=0)、[Credits](http://127.0.0.1:3012/?build=v3-page-followup#/app/wallet?user=DEMO-1003&review=0)。专项检查为 `npm run test:plan-states` 和 `npm run test:commerce-ui`；详情与回归证据见下方最新更新。

当前更新：[V3 组件、页面接入与 AI Ball](docs/SunnyFit_V3_Liquid_Glass_And_AI_Update.md)。维护 41 个公开组件；正式首页四个状态已在工作台完整组合；实际首页、Workout 的 Course 模式、计划、课程详情、既有 Program 和对话历史使用共用控件。日程与个人计划仍缺真实业务数据契约。顶栏标题区域透明，玻璃材质只应用到独立操作控件。Alpha 会员内容仅作为业务原型。AI Ball 保持已校准的正视、两侧上方姿态与连续动作。AI Coach 的问候、消息和输入以及运动结果的分析卡片也已部分接入；正式整页、其他模式、完整数据契约和视觉验收仍需继续。

组件与实验工具的首批历史范围见[组件基础交付](docs/SunnyFit_V3_UI_Foundation_Delivery.md)，当前范围以上述最新更新为准。运行 `npm run demo:components` 打开组件与设计来源，运行 `npm run demo:lab` 打开同一账户快照的 A/B 比较。正式首页资源已通过已授权的远程 Figma 工具取得；代码维护约定存于 `src/design-system/README.md`。

历史前端更新：[早期 Alpha 原型对齐说明](docs/SunnyFit_V3_Frontend_Source_Aligned_Update.md)。该记录早于本轮正式 V3 材质与组件纠偏，仅保留当时范围、验证结果和资源限制；当前视觉与组件状态以上述最新更新为准。

历史纠偏：已撤回自创的 Browse all workouts 和无原稿依据的账户、目录、周报及 Program 详情页，恢复既有导航。当时构建、32 项布局与撤回检查、17 项商业化回归通过。以下旧的 18 项及 45 项结果保留为历史记录。

浏览器阅读文档与截图：在项目目录运行 `npm run review`，会启动只读预览并自动打开浏览器。固定入口为 `http://127.0.0.1:3110/latest`，文档目录为 `http://127.0.0.1:3110/`。预览直接读取本地文档，修改后刷新即可；只服务本项目 docs 和 README，不访问数据库。若要在终端前台运行服务，使用 `npm run review:serve`，按 Ctrl+C 停止。

2026-10-12 已完成优化版：会员包含服务次数、新加购 Credits 不过期、周期末套餐切换、当前权益快照和真实用户导航均已接入。23 项领域测试、18 项新版浏览器检查及原有后台检查通过。详见 [优化版交付说明](docs/SunnyFit_V3_Optimized_Demo_Handoff.md)；[三轮验证与更新方案](docs/SunnyFit_V3_Demo_Validation_And_Update_Plan.md)保留历史依据和真人测试协议。自动化验证不代表欧美用户研究已完成。

运行优化版：`npm run demo:optimized`，前台入口为 `http://127.0.0.1:3012/#/app/home?user=DEMO-1003&review=0`，后台为 `http://127.0.0.1:3012/#/commercialization/overview`。使用独立持久数据库 `runtime/optimized-demo.sqlite`，原 Demo 数据保留。复现检查：`npm test`、`npm run test:consumer`、`npm run test:browser`；浏览器检查使用独立测试数据库。

## 打开原型

布局修复验证：先启动优化版，再运行 `npm run test:layout`。覆盖 375、390、430 像素的 14 个前台页面及侧栏，45 项检查通过，截图见优化版交付说明。评审侧栏已对齐现有 Admin 的配色和选中态。

- [评审概览（仅 Demo）](http://127.0.0.1:3011/#/commercialization/overview)
- [内容标记管理](http://127.0.0.1:3011/#/commercialization/content)
- [App 样稿](http://127.0.0.1:3011/#/app/home)

需要 Node.js 24 或更新版本：

```powershell
npm ci
npm run build
npm start
```

开发方式：`npm run dev`，访问 `http://127.0.0.1:8080`，API 代理到 3011。数据库为 `runtime/sunnyfit-admin.sqlite`，重启保留配置和操作记录；种子只初始化，不覆盖已有编辑。OpenSSL 参数用于当前 Node 运行 Webpack 4。

## 实施范围与演示范围

**Demo 的独立页面不是全部要新增的后台菜单。** 侧栏已分为商业化模块建议、现有模块扩展、可选运营方案与评审工具；每页显示正式实施位置。独立钱包、流水及记录样例从对应父模块的说明入口访问。

| 后台模块 | 主要操作 |
| --- | --- |
| Entitlement Catalog / Suits | 建议新增权益管理：只读目录、Base/Additional、Scope、Credits 福利、草稿、发布、版本、引用保护 |
| Products | 建议新增商业商品管理或扩展已有模块：会员和 Credits 商品；SKU 在商品详情内 |
| Service Pricing | 建议新增计价配置能力，可并入商业化配置 |
| Content Labels | 扩展原 Course / World Tour / **现有 Training Program** 列表及编辑页；统一内容列表为演示载体 |
| User Rights / Wallets / Ledger | 扩展原用户详情：权益、Credits 余额 / 批次 / 流水、补偿和资产查询；不要求独立钱包菜单 |
| Orders / Subscriptions | 复用原交易 / 订阅管理，增加快照、履约状态及失败补发；续订管理按渠道能力确认 |
| Redemptions / Service Requests / Audit | 必需的记录与追溯能力；嵌入用户 / 内容详情及原操作日志，独立查询页是辅助样例 |
| Campaigns / Delivery Records | 可选运营方案；可复用原活动 / 客服补偿能力 |
| Overview / Flow Preview | **仅评审工具**：场景用户、模拟支付 / 完成 / 释放 / 到期；不列入正式页面需求 |

App：Home、Workout 的 Course 首屏、课程详情、Training Program 首页状态、AI Coach、Workout Data、当前 Plan 和 AI 历史入口；另有新增的会员与 Credits 页面。左侧可关闭商业化新增标记，对照原稿。个人中心、实景详情、Program 详情仍待具体 Frame，不再使用推测的页面。

## 建议评审顺序

1. **Content Labels**：筛选三个内容类型 → Configure → 修改标签/兑换规则 → 保存草稿 → 预览 → 发布。勾选多条可批量保存或发布。
2. **Flow Preview**：Jamie 加购后使用普通聊天；Casey 深入分析时额度不足；Alex 查看跨批次消费；Evelyn 到期后读取旧资产。
3. **Orders**：模拟支付成功但履约失败，再 Retry Delivery；查看购买快照。
4. **App**：输入问题 → 受限弹窗 → 充值 → 返回，输入保留；兑换内容后再次使用不收费。
5. 每页“交互说明”及实施位置提示属于评审注释；字段提示和业务反馈在正式页面保留。详见 [开发交付说明第 1.1 节](docs/SunnyFit_V3_Admin_Prototype_Handoff.md#11-正式实施位置与评审工具)。

## 与现有后台和 Figma 的关系

根据现有后台公开发布资源确认：Vue **2.6.10**、Element UI **2.15.14**、Vue Router **3.1.0**；原型采用相同版本及 Sidebar / Navbar / TagsView / AppMain、hash 路由、`meta.perms` 约定，侧栏 210px / `#304156`。

未取得原项目源码或 Edge 已登录会话。Vue CLI 4、Webpack 4、Vuex、Axios 是本地原型构建配置，不能据此声称原项目构建完全相同。迁入时复用现有 Layout、request、登录权限和依赖，复制业务页面、组件、API 适配层及路由模块。

App 依据 V3.0 MVP、Alpha 和用户提供的 SUNNYFIT 设计稿中实际可读取的 Frame。恢复四项导航与独立 AI 入口，去掉自创的 Explore / Coach / Me 导航、聊天功能 Tab 和资产聚合入口。会员、钱包、内容标记、分析生成与受限弹窗是本次新增方案，未声称是既有 UI。详见交付说明第 9 节的页面/入口/来源映射。

## 数据和政策边界

六条用户确认规则已落入本地服务。价格、数量、期限、每次操作计价、会员衔接及 Program 内组合授权属于演示或待确认政策。真实支付、商店回调、LLM、用户认证、正式内容 ID、Star 迁移和生产对账尚未接入。

## 代码位置

```text
src/views/commercialization/   后台页面及规则注释
src/views/app/                 App 样稿和样式
src/components/Commerce/       钱包、流水详情、购买、批量标记、发放组件
src/components/AdminNumber/    Element UI 数字输入状态兼容
src/api/                      HTTP 适配层
src/router/modules/           后台路由模块
server/store.cjs              目录、Suit、版本和引用保护
server/commerce.cjs           授权、批次、报价、支付履约、服务、兑换
config/demo-policy.cjs        集中管理示例定值
public/assets/figma/           本地原设计静态资产
docs/                         业务规则、交付说明和截图
```

当前构建和页面检查已完成。`npm test` 覆盖目录、权益与商业化关键规则，`npm run test:consumer` 验证新版用户任务，`npm run test:browser` 保留第一批后台检查。真实商店、AI、训练播放器和目标用户理解仍需后续对接与测试。

