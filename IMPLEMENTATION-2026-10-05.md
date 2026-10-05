# 2026-10-05 本地实施记录

工作分支：`codex/mobile-web-adapter`。只改 dsh-mobile-hanui，全程未提交、未发布、未访问生产。

## 已实施

1. 从巨型 client.js 分离私有 CSS/DOM 适配、可撤销副作用、平台桥和通知业务观察模块；Node 标准库构建为单一 classic factory，保持官方 ModuleLoader 加载契约，无浏览器 sibling import。
2. 保留完整旧 details 指纹匹配下的既有移动增强；固定哈希类名和旧方法不泄漏到 current rightbar 分支。当前布局使用公开 shell.overlay 和 toggleSidebar，并验证 overlay、四列相对结构、class suffix 和必要 rightbar 方法。
3. 样式在匹配后才安装；DOM 失配、disable、宽屏和卸载均清理。属性恢复原值、统计 break 节点移除、旧方法恢复精确身份/属性归属，事件/observer/rAF/定时点击均释放。中心区零宽 canary 停止增强。
4. 可选 HanApp 版本1 JSON桥，三个允许请求、输入/响应约束、correlation、timeout、pending 上限和清理。无桥可正常加载网页，并使用浏览器 Notification 能力。
5. 手机抽屉中有权限/通知开关和状态。默认关闭；可选真实 public UiSession.pendingInteractions 订阅，仅后台仍打开页面的新待确认事项，已有项作为基线，opaque identity 去重。原生仅接收通用提示、origin+pathname目标和tag，不接收会话信息。
6. src/login.css 为纯可选静态手机增强，保留已有 hanaccount 登录卡片及主题。部署 URL 明确为 same-origin `/hanui-assets/login.css`，由部署者静态映射，不假定官方 plugins 路由。
7. README / AGENTS 更新加载、构建、部署、能力保护及 boot 恢复边界。

## 官方接口依据

本地官方源码 `D:/0HAN/Work/deepseek-harness`，HEAD `0a15e36e7f82b6ed45af6fa9759f29b40dcd965d`：

- `packages/client/ui-layout/src/client/index.ts`：shell.overlay 为 root/list 可加扩展槽。
- `packages/client/ui-layout/src/client/service.ts`：公开 toggleSidebar / openRightbar / closeRightbar；没有旧 openDetails。
- `packages/client/ui-layout/src/client/AppFrame.tsx`：data-shell-overlay、sidebar/center/rightbar/overlay列结构；ui-layout package version `0.1.6-alpha.1`。该版本字符串只是已审计源码记录，运行时结构保护不假装可以认证整个官方 build。
- `packages/client/ui-session/src/client/index.ts`：公开 pendingInteractions getSnapshot/subscribe，值为 key/kind/sessionId。
- `packages/client/ui-conversation/src/client/skeleton/InputBar.tsx`、`apply.ts`：标准文件输入和官方 `/file` 动作；addFiles 是 package-private，hanui 未接管。

## 验证

`npm test`：20/20 通过（独立复核修复后的最终结果）。检查生成 bundle 与源码一致，并直接在 VM 中执行实际 src/client.js factory，仅允许 React/jsx-runtime require；仿真 React effect 生命周期验证 current/legacy/desktop/未知DOM、disable/dispose、列替换、零宽canary、原函数恢复和所有监听器清理。实际 bundle 中也验证了可见按钮→显式权限→默认关闭的业务开关→真实 public snapshot→通用 HanApp notification，全程不传 Session DTO。

辅助用例覆盖无桥、JSON不合法/超长/错版本/错shape、乱序响应、精确origin/凭据限制、长度限制、pending上限、timeout、dispose和旧origin拒绝，公开observable的基线/去重/可选缺失/协议变更/失败隔离，静态CSS不含外部资源或认证逻辑且不重绘品牌。

`node --check`：client.js、client.entry.js、private-adapters.js、platform.js、effects.js、needs-action.js 均通过。`npm pack --dry-run` 成功，确认独立 client.js、login.css 和 Node 构建脚本随包分发；未发布包。`git diff --check` 通过。未安装第三方工具。

## 独立复核后的修复

依据父仓库 `.superpowers/sdd/reviews/hanui-review.md` 确认的四个生命周期缺陷，逐项添加回归后修复；未提交或发布：

- 同一个 frame 中替换仍然匹配的 center/sidebar 时，比较全部被租用列和 overlay 的对象身份；恢复旧节点标记，重新绑定新列，撤销旧 canary 并重查新 center 的宽度。有效列替换和零宽替换的实际 bundle 回归通过。
- 定时关闭动作按 active 布局生命周期创建和释放；旧 lease 撤销立即标记失效，回调还验证当前 frame/sidebar 身份。兼容 frame 替换后旧 140/280ms 动作不再 toggle 新布局。
- Notification helper 每次 await capabilities 后再次验证存活，原生权限/显示返回后也验证存活；浏览器创建/授权均不会在 dispose 后启动。已创建通知仍被关闭并移除点击回调。
- 观察接口不兼容与临时投递失败分开：前者关闭订阅支持，后者只显示“通知暂未送达，可关闭或重新开启通知”，不永久禁用开关。点击先处理 opt-out，然后才判断接口能力；新待确认项可继续触发恢复后的投递。默认权限不自动申请。
- 启动时临时 HanApp capabilities 超时不缓存永久失败；下一次用户动作重新查询。实际 bundle 用可控超时模拟“桥尚未 ready → 超时 → ready 后再次点击”，正常启用。

新增5个目标回归：同frame有效列替换、兼容frame替换期间旧定时动作、浏览器异步show/permission卸载、投递失败后opt-out/重新启用/新事项投递、早期capabilities超时后用户重试。前三个和投递失败用例在修复前均复现审查错误；早期超时用例验证既有重试路径没有被永久支持标记污染。最终20项全部通过，generated bundle检查、语法、`npm pack --dry-run`、`git diff --check`均通过。

## 明确边界与剩余验收

### 官方0.2.1布局升级修复（2026-10-05）

只读核对运行中的安装包发现：hanui仍是旧v16代码（包metadata仍0.2.5），官方ui-layout/ui-conversation已升级为0.2.1-alpha.1，新增`data-shell-bottom`位于rightbar与overlay之间；Darwin可在overlay后追加`data-shell-leading`。旧包在未验证新版结构时强改header/composer和details；本地新adapter原本也只接受overlay为第4个元素，会拒绝新版。

在不改认证、App、login.css或官方DOM的前提下，增加精确bottom/leading结构适配；未知seat、handle、平台或次序仍拒绝。sidebar脱离grid后，center和rightbar分别固定第2/3轨道，保留bottom第二行。现代overlay取消z20父级堆叠限制，插件遮罩45、抽屉50、通知61恢复同一堆叠平面。新版composer继续使用官方自带的窄屏宽度/换行，不移植legacy旧hash单行/header/hero强改。

新增3个实际bundle回归先全部失败，修复后全部通过；覆盖0.2.1 bottom/overlay、Darwin leading及已知handle、桌面无增强、未知结构拒绝、rightbar/overlay标记与禁用恢复、无legacy composer强制规则。最终`npm test`23/23通过，生成一致性、`node --check src/client.js`、`npm pack --dry-run`、`git diff --check`通过。Host index/patch内容与当前安装包相同；只更新已生成`src/client.js`即可替换客户端运行逻辑，开发源码同步随包保存。未提交、部署或修改服务器；真实浏览器/手机修复后截图、抽屉遮罩/通知命中和rightbar行为由root继续验收。

### 独占HANUI页面的侧栏宽度与通知遮挡修复（2026-10-05）

root实际390×844浏览器验收发现：sidebar宽344.35，但其display:contents包装后的hHd-Xa_root保留inline宽280，直接子元素width规则没有几何效果；fixed通知面板覆盖官方设置，设置elementFromPoint命中失败。

先新增两项实际bundle回归，旧实现分别因缺少root标记和缺少公开footer注册而失败。修复仅为确认的唯一直属root或唯一contents包装后root增加journal宽度标记，CSS覆盖宽度但不改inline280px，root替换/禁用恢复原属性。未知root不加标记。通知从shell.overlay移入公开sidebar.footer.action，使用官方wide参数，正常占位在Settings上方，不改设置z-index或移动官方节点；缺少footer槽时不插入浮动替代。通知使用单一shell布局lease，关闭/禁用/失配隐藏；权限await绑定当前可见lease，收起再展开仍拒绝旧结果，legacy点击规则排除自身通知控件。

最终`npm test`28/28通过，涵盖modern/legacy最终通知CSS均无浮动定位及新的宽度/原值恢复/同列root替换/未知root、公开footer注册/无浮动定位/桌面与失配隐藏、616高视口控制结构、关闭和禁用后迟到权限结果、legacy点击不关闭抽屉；既有opt-in/opt-out/临时失败重试/早期capabilities超时场景继续通过。VM不进行浏览器排版，不能把此结果声称为真实点击或视觉验收。生成一致性、语法、打包和diff检查通过。运行期只需更新已生成src/client.js，开发包同步相关源文件和文档。未改login.css、Auth、App、服务器，未提交或部署；390×844与360×616真实root宽度、Settings和通知双hit-test仍由root部署后验收。

### footer通知权限的异步owner边界复修（2026-10-05）

独立审查发现两处28项旧测试没有覆盖的窗口。新增实际bundle回归先复现：footer在capabilities等待中关闭后，旧helper仍发送1次requestNotificationPermission；同frame有效center替换后，两次visible=true导致旧bool lease未退休，迟到grant仍启用通知。

helper.requestPermission新增可选`{isCurrent}`回调，启动、capabilities await之后发送权限申请前、原生/浏览器权限结果返回后均检查helper存活及当前操作；原无参caller保留默认行为。layoutState共享具体activeMatch owner，footer lease随owner变化重新建立，检查owner.alive、当前snapshot严格等于owner、frame没有collapsed标记及未禁用；不依赖中间false被React提交。旧owner不能借新owner结果继续，新owner的明确点击仍可启用通知。

最终`npm test`31/31通过，新增上述2项artifact回归，以及native/browser guard与无参caller验证；原关闭/禁用后grant、早期caps超时重试、临时投递失败opt-out及现代/legacy footer正常流测试保持通过。build一致性、语法、pack dry-run和diff检查通过。只修改hanui源码、测试及生成bundle；不改App/login/Auth，不提交、部署或访问设备/服务器。

### 卸载社区插件后的设置与会话header小屏修复（2026-10-05）

root实际独占HANUI的360×616页面取证：官方VOzbGW_panel为312×568，nav188导致content124逐字换行；会话header为360×76，crumbs从x20开始，悬浮菜单在x10..54遮住标题。确认当前headerLeading与conversation.session.header公开slot包装，titleRow并非header直接子元素。

现代分支新增局部subview结构校验：Settings需panel[role=dialog]直属nav/content及其navTitle/navList、header/options完整匹配；header需headerLeading+公开slot包装、已知titleRow/cluster/crumbs/actions/utilities/corner与可选tabs结构。只对匹配节点记录可撤销marker，不移动官方DOM。设置保持官方modal尺寸，panel改column，navList为横向可滚动按钮，content满宽且min-height0，options保留垂直滚动；标题视觉隐藏但保留aria-labelledby目标。会话仅对titleRow增加42px起始padding（原x20加到x62，超过默认FAB右沿54且留8px）及44px最小行高，保留tabs和官方header grid/composer。

两项实际bundle回归先失败后通过，覆盖动态面板/slot出现、未知子结构撤销、恢复原marker、禁用/卸载与桌面不改、官方节点顺序保持。根代理提出稳定身份时不要重复写属性后，新增回归先复现5次无关观察把marker写入次数从1增至6；修复为身份集合不变时返回，最终仍只写1次，observer不观察自身marker。最终`npm test`34/34通过，既有通知owner与宽度修复保持通过；build一致性、语法、pack dry-run、diff检查通过。Node VM只验证规则与生命周期，不替代实际CSS排版/点击；root继续部署和360×616真实导航/文字/header命中验收。此子任务未操作服务器、ADB、App或提交，生成src/client.js是运行期更新文件。

### 设置真实BODY portal定位修正（2026-10-05）

root部署E398后360页面确认Settings marker仍为0：实际Settings为BODY直属VOzbGW_overlay[role=presentation]下的VOzbGW_panel[data-shortcut-modal=settings][role=dialog]，原本从sidebar扫描漏掉portal。此前Node夹具模拟sidebar内panel，不能作为真实portal兼容证据。

新增真实BODY portal回归先复现marker缺失；随后改为当前frame.ownerDocument扫描指定panel，仅接受上述精确portal位置、role和settings标记，再沿用完整nav/content子树校验。不增强任意全局dialog。portal移到sidebar、modal变成other、overlay role变化均撤销marker，恢复精确结构重新加标记，禁用清理。data-shortcut-modal变化加入观察；稳定身份写入去重保持不变。夹具同步实际portal并补ownerDocument及appendChild移动行为，之前设置回归现在也走真实portal拓扑。

最终`npm test`35/35通过，build一致性、语法、pack dry-run、diff检查通过。仅修改hanui本地源码/夹具/生成bundle及文档，不部署、不访问服务器/ADB/App；真实360设置内容宽度和菜单标题命中仍需root重新部署验收。

- 没有真实浏览器/手机/Android end-to-end视觉及系统权限验收；Node夹具验证生命周期和接口形状，不能证明页面所有操作在设备上可用。
- 当前 rightbar 分支只改审计过的布局，旧功能私有选择器不匹配时不强行启用。新版设置/模型/提问面板保持官方行为，需要对具体版本做手机视觉验收。
- 文件/照片继续走官方标准选择器及上传；没有独立相机入口，没有绕过 composer gate 的第二上传连接。
- 通知限已打开页面中观察到的新待确认项，最多4096个身份。App被关、页面被挂起或未加载会话不能保证通知。无完成/成功通知，未推断running下降沿。
- 完整业务完成通知需要官方明确公开的turn身份、成功/失败/取消结果、会话绑定、重连/回放去重和跳转契约，以及针对实际安装版本的集成验收；closed-app push另需服务端Web Push/平台推送方案。不能编造未验证事件订阅。
- mobileShell=0 不是 factory/boot/依赖失败恢复。纯官方 composition 服务端恢复路径仍须跨模块整合验证；视觉能力guard不是 auth fail-closed ready。
- 静态登录CSS精确路由与认证CSP/可选加载由部署及hanaccount配置负责，尚未对真实入口做部署验收。

### 现代手机导航与控件局部适配（2026-10-05，本地实现）

按官方0.2.1-alpha.1运行结构与提供的手机参考图，现代 `shell.overlay` 入口改为固定左上12px的44px汉堡按钮；现代分支不读旧 `dsh-mobile-fab-pos`、不绑定拖动，也不占用官方 `header.leading`。菜单仅在完整且可见的已验证header/hero或全屏rightbar工具栏租约中显示；未来leading贡献、未知header、不可见header和未知fullscreen strip会撤销整套样式与marker，observer保持运行，官方结构恢复后再增强。Fullscreen strip精确接受已审计的4节点结构及含官方add-tab按钮的5节点文件tab变体，包含collapsed状态也遵守 `data-rightbar-fullscreen`；保留官方tab、split、mode/toggle及文件/终端节点。

现代侧栏只对已匹配的官方会话名称搜索子树排版：原生button/input和事件保持不动，searchSlot在原sectionHeader内单独占满一行。应用sidebar背景、搜索底色及business-primary选中色，避免把暗主题中呈白色的brand-primary当作蓝色。composer只对完整卡片、模式控件和唯一输入滚动节点做圆角/触点调整；滚动区保留自适应高度，并限制到 `min(336px,40vh)` / 支持时 `min(336px,40dvh)`，无JS视口补偿。未重排附件、发送/停止、队列及官方composer seat。

footer通知改为正常流中的紧凑铃铛开关；默认关闭并提供独立“说明”展开。只有用户显式启用才请求权限，按原逻辑保留opt-out、owner/isCurrent、能力竞态及退役保护。菜单图标按参考校准为24px viewBox内两条不等长线。legacy FAB位置/拖动和旧details适配保持现有行为。README与AGENTS已同步现代lease、菜单、sidebar/composer及通知边界。

新增实际 `src/client.js` artifact回归覆盖现代旧位置隔离、header可见性失效及恢复、leading拒绝、fullscreen/collapsed和文件tab strip变体、未知子树整租约撤销、search/composer marker回收、短屏滚动CSS、通知说明不请求权限及显式开关权限行为；原35项基线继续通过。最终 `npm test` 42/42通过（含bundle一致性），`node --check`覆盖client与相关源码通过，`npm pack --dry-run`和`git diff --check`通过。bundle SHA-256：`2A2C18768C82F33E84059247238AD76BDDDE854E46AE706AD62AC7B9A2BDC289`。Node夹具不证明实际手机CSS排版、hit-test或真实通知权限；root负责部署后截图/设备验收，Sol负责独立复核。本轮未操作服务器、ADB、Gradle、认证core，未提交或发布。


### Sol复审问题修正（2026-10-05）

独立复审发现现代导航在旧header私有类消失但公开 `conversation.header` 槽仍存在时会误判为纯外层fixture；同时完整hero可能绕过未知会话header。guard现在将真实 `HEADER` 元素、私有header/session槽、公开header槽和composer作为业务候选，仅没有任何候选时才允许not-applicable；完整header需可见并精确匹配，未知候选会退休整套lease。先检查header leading公开槽，任何子节点或非空文本都保护官方贡献并撤销lease；移除贡献、结构恢复后observer可重新增强。

Fullscreen rightbar允许tab容器保留多个已知tab，但要求唯一 `aria-selected=true` tab及唯一活动tab title slot；tab/body标识仍须匹配。通知已开启而业务observable后来失效时，开关保持可点以便关闭，只有未开启且业务能力不支持时才禁用。sidebar搜索输入在唯一验证marker内显式恢复opacity和pointer-events，覆盖官方隐藏输入状态并保留原事件/焦点逻辑。

新增实际bundle回归覆盖header私有结构变化且hero存在时整lease撤销、header leading新增button/文本、多个rightbar tabs中按active tab匹配、业务能力失效后通知opt-out；既有sidebar搜索样式断言覆盖可见和pointer-events规则。最终全套验证结果和生成bundle SHA-256见下方更新。

复审修正后最终验证：`npm test` 46/46通过（含实际bundle一致性与旧35项回归），`node --check`覆盖client及辅助源码通过，`npm pack --dry-run`和`git diff --check`通过。最终 `src/client.js` SHA-256：`4396972AA2496092FE73F1DF8D2FF3B81CFBE21DBF0817FDCD5FCF38C02BD97E`。实际输入点击/筛选以及手机视觉仍由root部署后验证；未部署、未操作设备/服务器/认证core、未提交或发布。

### 真实0.2.1 hero DOM结构修正（2026-10-05）

依据 `mobile-hero-dom-20261005.json` 重做新会话识别。原matcher把composerHero当成wSkVaW_root的祖先，且要求输入root位于pXSMma_body内；采集DOM显示hero root是composerStack.composerHero的祖先，品牌树pXSMma_root/stack/body为空，而uV2eYG_root在public `conversation.composer.bar` slot下。新matcher要求真实main→main.conversation→wSkVaW_root[data-phase=hero]→公开header slot/空白HEADER及body→scrollBody→composerSeat→conversation.composer→chain fallback→composerStack.composerHero→brandRoot/空body、workspaceRow、input.dock、composer.bar→uV2eYG_root关系。hero header使用独立完整指纹，确认leading空slot、session.header/titleRow、headerCorner唯一公共slot及其中expand button；仅在真实titleRow上设置44px菜单横向clearance，移除原本落在composerStack的top padding。全链marker一起由lease撤销。

复核时根据实际普通会话DOM将导航guard phase恢复为 `active`。普通 `wSkVaW_body` 在 `scrollBody` 外还包含两个官方宽度handle；guard现在只核验 main/conversation/root/header 的祖先链，不把 body 内部节点当作导航条件。普通会话fixture同步加入这两个handle。两个属性观察器覆盖phase、composer seat/chain、rightbar expand及active tab属性，确保单独属性变化会重验；自身marker不在观察列表中。最终 `npm test` 47/47通过；`node --check`覆盖client及相关源码，`npm pack --dry-run`与`git diff --check`通过。`src/client.js` SHA-256：`3F911EC5499031E1126917E82266B17639DADA6EA4F141E05FA18A84183C18C4`。实际手机视觉和输入hit-test仍待root部署验收；未部署、未操作设备/服务器/认证core、未提交或发布。

普通会话的采集DOM phase为 `active`，main候选需验证对应root、public conversation.header唯一slot及唯一已识别HEADER，wrapper自身display:contents/零尺寸不会用于可见性判定，验证对象是HEADER和titleRow。`main`/`main.conversation`存在但无法匹配已知主header/hero时不能走外层fixture的not-applicable路径。测试夹具改为与采集parent/class/slot/phase对应的DOM树，包含零尺寸display:contents public wrapper；另加未知main面板拒绝用例。

### 搜索行尺寸、右栏tooltip与触点校正（2026-10-05）

root部署实测搜索marker已正常，但搜索slot仍被官方`max-width:28px`压缩，父sectionHeader固定36px并裁切；在精确marker下覆盖slot/search max-width并铺满整行，header恢复auto高度、36px最小高度和可见overflow，使搜索行与原工具行自然占位。文件面板hover会在已识别toolbar中追加官方tooltip；仅允许完整`SPAN._bubble_12mhf_1`及核实的“收起侧边栏 Ctrl + Shift + B”/“退出全屏 Ctrl + Alt + Enter”标记，仍要求mode/toggle两个原生按钮各唯一，未知children继续撤销整租约。composer官方按钮至少44px高，附件/发送至少44px宽，model触点至少44px高；rightbar仅mode/toggle按钮增至44px，未改变tab关闭与split按钮尺寸。

新增/扩充bundle回归覆盖两种tooltip与文件tab变体、未知toolbar子节点整租约撤销、search slot/header展开CSS以及composer/rightbar触点CSS。实页搜索QA发现结果行会替换treeitem类型；现搜索marker只依赖精确search subtree，sidebar-content行样式独立核对treeitem，新增无session row搜索与清空恢复回归。真实两tab flat tree还显示tabLayout有两个dock cell：只认唯一带pane标记的活动host，另一cell必须为空header/body占位；stripTabs可有一个仅class属性的已知空slot。选中色始终有rgba fallback，支持`color-mix`时才在`@supports`规则中覆盖。最终`npm test` 48/48通过；build一致性、`node --check`、`npm pack --dry-run`和`git diff --check`通过。`src/client.js` SHA-256：`6C17FB9FD9FB4AF4AB5418369C4F554B73821DDB6058DEDD28196C802EAC1CE0`。实页搜索输入过滤、两tab与44px触点需root重新部署验收；本轮未部署或操作设备/服务器。


## 手机界面与登录等待修复

附件菜单压缩卡片高度并调整菜单高度上限，避免普通手机尺寸裁切卡片。composer的44px触点只覆盖工具栏和发送栏，不再误改附件删除按钮。右栏展开时隐藏中心标题栏的重复展开入口。通知区域整体隐藏，未设置关闭偏好时默认开启，Android沿用系统权限申请；浏览器不自动申请权限。51项手机模块测试和24项登录脚本测试通过。浏览器360px夹具验证九项卡片完整显示、删除按钮18×18及通知区域不可见；未替代实际手机登录全流程验证。

登录脚本的设备缓存桥等待从8秒改为1.5秒，返回中断的访问检查只重试接口、不重新加载整页，短暂网络错误自动重试两次。已部署客户端bundle与登录展示脚本；旧版备份为 `/home/ubuntu/.dsh/backups/ui-login-20261005-YgyrUD/`。认证核心、规则及App未替换。


## 旧布局交互迁移补全（2026-10-05）

审计确认的四项缺口已补：现代程序焦点保护（直接点输入与 Tab 例外）、外层 data-conversation-scroll 的官方 anchored pager 自动调用、遮罩单指左滑关闭、已验证 newSession/brand 入口收起侧栏。添加 modern.focusInput/historyTarget/isNewSession 私有适配，未移植旧 StatsLine/details/FAB 强制行为。

新增7项实际 bundle 回归：最初四项在修改前失败，修改后通过；覆盖直接点击/键盘、嵌套可访问控件、未知 composer、外层分页、500ms节流、禁用/按钮等待/桌面、旧版兼容、pager移除、纵向/取消/内容手势、租约退役与新建入口的按钮白名单。61项 Node 测试全部通过，bundle一致性、syntax和打包检查通过。同步 README 的通知说明与 AGENTS 的设置尺寸约束。

未修改 Android/认证或访问生产。Tooltip 隐藏与提问面板全屏策略尚属视觉待验收项，未盲目恢复旧哈希规则。真实手机效果不由上述 VM 回归替代。
