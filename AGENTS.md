# AGENTS.md — dsh-mobile-hanui

## 所有权与边界

这是独立、纯客户端 Cordis 插件。hanui 负责手机网页体验、可选通知业务判断、登录页面的静态视觉资源；认证由 hanaccount 负责，DSH 官方页面负责业务连接、会话、文件上传及协议。Android 是可替换网站的通用容器。不要修改官方 DSH 核心或建立原生 DSH 回退连接。

## 结构

- `src/client.entry.js`：React 移动交互、公开 shell.overlay / sidebar.footer.action 注册、可选 uiSession 注入。
- `src/private-adapters.js`：隔离的旧 CSS module 指纹 / CSS，当前 rightbar 布局结构指纹 / CSS。
- `src/effects.js`：DOM 修改记录、定时器和旧方法包装的可撤销生命周期。
- `src/platform.js`：可选 HanApp JSON 客户端及浏览器通知 helper。
- `src/needs-action.js`：真实 public pendingInteractions 订阅、基线和去重。
- `src/client.js`：已生成的独立浏览器 bundle，不直接修改。
- `src/login.css`：独立可选静态样式，不包含认证逻辑。
- `src/index.js` / `cordis.patch.yml`：空 Host entry，只用于客户端模块发现。不要删除。
- `scripts/bundle.mjs`：零依赖构建及生成文件一致性检查。
- `tests/`：Node 原生测试；包括实际 bundle 的 VM + React 生命周期仿真。

## 加载与维护

`package.json` 声明 dsh.client 和 dsh.bundle.patch。客户端通过 `window.__ModuleLoader__.load({id,factory})` 加载，工厂只 require React / jsx-runtime；不在浏览器中导入辅助源码。安装者使用包内已生成的文件，无构建、postinstall 或运行时依赖。

开发修改后必须 `npm run build`，再 `npm test`、`node --check src/client.js` 和 `npm pack --dry-run`。不需要安装第三方依赖。不得只改生成文件而遗漏源文件。

`ctx.slots.inject('shell.overlay', ...)` 是真实公开扩展入口；`ctx.layout.toggleSidebar()` 是公开动作。当前 rightbar 不做 details 方法包装。旧方法包装仅在完整旧版指纹匹配时启用并在清理时恢复原函数身份/属性归属；不再使用 `__raw`、向官方对象写私有 sentinel 属性。

所有未知布局或缺失能力都保持官方页面可用，禁止选择“看起来像”的任意父节点并强行改布局。运行期发现列结构改变时撤销样式；中心宽度为零时本次停止增强。固定类名和结构均属于私有适配，不是稳定公开 API，升级后需重新验收。

现代布局已审计两种结构：0.1.6四列，以及0.2.1-alpha.1的sidebar/center/rightbar/bottom/overlay；后者允许Darwin平台在overlay后追加带data-shell-leading的leadingSeat，再接已知sidebar/rightbar拖动handle。未知seat、次序或指纹拒绝。侧栏fixed后center和rightbar分别固定第2/3轨道；保留官方bottom第二行。现代overlay只取消父级z-index堆叠上下文，让插件遮罩/抽屉按45/50排序，不移动官方DOM。现代导航另有运行期guard：只有没有main/main.conversation及其他业务候选的纯外层fixture才走not-applicable；真实会话header、main、composer或rightbar候选出现后，只允许完整可见header、真实hero全链或完整全屏rightbar工具栏匹配；fullscreen strip失配、未知header或有内容的leading seat会撤销整套现代lease，观察器继续监听以便完整匹配后恢复。现代shell.overlay按钮固定在12px安全区内，44px、无阴影、hamburger，不读取旧fabPos、不绑定legacy drag；sidebar打开时同一按钮隐藏并保留遮罩关闭。

现代私有DOM增强必须单独验证、使用独立marker并由journal撤销。侧栏只对唯一直属hHd-Xa_root或唯一display:contents包装后的该root记录宽度标记；搜索行需要完整sectionHeader/searchSlot/searchButton/input结构，保留官方会话名称搜索事件，再用flex-wrap将searchSlot排成整行；在精确搜索marker下解除searchSlot/search的max-width并令header高度随内容展开、保持36px最小高度和可见溢出，恢复输入的opacity与pointer-events以保证可见且可点击。搜索marker只依赖完整官方搜索子树；会话行样式marker单独要求已知treeitem行，避免过滤结果替换行结构时隐藏官方搜索输入。选中态先提供兼容浅蓝fallback，再用官方business-primary与sidebar fill混色；不能假设brand-primary在暗主题是蓝色。仅对唯一完整composer卡片/滚动区加局部圆角、模式pill、官方button至少44px触点（附件与发送至少44px宽）、max-height min(336px,40vh) fallback及40dvh滚动上限；保留官方composer席位、软键盘、滚动、附件、模式和发送控件。fullscreen rightbar要求确认dockkit surface/tabhost/strip/title slot/split/two toolbar actions全树；tabLayout只接受一个paneHost，或两个其中另一host具有已验证空header/body的tabCell变体，tab strip只接受4个孩子及唯一add-tab按钮5个孩子变体，stripTabs允许一个仅class属性的空`_slot_6nhg2_327`。strip chrome可带最多一个完整识别的官方tooltip（`_bubble_12mhf_1`，两种已审计aria-label）；要求已知tab集合中只有一个aria-selected=true活动tab，并只在活动tab内核对title；标题条左侧保留64px，min-height64，mode/toggle官方按钮触点至少44px，不克隆或重排官方tab/文件/终端DOM。未知或重复结构不标记。

按用户2026-10-05更新要求，通知区域整体隐藏，后台待确认通知默认开启，保留显式关闭的既有偏好；Android 在桥可用时申请系统通知权限，浏览器不自动弹出权限请求。开关44px高、pressed/busy/disabled/focus-visible可访问，默认不显示仅当前页面的说明；仅用户显式操作或实际错误时反馈状态。禁用/失配/收起后隐藏并退休权限await；不能恢复浮动面板遮住官方设置。

修改属性前记录原值，卸载/禁用恢复；外部已覆盖的属性不得被清理覆盖。移除自身插入节点和样式，取消 rAF、超时、观察器与事件监听。布局失配/禁用时不能继续触发延迟点击。通知footer共享具体activeMatch owner，不能只用bool表示布局lease；有效列替换也必须退休旧权限操作。helper.requestPermission可接受isCurrent回调，在capabilities返回后、发送原生/浏览器权限申请前及最终结果返回后校验；无参caller保持原行为。

现代设置/header采用独立子结构匹配，不能重新启用整套legacy CSS。只有VOzbGW_panel的nav(navTitle/navList)/content(header/options)完整结构才标记为手机顶部横向导航；设置dialog按手机视口调整尺寸并保留官方节点，navTitle视觉隐藏但保留aria-labelledby目标。当前header需headerLeading及公开conversation.session.header包装，内部titleRow/titleCluster/crumbs/actions/utilities/corner和可选tabs正确才给titleRow预留菜单空间；手机header的增量起始clearance为44px（叠加官方20px父级padding），右栏strip独立保留64px。hero需精确验证main.conversation→wSkVaW_root[data-phase=hero]、public conversation.header→HEADER.blank/empty leading/session.header/titleRow/corner slot/expand button及body→scrollBody→composerSeat→composer slot→chain fallback→composerStack.composerHero→brand/workspace/input.dock/composer.bar→uV2eYG_root全链；仅在titleRow上添加hero header clearance，不能用composerStack的padding-top代替。subview marker挂独立journal；身份集合不变时不写属性，结构变化/替换/卸载/禁用时撤销，观察器不观察自身data-hanui-*标记。

设置真实采用BODY portal，不能从sidebar内部寻找：由当前frame.ownerDocument扫描指定VOzbGW_panel，并且必须是BODY直属VOzbGW_overlay[role=presentation]的直属panel[data-shortcut-modal=settings][role=dialog]，再校验上述完整内部结构。任意全局dialog、其他modal和改变portal归属的节点都不增强；data-shortcut-modal变化参与观察。

## 文件、照片与通知

保留官方 standard file input / `/file` 入口及官方上传流程。不得绕过官方文件接收 gate，`ComposerBarInjected.addFiles` 是 package-private，不能伪装成稳定公共接口。独立相机入口尚未实现。

手机附件菜单在已确认的 uV2eYG_root 内识别 data-trigger-menu、listbox 与 dsh-slash-option-command-* 按钮，仅对命令菜单启用三列方块布局。每项只显示原图标和中文名称，英文别名、说明和分组标题隐藏；引用候选及未知结构不增强。相册按钮临时将同一官方文件选择器的 accept 设为 image/*，选择、取消或停用后恢复原值，不另建上传链路。手机 composerSeat 使用不透明白底。电脑布局、原始按钮事件及节点顺序保持不变，停用或结构失配后移除新增入口并恢复标记。

`uiSession` 使用可选 `ctx.inject(['uiSession'], ...)`，只订阅已证明的 `pendingInteractions` Observable。默认开启，通知开关与说明整体隐藏；只通知后台仍打开页面的新待确认事项，基线不补发。同一 key 去重，最多4096个身份后停止观察，防止无界内存。接口不兼容和临时投递失败必须区分；临时失败保留opt-out和用户重试，capabilities超时不得永久缓存。禁止编造 DSH 完成事件，禁止把 SessionSnapshot.running 的下降沿称为成功。

通知桥只使用 capabilities / requestNotificationPermission / showNotification，JSON version=1、correlation id、响应校验、32 pending、10s超时和16384字符消息上限。title120/body500/tag80/URL2048，target 精确当前 HTTP(S) origin 且不允许 URL 凭据；原生接收 title/body/targetUrl/tag，不接收 sessionId/DTO/Cookie。缺桥使用浏览器 Notification API，权限申请仅由用户明确动作触发；页面卸载清理 pending 回调和浏览器通知。

## 登录 CSS 部署

按用户2026-10-05更新要求，登录CSS提供白底、蓝色dsh android品牌、白色输入栏和蓝色继续按钮。由部署者把包内 `src/login.css` 复制到静态目录并映射同 origin 的精确 `/hanui-assets/login.css` 路径；可在 hanaccount 中配置显式 `loginStylesheetUrl`。不要假定官方 `/plugins` 路由能服务该 CSS。包不新增 Host route。保留认证插件内置基本样式，加载失败照常登录。静态视觉资源永不提供认证 ready 或安全依赖。

## 部署与恢复

profile 中安装此包并加入 `dsh.profile.bundles`；空 Host entry 供官方 client-modules 扫描。可用本地 `link:` 开发，不改 node_modules 编译产物。部署说明见 README。

`?mobileShell=0` / localStorage 开关只关闭已加载后的运行期增强，不能恢复 boot 失败。factory/依赖/manifest 出错时必须由服务端纯官方 composition 回退恢复；认证失败不得降级。不要把客户端 capability guard 当成 auth fail-closed 证据。

提交、bump/tag、push、npm publish 与访问生产遵循用户当前授权；本轮任务明确不提交、不发布、不访问生产。


## 旧交互迁移补全（2026-10-05）

现代和旧布局均保留切换会话的程序焦点保护、顶部历史自动加载及遮罩左滑关闭。现代焦点保护只作用于完整 composer-card 指纹中的 contenteditable，保留直接点输入、Tab导航及内部控件的焦点；不能全局 blur 所有输入。现代历史分页只接受 center 内的实际 data-conversation-scroll，要求唯一已知聊天 scroll、直属 data-chat-flow、直属 older 行及唯一官方 button；重新验证 rAF 中的所有权与按钮状态，复用官方 anchored pager，不改分页大小。仅遮罩上单指水平左滑关闭，纵向/取消/多指/侧栏内容手势不关闭；布局变化、禁用和卸载退休事件与延迟任务。现代新建对话只识别已验证 sidebar root 的唯一直属 newSession button，或直属 logoRow 的唯一 brand button，不放开通用按钮自动收起。相关私有能力位于 modern.focusInput/historyTarget/isNewSession；未知结构保持官方行为。
