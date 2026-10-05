# dsh-mobile-hanui

DeepSeek Harness 的手机 Web 适配插件。只修改本插件，不接管 DSH 的连接、会话、上传或认证协议。

## 安装

```sh
cd ~/.dsh/profiles/web
pnpm add dsh-mobile-hanui
```

在 profile 的 `dsh.profile.bundles` 数组中加入 `"dsh-mobile-hanui"`，重启对应的本地 Web 服务。安装者无需构建；发布包包含已生成的独立 `src/client.js`，无运行时 npm 依赖。

## 布局兼容

视口 ≤1023px 时，插件先检测布局能力及 DOM 指纹，匹配成功后才安装样式和交互：

- 当前 `ui-layout` 的 rightbar 布局：手机左侧抽屉、遮罩关闭，使用官方 `layout.toggleSidebar()`；rightbar 仍由官方负责。支持审计过的0.1.6四列与0.2.1-alpha.1新增bottom行/可选Darwin leading seat结构，保留官方bottom行，未知seat或次序停止增强。现代布局只在已验证的会话header、起始页输入区或全屏rightbar工具栏上方显示固定汉堡菜单；不读取旧版拖动位置。全屏rightbar会给官方tab和工具栏保留菜单触点空间，文件tab保留官方新建tab按钮。
- 现代侧栏仅在已确认搜索/分区结构后把官方会话名称搜索框排成整行，并确保官方输入框可见可点，再应用浅灰搜索底色与蓝色选中态。现代composer只增强已验证输入卡片的圆角和模式pill；长稿滚动区在已确认节点内限制为屏幕高度的40%（最高336px）。布局候选节点出现但结构不符时，现代增强整体撤销，官方页面继续控制布局。
- 旧 details 布局：保留原来的输入、设置、提问面板、统计行和历史滚动增强。固定 CSS module 名称及旧 layout 方法仅存在于私有适配分支。
- 缺少必要列、接口或 DOM 指纹时停止增强；中心区宽度为零时撤销本次增强。桌面、未知版本保持官方布局。

关闭、视口变宽、DOM 替换或插件卸载会移除本插件的样式、监听器、定时操作和插入的统计节点，恢复改写前的属性与 layout 方法。新增的源码集中在 `src/private-adapters.js`、`src/effects.js`；这是视觉兼容保护，不是官方版本的安全认证。

文件和照片继续使用官方输入框的标准 Web 文件选择及官方上传流程。当前源码的“+”菜单包含 `/file` 动作；图片由浏览器文件选择器提供。插件不会绕过该动作的可用性判断、不会创建第二条上传连接。独立相机入口尚未实现。

## 通知

后台待确认通知默认开启，保留用户已经明确关闭的偏好；通知设置区域整体隐藏。Android 桥可用时申请系统通知权限，普通浏览器不会自动弹出权限申请。只处理仍打开页面在后台时的新待确认事项。

插件可选订阅真实公开的 `ctx.uiSession.pendingInteractions`（`getSnapshot()` / `subscribe()`）。已有事项作为基线，不补发历史通知；相同 opaque key 不重复发送。缺少该接口或快照形状改变时关闭业务通知增强。`uiSession` 是可选注入，不加入必需的启动依赖。

通知标题和正文为通用提示，不包含问题文本、Session DTO 或 sessionId；点击目标是当前 origin + pathname。可选 `window.HanApp` 使用 AndroidX WebMessage JSON 契约；普通浏览器无桥时使用浏览器 Notification API，均不自动申请权限。全局安全辅助入口为 `window.DSHMobileHanui.notifications`，提供 `capabilities()`、`requestPermission()`、`show({title,body,targetUrl?,tag?})` 和 `setNeedsActionEnabled(boolean)`。

此功能不包含成功完成通知、关闭 App 后的推送或未加载会话的后台监听。`running=false` 不足以判定成功。完整完成通知还需要官方公开且版本确定的 turn 身份、完成/取消/失败结果、重连与历史回放去重及会话跳转契约；不能靠猜测事件名实现。浏览器/WebView 被系统挂起时不能保证送达。

## 登录静态样式

`src/login.css` 是纯静态、可选的登录视觉资源。按用户2026-10-05新要求，采用白底、蓝色 dsh android 品牌、白色输入栏和蓝色圆角继续按钮；含手机安全区、54px点击目标与16px输入。认证和服务器切换逻辑不在CSS中。hanaccount独立登录页随包提供同步的fallback副本。

显式部署到同 origin 的 `/hanui-assets/login.css`：由部署者把包内 `src/login.css` 复制到独立静态目录，例如 `/srv/hanui-assets/login.css`，在反向代理中映射该**精确 GET/HEAD 路径**并返回 `text/css`。在 hanaccount 配置中设置完整 `loginStylesheetUrl`，例如 `https://your-dsh.example/hanui-assets/login.css`。保留内置登录样式并在其后加载本 CSS；登录 body 使用 `han-login` 类。

不要假定 `/plugins/dsh-mobile-hanui/login.css` 可访问：官方客户端资源路由仅保证客户端 bundle 的服务。本包没有增加 Host 静态路由，CSS 加载失败时认证插件保留内置登录页面，CSS 从不提供认证 ready 或安全判断。

## 关闭与故障恢复

- URL 加 `?mobileShell=0`，或设置 `localStorage.setItem('dsh-mobile-shell', '0')` 后刷新。
- 已加载页面也可调用 `window.DSHMobileHanui.setEnabled(false)` 即时撤销增强。

`mobileShell=0` 只在插件已经成功进入运行时后起作用，不能修复 factory/依赖/boot manifest 加载失败。该类故障需要服务端以已验证的纯官方 composition 恢复页面；本客户端插件无法替代此恢复路径。认证失败不得降级。

## 开发验证

```sh
npm run build
npm test
node --check src/client.js
npm pack --dry-run
```

修改 `src/client.entry.js` 或辅助模块后运行 `npm run build`；`scripts/bundle.mjs` 用 Node 标准库生成独立 classic ModuleLoader factory，浏览器不会 import 未服务的同级源码。`npm test` 首先检查生成文件是否过期，再测试实际 bundle 的启动、兼容保护和清理及通知 JSON 契约。无需安装测试依赖。

详情见 [AGENTS.md](./AGENTS.md) 和 [本轮实施记录](./IMPLEMENTATION-2026-10-05.md)。


### 手机交互兼容

当前与旧布局都支持切换会话时抑制程序聚焦弹键盘、滚到顶部调用官方历史加载按钮、在遮罩上左滑关闭侧栏。直接点输入和 Tab 导航保留焦点，纵向滚动和取消手势不关闭侧栏。当前布局的新建对话按钮和顶部品牌快捷入口会在选择后自动收起侧栏；设置、搜索和行菜单保留打开。

历史分页沿用官方流程与分页大小，当前布局读取外层真实滚动容器。布局失配、桌面或停用时不执行这些增强。手机触摸与软键盘效果仍需实际站点验收；Node 测试覆盖行为分支和生命周期。
