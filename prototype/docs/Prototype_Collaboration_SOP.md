# SunnyFit 原型协作与迭代 SOP

原型继续采用左侧导航、中间交互页面、右侧说明。运营从页面上的文案区块进入编辑或评论；团队版本以协作服务的数据库为准。原型中模拟的会员、购买和训练数据仍属于演示环境，不进入协作数据库。

## 运营使用

1. 打开维护者分享的协作链接。编辑链接可修改文案和评论。评论默认对所有访问者开放，普通预览链接也可查看、提交评论；普通链接不显示「编辑文案」或修改历史。
2. 右键点击文案区块，再选择「编辑文案」或「备注/评论」。菜单打开后保持固定，点击菜单外或按 Esc 关闭。左键继续进行原型交互；触屏和键盘用户可使用「选择区块」。右侧只列出这个区块在当前状态下对应的字段。
3. 填写显示名称，修改文案并查看中间预览。名称由协作者自行填写，用于记录，不代表已核验的个人身份。同一链接内的人员拥有相同权限；需要分别撤销人员权限时，应分别发放链接。
4. 点击「保存此区块」后，文案立即成为团队的生效版本。其他浏览器重新打开页面时读取该版本，已打开的页面在无草稿时每 20 秒刷新。
5. 若提示已有新版本，当前草稿会保留，不能直接覆盖。复制需要保留的草稿，再选择「载入最新版本」并重新修改。
6. 「备注/评论」记录选中区块、页面和页面/组件状态。提交后其他协作者可查看。编辑者可标记解决；普通访问者可提交和查看。评论每条最多 2000 字符，服务端按分钟限制提交频率。
7. 「版本记录」可预览历史文案。恢复后仍需保存，生成一个新版本；原历史不删除。切换页面或刷新前，未保存的修改会触发提示。

已打开的编辑链接会转为当前标签页的临时凭证并从地址栏移除。向别人授权时请转发维护者提供的原始协作链接。不要将编辑链接放入 Git、公开文档、截图或监控日志。

文案按字段编辑、按区块保存和记录版本。标题、说明、CTA 按钮分别是字段；多句说明仍属于同一个字段。右侧只显示选中区块在当前状态下对应的字段。同一字段被多处引用时，修改会同步生效。

### 课程、World Tour 与 Program 的流程文案

右键详情页底部的开始按钮，默认只显示该按钮当前使用的一个字段。无试用与有试用分别编辑；留空时，编辑器会展示沿用的通用文案与最终显示效果。`{days}` 在场景预览中用 30 天代入，实际产品仍由已核验的活动资格与方案控制；活动自身配置了入口 CTA 时，该活动文案优先，页面不会把它误标为可编辑的详情字段。

通过编辑器的「文案展示位置」切换关联场景：详情入口、快速付费墙、订阅/试用按钮、完整权益介绍、订阅完成、付款取消。右侧会说明触发条件并只列出对应字段，中间同步使用真实页面组件展示效果。「在原型中定位」可滚动到并标出具体文字。完整权益页的原任务提示复用于顶部与底部；取消返回按钮也用于付款失败，关闭普通付费墙不显示该按钮。

场景切换保留整个区块的草稿，面板会提醒其他位置还有几处未保存修改。「保存此区块」统一生成一个版本；「返回原交互」恢复编辑前的交互状态，草稿仍保留。预览购买或继续只切换展示状态，不更改地址、会员权益、额度、订单或训练记录。版本预览只恢复右侧当前列出的字段，其他位置的草稿不变。

## 源码维护约定

| 文件 | 职责 |
| --- | --- |
| `config/operations-copy.json` | 首次读取与断网时的内置默认文案 |
| `config/operations-copy.fields.json` | 字段名称、长度、变量与继承规则 |
| `config/copy-blocks.json` | 持久区块 ID 与字段归属；维护者手动管理 |
| `scripts/prepare-collaboration.cjs` | 验证字段归属，生成前后端共用的注册表 |
| `src/copy/operations-copy.js` | 共享读取、区块草稿、授权与保存 |
| `src/copy/copy-locations.cjs` | 展示位置、触发条件、可见字段与继承显示 |
| `src/views/app/review/copy-flow-preview.js` | 不产生业务写入的流程场景预览适配器 |
| `src/views/app/review/CopyContextMenu.vue` | 脱离手机缩放容器的右键菜单 |
| `src/views/app/review/OperationsCopyEditor.vue` | 当前区块编辑、评论与版本记录 |
| `collaboration-service/core/service.mjs` | 本地 SQLite / 云端 D1 共用的业务协议 |
| `collaboration-service/db/schema.ts` 和 `drizzle/` | 云端数据库结构与追加式迁移 |

区块 ID 与字段 key 是数据关联契约，不随组件改名、排序、视觉重排而变化。一个字段只能归属一个区块。同一个 CTA 在多处出现时继续使用同一归属。改版废弃字段时先保留契约并停止渲染；不要复用旧 ID 表示另一个功能。数据库中的历史与评论不会因前端删除节点而消失。

页面通过 `v-copy-block` 显式声明区块，不能通过文字匹配、CSS 路径或节点顺序自动定位。示例：

```vue
<section v-copy-block="{id:'membership.discovery', fields:['membership.preview.title','membership.preview.description']}">
  <h2>{{ $copy('membership.preview.title') }}</h2>
  <p>{{ $copy('membership.preview.description') }}</p>
</section>
```

新增文案时同时登记默认值、字段校验与区块归属，运行 `node scripts/prepare-collaboration.cjs`。生成的两个注册表应随同源码提交，不手工修改。新增页面备注只需登记一个 `fields: []` 的区块。新增字段时提升 `registryVersion`，先发布兼容旧客户端的服务，再发布前端。

`v-copy-block` 的 `fields` 必须只列出该节点当前状态实际展示的字段；流程结果文案应挂在结果组件，不应挂在详情开始按钮。需跨场景预览时，在 `copy-locations.cjs` 注册真实位置，并在实际文字节点声明 `data-copy-key`。为新业务添加预览适配前不得复用不相符的内容流程；适配器禁止调用购买、发送消息、激活计划和开始训练的方法。维护浏览器检查须逐字段验证存在实际可见目标，并验证切换场景不改路由和业务数据。

内置默认值只补足数据库中尚未编辑的字段。构建不会读取历史浏览器文件，也不会把新默认值写回数据库。以前 localStorage / OPFS 的运营文案不再自动载入；需要迁移时人工核对并通过正常区块保存，避免旧稿覆盖团队版本。

## 本地开发与验证

本地协作数据库独立于商业化演示数据库。设置 `COLLAB_DB_PATH`、`COLLAB_ADMIN_KEY` 与 `COLLAB_ALLOWED_ORIGINS` 后启动 `npm start`。管理员密钥必须由进程环境注入，不写入仓库。未设置密钥时管理接口关闭，不能凭 URL 标志自行获得编辑权限。

```text
npm ci
npm test
npm run build
npm run test:collaboration
npm run test:review
npm run test:paywall
npm run test:prototype-flow
```

协作浏览器检查自动使用独立数据库和临时授权链接，覆盖普通浏览、编辑/评论权限、跨浏览器保存、冲突、历史、模态页面、窄屏和撤销。测试不写团队数据库。证据存于 `runtime/collaboration-browser-*/results.json`，只分享经过检查且不含授权链接的结果或截图。

云端服务使用自己的锁文件安装依赖，并运行：

```text
node node_modules/typescript/bin/tsc --noEmit
node scripts/test-d1.mjs
node scripts/run-framework.mjs build
```

上述命令在 `collaboration-service/` 执行。D1 检查使用 Miniflare 临时数据库，验证实际 SQL 迁移、原子保存、审计和评论。Windows 若 Sites 外层 npm shim 无法找到 npm，可直接运行项目的 Node 构建入口；不要因此修改系统 npm 或跳过数据库检查。

## 链接与服务管理

托管目标为 Sites 的 D1 数据库；项目身份保存在 `collaboration-service/.openai/hosting.json`，后续迭代复用该项目，不能重新创建数据库。通过 Sites 的运行时环境管理保存 `COLLAB_ADMIN_KEY`（secret）和 `COLLAB_ALLOWED_ORIGINS`，前端仅保存非敏感的 `public/config/collaboration.json.apiBase`。

管理员通过 `scripts/collaboration-links.mjs` 的 stdin 输入 JSON 创建、列出或撤销链接。密钥不能放在命令行参数。创建示例输入结构：

```json
{
  "action": "create",
  "apiBase": "https://YOUR-SERVICE/api/collaboration",
  "adminKey": "从密钥管理器读取，不提交此值",
  "label": "运营姓名或评审组",
  "role": "editor",
  "days": 30,
  "scopes": ["membership.discovery", "profile.membership"],
  "previewUrl": "https://hjay7512-jpg.github.io/SunnyFit-3.0-prd/prototype/#/app/profile?review=1"
}
```

`role` 可为 `editor` / `reviewer`，`scopes: ["*"]` 表示全部区块，有效期 1–90 天。输出的原始链接只交给指定协作者。撤销使用 `action: "revoke"` 与链接 `id`；列出使用 `action: "list"`。数据库仅保存令牌哈希，不提供原始令牌找回；遗失时撤销并新建。

普通预览需要匿名读取生效文案，因此协作 API 需要可从现有 GitHub Pages 访问的服务入口。文案修改、修改历史、解决评论和管理接口逐请求校验授权；查看和提交评论默认开放。CORS 只允许登记的原型来源；它不替代权限校验。

## 发布与回滚

1. 修改前记录当前前端 commit、服务版本及数据库迁移版本。环境变更先在独立测试数据库验证；不使用测试脚本探测或改写团队记录。
2. 数据库结构变更先改 `db/schema.ts`，运行 `npm run db:generate`，检查生成 SQL 与元数据。已执行的迁移不可修改，后续变更追加迁移。迁移只改结构，不重置运营值，不在请求中建表。
3. 完成前述单测、D1 和浏览器验证。对照正常预览、评审链接、编辑链接确认权限和显示；检查旧写接口仍返回 410。
4. 按本会话 AGENTS 约定取得生产发布批准后，先发布兼容服务及迁移，核对健康接口。再配置前端 API 地址、构建并发布 GitHub Pages。前端部署不包含数据库文件、密钥、授权链接或评论数据。
5. 核对线上 `deployment.json.sourceCommit` 与目标 commit 相同，再由两位授权协作者验证读取、评论和一处已获准的文案修改。不要在团队数据库批量写入测试文案。
   `node scripts/collaboration-online-check.cjs` 从隐藏 stdin 接收 `{"editorUrl":"授权编辑链接"}`，自动检查公开评论、编辑权限、修改历史和可还原的文案预览；它不提交评论或文案，不把授权链接写入证据。
6. 前端回滚恢复上一 commit 的构建；服务回滚选择兼容现有迁移的上一版本，不回退或删除已应用的数据库结构。文案回滚从版本面板预览并保存为新版本。数据恢复前先备份现状并单独批准，不能用重新发布前端代替数据恢复。

本次交付的发布状态、服务版本和线上复核结果应保存在相邻交付记录中；上线前不能将本地通过写成云端已生效。
