# SunnyFit Figma 读取连接恢复

2026-10-12：原稿读取已恢复，通过官方 Figma 桌面 MCP 成功读取用户指定的 Alpha 商业化画布与其个人中心、会员用量子页面。

## 诊断与处理

原托管插件先返回需要重新认证，重新授权后仍在插件工具分发层返回 Unknown tool。插件管理显示 Figma 已安装且启用。这不足以判断账号限额耗尽，也不能据此判定用户重新授权失败。托管插件本身的工具分发问题尚未解决。

当前 CLI 使用 `C:\Users\Administrator\.codex-account-B`，此前没有独立 MCP 配置。本机 Figma 桌面已在 `http://127.0.0.1:3845/mcp` 提供官方 MCP 服务，但当前标签不是 Design 或 FigJam 文件，初始化成功后 tools/list 返回明确的 active-tab 错误。

已添加当前账号的 `figma-desktop` 配置，并在 Figma 桌面打开用户指定的 V3.0 Alpha 文件。其后 tools/list、节点元数据和截图均成功。配置使用本地 HTTP，无需重复 OAuth；CLI 显示 OAuth unsupported 是此通道不提供 OAuth，不是登录失败。

当前会话可通过项目只读脚本访问，后续 CLI 会话可加载新配置。保持 Figma 桌面运行并打开目标 Design 文件。此修复未修改设计节点、商业配置或生产数据，也未清除任何授权凭据。

## 验证证据

- `221:1177`：Commercialization 画布，成功获取元数据及截图；它是整页画布，不能把其整张图当成单个个人中心 Frame。
- `249:2123`：该画布内的 Personal Center，成功获取截图。
- `249:2183`：该画布内的 Membership & Usage，成功获取截图。

[商业化画布截图](figma-connection-recovery/221-1177-0.png) · [个人中心截图](figma-connection-recovery/249-2123-0.png) · [会员用量截图](figma-connection-recovery/249-2183-0.png)

复现命令：

```powershell
codex mcp get figma-desktop
node scripts/figma-desktop-read.cjs list
node scripts/figma-desktop-read.cjs get_metadata 221:1177
node scripts/figma-desktop-read.cjs get_screenshot 249:2123
```

脚本只允许元数据、截图与变量读取，不提供 Figma 写入操作。若返回 active-tab 错误，先在 Figma 桌面切回原 Design 文件，不应反复解绑账号。

配置依据：[Figma 官方桌面 MCP 说明](https://developers.figma.com/docs/figma-mcp-server/local-server-installation/)、[OpenAI Docs MCP 配置说明](https://learn.chatgpt.com/docs/extend/mcp?surface=cli)。
