# SunnyFit 前端原稿对齐更新

2026-10-12。本轮根据用户指定的 Alpha `221:1177` 商业化画布更新前端。个人中心和 Membership & Usage 的组件层级已经接回原入口，卡片、访问判断、报价与返回任务使用一致的场景数据。未新增账户菜单、课程目录、资产中心或 Program 详情入口。

## 查看更新

- [个人中心用户模式](http://127.0.0.1:3012/#/app/profile?user=DEMO-1003&review=0)
- [Membership & Usage 用户模式](http://127.0.0.1:3012/#/app/membership?user=DEMO-1003&review=0)
- [评审模式](http://127.0.0.1:3012/#/app/profile?user=DEMO-1003&review=1)

现有服务刷新即可；重新启动使用 `npm run demo:optimized`。浏览器直接显示原页面，不需要插件来展示本地原型。

## 原稿和更新对应

| 原稿组件或动作 | 本轮处理 |
| --- | --- |
| Personal Center，249:2123 | 保留身份、Rewards、Badges、Membership & Usage、Devices & Health、My Orders、Community & Privacy、Settings、Help & Support、邀请与设备商城的原层级。未接入的非商业化模块保留静态结构，不补造页面。 |
| Membership & Usage，249:2183 | 保留当前方案卡、主要 CTA，以及 Plan & Benefits、Billing History、Restore Purchase。包含次数与额外 Credits 在这一层分别呈现。 |
| AI Coach 用量展示 | 将含义模糊的百分比改成“剩余 / 总量”和实际重置日期。Free 没有包含次数时不伪造 8 turns left。 |
| Explore Premium / Plan & Benefits | 进入当前权益、在售方案和订阅管理内容；不作为新的一级菜单。当前周期使用原权益快照，下一次付款使用对应 SKU 的货币和金额。 |
| My Orders / Billing History | 同一账户订单读取，区分已付款、失败、待履约和计划切换。Scheduled 明确无当日收费。 |
| Course Start、Home 卡片、Workout GO | 展示标题、时长与 Start 校验绑定同一内容对象；不再出现卡片 A、确认内容 B。 |
| Program 下一门课程 | 使用实际成员与顺序；从原 Start Now 带经过校验的父 Program 进入课程，不制造再次兑换。 |
| AI Coach View usage / 商业限制动作 | 保留草稿、训练对象、父 Program 和返回来源。购买或加购完成后回到原任务，不自动生成或扣费。 |
| 限制弹层 | 权益不足、包含量耗尽、Credits 不足与服务不可用分别解释；不可用服务不给无效充值入口。 |

Rewards 与 Badges 的数据没有进入当前接口，所以展示空值，不照抄设计中的演示数字，也不以 Credits 替代。Plan & Benefits 摘要遵循 Scope，包含次数只展示与有效服务权限相容的规则。加购页面只展示无期限的新在售 Credits，保留历史批次自己的有效期。

## 验证与范围

构建通过。21 项隔离浏览器回归覆盖原账户导航、订阅与包含量、草稿回流、Program、报价 SKU 和后台状态关联。41 项布局检查覆盖 375、390、430 像素宽度的 12 个页面、长标题、原账户菜单和已撤回入口；同时确认页面引用的图片加载成功。课程 Start 和底部安全区保持可见，正文独立滚动。

- [交互回归结果](optimized-demo-validation/2026-10-12T11-55-36-079Z-da130e/results.json)
- [最终布局结果](layout-validation/2026-10-12T11-57-03-288Z/results.json)
- [个人中心截图](layout-validation/2026-10-12T11-57-03-288Z/390-profile.png)
- [会员用量截图](layout-validation/2026-10-12T11-57-03-288Z/390-membership.png)
- [课程及持续可见的 Start](layout-validation/2026-10-12T11-57-03-288Z/390-course.png)

这证明当前本地交互和排版条件，不能替代欧美真人体验验证。价格、次数和周期仍是 Demo 参数；支付、商店恢复和 AI 是模拟服务。原后台允许有期限的新商品、包含服务与功能授权的发布校验等问题，本轮只在前端防止错误承诺，服务端约束仍需单独修复。

## 尚未完成的原稿资源验收

个人中心整帧和身份卡的高保真读取被 Figma 下载目录授权阻止，返回 `Cannot write to this directory`。其余会员入口、菜单、身份文字、权益数字和底部菜单子组件已获得高保真设计上下文与截图。当前身份卡使用灰色占位圆形，尚未取得原头像 SVG，不宣称静态资源完全还原。

[Figma design-to-code 规范](C:/Users/Administrator/.codex-account-B/plugins/cache/openai-curated-remote/figma/15.0.0/skills/figma-design-to-code/SKILL.md)要求 “You MUST ensure ALL static assets used have been downloaded”。因此不能用省略原资源来判定完整验收通过。需在 Figma 桌面 Dev Mode 的 MCP 设置为 `E:\SunnyFit\monetization\public\assets\figma\account` 添加目录授权，或由用户调整为官方支持的本地资源模式后，再完成头像资源与整帧对照。
