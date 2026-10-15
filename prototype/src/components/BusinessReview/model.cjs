// Source: Confluence Entitlement Item List v10, 2026-10-14.
const entities={
  "entitlement": {
    "title": "Entitlement Item",
    "name": "权益项",
    "subtitle": "系统定义“能获得什么”",
    "definition": "权益项是用户可以获得的一项具体权益，例如课程访问权、动态计划功能，或 AI 教练额度。",
    "example": "“动态计划”是一项功能权益；“AI 教练额度”是一项可消耗额度。它们可以一起放进会员的权益组合。",
    "rules": [
      "MVP：5 项内容访问、3 项功能、2 种额度。AI Chat 不作为单独 Feature；真人教练不在本轮 MVP。",
      "内容选 Scope，功能加入即授权，额度单独配置发放规则。"
    ],
    "links": [
      [
        "权益目录",
        "catalog"
      ]
    ]
  },
  "content_access": {
    "title": "Content Access",
    "name": "内容访问权",
    "subtitle": "内容范围访问权",
    "definition": "内容访问权决定用户可以访问哪些内容。后台把内容划分为不同范围，再为权益组合勾选允许访问的范围。",
    "example": "某权益组合勾选了“Premium Courses”，获得这份权益的用户就可以访问归属于这个范围的课程。",
    "rules": [
      "一条内容只归属于一个内容范围，一个范围可以包含多条内容。",
      "一份权益组合可以勾选多个范围；全开放时逐项选择全部范围，不再配置 ALL。"
    ],
    "links": [
      [
        "内容管理",
        "content"
      ],
      [
        "权益组合配置",
        "suits"
      ]
    ]
  },
  "feature_access": {
    "title": "Feature Access",
    "name": "功能使用权",
    "subtitle": "加入 Item 即获得功能",
    "definition": "功能使用权决定用户能否使用某项功能。后台把功能加入权益组合，获得这份权益的用户就拥有该功能。",
    "example": "动态计划激活、训练 AI 洞察和周报 AI 洞察是三项功能权益，获得授权后使用不消耗 Credits。",
    "rules": [
      "加入功能即授权，没有 Scope、Quota 或开关。",
      "基础训练数据、RPE 和模板周报免费。",
      "计划讨论属于 AI User Turn；只有激活已有计划检查 Dynamic Plan 权益。"
    ],
    "links": [
      [
        "权益目录",
        "catalog"
      ],
      [
        "权益组合配置",
        "suits"
      ]
    ]
  },
  "consumable_credits": {
    "title": "Consumable Credits",
    "name": "可消耗额度",
    "subtitle": "独立的可消费资产",
    "definition": "可消耗额度是用户持有的余额，使用需要付额度的服务时会减少。后台需要明确额度的类型、发放数量和有效期。",
    "example": "用户可以同时拥有会员赠送的 AI 教练额度和自己购买的 AI 教练额度；两笔额度保留各自的有效期。",
    "rules": [
      "额度可以来自会员赠送、单独购买、活动赠送或补偿。",
      "不同类型分别计算余额，不能相互抵扣；各服务具体扣多少额度仍待确定。"
    ],
    "links": [
      [
        "权益组合配置",
        "suits"
      ],
      [
        "额度商品",
        "products"
      ]
    ]
  },
  "content": {
    "title": "Content",
    "name": "内容",
    "subtitle": "Course / World Tour / Program / Movement / Challenge",
    "definition": "内容包括课程、实景、训练包、动作和限时挑战。每个内容归属一个 Scope，Suit 选择允许访问的范围。",
    "example": "后台将一门课程归入“Premium Courses”。要访问这门课程，用户持有的内容访问权需要覆盖这个范围。",
    "rules": [
      "课程、实景、动作在 Start 校验；训练包在 Select 校验；限时挑战在 Join 校验。",
      "浏览与预览开放；Join 不等于完成挑战，目标、进度和奖励由挑战业务管理。",
      "Content Credits 兑换成功后永久解锁，重复播放不扣额，会员到期不撤销解锁。"
    ],
    "links": [
      [
        "内容管理",
        "content"
      ]
    ]
  },
  "content_scope": {
    "title": "Content Scope",
    "name": "内容范围",
    "subtitle": "内容侧维护的范围",
    "definition": "内容范围是一组供授权使用的内容，由内容管理侧维护。每条内容只选一个范围，权益组合可以选择多个范围。",
    "example": "“Premium Courses”可以包含多门课程。某权益组合选择这个范围，就覆盖其中的课程。",
    "rules": [
      "新建一个范围后，旧权益组合不会自动获得它，需要另行选择并发布。",
      "“选择全部”指选中当前已有的范围，不包括以后新增的范围。",
      "停用范围会停止新的选择，不会直接撤销用户已经获得的访问权。"
    ],
    "links": [
      [
        "维护内容范围",
        "content"
      ],
      [
        "权益目录",
        "catalog"
      ]
    ]
  },
  "suit": {
    "title": "Entitlement Suit",
    "name": "权益组合",
    "subtitle": "组合访问权与额度发放",
    "definition": "权益组合把多项权益放在一起，定义用户获得后能看什么、能用什么，以及获得哪些额度。会员商品通过关联它来确定会员权益。",
    "example": "一份 Premium 权益组合可以包含 Premium 课程访问权、动态计划功能，以及按月发放的 AI 教练额度。",
    "rules": [
      "内容选 Scope、功能加入 Item、额度填写独立发放规则。",
      "保存草稿不改变用户权益；发布生成下一版本。",
      "Base 与 Additional 的内容、功能权限取并集；额度分别发放、保留来源。"
    ],
    "links": [
      [
        "权益组合配置",
        "suits"
      ]
    ]
  },
  "suit_version": {
    "title": "Published Suit Version",
    "name": "已发布的权益版本",
    "subtitle": "不可变的权益版本",
    "definition": "每次发布都会保存一份确定的权益配置。用户购买会员时，订单会记住当时买到的版本，后续修改不会改变这次购买。",
    "example": "用户买到第 1 版权益后，后台发布了第 2 版；这个用户已购周期内仍按第 1 版享有权益。",
    "rules": [
      "新版本用于后续购买和新授权，已购周期保留原权益、额度数量和有效期。",
      "用户付款前配置发生变化，需要重新确认购买内容；已付款订单按原购买内容发放。"
    ],
    "links": [
      [
        "套餐版本",
        "suits"
      ],
      [
        "订单记录",
        "orders"
      ]
    ]
  },
  "access_rights": {
    "title": "Access Rights",
    "name": "内容与功能访问权",
    "subtitle": "Content + Feature",
    "definition": "访问权合起来说明用户可以看哪些内容、使用哪些功能。查看某项能力是否可用时，系统检查用户当前持有的这些权限。",
    "example": "用户持有 Premium 课程访问权和动态计划功能，就可以访问对应课程、使用动态计划；AI 教练额度余额另外计算。",
    "rules": [
      "拥有访问权和拥有额度是两个独立判断，额度余额不自动增加访问权。",
      "基础免费训练继续免费。",
      "读取已有对话、报告和计划，与发起一次新的生成分别处理。"
    ],
    "links": [
      [
        "用户有效权益",
        "users"
      ]
    ]
  },
  "grant_rule": {
    "title": "Credit Grant Rule",
    "name": "额度发放规则",
    "subtitle": "Type · Amount · Rule · Expiry",
    "definition": "额度发放规则说明：给用户哪种额度、每次给多少、什么时候给，以及这笔额度何时到期。后台在权益组合中配置它。",
    "example": "会员从订阅开始日，按原订阅时区逐月发放 AI Coach Credits 和 Content Credits；年费也逐月发放。",
    "rules": [
      "会员月赠在下一次月度刷新到期，不结转；不会清空自购余额。",
      "周期使用原始订阅日期和时区，月底与夏令时保持日历语义。",
      "数量与正式价格仍待定义，原型使用可编辑的本地评审参数。"
    ],
    "links": [
      [
        "配置发放规则",
        "suits"
      ]
    ]
  },
  "membership_product": {
    "title": "Membership Product",
    "name": "会员商品",
    "subtitle": "会员商品关联 Base Suit",
    "definition": "会员商品是用户可以买到的会员套餐。后台为它关联一份已发布的基础权益组合，并配置售卖规格、价格和会员周期。",
    "example": "用户购买“Premium Monthly”，支付成功后按订单中的权益版本获得内容和功能访问权，并按规则获得额度。",
    "rules": [
      "每个会员商品关联一份已发布的付费基础权益组合，多个商品可以使用同一份组合。",
      "用户这次购买的权益、会员周期和金额，以订单记录为准。",
      "图中的商品名称和额度示例不代表已经确定的正式售价或发放数量。"
    ],
    "links": [
      [
        "会员商品与售卖规格",
        "products"
      ]
    ]
  },
  "credit_product": {
    "title": "Credit Product",
    "name": "额度商品",
    "subtitle": "单独购买指定类型额度",
    "definition": "额度商品让用户单独购买一种额度。后台选择额度类型和数量，用户支付成功后，这笔额度进入相应的钱包。",
    "example": "用户购买“AI 教练额度包”，只增加 AI 教练额度余额。即使会员到期，这笔自购额度也不会因此失效。",
    "rules": [
      "购买额度商品不开通会员，也不增加内容或功能使用权。",
      "新购买的额外额度不设置到期时间。",
      "历史购买继续保留原额度类型和原有效期。"
    ],
    "links": [
      [
        "额度商品与售卖规格",
        "products"
      ]
    ]
  },
  "product": {
    "title": "Product",
    "name": "商品",
    "subtitle": "Membership / Credit",
    "definition": "商品是面向用户售卖的对象。目前分为会员商品和额度商品：前者提供一组会员权益，后者提供一种额度。",
    "example": "“Premium Monthly”是会员商品；“AI 教练额度包”是额度商品。两者提供的购买内容不同。",
    "rules": [
      "会员商品关联权益组合，额度商品指定额度类型和发放数量。",
      "同一个商品可以配置多个售卖规格，用于不同渠道或购买周期。"
    ],
    "links": [
      [
        "商品管理",
        "products"
      ]
    ]
  },
  "sku": {
    "title": "SKU",
    "name": "售卖规格",
    "subtitle": "渠道 · 价格 · 周期",
    "definition": "售卖规格是商品下面可实际购买的一种选项，记录销售渠道、价格、币种，以及适用的会员周期。",
    "example": "同一会员商品可以配置不同渠道的售卖规格；用户付款时确认的是其中一个规格和它的价格。",
    "rules": [
      "一个售卖规格只属于一个商品，一个商品可以有多个规格。",
      "订单保存用户实际确认的规格；后续调整不改写历史购买记录。"
    ],
    "links": [
      [
        "商品内的售卖规格",
        "products"
      ]
    ]
  },
  "order": {
    "title": "Order",
    "name": "订单",
    "subtitle": "锁定本次购买",
    "definition": "订单记录用户这次买了什么、支付多少钱、是否支付成功，以及权益是否已经发放。它保存这次购买的确定内容。",
    "example": "用户购买会员后，订单既记录“已支付”，也记录“权益已发放”。如果支付成功但发放失败，系统可以按原购买内容补发。",
    "rules": [
      "付款失败不发放权益或额度。",
      "付款成功后按订单里的购买内容发放，不套用后来修改的配置。",
      "补发或重试不能重复发放已经到账的权益或额度。"
    ],
    "links": [
      [
        "订单记录",
        "orders"
      ],
      [
        "走查支付流程",
        "operations"
      ]
    ]
  },
  "purchase_snapshot": {
    "title": "Purchase Snapshot",
    "name": "本次购买内容",
    "subtitle": "Product + SKU + Suit Version",
    "definition": "本次购买内容是订单保存的一份购买清单，记住商品、售卖规格，以及用户买到的权益或额度。之后发放时就按这份清单执行。",
    "example": "会员订单记住买到哪个权益版本、会员周期多久；额度订单记住买到哪种额度、数量多少和是否到期。",
    "rules": [
      "会员订单保存当时的权益组合配置。",
      "额度订单保存当时的额度类型、数量和有效期。",
      "后续后台修改和发布不会改写这份购买内容。"
    ],
    "links": [
      [
        "查看订单购买内容",
        "orders"
      ]
    ]
  },
  "fulfillment": {
    "title": "Fulfillment",
    "name": "支付后的权益发放",
    "subtitle": "按已支付快照发放",
    "definition": "用户支付成功后，系统把订单中约定的内容交付给用户：开通相应访问权，或者发放额度。这个过程叫履约。",
    "example": "会员订单支付成功后，系统开通对应周期的会员权益，再按已购规则发放额度。额度包订单只发放购买的额度。",
    "rules": [
      "发放内容以已支付订单为准。",
      "发放失败可以重试，重试不会再次付款，也不会重复发放已经到账的部分。"
    ],
    "links": [
      [
        "订单发放状态",
        "orders"
      ]
    ]
  },
  "access_grant": {
    "title": "Access Grant",
    "name": "用户已获得的访问权",
    "subtitle": "用户 + Suit 版本 + 有效周期",
    "definition": "这条记录说明某个用户获得了哪一版权益，以及从什么时候到什么时候有效。系统据此判断用户当前能访问哪些内容和功能。",
    "example": "用户购买一个月会员后，会获得一条对应权益版本的授权记录，记录这次会员的开始和结束时间。",
    "rules": [
      "后台发布新版本不会覆盖这条已获得的授权。",
      "会员到期后，新操作按用户当时仍有效的权限判断。",
      "已独立兑换的内容和已保存的对话、报告、计划，不会因为新价格再次收费。"
    ],
    "links": [
      [
        "用户授权与版本",
        "users"
      ]
    ]
  },
  "credit_type": {
    "title": "Credit Type",
    "name": "额度类型",
    "subtitle": "额度资产类型",
    "definition": "额度类型区分不同用途的额度，例如 AI 教练额度、真人教练额度、内容额度。系统分别保存每种类型的余额。",
    "example": "AI 教练额度不足时，不能拿真人教练额度来抵扣。即使两种额度都在同一个用户名下，也分别计算。",
    "rules": [
      "不同类型不能混用，也不自动兑换。",
      "定义一种额度类型，不代表对应服务已经上线或扣费标准已经确定。",
      "旧通用额度继续保留，不复制成多份新类型余额。"
    ],
    "links": [
      [
        "权益目录中的额度类型",
        "catalog"
      ]
    ]
  },
  "credit_grant": {
    "title": "Credit Grant",
    "name": "一次额度发放",
    "subtitle": "类型 · 来源 · 数量 · 到期",
    "definition": "每实际发放一次额度，就保存一笔记录，记清额度类型、数量、来源、到账时间和到期时间。同一用户可以有多笔发放记录。",
    "example": "本月会员赠送的 AI 教练额度是一笔，自购 AI 教练额度是另一笔。两笔可以汇入同类型余额，但各自的来源和期限保留。",
    "rules": [
      "会员赠送、购买、活动和补偿分别记录来源。",
      "新一轮会员发放不会清掉自购余额。",
      "同一次发放失败后重试，不能让同一笔额度到账两次。"
    ],
    "links": [
      [
        "用户钱包与发放记录",
        "users"
      ],
      [
        "活动与补偿",
        "campaigns"
      ]
    ]
  },
  "wallet": {
    "title": "Credit Wallet",
    "name": "额度钱包",
    "subtitle": "按用户与类型分别核算",
    "definition": "额度钱包让系统知道用户某一种额度现在还剩多少。它汇总这一类型的各笔有效额度，同时保留每笔额度的来源和到期时间。",
    "example": "用户有会员赠送和自购的 AI 教练额度，钱包显示这两笔当前可用额度的合计；真人教练额度另算。",
    "rules": [
      "消费时只使用对应类型的余额。",
      "有到期时间的额度优先使用，最早到期的先扣，无到期时间的最后扣。",
      "已过期的额度或已被其他请求占用的额度，不计入当前可用余额。"
    ],
    "links": [
      [
        "用户钱包",
        "users"
      ]
    ]
  },
  "transaction": {
    "title": "Credit Transaction",
    "name": "额度变动记录",
    "subtitle": "Grant / Consume / Refund / Expire",
    "definition": "额度变动记录说明余额为什么增加或减少，包括发放、消费、退回和到期。后台可以据此追查每一次变化。",
    "example": "用户使用一项服务扣除额度后，后台记录这次消费，以及它扣了哪几笔发放的额度。",
    "rules": [
      "每笔变化都要能查到原因和对应额度，重试不能重复记账或重复扣款。",
      "能在后台记录额度退回，不代表已经确定用户取消服务时的退款政策。",
      "是否把新类型额度明细展示给用户，仍待确定。"
    ],
    "links": [
      [
        "后台额度变动查询",
        "ledger"
      ]
    ]
  },
  "membership_source": {
    "title": "Membership Grant",
    "name": "会员赠送额度",
    "subtitle": "来自已购权益组合",
    "definition": "会员赠送额度来自用户购买的权益组合。系统按照用户买到的版本，在约定时间发放指定数量的额度。",
    "example": "权益组合约定按月赠送 AI 教练额度，系统每月新增一笔赠送记录，并为这笔额度记录到期时间。",
    "rules": [
      "发什么额度、发多少、何时发，以用户已购版本为准。",
      "每月新增一笔，不清空用户另行购买的余额。",
      "每笔额度按自己的有效期到期。"
    ],
    "links": [
      [
        "会员额度发放配置",
        "suits"
      ]
    ]
  },
  "purchase_source": {
    "title": "Purchase Grant",
    "name": "用户自购额度",
    "subtitle": "来自独立额度商品",
    "definition": "用户自购额度来自单独购买的额度商品。支付成功后，购买的数量进入对应类型的钱包。",
    "example": "用户购买 AI 教练额度包后，新增一笔自购额度；会员结束后，这笔新自购额度仍然保留。",
    "rules": [
      "新自购额度没有到期时间。",
      "购买额度只增加余额，不开通会员或额外功能。"
    ],
    "links": [
      [
        "额度商品",
        "products"
      ]
    ]
  },
  "campaign_source": {
    "title": "Campaign / Compensation",
    "name": "活动或补偿额度",
    "subtitle": "活动与补偿独立发放",
    "definition": "后台可以通过活动或补偿给用户发放额度。每次发放都指定类型、数量和有效期，并记录活动或补偿来源。",
    "example": "运营通过活动赠送 AI 教练额度，用户钱包新增一笔活动额度；后续可以查到它来自哪次活动。",
    "rules": [
      "活动、补偿、自购和会员额度分别保留来源与有效期。",
      "附加内容和功能与 Base 取并集；附加额度按规则独立发放。"
    ],
    "links": [
      [
        "活动与补偿",
        "campaigns"
      ]
    ]
  },
  "service": {
    "title": "Service Trigger",
    "name": "用户发起一次服务",
    "subtitle": "一次用户服务请求",
    "definition": "用户发起 AI 对话或计划讨论，按一个 User Turn 使用 AI Coach Credits；内部工具和模型调用不重复计费。功能型洞察与计划激活只检查访问权。",
    "example": "生成训练 AI 洞察不扣 Credits；向 AI Coach 发送问题按已配置的每 User Turn 数量预留。",
    "rules": [
      "AI 请求先预留，成功结算一次，实际失败释放原批次额度。",
      "不同 Credit Type 不互相补足。",
      "每次具体消耗数量未定；配置为空时不创建报价、不预留。"
    ],
    "links": [
      [
        "服务配置",
        "pricing"
      ]
    ]
  },
  "consume_policy": {
    "title": "Consumption Policy",
    "name": "服务扣费规则",
    "subtitle": "类型与单位已确认 · 具体金额待定",
    "status": "open",
    "definition": "AI 开放对话按 User Turn 消耗 AI Coach Credits；内容兑换确认成功消耗 Content Credits 并永久解锁。具体数量和价格尚未定稿。",
    "example": "一个用户请求只结算一次，不因内部多次调用增加收费。功能洞察使用权限授权，不走 Credits。",
    "rules": [
      "单次具体金额是 Open，本地示例金额明确标记为评审参数。",
      "实际失败释放预留；用户主动取消、部分成功的退款仍待定义。",
      "无消耗配置时不能生成报价或扣除额度。"
    ],
    "links": [
      [
        "旧原型的示例服务价格",
        "pricing"
      ]
    ]
  },
  "allocation": {
    "title": "Priority Consume",
    "name": "额度扣除顺序",
    "subtitle": "同类型 · 先到期 · 无期限最后",
    "definition": "确定一次服务需要扣哪种额度、扣多少后，系统在这一类型的余额里，优先扣即将到期的额度。",
    "example": "AI 教练钱包同时有本月到期的会员额度和永久有效的自购额度，先扣会员额度，用完后再扣自购额度。",
    "rules": [
      "有到期时间的额度，按最早到期的顺序扣；无到期时间的最后扣。",
      "对应类型余额不足时，不能借用其他类型或旧通用额度。",
      "同一次消费不能重复扣除，余额不能扣成负数。"
    ],
    "links": [
      [
        "钱包与额度变动记录",
        "users"
      ]
    ]
  },
  "legacy": {
    "title": "Historical Snapshot",
    "name": "历史购买与余额",
    "subtitle": "旧已购版本与旧通用额度",
    "status": "legacy",
    "definition": "切换新权益模型前，用户已经买到的权益和已有余额继续按原规则保留。新模型不会改写这些历史购买。",
    "example": "原有通用额度保留数量与期限，不转换成 AI Coach 或 Content 两份余额；旧订单不追随新配置。",
    "rules": [
      "旧订单、旧授权和旧额度，保留各自原来的规则与期限。",
      "旧记录中可能仍出现 ALL 或使用次数，它们只用于解释旧购买。"
    ],
    "links": [
      [
        "历史订单",
        "orders"
      ],
      [
        "历史授权与余额",
        "users"
      ]
    ]
  },
  "new_version": {
    "title": "New Typed Version",
    "name": "按新模型发布的权益",
    "subtitle": "新配置按三类模型发布",
    "definition": "后台后续配置的权益组合，按内容访问、功能使用和额度发放三类分别填写。发布后形成新的权益版本。",
    "example": "更新权益组合时，课程选具体范围、动态计划直接加入、AI 教练额度单独填写发放规则，再发布供后续购买使用。",
    "rules": [
      "新配置不再让所有权益统一填写范围和次数。",
      "草稿可以调整，正式发布后供后续购买和新授权使用。",
      "已购周期仍执行用户当时买到的版本。"
    ],
    "links": [
      [
        "套餐升级预览",
        "suits"
      ]
    ]
  },
  "saved_asset": {
    "title": "Saved Assets",
    "name": "用户已有的结果",
    "subtitle": "已有对话 · 报告 · 计划",
    "definition": "用户已有的结果包括已经生成并保存的对话、报告和计划。用户再次打开它们，是读取已有内容，不是重新生成。",
    "example": "用户打开上周已经生成的周报，仍可以阅读，不会因为这次打开再扣一笔额度。",
    "rules": [
      "读取不重复收费，历史已购资产保留原合同。",
      "新版 AI 洞察读取仍检查功能权限；基础周报和训练数据保持免费。",
      "内容永久解锁与会员期限独立。"
    ],
    "links": [
      [
        "用户保存的结果",
        "users"
      ]
    ]
  },
  "additional_merge": {
    "title": "Additional Merge",
    "name": "多份权益如何叠加",
    "subtitle": "访问权并集已确认 · 细则待定",
    "status": "open",
    "definition": "用户的 Base 与 Additional 内容访问权、功能权限取并集。各来源 Credits 独立发放和记账，更细的冲突与合并规则仍待定义。",
    "example": "会员拥有课程权限，活动再赠送周报 AI 洞察；两项可同时生效，活动额度另建批次。",
    "rules": [
      "内容与功能授权取并集，不覆盖 Base。",
      "额度按来源独立处理；更细合并细则保持 Open。"
    ],
    "links": [
      [
        "权益组合配置",
        "suits"
      ]
    ]
  },
  "refund_policy": {
    "title": "User Cancellation Refund",
    "name": "主动取消是否退回额度",
    "subtitle": "用户主动取消是否退还",
    "status": "open",
    "definition": "用户主动取消一次服务后，是否退回已经扣除的额度，以及退回额度是否保留原有效期，目前尚未确定。",
    "example": "如果一次服务已经扣了额度，用户随后主动取消，这次是否退还，需要按之后确认的规则处理。",
    "rules": [
      "需要明确什么情况下可以退回，以及退回数量和有效期。",
      "后台可以记账退回额度，不代表用户主动取消就一定退款。"
    ]
  },
  "removal_policy": {
    "title": "Redeemed Content Removal",
    "name": "已兑换内容下架怎么办",
    "subtitle": "已兑换内容下架处理",
    "status": "open",
    "definition": "用户已经用额度兑换了内容，之后这条内容下架，用户还能否访问、是否替换或补偿，目前尚未确定。",
    "example": "用户已兑换一门课程，课程后来下架，这位用户应该保留访问权还是获得补偿，需要先评审确定。",
    "rules": [
      "需要明确下架后的访问、替换和补偿方式。",
      "原型已有的演示处理方式，不自动作为正式业务规则。"
    ]
  },
  "user_transactions": {
    "title": "User Credit Activity",
    "name": "是否向用户展示额度明细",
    "subtitle": "新类型流水是否对用户展示",
    "status": "open",
    "definition": "后台需要记录额度的每一次变化；用户是否也能在应用中查看新类型额度的发放、消费和到期明细，目前尚未确定。",
    "example": "用户是否可以打开一个页面，查看自己的 AI 教练额度来自哪里、用在了哪次服务上，需要评审决定。",
    "rules": [
      "需要明确是否展示，以及展示哪些信息。",
      "目前不新增新类型的用户明细入口；原有旧通用额度入口继续保留。"
    ]
  },
  "upgrade_policy": {
    "title": "Upgrade Settlement",
    "name": "即时升级结算",
    "subtitle": "新周期已确认 · 结算金额待定",
    "status": "open",
    "definition": "升级立即生效并开启新周期。剩余价值如何抵扣、实际应付金额如何计算仍待定义，因此原型暂不执行升级付款。",
    "example": "已有月度会员切换年度套餐时，显示结算规则待定，原订阅继续有效，不生成错误订单。",
    "rules": [
      "新周期和即时生效已确认。",
      "抵扣、应付金额与结算细则确认后才能支付。"
    ],
    "links": [
      [
        "商品配置",
        "products"
      ]
    ]
  }
}
const topics=[
  {
    "id": "types",
    "name": "权益类型",
    "title": "三类权益，各自表达一种业务语义",
    "description": "Entitlement 定义能获得什么；访问权控制持续能力，Credits 管理可消费资产。",
    "width": 940,
    "height": 500,
    "initial": "entitlement",
    "nodes": [
      {
        "id": "entitlement",
        "entity": "entitlement",
        "x": 360,
        "y": 72,
        "width": 220,
        "height": 84
      },
      {
        "id": "content_access",
        "entity": "content_access",
        "x": 40,
        "y": 218,
        "width": 220,
        "height": 84
      },
      {
        "id": "feature_access",
        "entity": "feature_access",
        "x": 360,
        "y": 218,
        "width": 220,
        "height": 84
      },
      {
        "id": "consumable_credits",
        "entity": "consumable_credits",
        "x": 680,
        "y": 218,
        "width": 220,
        "height": 84
      },
      {
        "id": "content_scope",
        "entity": "content_scope",
        "x": 40,
        "y": 364,
        "width": 220,
        "height": 84
      },
      {
        "id": "access_rights",
        "entity": "access_rights",
        "x": 360,
        "y": 364,
        "width": 220,
        "height": 84,
        "subtitle": "功能加入即授权"
      },
      {
        "id": "wallet",
        "entity": "wallet",
        "x": 680,
        "y": 364,
        "width": 220,
        "height": 84
      }
    ],
    "edges": [
      {
        "from": "entitlement",
        "to": "content_access",
        "label": "类型"
      },
      {
        "from": "entitlement",
        "to": "feature_access",
        "label": "类型"
      },
      {
        "from": "entitlement",
        "to": "consumable_credits",
        "label": "类型"
      },
      {
        "from": "content_access",
        "to": "content_scope",
        "label": "选择范围"
      },
      {
        "from": "feature_access",
        "to": "access_rights",
        "label": "持续访问权"
      },
      {
        "from": "consumable_credits",
        "to": "wallet",
        "label": "独立资产"
      }
    ],
    "relations": [
      [
        "Content Access",
        "Content Scope",
        "多选明确范围"
      ],
      [
        "Feature Access",
        "功能访问权",
        "加入 Item 即授权"
      ],
      [
        "Consumable Credits",
        "Credit Wallet",
        "按类型管理消费资产"
      ]
    ],
    "takeaway": "5 项内容权益、3 项功能权益和 2 种额度分别配置；功能不消耗 Credits。"
  },
  {
    "id": "relations",
    "name": "权益关系",
    "title": "从定义与组合，到购买后的用户权益",
    "description": "箭头表示配置引用或交付关系；用户获得的是已购版本和独立资产。",
    "width": 1260,
    "height": 580,
    "initial": "suit",
    "nodes": [
      {
        "id": "entitlement",
        "entity": "entitlement",
        "x": 40,
        "y": 90,
        "width": 220,
        "height": 84
      },
      {
        "id": "suit",
        "entity": "suit",
        "x": 350,
        "y": 90,
        "width": 220,
        "height": 84
      },
      {
        "id": "product",
        "entity": "product",
        "x": 660,
        "y": 90,
        "width": 220,
        "height": 84
      },
      {
        "id": "sku",
        "entity": "sku",
        "x": 970,
        "y": 90,
        "width": 220,
        "height": 84
      },
      {
        "id": "credit_type",
        "entity": "credit_type",
        "x": 40,
        "y": 290,
        "width": 220,
        "height": 84
      },
      {
        "id": "grant_rule",
        "entity": "grant_rule",
        "x": 350,
        "y": 290,
        "width": 220,
        "height": 84
      },
      {
        "id": "order",
        "entity": "order",
        "x": 660,
        "y": 290,
        "width": 220,
        "height": 84
      },
      {
        "id": "purchase_snapshot",
        "entity": "purchase_snapshot",
        "x": 970,
        "y": 290,
        "width": 220,
        "height": 84
      },
      {
        "id": "wallet",
        "entity": "wallet",
        "x": 40,
        "y": 440,
        "width": 220,
        "height": 84
      },
      {
        "id": "credit_grant",
        "entity": "credit_grant",
        "x": 350,
        "y": 440,
        "width": 220,
        "height": 84
      },
      {
        "id": "access_grant",
        "entity": "access_grant",
        "x": 660,
        "y": 440,
        "width": 220,
        "height": 84
      }
    ],
    "edges": [
      {
        "from": "entitlement",
        "to": "suit",
        "label": "按类型组合"
      },
      {
        "from": "suit",
        "to": "product",
        "label": "会员商品引用"
      },
      {
        "from": "product",
        "to": "sku",
        "label": "一个商品，多 SKU"
      },
      {
        "from": "suit",
        "to": "grant_rule",
        "label": "发放规则"
      },
      {
        "from": "sku",
        "to": "purchase_snapshot",
        "label": "确认的规格"
      },
      {
        "from": "product",
        "to": "order",
        "label": "购买"
      },
      {
        "from": "order",
        "to": "purchase_snapshot",
        "label": "锁定本次购买"
      },
      {
        "from": "order",
        "to": "access_grant",
        "label": "会员履约"
      },
      {
        "from": "grant_rule",
        "to": "credit_grant",
        "label": "按规则发放"
      },
      {
        "from": "credit_type",
        "to": "wallet",
        "label": "资产类型"
      },
      {
        "from": "credit_grant",
        "to": "wallet",
        "label": "归属同类型账户",
        "reverse": true
      }
    ],
    "relations": [
      [
        "Entitlement Item ↔ Suit",
        "多对多",
        "通过内容授权 / 功能加入 / 额度规则组合"
      ],
      [
        "Membership Product → Suit",
        "每个会员商品一个 Base Suit",
        "一个 Suit 可被多个商品引用"
      ],
      [
        "Product → SKU",
        "1 : N",
        "SKU 属于一个商品"
      ],
      [
        "Order → 购买快照",
        "1 : 1",
        "一个确认 SKU；会员另含一个 Suit 版本"
      ],
      [
        "Credit Grant → Credit Type",
        "N : 1",
        "一个 Grant 只对应一个类型"
      ],
      [
        "用户 + Credit Type → Wallet",
        "一个类型一个账户",
        "账户内可以有多个来源批次"
      ]
    ],
    "takeaway": "套餐配置不是用户实时资产；用户授权、额度批次和订单快照分别保存。"
  },
  {
    "id": "composition",
    "name": "权益组合",
    "title": "Suit 组合访问权与额度发放规则",
    "description": "按类型配置，不增加统一 Scope、Quota 或 Access 开关。",
    "width": 940,
    "height": 680,
    "initial": "suit",
    "nodes": [
      {
        "id": "suit",
        "entity": "suit",
        "x": 360,
        "y": 72,
        "width": 220,
        "height": 84
      },
      {
        "id": "content_access",
        "entity": "content_access",
        "x": 40,
        "y": 220,
        "width": 220,
        "height": 84
      },
      {
        "id": "feature_access",
        "entity": "feature_access",
        "x": 360,
        "y": 220,
        "width": 220,
        "height": 84
      },
      {
        "id": "grant_rule",
        "entity": "grant_rule",
        "x": 680,
        "y": 220,
        "width": 220,
        "height": 84
      },
      {
        "id": "content_scope",
        "entity": "content_scope",
        "x": 40,
        "y": 370,
        "width": 220,
        "height": 84
      },
      {
        "id": "access_rights",
        "entity": "access_rights",
        "x": 360,
        "y": 370,
        "width": 220,
        "height": 84,
        "subtitle": "已有功能 Item 的集合"
      },
      {
        "id": "grant_fields",
        "entity": "grant_rule",
        "x": 680,
        "y": 370,
        "width": 220,
        "height": 84,
        "title": "Grant Rule Fields",
        "subtitle": "Type / Amount / Rule / Expiry"
      },
      {
        "id": "suit_version",
        "entity": "suit_version",
        "x": 360,
        "y": 538,
        "width": 220,
        "height": 84
      },
      {
        "id": "additional_merge",
        "entity": "additional_merge",
        "x": 680,
        "y": 538,
        "width": 220,
        "height": 84
      }
    ],
    "edges": [
      {
        "from": "suit",
        "to": "content_access",
        "label": "内容授权"
      },
      {
        "from": "suit",
        "to": "feature_access",
        "label": "功能授权"
      },
      {
        "from": "suit",
        "to": "grant_rule",
        "label": "额度发放"
      },
      {
        "from": "content_access",
        "to": "content_scope",
        "label": "Scope 多选"
      },
      {
        "from": "feature_access",
        "to": "access_rights",
        "label": "加入即拥有"
      },
      {
        "from": "grant_rule",
        "to": "grant_fields",
        "label": "额度发放配置"
      },
      {
        "from": "content_scope",
        "to": "suit_version",
        "label": "内容授权快照"
      },
      {
        "from": "access_rights",
        "to": "suit_version",
        "label": "功能快照"
      },
      {
        "from": "grant_fields",
        "to": "suit_version",
        "label": "额度规则快照"
      },
      {
        "from": "suit_version",
        "to": "additional_merge",
        "label": "Additional 的组合规则",
        "status": "open"
      }
    ],
    "relations": [
      [
        "Content Access",
        "配置 Content Scope",
        "“选择全部”枚举当时的具体范围"
      ],
      [
        "Feature Access",
        "只加入 Item",
        "不配置 Scope 或 Quota"
      ],
      [
        "Consumable Credits",
        "独立 Grant Rule",
        "Monthly 新增发放；到期规则独立"
      ],
      [
        "Base / Additional",
        "访问权取并集",
        "额度独立发放；更细合并规则仍待定"
      ]
    ],
    "takeaway": "Credit Grant Rule 是配置；Wallet 的实时余额由实际发放和消费产生。"
  },
  {
    "id": "content",
    "name": "内容授权",
    "title": "内容的唯一归属，与套餐的多选范围相匹配",
    "description": "内容侧维护分类与归属，套餐选择可以持续访问的范围。",
    "width": 940,
    "height": 500,
    "initial": "content_scope",
    "nodes": [
      {
        "id": "content",
        "entity": "content",
        "x": 40,
        "y": 104,
        "width": 220,
        "height": 84
      },
      {
        "id": "content_scope",
        "entity": "content_scope",
        "x": 360,
        "y": 104,
        "width": 220,
        "height": 84
      },
      {
        "id": "suit",
        "entity": "suit",
        "x": 680,
        "y": 104,
        "width": 220,
        "height": 84
      },
      {
        "id": "access_grant",
        "entity": "access_grant",
        "x": 680,
        "y": 320,
        "width": 220,
        "height": 84
      },
      {
        "id": "content_access",
        "entity": "content_access",
        "x": 360,
        "y": 320,
        "width": 220,
        "height": 84,
        "subtitle": "新 Start / Select 检查范围"
      },
      {
        "id": "saved_asset",
        "entity": "saved_asset",
        "x": 40,
        "y": 320,
        "width": 220,
        "height": 84
      }
    ],
    "edges": [
      {
        "from": "content",
        "to": "content_scope",
        "label": "每个内容一个 Scope"
      },
      {
        "from": "suit",
        "to": "content_scope",
        "label": "一个 Suit 选多个 Scope",
        "reverse": true
      },
      {
        "from": "suit",
        "to": "access_grant",
        "label": "按已购版本授权"
      },
      {
        "from": "access_grant",
        "to": "content_access",
        "label": "匹配具体范围",
        "reverse": true
      }
    ],
    "relations": [
      [
        "Content → Content Scope",
        "N : 1",
        "一个内容只有一个归属"
      ],
      [
        "Suit ↔ Content Scope",
        "多对多",
        "一个套餐可选多个范围"
      ],
      [
        "新增 Scope → 旧 Suit",
        "不自动授权",
        "需要明确配置并发布下一版本"
      ]
    ],
    "takeaway": "Free / Premium 是商业属性；新模型实际访问依据 contentScope，不用标签推断 Scope。"
  },
  {
    "id": "orders",
    "name": "套餐与订单",
    "title": "会员与额度商品，共用订单，分别交付权益",
    "description": "订单锁定本次购买，履约按原快照发放；付款与交付状态分开记录。",
    "width": 1260,
    "height": 600,
    "initial": "order",
    "nodes": [
      {
        "id": "membership_product",
        "entity": "membership_product",
        "x": 40,
        "y": 82,
        "width": 220,
        "height": 84
      },
      {
        "id": "credit_product",
        "entity": "credit_product",
        "x": 40,
        "y": 265,
        "width": 220,
        "height": 84
      },
      {
        "id": "sku",
        "entity": "sku",
        "x": 350,
        "y": 173,
        "width": 220,
        "height": 84
      },
      {
        "id": "order",
        "entity": "order",
        "x": 660,
        "y": 173,
        "width": 220,
        "height": 84
      },
      {
        "id": "purchase_snapshot",
        "entity": "purchase_snapshot",
        "x": 970,
        "y": 173,
        "width": 220,
        "height": 84
      },
      {
        "id": "suit_version",
        "entity": "suit_version",
        "x": 350,
        "y": 405,
        "width": 220,
        "height": 84,
        "title": "Purchased Suit Version",
        "subtitle": "订单引用的不可变版本"
      },
      {
        "id": "fulfillment",
        "entity": "fulfillment",
        "x": 660,
        "y": 405,
        "width": 220,
        "height": 84
      },
      {
        "id": "access_grant",
        "entity": "access_grant",
        "x": 970,
        "y": 365,
        "width": 220,
        "height": 84
      },
      {
        "id": "credit_grant",
        "entity": "credit_grant",
        "x": 970,
        "y": 500,
        "width": 220,
        "height": 84
      }
    ],
    "edges": [
      {
        "from": "membership_product",
        "to": "sku",
        "label": "选择商品规格"
      },
      {
        "from": "credit_product",
        "to": "sku",
        "label": "选择商品规格"
      },
      {
        "from": "sku",
        "to": "order",
        "label": "确认购买"
      },
      {
        "from": "order",
        "to": "purchase_snapshot",
        "label": "价格 / 规格 / 权益快照"
      },
      {
        "from": "order",
        "to": "fulfillment",
        "label": "支付成功后"
      },
      {
        "from": "purchase_snapshot",
        "to": "fulfillment",
        "label": "按已购快照交付",
        "path": "M 1080 257 V 332 H 940 V 447 H 880",
        "labelX": 1010,
        "labelY": 320,
        "labelWidth": 180
      },
      {
        "from": "suit_version",
        "to": "fulfillment",
        "label": "会员：引用已购版本"
      },
      {
        "from": "fulfillment",
        "to": "access_grant",
        "label": "会员：访问权"
      },
      {
        "from": "fulfillment",
        "to": "credit_grant",
        "label": "会员福利或额度购买"
      }
    ],
    "relations": [
      [
        "Membership Product → Suit",
        "一个发布的 Base Suit",
        "交付访问权 + 配置的额度福利"
      ],
      [
        "Credit Product → Credit Grant",
        "一个 Credit Type",
        "只发额度，不开通会员或功能"
      ],
      [
        "Order → Fulfillment",
        "按已支付快照",
        "失败补发和重试不重复付款 / 发放"
      ]
    ],
    "takeaway": "修改商品或 Suit，不会追溯改写已经支付的订单和已购周期。"
  },
  {
    "id": "credits",
    "name": "额度与消费",
    "title": "多来源发放，同类型分配，账务统一追溯",
    "description": "AI 按 User Turn、内容按确认兑换结算；具体金额待定。功能授权不走 Credits。",
    "width": 1260,
    "height": 670,
    "initial": "credit_grant",
    "nodes": [
      {
        "id": "membership_source",
        "entity": "membership_source",
        "x": 40,
        "y": 90,
        "width": 220,
        "height": 84
      },
      {
        "id": "purchase_source",
        "entity": "purchase_source",
        "x": 350,
        "y": 90,
        "width": 220,
        "height": 84
      },
      {
        "id": "campaign_source",
        "entity": "campaign_source",
        "x": 660,
        "y": 90,
        "width": 220,
        "height": 84
      },
      {
        "id": "credit_grant",
        "entity": "credit_grant",
        "x": 350,
        "y": 277,
        "width": 220,
        "height": 84
      },
      {
        "id": "credit_type",
        "entity": "credit_type",
        "x": 40,
        "y": 277,
        "width": 220,
        "height": 84
      },
      {
        "id": "wallet",
        "entity": "wallet",
        "x": 660,
        "y": 277,
        "width": 220,
        "height": 84
      },
      {
        "id": "transaction",
        "entity": "transaction",
        "x": 970,
        "y": 277,
        "width": 220,
        "height": 84
      },
      {
        "id": "service",
        "entity": "service",
        "x": 40,
        "y": 513,
        "width": 220,
        "height": 84
      },
      {
        "id": "consume_policy",
        "entity": "consume_policy",
        "x": 350,
        "y": 513,
        "width": 220,
        "height": 84
      },
      {
        "id": "allocation",
        "entity": "allocation",
        "x": 660,
        "y": 513,
        "width": 220,
        "height": 84
      }
    ],
    "edges": [
      {
        "from": "membership_source",
        "to": "credit_grant",
        "label": "会员福利"
      },
      {
        "from": "purchase_source",
        "to": "credit_grant",
        "label": "独立购买"
      },
      {
        "from": "campaign_source",
        "to": "credit_grant",
        "label": "活动 / 补偿"
      },
      {
        "from": "credit_type",
        "to": "credit_grant",
        "label": "每批一个类型"
      },
      {
        "from": "credit_grant",
        "to": "wallet",
        "label": "多批次余额"
      },
      {
        "from": "wallet",
        "to": "transaction",
        "label": "记录资产变动"
      },
      {
        "from": "service",
        "to": "consume_policy",
        "label": "访问权之外"
      },
      {
        "from": "consume_policy",
        "to": "allocation",
        "label": "规则定义后",
        "status": "open"
      },
      {
        "from": "allocation",
        "to": "wallet",
        "label": "同类型优先分配",
        "reverse": true
      }
    ],
    "relations": [
      [
        "Membership / Purchase / Campaign / Compensation",
        "Credit Grant",
        "保留来源、类型、发放及到期时间"
      ],
      [
        "Credit Grant → Wallet",
        "同类型聚合",
        "不同类型不互付"
      ],
      [
        "会员 Monthly",
        "每月新批次，不结转",
        "原订阅日期与时区；自购永久有效"
      ],
      [
        "Consumption Policy",
        "单位已确认，金额 Open",
        "未配置金额不报价、不预留、不扣款"
      ]
    ],
    "takeaway": "先按 Credit Type 隔离，再按最早到期消费；无到期自购额度最后使用。"
  },
  {
    "id": "versions",
    "name": "版本与待定",
    "title": "已购版本保留，新版本前进，待定项保持可见",
    "description": "已确认规则、历史兼容和未定义决策分别标记，避免评审时混在一起。",
    "width": 1260,
    "height": 650,
    "initial": "legacy",
    "nodes": [
      {
        "id": "legacy",
        "entity": "legacy",
        "x": 40,
        "y": 90,
        "width": 220,
        "height": 84
      },
      {
        "id": "new_version",
        "entity": "new_version",
        "x": 350,
        "y": 90,
        "width": 220,
        "height": 84
      },
      {
        "id": "access_grant",
        "entity": "access_grant",
        "x": 660,
        "y": 90,
        "width": 220,
        "height": 84
      },
      {
        "id": "saved_asset",
        "entity": "saved_asset",
        "x": 970,
        "y": 90,
        "width": 220,
        "height": 84
      },
      {
        "id": "additional_merge",
        "entity": "additional_merge",
        "x": 40,
        "y": 316,
        "width": 220,
        "height": 84
      },
      {
        "id": "consume_policy",
        "entity": "consume_policy",
        "x": 350,
        "y": 316,
        "width": 220,
        "height": 84
      },
      {
        "id": "refund_policy",
        "entity": "refund_policy",
        "x": 660,
        "y": 316,
        "width": 220,
        "height": 84
      },
      {
        "id": "removal_policy",
        "entity": "removal_policy",
        "x": 970,
        "y": 316,
        "width": 220,
        "height": 84
      },
      {
        "id": "user_transactions",
        "entity": "user_transactions",
        "x": 350,
        "y": 518,
        "width": 220,
        "height": 84
      },
      {
        "id": "upgrade_policy",
        "entity": "upgrade_policy",
        "x": 660,
        "y": 518,
        "width": 220,
        "height": 84
      }
    ],
    "edges": [
      {
        "from": "new_version",
        "to": "access_grant",
        "label": "仅后续购买 / 新授权"
      },
      {
        "from": "access_grant",
        "to": "saved_asset",
        "label": "原资产独立保留"
      },
      {
        "from": "consume_policy",
        "to": "user_transactions",
        "label": "计费与用户展示分开",
        "status": "open"
      }
    ],
    "relations": [
      [
        "历史订单 / 授权 / 批次",
        "保留原样",
        "不复制余额、不延长旧有效期"
      ],
      [
        "新配置发布",
        "下一版本",
        "旧购买周期不追随新编辑"
      ],
      [
        "Open 决策",
        "不擅自补规则",
        "图形标记与运行时阻断一致"
      ]
    ],
    "takeaway": "后台具备内部账务能力，不代表服务单位、取消退款或用户流水展示已经确认。"
  }
]
const openItems=[
  {
    "id": "OPEN-01",
    "entity": "additional_merge",
    "name": "Additional Suit Merge Rule",
    "boundary": "访问权并集已确认；更细重叠与冲突细则待定。"
  },
  {
    "id": "OPEN-02",
    "entity": "consume_policy",
    "name": "单次消耗与正式定价",
    "boundary": "类型和 User Turn 已明确；具体数量、价格和会员赠送数量待定。"
  },
  {
    "id": "OPEN-03",
    "entity": "refund_policy",
    "name": "主动取消服务是否退款",
    "boundary": "不能从内部 Refund 能力推导自动退款。"
  },
  {
    "id": "OPEN-04",
    "entity": "removal_policy",
    "name": "已兑换内容下架处理",
    "boundary": "访问、替换、补偿处理待定。"
  },
  {
    "id": "OPEN-05",
    "entity": "user_transactions",
    "name": "用户侧 Credit Transaction",
    "boundary": "后台追溯必需，用户展示尚未决定。"
  },
  {
    "id": "OPEN-06",
    "entity": "upgrade_policy",
    "name": "即时升级结算",
    "boundary": "即时生效、新周期已确认；剩余价值抵扣与应付金额待定，不执行付款。"
  }
]
module.exports={entities,topics,openItems}
