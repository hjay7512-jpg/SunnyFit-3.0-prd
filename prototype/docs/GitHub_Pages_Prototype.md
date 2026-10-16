# GitHub 原型访问与迭代

当前原型独立保存在仓库的 `prototype/` 目录中。仓库根目录已有的 HTML 页面和视频保持原文件，自动发布时一起保留。

## 在线入口

- [前台原型](https://hjay7512-jpg.github.io/SunnyFit-3.0-prd/prototype/#/app/home?user=DEMO-2002&review=1)
- [后台原型](https://hjay7512-jpg.github.io/SunnyFit-3.0-prd/prototype/#/commercialization/overview)
- [业务定义与关系图](https://hjay7512-jpg.github.io/SunnyFit-3.0-prd/prototype/#/business-rules?module=overview&topic=relations&node=entitlement)
- [组件与设计来源](https://hjay7512-jpg.github.io/SunnyFit-3.0-prd/prototype/#/demo/lab?tab=components)
- [A/B 场景实验](https://hjay7512-jpg.github.io/SunnyFit-3.0-prd/prototype/#/demo/lab)

## 数据和交互

线上原型通过浏览器 SQLite 运行 `server/` 中同一套业务代码和 API 分派，保留权益配置、版本发布、商品与订单、会员和 Credits、服务消费与内容兑换交互。页面数据不是静态截图。

演示数据保存在访问者自己的浏览器 IndexedDB 中，刷新后保留；同一浏览器的多个标签页通过 Web Locks 串行更新，读取同一份快照。不同浏览器或不同评审者各自拥有独立数据。页顶的“重置演示”可以恢复初始场景，需确认后才清除当前浏览器中的原型改动。不会读取或上传本地 `runtime/` 中的数据库。

价格、赠送数量和示例消费费率继续使用评审参数；原有 Open 规则保留。购买和服务操作均为模拟业务，不进行真实支付。

本地 Node/SQLite 服务继续使用原 HTTP API，运行方式不变。

## 持续迭代

在仓库的 `prototype/` 中修改代码并推送到 `main` 后，GitHub Actions 会运行业务测试、构建浏览器版本、保留原有页面并发布 GitHub Pages。发布日志在仓库的 Actions 页面查看。

```sh
cd prototype
npm ci
npm test
npm run build:pages
```

浏览器部署验证在 Windows 已安装 Edge 的环境中运行 `npm run test:pages`。验证覆盖服务结算与失败释放、购买幂等、永久兑换、草稿发布和错误回滚、刷新保留、多标签页并发、页面与资源加载、手机屏幕适配和重置。

GitHub Pages 静态产物来自 `pages-dist/`；其中的 SQLite 运行库由构建脚本生成，不手工维护。`DEMO_PUBLIC_PATH` 控制部署子目录。发布工作流位于仓库根目录 `.github/workflows/deploy-pages.yml`。
