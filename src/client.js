/**
 * Mobile shell — audited modern rightbar layout with isolated legacy v16 support.
 *
 * Root cause of “only menu visible” (v11): `grid-template-columns: 0 1fr 0` +
 * `position:fixed` on sidebar/details removes them from grid flow → center
 * auto-places into track 1 (width 0). Fix: `grid-column: 2` on centerCol.
 *
 * v16 rules:
 * - Pin .centerCol to grid-column:2 / grid-row:1 under mobile shell
 * - Never transform the center column; never lock html/body/#root height
 * - Drawer from the LEFT; open via FAB click/tap (no swipe-open)
 * - Close: backdrop tap + swipe-left on backdrop; no X button
 * - Main grid stays 0 1fr 0 so local page does not move/squeeze
 * - FAB: touch-action none + capture on pointerdown; open on pointerup if not drag
 * - Header: AgentPreset「模式」beside 轨迹 tabs (title row free)
 * - Session tap auto-close: YDXeBa_sessionRow / searchResultRow (+ 140/280ms)
 * - Plugin only (dsh.client)
 */
window.__ModuleLoader__.load({
  id: 'dsh-mobile-hanui',
  factory: (require) => {
    const module = { exports: {} }
    const exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })

    const React = require('react')
    const { jsx, jsxs } = require('react/jsx-runtime')

    const MOBILE_MQ = '(max-width: 1023px)'
    const HTML_CLASS = 'dsh-mobile-shell'
    const ATTR_DETAILS = 'data-dsh-mobile-details-open'
    const FAB_POS_KEY = 'dsh-mobile-fab-pos'
    const DRAG_THRESHOLD = 8
    const FAB_SIZE = 44
    const FAB_MARGIN = 8
    // Swipe-close only (backdrop); axis-lock aborts vertical pans
    const SWIPE_AXIS_LOCK = 12
    const SWIPE_DX_MIN = 48
    const SWIPE_DX_DY = 1.5
    /** Record only plugin-owned DOM writes, restoring originals on disable/dispose. */
    function createDomJournal() {
      const attributes = new Map()
      const nodes = new Set()
      return {
        setAttribute(el, name, value) {
          let record = attributes.get(el)
          if (!record) attributes.set(el, record = new Map())
          if (!record.has(name)) record.set(name, { original: el.getAttribute(name), written: value })
          record.get(name).written = value
          if (value === null) el.removeAttribute(name)
          else el.setAttribute(name, value)
        },
        ownNode(node) { nodes.add(node); return node },
        ownsNode(node) { return nodes.has(node) },
        dispose() {
          for (const node of nodes) node.remove()
          nodes.clear()
          for (const [el, record] of attributes) for (const [name, value] of record) {
            if (el.getAttribute(name) !== value.written) continue
            if (value.original === null) el.removeAttribute(name)
            else el.setAttribute(name, value.original)
          }
          attributes.clear()
        },
      }
    }

    /** A cancellable queue for delayed UI actions. */
    function createTimers(win) {
      const timers = new Set()
      let disposed = false
      return {
        later(fn, ms) {
          if (disposed) return
          const id = win.setTimeout(() => { timers.delete(id); if (!disposed) fn() }, ms)
          timers.add(id)
          return id
        },
        dispose() {
          disposed = true
          for (const timer of timers) win.clearTimeout(timer)
          timers.clear()
        },
      }
    }

    /** Preserve original identity and ownership when a legacy adapter wraps a method. */
    function replaceMethod(target, name, factory) {
      const original = target?.[name]
      if (typeof original !== 'function') throw new TypeError(`missing layout.${name}`)
      const descriptor = Object.getOwnPropertyDescriptor(target, name)
      const wrapper = factory(original)
      target[name] = wrapper
      if (target[name] !== wrapper) throw new TypeError(`layout.${name} is not writable`)
      return () => {
        if (target[name] !== wrapper) return
        if (descriptor) Object.defineProperty(target, name, descriptor)
        else delete target[name]
      }
    }

    function installLayoutEnhancement(doc, match, htmlClass) {
      const journal = createDomJournal()
      const mobileMenu = installMobileAttachmentMenu(doc, match, htmlClass)
      let subviewJournal = createDomJournal()
      let currentViews = []
      const syncViews = () => {
        mobileMenu.sync()
        const nextViews = match.adapter.subviews?.(match) ?? []
        if (nextViews.length === currentViews.length && nextViews.every(([name, el], index) => currentViews[index][0] === name && currentViews[index][1] === el)) return
        subviewJournal.dispose()
        subviewJournal = createDomJournal()
        currentViews = nextViews
        for (const [name, el] of currentViews) subviewJournal.setAttribute(el, `data-hanui-${name}`, '')
      }
      const html = doc.documentElement
      const hadClass = html.classList.contains(htmlClass)
      const style = journal.ownNode(doc.createElement('style'))
      style.dataset.plugin = 'dsh-mobile-hanui'
      style.textContent = match.adapter.css + mobileMenu.css
      doc.head.appendChild(style)
      for (const [name, el] of [['frame', match.frame], ['sidebar', match.sidebar], ['sidebar-root', match.sidebarRoot], ['center', match.center], ['rightbar', match.rightbar], ['overlay', match.overlay]]) {
        if (el) journal.setAttribute(el, `data-hanui-${name}`, '')
      }
      html.classList.add(htmlClass)
      syncViews()
      let disposed = false
      return {
        syncViews,
        dispose() {
          if (disposed) return
          disposed = true
          mobileMenu.dispose()
          subviewJournal.dispose()
          currentViews = []
          journal.dispose()
          if (!hadClass) html.classList.remove(htmlClass)
        },
      }
    }

    function installMobileAttachmentMenu(doc, match, htmlClass) {
      const css = `@media (max-width:1023px) {
        html.${htmlClass} [data-hanui-center] .wSkVaW_composerSeat { background:#fff !important; }
        html.${htmlClass} [data-hanui-center] .wSkVaW_composerSeat::before,
        html.${htmlClass} [data-hanui-center] .wSkVaW_composerSeat::after { background:none !important; }
        html.${htmlClass} [data-hanui-attachment-menu] { background:#fff !important; padding:12px !important; border-radius:24px !important; max-height:min(420px,60vh) !important; max-height:min(420px,60dvh) !important; }
        html.${htmlClass} [data-hanui-attachment-grid] { display:grid !important; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; }
        html.${htmlClass} [data-hanui-attachment-grid] > [role=presentation] { display:none !important; }
        html.${htmlClass} [data-hanui-attachment-grid] > button { display:flex !important; flex-direction:column; justify-content:center; align-items:center; gap:10px; min-width:0; min-height:80px; padding:12px 6px; border:0; border-radius:18px; background:#f5f5f5; color:#171717; font:inherit; cursor:pointer; }
        html.${htmlClass} [data-hanui-attachment-grid] > button[aria-selected=true],
        html.${htmlClass} [data-hanui-attachment-grid] > button:focus-visible { background:#eaf1ff; outline:2px solid #4678ee; outline-offset:-2px; }
        html.${htmlClass} [data-hanui-attachment-grid] [data-hanui-tile-icon] { width:26px !important; height:26px !important; color:inherit; }
        html.${htmlClass} [data-hanui-attachment-grid] svg { width:26px; height:26px; }
        html.${htmlClass} [data-hanui-attachment-grid] [data-hanui-tile-label] { max-width:100% !important; font-size:15px; }
        html.${htmlClass} [data-hanui-tile-detail] { display:none !important; }
      }`
      let current = null
      let menuJournal = createDomJournal()
      let restorePicker = () => {}
      const reset = () => { restorePicker(); menuJournal.dispose(); menuJournal = createDomJournal(); current = null }
      const sync = () => {
        const menus = match.center.querySelectorAll('[data-trigger-menu]')
        const menu = menus.length === 1 ? menus[0] : null
        const grid = menu?.querySelector('[role="listbox"]')
        const rows = grid ? Array.from(grid.children).filter(el => el.getAttribute('role') === 'option' && !el.hasAttribute('data-hanui-album')) : []
        const validRows = rows.length > 0 && rows.every(row => row.tagName === 'BUTTON' && row.id?.startsWith('dsh-slash-option-command-') && Array.from(row.children).some(el => Array.from(el.classList).some(name => name.endsWith('_itemName'))))
        const roots = match.center.querySelectorAll('.uV2eYG_root')
        const root = roots.length === 1 ? roots[0] : null
        const inputs = root?.querySelectorAll('input[type="file"]') ?? []
        const picker = inputs.length === 1 ? inputs[0] : null
        if (!menu || !grid || !validRows || !picker || !root.contains(menu)) { reset(); return }
        const identity = [menu, grid, picker, ...rows, ...rows.flatMap(row => Array.from(row.children))]
        if (current && identity.length === current.length && identity.every((node, index) => node === current[index])) return
        reset()
        current = identity
        menuJournal.setAttribute(menu, 'data-hanui-attachment-menu', '')
        menuJournal.setAttribute(grid, 'data-hanui-attachment-grid', '')
        for (const row of rows) for (const child of row.children) {
          const classes = Array.from(child.classList)
          const marker = classes.some(name => name.endsWith('_itemIcon')) ? 'icon' : classes.some(name => name.endsWith('_itemName')) ? 'label' : 'detail'
          menuJournal.setAttribute(child, `data-hanui-tile-${marker}`, '')
        }
        const album = menuJournal.ownNode(doc.createElement('button'))
        album.type = 'button'
        album.setAttribute('role', 'option')
        album.setAttribute('aria-selected', 'false')
        album.setAttribute('data-hanui-album', '')
        album.setAttribute('aria-label', '相册')
        album.disabled = picker.disabled
        const icon = doc.createElementNS('http://www.w3.org/2000/svg', 'svg')
        icon.setAttribute('viewBox', '0 0 24 24')
        icon.setAttribute('fill', 'none')
        icon.setAttribute('stroke', 'currentColor')
        icon.setAttribute('stroke-width', '1.8')
        icon.setAttribute('aria-hidden', 'true')
        const path = doc.createElementNS('http://www.w3.org/2000/svg', 'path')
        path.setAttribute('d', 'M6 3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3ZM3 16l6-6 12 10M16 7h.01')
        icon.appendChild(path)
        album.appendChild(icon)
        const label = doc.createElement('span')
        label.textContent = '相册'
        album.appendChild(label)
        album.addEventListener('mousedown', event => event.preventDefault())
        album.addEventListener('click', () => {
          if (!match.alive || picker.disabled || !root.contains(picker) || !menu.contains(album)) return
          restorePicker()
          const original = picker.getAttribute('accept')
          picker.setAttribute('accept', 'image/*')
          restorePicker = () => {
            picker.removeEventListener('change', restorePicker)
            picker.removeEventListener('cancel', restorePicker)
            if (picker.getAttribute('accept') === 'image/*') {
              if (original === null) picker.removeAttribute('accept')
              else picker.setAttribute('accept', original)
            }
            restorePicker = () => {}
          }
          picker.addEventListener('change', restorePicker)
          picker.addEventListener('cancel', restorePicker)
          picker.click()
        })
        grid.insertBefore(album, rows[0])
      }
      return { css, sync, dispose() { reset() } }
    }

    /** Optional, website-neutral AndroidX WebMessage client. No DSH wire protocol. */
    const LIMITS = Object.freeze({ title: 120, body: 500, tag: 80, targetUrl: 2048, message: 16384, pending: 32 })

    function notificationPayload(value, origin) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('notification payload required')
      const out = {}
      for (const key of ['title', 'body', 'tag', 'targetUrl']) {
        const text = value[key]
        if (text === undefined && (key === 'tag' || key === 'targetUrl')) continue
        if (typeof text !== 'string' || text.length > LIMITS[key] || (key === 'title' && !text.trim())) {
          throw new TypeError(`invalid notification ${key}`)
        }
        out[key] = text
      }
      if (out.targetUrl !== undefined) {
        const url = new URL(out.targetUrl, origin)
        if (!/^https?:$/.test(url.protocol) || url.origin !== origin || url.username || url.password) throw new TypeError('notification target must have the current exact origin')
        out.targetUrl = url.href
        if (out.targetUrl.length > LIMITS.targetUrl) throw new TypeError('notification target too long')
      }
      return out
    }

    function createBridgeClient(win, { timeout = 10000 } = {}) {
      const bridge = win?.HanApp
      const pending = new Map()
      const previous = bridge?.onmessage
      let disposed = false
      let sequence = 0
      const prefix = win?.crypto?.randomUUID?.() ?? `hanui-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const origin = win?.location?.origin
      const available = !!bridge && typeof bridge.postMessage === 'function' && /^https?:\/\//.test(origin ?? '')
      const receive = (event) => {
        if (disposed || win.location.origin !== origin || win.HanApp !== bridge) return
        const data = event?.data
        if (typeof data !== 'string' || data.length > LIMITS.message) return
        let reply
        try { reply = JSON.parse(data) } catch { return }
        if (!reply || reply.version !== 1 || typeof reply.id !== 'string' || typeof reply.ok !== 'boolean') return
        const entry = pending.get(reply.id)
        if (!entry) return
        if (reply.ok && (!reply.result || typeof reply.result !== 'object' || Array.isArray(reply.result))) return
        if (!reply.ok && (typeof reply.error !== 'string' || reply.error.length > 500)) return
        pending.delete(reply.id)
        win.clearTimeout(entry.timer)
        if (reply.ok) entry.resolve(reply.result)
        else entry.reject(new Error(reply.error))
      }
      if (available) bridge.onmessage = receive
      function request(type, payload = {}) {
        if (disposed || !available || win.location.origin !== origin || win.HanApp !== bridge) return Promise.reject(new Error('HanApp unavailable'))
        if (!['pageReady', 'capabilities', 'requestNotificationPermission', 'showNotification'].includes(type)) return Promise.reject(new TypeError('unsupported HanApp request'))
        if (pending.size >= LIMITS.pending) return Promise.reject(new Error('too many HanApp requests'))
        try {
          payload = type === 'showNotification' ? notificationPayload(payload, origin) : {}
        } catch (error) { return Promise.reject(error) }
        const id = `${prefix}:${++sequence}`
        const message = JSON.stringify({ version: 1, id, type, payload })
        if (message.length > LIMITS.message) return Promise.reject(new TypeError('HanApp request too large'))
        return new Promise((resolve, reject) => {
          const timer = win.setTimeout(() => {
            pending.delete(id)
            reject(new Error('HanApp timeout'))
          }, timeout)
          pending.set(id, { resolve, reject, timer })
          try { bridge.postMessage(message) } catch (error) {
            win.clearTimeout(timer)
            pending.delete(id)
            reject(error)
          }
        })
      }
      return {
        available,
        request,
        dispose() {
          if (disposed) return
          disposed = true
          if (available && bridge.onmessage === receive) bridge.onmessage = previous
          for (const entry of pending.values()) {
            win.clearTimeout(entry.timer)
            entry.reject(new Error('HanApp disposed'))
          }
          pending.clear()
        },
      }
    }

    /** The caller owns business triggers; permission is requested only on explicit invocation. */
    function createNotificationHelper(win, bridge) {
      const browser = win?.Notification
      let disposed = false
      const notices = new Set()
      const assertActive = () => { if (disposed) throw new Error('notification helper disposed') }
      async function capabilities() {
        assertActive()
        if (bridge.available) {
          const result = await bridge.request('capabilities')
          assertActive()
          return result
        }
        return { bridgeVersion: 0, notifications: !!browser && browser.permission === 'granted', notificationPermission: !!browser && typeof browser.requestPermission === 'function' }
      }
      return {
        capabilities,
        async requestPermission({ isCurrent = () => true } = {}) {
          const assertCurrent = () => {
            assertActive()
            if (!isCurrent()) throw new Error('notification permission action retired')
          }
          assertCurrent()
          const caps = await capabilities()
          assertCurrent()
          if (bridge.available) {
            if (caps.notifications === true) return { granted: true }
            if (caps.notificationPermission !== true) return { granted: false }
            const result = await bridge.request('requestNotificationPermission')
            assertCurrent()
            return result
          }
          if (caps.notificationPermission !== true) return { granted: false }
          const permission = await browser.requestPermission()
          assertCurrent()
          return { granted: permission === 'granted' }
        },
        async show(value) {
          const payload = notificationPayload(value, win.location.origin)
          const caps = await capabilities()
          assertActive()
          if (caps.notifications !== true) return { shown: false, reason: 'permission-or-capability-unavailable' }
          if (bridge.available) {
            const result = await bridge.request('showNotification', payload)
            assertActive()
            return result
          }
          const notice = new browser(payload.title, { body: payload.body, tag: payload.tag })
          notices.add(notice)
          notice.onclose = () => notices.delete(notice)
          if (payload.targetUrl) notice.onclick = () => { win.location.assign(payload.targetUrl); notice.close() }
          return { shown: true }
        },
        dispose() {
          disposed = true
          for (const notice of notices) { notice.onclick = null; notice.onclose = null; notice.close() }
          notices.clear()
        },
      }
    }

    /** Private DOM fingerprints are quarantined here; missing parts mean no enhancement. */
    function createPrivateAdapters({ MOBILE_MQ, HTML_CLASS, ATTR_DETAILS }) {
        // Current @deepseek-ai/dsh-client-ui-layout AppFrame module classes
        const CLS = {
          frame: 'pI_x6G_frame',
          sidebar: 'pI_x6G_sidebarCol',
          center: 'pI_x6G_centerCol',
          details: 'pI_x6G_detailsCol',
          overlay: 'pI_x6G_overlayLayer',
          chatScroll: 'Md3f7G_scroll',
          chatOlder: 'Md3f7G_older',
        }
        const MSG = {
          actions: 'p-xYUq_actions',
          action: 'p-xYUq_action',
          timeStart: 'p-xYUq_timeStart',
          timeEnd: 'p-xYUq_timeEnd',
          runTimeDot: 'p-xYUq_runTimeDot',
        }
        const STATS = { root: 'FJxK0a_root', sep: 'FJxK0a_sep' }
        const INPUT = {
          root: 'uV2eYG_root',
          card: 'uV2eYG_card',
          row: 'uV2eYG_row',
          modes: 'uV2eYG_modes',
          select: 'uV2eYG_select',
          tools: 'uV2eYG_tools',
          trailing: 'uV2eYG_trailing',
          primary: 'uV2eYG_primary',
          add: 'uV2eYG_add',
          input: 'uV2eYG_input',
        }
        // Conversation session header (title / 轨迹 / AgentPreset「模式」)
        const HDR = {
          header: 'wSkVaW_header',
          headerBlank: 'wSkVaW_headerBlank',
          titleRow: 'wSkVaW_titleRow',
          titleCluster: 'wSkVaW_titleCluster',
          headerLeading: 'wSkVaW_headerLeading',
          headerCorner: 'wSkVaW_headerCorner',
          crumbs: 'wSkVaW_crumbs',
          headerActions: 'wSkVaW_headerActions',
          headerUtilities: 'wSkVaW_headerUtilities',
          tabs: 'wSkVaW_tabs',
        }
        const PRESET_LABEL = 'SVAs4q_label'
        // Subagent catalog (header actions trigger + dropdown menu)
        const SUBAGENT = {
          root: 'h8S2Va_root',
          trigger: 'h8S2Va_trigger',
          menu: 'h8S2Va_menu',
        }
        // User-questions panel (ask_user_question composer takeover)
        const QUESTION = {
          frame: 'Mbwy4a_frame',
          card: 'Mbwy4a_card',
          options: 'Mbwy4a_options',
          body: 'Mbwy4a_body',
          footer: 'Mbwy4a_footer',
        }
        // New-session / hero composer (choose workspace, glow, workspace row)
        const HERO = {
          composerHero: 'wSkVaW_composerHero',
          composerStack: 'wSkVaW_composerStack',
          heroGlow: 'wSkVaW_heroGlow',
          heroWorkspaceRow: 'wSkVaW_heroWorkspaceRow',
          scrollBody: 'wSkVaW_scrollBody',
          composerSeat: 'wSkVaW_composerSeat',
          root: 'wSkVaW_root',
          shellRoot: 'pXSMma_root',
          shellStack: 'pXSMma_stack',
          brandBody: 'pXSMma_body',
          shellBody: 'wSkVaW_body',
        }
        // Workspace section header — the row directly beside the workspace title:
        // search field, view-options (group/order) menu, and add-workspace (+)
        // button. These controls open sub-views / menus inside the drawer, so a tap
        // must NOT collapse the sidebar (previously the generic "actionable" branch
        // closed it → search / add-workspace flashed the drawer closed).
        const WS_HDR = {
          sectionHeader: 'qDHVXG_sectionHeader',
          search: 'qDHVXG_search',
          searchButton: 'qDHVXG_searchButton',
          searchInput: 'qDHVXG_searchInput',
          clearButton: 'qDHVXG_clearButton',
          iconButton: 'qDHVXG_iconButton',
          headerActions: 'qDHVXG_headerActions',
        }
        // Workspace sidebar session rows (div[role=treeitem], not <button>)
        const SIDEBAR_ROW = {
          session: 'YDXeBa_sessionRow',
          search: 'YDXeBa_searchResultRow',
          project: 'YDXeBa_projectRow',
          rowActions: 'YDXeBa_rowActions',
          iconButton: 'YDXeBa_iconButton',
        }
        // Tooltip bubble (hover label like 停止生成/发送消息/关闭) — position:fixed
        // with hover-time coordinates that don't follow the anchor when it moves.
        const TOOLTIP_BUBBLE = '_bubble_owhem_8'
        // Sidebar inner root (SidebarRoot) — carries an inline width from the desktop
        // three-column layout that is narrower than the phone drawer, leaving a
        // blank strip to the right of the collapse button.
        const SIDEBAR_ROOT = 'hHd-Xa_root'
        const SIDEBAR = {
          search: 'bhn1Oq_search', searchInput: 'bhn1Oq_searchInput', searchButton: 'bhn1Oq_searchButton',
          searchSlot: 'bhn1Oq_searchSlot', sectionHeader: 'bhn1Oq_sectionHeader', sectionLabel: 'bhn1Oq_sectionLabel', headerActions: 'bhn1Oq_headerActions',
          newSession: 'hHd-Xa_newSession', brand: 'hHd-Xa_brand', logoRow: 'hHd-Xa_logoRow',
          selected: 'YDXeBa_selected', sessionRow: 'YDXeBa_sessionRow', footer: 'hHd-Xa_footArea',
        }
        const RIGHTBAR = {
          panel: 'P3OORG_panel', panelBody: 'P3OORG_panelBody', surface: '_surface_6nhg2_125',
          tabLayout: '_tabLayout_6nhg2_134', tabCell: '_tabCell_6nhg2_142', tabHost: '_tabHost_6nhg2_162',
          tabHeader: '_tabHostHeader_6nhg2_177', tabBody: '_tabHostBody_6nhg2_181',
          tabStrip: '_tabStrip_6nhg2_237', stripTabs: '_stripTabs_6nhg2_257', stripTabSlot: '_slot_6nhg2_327', stripFill: '_stripFill_6nhg2_288',
          stripChrome: '_stripChrome_6nhg2_296', tooltipBubble: '_bubble_12mhf_1', tabTitle: 'P3OORG_tabTitle',
        }
        // Settings panel (two-column 800px sheet) — breaks on phones unless turned
        // into a full-screen single column.
        const SETTINGS = {
          overlay: 'VOzbGW_overlay',
          panel: 'VOzbGW_panel',
          nav: 'VOzbGW_nav',
          navCell: 'VOzbGW_navCell',
          navTitle: 'VOzbGW_navTitle',
          navList: 'VOzbGW_navList',
          content: 'VOzbGW_content',
          header: 'VOzbGW_header',
          options: 'VOzbGW_options',
          trigger: 'VOzbGW_trigger',
        }

        const CSS = `
    @media ${MOBILE_MQ} {
      /* Local chat: full width, never translated / squeezed */
      html.${HTML_CLASS} .${CLS.frame} {
        grid-template-columns: 0 minmax(0, 1fr) 0 !important;
        transition: none !important;
        transform: none !important;
      }

      html.${HTML_CLASS} .${CLS.frame} > [data-side] {
        display: none !important;
      }

      /* CENTER — pin to track 2 (1fr) so fixed side columns cannot starve chat */
      html.${HTML_CLASS} .${CLS.center} {
        grid-column: 2 !important;
        grid-row: 1 !important;
        display: flex !important;
        visibility: visible !important;
        opacity: 1 !important;
        position: relative !important;
        inset: auto !important;
        top: auto !important;
        right: auto !important;
        bottom: auto !important;
        left: auto !important;
        width: auto !important;
        max-width: none !important;
        height: 100% !important; /* keep the grid track's full height so the
                                   conversation root's height:100% chain survives —
                                   without it the composer scrolls out of view */
        align-self: stretch !important;
        min-height: 0 !important;
        min-width: 0 !important;
        margin: 0 !important;
        transform: none !important;
        translate: none !important;
        pointer-events: auto !important;
        overflow: visible !important; /* never clip the model/effort dropdowns that
                                        pop up or out of the center column */
        z-index: 1 !important;
      }

      /* Overlay stays a full-frame absolute layer; never steal the center track */
      html.${HTML_CLASS} .${CLS.overlay} {
        grid-column: 1 / -1 !important;
        grid-row: 1 !important;
      }

      /* SIDEBAR — left drawer; closed parked off-screen to the LEFT (not on center) */
      html.${HTML_CLASS} .${CLS.sidebar} {
        position: fixed !important;
        z-index: 50 !important;
        top: 0 !important;
        left: 0 !important;
        right: auto !important;
        bottom: 0 !important;
        width: min(100%, 360px) !important;
        max-width: 100% !important;
        height: 100% !important;
        height: 100dvh !important;
        margin: 0 !important;
        box-sizing: border-box !important;
        padding-top: env(safe-area-inset-top, 0px);
        padding-bottom: env(safe-area-inset-bottom, 0px);
        background: var(--dsw-specific-sidebar-fill, var(--dsw-alias-bg-base, #fff)) !important;
        border: none !important;
        border-right: 1px solid var(--dsw-alias-border-l2, rgba(0,0,0,.08)) !important;
        overflow: auto !important;
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: contain;
        transform: translate3d(-100%, 0, 0) !important;
        pointer-events: none !important;
        transition: transform 0.28s cubic-bezier(0.32, 0.72, 0, 1);
      }

      html.${HTML_CLASS} .${CLS.frame}:not([data-sidebar-collapsed]) .${CLS.sidebar} {
        transform: translate3d(0, 0, 0) !important;
        pointer-events: auto !important;
      }

      html.${HTML_CLASS} .${CLS.frame}:not([data-sidebar-collapsed]) .${CLS.sidebar} > * {
        width: 100% !important;
        max-width: none !important;
        animation: none !important;
      }
      /* The sidebar's inner root carries an inline width from the desktop
         three-column solve (e.g. 280px) that is narrower than the phone drawer
         (min(100%,360px)), leaving a blank strip right of the collapse button.
         Force the inner root to fill the drawer. */
      html.${HTML_CLASS} .${CLS.frame}:not([data-sidebar-collapsed]) .${SIDEBAR_ROOT} {
        width: 100% !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
      }
      html.${HTML_CLASS} .${CLS.frame}:not([data-sidebar-collapsed]) .${CLS.sidebar} [class*="Label"] {
        max-width: none !important;
        opacity: 1 !important;
        overflow: visible !important;
      }
      html.${HTML_CLASS} .${CLS.frame}:not([data-sidebar-collapsed]) .${CLS.sidebar} time,
      html.${HTML_CLASS} .${CLS.frame}:not([data-sidebar-collapsed]) .${CLS.sidebar} [class*="time"],
      html.${HTML_CLASS} .${CLS.frame}:not([data-sidebar-collapsed]) .${CLS.sidebar} [class*="Time"],
      html.${HTML_CLASS} .${CLS.frame}:not([data-sidebar-collapsed]) .${CLS.sidebar} [class*="meta"],
      html.${HTML_CLASS} .${CLS.frame}:not([data-sidebar-collapsed]) .${CLS.sidebar} [class*="Meta"] {
        flex: none;
        white-space: nowrap;
        position: static !important;
        transform: none !important;
        opacity: 1 !important;
      }

      /* DETAILS — left slide sheet for tool-row clicks */
      html.${HTML_CLASS} .${CLS.details} {
        position: fixed !important;
        z-index: 55 !important;
        top: 0 !important;
        left: 0 !important;
        right: auto !important;
        bottom: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
        height: 100% !important;
        height: 100dvh !important;
        margin: 0 !important;
        box-sizing: border-box !important;
        padding-top: env(safe-area-inset-top, 0px);
        padding-bottom: env(safe-area-inset-bottom, 0px);
        background: var(--dsw-alias-bg-base, #fff) !important;
        border: none !important;
        overflow: auto !important;
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: contain;
        transform: translate3d(-100%, 0, 0) !important;
        pointer-events: none !important;
        transition: transform 0.28s cubic-bezier(0.32, 0.72, 0, 1);
      }

      html.${HTML_CLASS}[${ATTR_DETAILS}] .${CLS.details} {
        transform: translate3d(0, 0, 0) !important;
        pointer-events: auto !important;
      }

      html.${HTML_CLASS}[${ATTR_DETAILS}] .${CLS.details} > * {
        width: 100% !important;
        max-width: none !important;
        min-height: 100%;
      }

      @media (prefers-reduced-motion: reduce) {
        html.${HTML_CLASS} .${CLS.sidebar},
        html.${HTML_CLASS} .${CLS.details} {
          transition: none !important;
        }
      }

      /* Message footer — line1 icons+time; line2 metrics (runMs inside timeEnd) */
      html.${HTML_CLASS} .${MSG.actions} {
        display: flex !important;
        flex-wrap: wrap !important;
        align-items: center !important;
        height: auto !important;
        min-height: 28px !important;
        gap: 6px 8px !important;
        row-gap: 4px !important;
        font-size: 12px;
      }
      html.${HTML_CLASS} .${MSG.timeStart},
      html.${HTML_CLASS} .${MSG.timeEnd} {
        display: contents !important;
      }
      html.${HTML_CLASS} .${MSG.runTimeDot}:first-of-type {
        flex: 0 0 100% !important;
        width: 100% !important;
        height: 0 !important;
        margin: 0 !important;
        opacity: 0 !important;
        overflow: hidden !important;
        pointer-events: none !important;
      }
      html.${HTML_CLASS} .${MSG.runTimeDot}:not(:first-of-type) {
        margin: 0 6px !important;
        font-size: 12px !important;
      }
      /* StatsLine composer dock — two lines; hide TTFT/tok/s */
      html.${HTML_CLASS} .${STATS.root} {
        white-space: normal !important;
        overflow: visible !important;
        text-overflow: unset !important;
        display: flex !important;
        flex-wrap: wrap !important;
        justify-content: center !important;
        align-items: baseline !important;
        gap: 2px 0 !important;
        row-gap: 2px !important;
        max-width: 100% !important;
        font-size: 12px !important;
        line-height: 18px !important;
        text-align: center !important;
        opacity: 0.8;
      }
      html.${HTML_CLASS} .${STATS.root} [data-dsh-stats="speeds"],
      html.${HTML_CLASS} .${STATS.root} [data-dsh-stats="sep-hide"] {
        display: none !important;
      }
      html.${HTML_CLASS} .${STATS.root} [data-dsh-stats-break] {
        flex: 0 0 100% !important;
        width: 100% !important;
        height: 0 !important;
        margin: 0 !important;
        overflow: hidden !important;
        pointer-events: none !important;
      }

      /* InputBar — single nowrap toolbar row (v15; undo v14 stack) */
      html.${HTML_CLASS} .${INPUT.root} {
        width: 100% !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
        padding-left: max(0px, env(safe-area-inset-left, 0px)) !important;
        padding-right: max(0px, env(safe-area-inset-right, 0px)) !important;
        padding-bottom: max(6px, env(safe-area-inset-bottom, 0px)) !important;
        overflow: visible !important; /* never clip model/effort popovers that pop up */
      }
      html.${HTML_CLASS} .${INPUT.card} {
        width: 100% !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
        gap: 8px !important;
        padding-top: 8px !important;
        border-radius: 18px !important;
        overflow: visible !important; /* was hidden — clips PermissionSelect */
      }
      html.${HTML_CLASS} .${INPUT.row} {
        display: flex !important;
        flex-wrap: nowrap !important;
        align-items: center !important;
        justify-content: flex-start !important;
        gap: 6px !important;
        padding: 2px 8px 8px !important;
        min-width: 0 !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }
      html.${HTML_CLASS} .${INPUT.tools} {
        flex: 0 1 auto !important; /* NOT 1 1 100% */
        display: flex !important;
        flex-wrap: nowrap !important;
        align-items: center !important;
        gap: 6px !important;
        min-width: 0 !important;
        max-width: none !important;
      }
      html.${HTML_CLASS} .${INPUT.modes} {
        flex: 0 1 auto !important; /* NOT 1 1 100% */
        display: flex !important;
        flex-wrap: nowrap !important;
        align-items: center !important;
        gap: 4px !important;
        min-width: 0 !important;
        max-width: min(42vw, 140px) !important;
        overflow: visible !important;
      }
      html.${HTML_CLASS} .${INPUT.select} {
        flex: 0 1 auto !important;
        width: auto !important;
        min-width: 0 !important;
        max-width: min(42vw, 140px) !important; /* compact; QA may use 36–42vw */
        min-height: 36px !important;
        height: 36px !important;
        font-size: 13px !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
      }
      html.${HTML_CLASS} .${INPUT.trailing} {
        flex: 1 1 auto !important; /* NOT 1 1 100% — same row */
        display: flex !important;
        flex-wrap: nowrap !important;
        justify-content: flex-end !important;
        align-items: center !important;
        gap: 6px !important;
        min-width: 0 !important;
        max-width: none !important;
      }
      html.${HTML_CLASS} .${INPUT.add} {
        width: 36px !important;
        height: 36px !important;
        flex: none !important;
      }
      html.${HTML_CLASS} .${INPUT.primary} {
        width: 40px !important;
        height: 40px !important;
        transform: none !important;
        flex: none !important;
      }

      /* Session header: title alone; 「模式」beside 轨迹 tabs */
      html.${HTML_CLASS} .${HDR.header} {
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) auto !important;
        grid-template-areas:
          "crumbs utilities"
          "tabs actions" !important;
        align-items: center !important;
        column-gap: 8px !important;
        row-gap: 4px !important;
        padding-left: 12px !important;
        padding-right: 12px !important;
      }
      html.${HTML_CLASS} .${HDR.titleRow},
      html.${HTML_CLASS} .${HDR.titleCluster} {
        display: contents !important;
      }
      html.${HTML_CLASS} .${HDR.crumbs} {
        grid-area: crumbs !important;
        min-width: 0 !important;
        max-width: 100% !important;
      }
      html.${HTML_CLASS} .${HDR.headerUtilities} {
        grid-area: utilities !important;
        justify-self: end !important;
      }
      html.${HTML_CLASS} .${HDR.tabs} {
        grid-area: tabs !important;
        justify-self: start !important;
        min-width: 0 !important;
      }
      html.${HTML_CLASS} .${HDR.headerActions} {
        grid-area: actions !important;
        justify-self: end !important;
        align-self: center !important;
        min-width: 0 !important;
        max-width: 100% !important;
        flex-wrap: wrap !important;
        gap: 4px 8px !important;
        overflow: visible !important; /* don't clip subagent/jobs buttons or their menus */
      }
      html.${HTML_CLASS} .${HDR.headerActions} .${PRESET_LABEL} {
        display: inline-flex !important;
        align-items: center !important;
        gap: 4px !important;
        max-width: 100% !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
        font-size: 12px !important;
        line-height: 18px !important;
      }

      /* Subagent catalog: keep the trigger visible and pull its dropdown out of
         the (previously clipped) header so the child-agent list is reachable. */
      html.${HTML_CLASS} .${SUBAGENT.root} {
        position: static !important;
      }
      html.${HTML_CLASS} .${SUBAGENT.menu} {
        position: fixed !important;
        top: env(safe-area-inset-top, 0px) !important;
        left: 8px !important;
        right: 8px !important;
        width: auto !important;
        max-width: none !important;
        max-height: min(70vh, 560px) !important;
        z-index: 120 !important;
      }

      /* User-questions panel: on phones it renders inside the sticky composer seat,
         where narrow height / overflow clipping leaves it half-visible or hidden.
         Lift it into a full-screen centered dialog with a mask so options are
         always reachable (desktop unchanged). */
      html.${HTML_CLASS} .${QUESTION.frame} {
        display: flex !important;
        visibility: visible !important;
        opacity: 1 !important;
        position: fixed !important;
        inset: 0 !important;
        z-index: 300 !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 12px !important;
        box-sizing: border-box !important;
        max-height: none !important;
        overflow: auto !important;
        -webkit-overflow-scrolling: touch;
        background: var(--dsw-alias-bg-mask-1, rgba(15,17,21,.5)) !important;
      }
      html.${HTML_CLASS} .${QUESTION.card} {
        width: 100% !important;
        max-width: min(560px, 100%) !important;
        max-height: min(85vh, 85dvh) !important;
        box-sizing: border-box !important;
        overflow: hidden !important;
        display: flex !important;
        flex-direction: column !important;
        background: var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-base, #fff)) !important;
        border-radius: 20px !important;
        box-shadow: var(--dsw-shadow-lv3, 0 12px 40px rgba(0,0,0,.2)) !important;
      }
      html.${HTML_CLASS} .${QUESTION.body} {
        flex: 1 1 auto !important;
        overflow-y: auto !important;
        -webkit-overflow-scrolling: touch;
        min-height: 0 !important;
      }
      html.${HTML_CLASS} .${QUESTION.footer} {
        flex: none !important;
      }

      /* New-session hero composer: full-width column that fills the viewport so
         the centered title stays mid-screen while the input bar docks at the
         bottom like a normal conversation (no giant blank gap below it). */
      html.${HTML_CLASS} .${HERO.composerHero} {
        width: 100% !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
        display: flex !important;
        flex-direction: column !important;
        min-height: 100% !important;
        padding-left: 8px !important;
        padding-right: 8px !important;
        padding-bottom: 16px !important;
        gap: 8px !important;
      }
      /* Title block (HeroShell) absorbs the extra vertical space and centers the
         headline inside it, keeping logo/text visually centered. */
      html.${HTML_CLASS} .${HERO.composerHero} .${HERO.shellRoot} {
        flex: 1 1 auto !important;
        min-height: 0 !important;
        height: auto !important;
        justify-content: center !important;
        padding: 24px 16px !important;
      }
      html.${HTML_CLASS} .${HERO.composerHero} .${HERO.shellStack} {
        max-width: 100% !important;
        width: 100% !important;
      }
      /* The input bar and workspace row stay flex:none at the bottom. */
      html.${HTML_CLASS} .${HERO.composerHero} .${INPUT.root} {
        flex: none !important;
        width: 100% !important;
        max-width: 100% !important;
      }
      html.${HTML_CLASS} .${HERO.heroGlow} {
        width: 100% !important;
        max-width: 100vw !important;
        opacity: 0.5 !important;
        left: 0 !important;
        right: 0 !important;
        transform: none !important;
      }
      html.${HTML_CLASS} .${HERO.heroWorkspaceRow} {
        box-sizing: border-box !important;
        padding-left: 8px !important;
        padding-right: 8px !important;
        flex-wrap: wrap !important;
        min-width: 0 !important;
        flex: none !important;
      }

      /* Tooltip bubbles (停止生成/发送消息/关闭 hover labels) are position:fixed
         with hover-time coordinates, so they don't follow their anchor when the
         composer/drawer scrolls or reflows on phones. Hide them on mobile — touch
         has no hover anyway, and aria-labels keep the text available to AT. */
      html.${HTML_CLASS} .${TOOLTIP_BUBBLE} {
        display: none !important;
      }

      /* Settings panel: desktop is an 800px two-column sheet (188px nav + content).
         On phones turn it full-screen single-column so the nav becomes a top strip
         and the content fills the viewport instead of overflowing / glitching. */
      html.${HTML_CLASS} .${SETTINGS.panel} {
        width: 100vw !important;
        max-width: 100vw !important;
        height: 100dvh !important;
        max-height: 100dvh !important;
        border-radius: 0 !important;
        flex-direction: column !important;
      }
      html.${HTML_CLASS} .${SETTINGS.panel} .${SETTINGS.nav} {
        flex-direction: row !important;
        flex-wrap: nowrap !important;
        flex: none !important;
        width: 100% !important;
        gap: 4px !important;
        padding: 10px 12px !important;
        overflow-x: auto !important;
        overflow-y: hidden !important;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none !important;
      }
      /* Each nav cell stays a fixed pill so the strip scrolls horizontally. */
      html.${HTML_CLASS} .${SETTINGS.panel} .${SETTINGS.nav} .${SETTINGS.navCell} {
        flex: 0 0 auto !important;
        width: auto !important;
        white-space: nowrap !important;
      }
      /* navTitle + navList lay out in a single scrollable row. */
      html.${HTML_CLASS} .${SETTINGS.panel} .${SETTINGS.nav} > div {
        flex-direction: row !important;
        flex-wrap: nowrap !important;
        flex: 0 0 auto !important;
        gap: 4px !important;
      }
      /* Hide the "设置" nav title on phones — the horizontally scrollable nav
         cells are self-explanatory and the title wastes vertical space. */
      html.${HTML_CLASS} .${SETTINGS.panel} .${SETTINGS.navTitle} {
        display: none !important;
      }
      html.${HTML_CLASS} .${SETTINGS.panel} .${SETTINGS.content} {
        flex: 1 1 auto !important;
        width: 100% !important;
        min-height: 0 !important;
      }
      html.${HTML_CLASS} .${SETTINGS.panel} .${SETTINGS.options} {
        overflow-y: auto !important;
        -webkit-overflow-scrolling: touch;
      }

      /* Keep iOS zoom guard */
      html.${HTML_CLASS} .${INPUT.input},
      html.${HTML_CLASS} textarea,
      html.${HTML_CLASS} input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"]) {
        font-size: 16px !important;
      }
    }

    .dshMobMenu {
      position: fixed;
      z-index: 60;
      top: calc(10px + env(safe-area-inset-top, 0px));
      left: calc(10px + env(safe-area-inset-left, 0px));
      width: 44px;
      height: 44px;
      border-radius: 12px;
      border: 1px solid var(--dsw-alias-border-l2, rgba(0,0,0,.12));
      background: var(--dsw-alias-button-floating-fill, #fff);
      color: var(--dsw-alias-label-primary, #0f1115);
      box-shadow: 0 2px 8px rgba(0,0,0,.12);
      display: none;
      align-items: center;
      justify-content: center;
      padding: 0;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      touch-action: none;
      user-select: none;
    }
    .dshMobMenu:active {
      background: var(--dsw-alias-button-floating-hover, #f3f4f6);
    }
    .dshMobMenu svg {
      width: 22px;
      height: auto;
      display: block;
    }
    .dshMobMenu[data-flash="true"] {
      border-color: var(--dsw-alias-label-primary, #0f1115);
      opacity: 0.55;
    }
    .dshMobBackdrop {
      position: fixed;
      inset: 0;
      z-index: 45;
      border: 0;
      margin: 0;
      padding: 0;
      background: rgba(15, 17, 21, 0.4);
      display: none;
      cursor: pointer;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
    }

    @media ${MOBILE_MQ} {
      .dshMobMenu[data-visible="true"] {
        display: inline-flex;
      }
      .dshMobBackdrop[data-visible="true"] {
        display: block;
      }
    }
    `


      const notificationCSS = `
    .dshMobNotifications { width: 100%; min-width: 0; box-sizing: border-box; padding: 0; color: var(--dsw-alias-label-primary,#111); display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
    .dshMobNotifications button { min-height: 44px; padding: 8px 10px; font: inherit; white-space: normal; }
    .dshMobNotifications[hidden] { display: none !important; }
    .dshMobNotifications .dshMobNotificationToggle { flex: 1 1 auto; min-width: 0; display: flex; align-items: center; justify-content: flex-start; gap: 8px; border: 0; border-radius: 12px; background: transparent; color: inherit; text-align: start; cursor: pointer; }
    .dshMobNotifications .dshMobNotificationToggle[aria-pressed="true"] { background: color-mix(in srgb,var(--dsw-alias-state-business-primary,#4169e1) 14%,var(--dsw-specific-sidebar-fill,#fff)); color: var(--dsw-alias-state-business-primary,#4169e1); }
    .dshMobNotifications .dshMobNotificationToggle:disabled { opacity: .55; cursor: not-allowed; }
    .dshMobNotifications .dshMobNotificationToggle:focus-visible, .dshMobNotifications .dshMobNotificationHelp:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary,#4169e1); outline-offset: 2px; }
    .dshMobNotifications .dshMobNotificationLabel { flex: 1 1 auto; min-width: 0; font-size: 14px; }
    .dshMobNotifications .dshMobNotificationState { font-size: 12px; }
    .dshMobNotifications .dshMobNotificationHelp { min-width: 44px; border: 0; border-radius: 10px; background: transparent; color: var(--dsw-alias-label-secondary,#667085); cursor: pointer; }
    .dshMobNotifications small, .dshMobNotifications span[role="status"] { flex-basis: 100%; padding: 0 10px 6px; font-size: 12px; overflow-wrap: anywhere; }
    `
      // The framework's contents wrapper has no width box. Only the audited root
      // directly inside that wrapper (or directly in the seat) may receive sizing.
      const sidebarRoot = sidebar => {
        if (sidebar.children.length !== 1) return null
        let root = sidebar.children[0]
        if (root.style?.display === 'contents') {
          if (root.children.length !== 1) return null
          root = root.children[0]
        }
        return root.classList.contains(SIDEBAR_ROOT) ? root : null
      }
      const legacy = {
        id: 'legacy-details-v16', css: CSS + notificationCSS,
        detect(doc, layout) {
          if (typeof layout?.toggleSidebar !== 'function' || typeof layout.openDetails !== 'function' || typeof layout.closeDetails !== 'function') return null
          const frame = doc.querySelector(`.${CLS.frame}`)
          if (!frame) return null
          const parts = ['sidebar', 'center', 'details', 'overlay'].map(key => frame.querySelector(`.${CLS[key]}`))
          if (parts.some(part => !part || part.parentElement !== frame)) return null
          return { adapter: legacy, frame, sidebar: parts[0], center: parts[1], details: parts[2], overlay: parts[3] }
        },
      }
      const modern = {
        id: 'rightbar-frame-audited-seats',
        css: `
    @media ${MOBILE_MQ} {
     html.${HTML_CLASS} [data-hanui-frame] { grid-template-columns: 0 minmax(0,1fr) 0 !important; }
     html.${HTML_CLASS} [data-hanui-center] { grid-column: 2 !important; grid-row: 1 !important; min-width: 0; }
     /* Both remaining in-flow columns need explicit tracks once the sidebar is fixed. */
     html.${HTML_CLASS} [data-hanui-rightbar] { grid-column: 3 !important; grid-row: 1 !important; }
     /* Let the fixed backdrop and drawer share a stacking plane. */
     html.${HTML_CLASS} [data-hanui-overlay] { z-index: auto !important; }
     html.${HTML_CLASS} [data-hanui-sidebar] { position: fixed; inset: 0 auto 0 0; width: min(88vw,360px); z-index: 50; display: none; overflow: auto; background: var(--dsw-specific-sidebar-fill,#f4f5f7); }
     html.${HTML_CLASS} [data-hanui-frame]:not([data-sidebar-collapsed]) [data-hanui-sidebar] { display: block; }
     html.${HTML_CLASS} [data-hanui-sidebar-root] { width: 100% !important; max-width: 100%; height: 100%; box-sizing: border-box; }
     /* These markers require the audited settings/header subtree, separately
        from the outer layout. Keep the official nodes and responsive modal size. */
     html.${HTML_CLASS} [data-hanui-settings-panel] { flex-direction: column !important; width: calc(100vw - 24px) !important; max-width: 560px; height: calc(100vh - 24px); height: calc(100dvh - 24px); max-height: calc(100dvh - 24px); min-width: 0; min-height: 0; box-sizing: border-box; overflow: hidden; }
     html.${HTML_CLASS} [data-hanui-settings-panel] > .${SETTINGS.nav} { flex: none; width: 100% !important; padding: 12px 12px 0 !important; gap: 0; }
     html.${HTML_CLASS} [data-hanui-settings-panel] .${SETTINGS.navTitle} { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
     html.${HTML_CLASS} [data-hanui-settings-panel] .${SETTINGS.navList} { flex-direction: row !important; width: 100%; min-width: 0; gap: 4px; overflow-x: auto; overflow-y: hidden; -webkit-overflow-scrolling: touch; }
     html.${HTML_CLASS} [data-hanui-settings-panel] .${SETTINGS.navCell} { flex: 0 0 auto; min-height: 44px; white-space: nowrap; padding: 8px 12px !important; font-size: 14px; }
     html.${HTML_CLASS} [data-hanui-settings-panel] > .${SETTINGS.content} { flex: 1 1 auto; width: 100%; min-width: 0; min-height: 0; overflow: hidden; display: flex; flex-direction: column; }
     html.${HTML_CLASS} [data-hanui-settings-panel] .${SETTINGS.options} { flex: 1 1 auto; min-height: 0; padding: 0 16px 20px !important; overflow-y: auto; overscroll-behavior: contain; }
     html.${HTML_CLASS} [data-hanui-settings-panel] .${SETTINGS.header} { flex: none; min-height: 48px !important; height: auto !important; padding: 8px 16px !important; }
     html.${HTML_CLASS} [data-hanui-settings-panel] .${SETTINGS.header} button { min-width: 44px; min-height: 44px; }
     html.${HTML_CLASS} [data-hanui-menu-clearance], html.${HTML_CLASS} [data-hanui-hero-header-clearance] { padding-inline-start: max(calc(44px + env(safe-area-inset-left,0px)), calc(var(--dsh-frame-leading-clearance,0px) - 20px)) !important; min-height: 44px; box-sizing: border-box; }
     html.${HTML_CLASS} [data-hanui-frame] > [data-side] { display: none; }
     html.${HTML_CLASS} [data-hanui-center] input:not([type=file]), html.${HTML_CLASS} [data-hanui-center] textarea, html.${HTML_CLASS} [data-hanui-center] [contenteditable=true] { font-size: 16px; }
    }
    ${notificationCSS}
     html.${HTML_CLASS} [data-hanui-sidebar] { background: var(--dsw-specific-sidebar-fill,#fff); }
     html.${HTML_CLASS} [data-hanui-sidebar] .${SIDEBAR.search} { background: var(--dsw-alias-bg-layer-1,#f3f4f6); border-radius: 999px; }
     html.${HTML_CLASS} [data-hanui-sidebar] [data-hanui-sidebar-search] { display: flex; flex-wrap: wrap; min-width: 0; height: auto !important; min-height: 36px; overflow: visible !important; }
     html.${HTML_CLASS} [data-hanui-sidebar-search] > .${SIDEBAR.searchSlot} { order: -1; max-width: none !important; flex: 0 0 100% !important; width: 100% !important; min-width: 0 !important; box-sizing: border-box; }
     html.${HTML_CLASS} [data-hanui-sidebar-search] .${SIDEBAR.search} { display: flex; align-items: center; width: 100% !important; max-width: none !important; min-width: 0; min-height: 44px; box-sizing: border-box; }
     html.${HTML_CLASS} [data-hanui-sidebar-search] .${SIDEBAR.searchInput} { flex: 1 1 auto; width: auto !important; min-width: 0; height: 44px; box-sizing: border-box; opacity: 1 !important; pointer-events: auto !important; color: var(--dsw-alias-label-primary,#111); background: transparent; border: 0; }
     html.${HTML_CLASS} [data-hanui-sidebar] .${SIDEBAR.selected} { background: rgba(65,118,230,.12); color: var(--dsw-alias-state-business-primary,#4169e1); border-radius: 16px; }
     @supports (background: color-mix(in srgb, blue 14%, white)) { html.${HTML_CLASS} [data-hanui-sidebar] .${SIDEBAR.selected} { background: color-mix(in srgb,var(--dsw-alias-state-business-primary,#4169e1) 14%,var(--dsw-specific-sidebar-fill,#fff)); } }
     html.${HTML_CLASS} [data-hanui-sidebar] .${SIDEBAR.footer} { padding-bottom: max(8px,env(safe-area-inset-bottom,0px)); }
     html.${HTML_CLASS} [data-hanui-hero-scroll] { justify-content: flex-end !important; }
     html.${HTML_CLASS} [data-hanui-hero-composer] { padding-bottom: 0 !important; }
     html.${HTML_CLASS} [data-hanui-hero-composer] .${HERO.heroWorkspaceRow} { margin-bottom: 10px !important; }
     html.${HTML_CLASS} [data-hanui-composer-card] { border-radius: 28px !important; }
     html.${HTML_CLASS} [data-hanui-composer-card] .${INPUT.modes} { gap: 8px; }
     html.${HTML_CLASS} [data-hanui-composer-card] .${INPUT.modes} > * { min-height: 44px; border-radius: 999px; }
     html.${HTML_CLASS} [data-hanui-composer-card] .${INPUT.tools} button,
     html.${HTML_CLASS} [data-hanui-composer-card] .${INPUT.trailing} button { min-height: 44px; }
     html.${HTML_CLASS} [data-hanui-composer-card] .${INPUT.add}, html.${HTML_CLASS} [data-hanui-composer-card] .${INPUT.primary} { min-width: 44px; }
     html.${HTML_CLASS} [data-hanui-composer-card] [data-slot="conversation.input.model"] button { min-height: 44px; }
     html.${HTML_CLASS} [data-hanui-composer-scroll] { max-height: min(336px,40vh); max-height: min(336px,40dvh); height: auto; overflow-y: auto; overscroll-behavior: contain; }
     html.${HTML_CLASS} [data-hanui-rightbar-strip] { box-sizing: border-box; min-height: 64px; padding-inline-start: 64px !important; }
     html.${HTML_CLASS} [data-hanui-rightbar-strip] [data-sidebar-right-mode], html.${HTML_CLASS} [data-hanui-rightbar-strip] [data-sidebar-right-toggle] { box-sizing: border-box; min-width: 44px; min-height: 44px; }
     html.${HTML_CLASS} [data-hanui-frame]:not([data-rightbar-collapsed]) [data-hanui-center] [data-sidebar-right-expand] { visibility: hidden; pointer-events: none; }
    .dshMobMenu {
      position: fixed;
      z-index: 60;
      top: calc(10px + env(safe-area-inset-top, 0px));
      left: calc(10px + env(safe-area-inset-left, 0px));
      width: 44px;
      height: 44px;
      border-radius: 12px;
      border: 1px solid var(--dsw-alias-border-l2, rgba(0,0,0,.12));
      background: var(--dsw-alias-button-floating-fill, #fff);
      color: var(--dsw-alias-label-primary, #0f1115);
      box-shadow: 0 2px 8px rgba(0,0,0,.12);
      display: none;
      align-items: center;
      justify-content: center;
      padding: 0;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      touch-action: none;
      user-select: none;
    }
    .dshMobMenu:active {
      background: var(--dsw-alias-button-floating-hover, #f3f4f6);
    }
    .dshMobMenu svg {
      width: 22px;
      height: auto;
      display: block;
    }
    .dshMobMenu[data-flash="true"] {
      border-color: var(--dsw-alias-label-primary, #0f1115);
      opacity: 0.55;
    }
    .dshMobMenuModern {
      top: calc(12px + env(safe-area-inset-top,0px));
      left: calc(12px + env(safe-area-inset-left,0px));
      border: 0;
      border-radius: 0;
      background: transparent;
      box-shadow: none;
      touch-action: manipulation;
      user-select: auto;
    }
    .dshMobMenuModern:active { background: transparent; }
    .dshMobMenuModern svg { width: 24px; height: 24px; }

    .dshMobBackdrop {
      position: fixed;
      inset: 0;
      z-index: 45;
      border: 0;
      margin: 0;
      padding: 0;
      background: rgba(15, 17, 21, 0.4);
      display: none;
      cursor: pointer;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
    }

    @media ${MOBILE_MQ} {
      .dshMobMenu[data-visible="true"] {
        display: inline-flex;
      }
      .dshMobBackdrop[data-visible="true"] {
        display: block;
      }
    }

    `,
        detect(doc, layout) {
          if (typeof layout?.toggleSidebar !== 'function' || typeof layout.openRightbar !== 'function' || typeof layout.closeRightbar !== 'function') return null
          const overlay = doc.querySelector('[data-shell-overlay]')
          const frame = overlay?.parentElement
          if (!frame) return null
          const children = Array.from(frame.children)
          const suffix = (el, name) => !!el && Array.from(el.classList).some(cls => cls.endsWith(`_${name}`))
          if (!suffix(frame, 'frame') || children.length < 4 || !suffix(overlay, 'overlayLayer') || !suffix(children[0], 'sidebarCol') || !suffix(children[1], 'centerCol') || !suffix(children[2], 'rightbarCol')) return null
          // Audited 0.1.6 has four seats; 0.2.1 adds the public bottom row before
          // overlay and a Darwin-only leading seat after it. Never skip arbitrary nodes.
          let bottom = null
          let overlayIndex = 3
          if (children[3]?.hasAttribute('data-shell-bottom')) {
            if (!suffix(children[3], 'bottomRow') || !children[2].hasAttribute('data-rightbar-col')) return null
            bottom = children[3]
            overlayIndex = 4
          }
          if (children[overlayIndex] !== overlay) return null
          let trailing = children.slice(overlayIndex + 1)
          let leading = null
          if (trailing[0]?.hasAttribute('data-shell-leading')) {
            if (!bottom || !suffix(trailing[0], 'leadingSeat') || doc.documentElement.getAttribute('data-platform') !== 'darwin') return null
            leading = trailing[0]
            trailing = trailing.slice(1)
          }
          if (trailing.some(el => !suffix(el, 'handle') || !['sidebar', 'rightbar'].includes(el.getAttribute('data-side')))) return null
          return { adapter: modern, frame, sidebar: children[0], sidebarRoot: sidebarRoot(children[0]), center: children[1], rightbar: children[2], overlay, bottom, leading }
        },
        focusInput(match, target) {
          if (!match.center.contains(target)) return null
          const card = modern.subviews(match).find(([name]) => name === 'composer-card')?.[1]
          const inputs = card?.querySelectorAll(`.${INPUT.input}`) ?? []
          const input = target.closest(`.${INPUT.input}`)
          return inputs.length === 1 && inputs[0] === input && input.getAttribute('contenteditable') === 'true' ? input : null
        },
        historyTarget(match, target) {
          if (!target.hasAttribute('data-conversation-scroll') || !match.center.contains(target)) return null
          const lists = target.querySelectorAll(`.${CLS.chatScroll}`)
          if (lists.length !== 1 || lists[0].closest('[data-conversation-scroll]') !== target) return null
          const columns = lists[0].querySelectorAll('[data-chat-flow]')
          if (columns.length !== 1 || columns[0].parentElement !== lists[0]) return null
          const olderRows = columns[0].querySelectorAll(`.${CLS.chatOlder}`)
          if (olderRows.length !== 1 || olderRows[0].parentElement !== columns[0]) return null
          const row = olderRows[0]
          const button = row.children.length === 1 ? row.children[0] : null
          return button?.tagName === 'BUTTON' && button.getAttribute('type') === 'button' ? { scroller: target, button } : null
        },
        isNewSession(match, target) {
          const root = sidebarRoot(match.sidebar)
          if (!root || !root.contains(target)) return false
          const button = target.closest(`.${SIDEBAR.newSession}, .${SIDEBAR.brand}`)
          if (button?.tagName !== 'BUTTON' || button.getAttribute('type') !== 'button' || button.disabled) return false
          if (button.classList.contains(SIDEBAR.newSession)) {
            return button.parentElement === root && root.querySelectorAll(`.${SIDEBAR.newSession}`).length === 1
          }
          return button.parentElement?.classList.contains(SIDEBAR.logoRow) && button.parentElement.parentElement === root && root.querySelectorAll(`.${SIDEBAR.brand}`).length === 1
        },
        subviews(match) {
          const markers = []
          const childrenAre = (node, classes) => !!node && node.children.length === classes.length && classes.every((cls, index) => node.children[index].classList.contains(cls))
          const direct = (node, predicate) => node ? Array.from(node.children).filter(predicate) : []
          const directSlot = (node, name) => {
            const slots = direct(node, child => child.getAttribute('data-slot') === name)
            return slots.length === 1 ? slots[0] : null
          }
          const directClass = (node, className, attrs = []) => {
            const nodes = direct(node, child => child.classList.contains(className) && attrs.every(([name, value]) => value === undefined ? child.hasAttribute(name) : child.getAttribute(name) === value))
            return nodes.length === 1 ? nodes[0] : null
          }
          const exactlyOne = (root, className, attrs = []) => {
            const nodes = Array.from(root.querySelectorAll(`.${className}`)).filter(node => attrs.every(([name, value]) => value === undefined ? node.hasAttribute(name) : node.getAttribute(name) === value))
            return nodes.length === 1 ? nodes[0] : null
          }
          const doc = match.frame.ownerDocument
          for (const panel of doc?.querySelectorAll(`.${SETTINGS.panel}`) ?? []) {
            const overlay = panel.parentElement
            if (panel.getAttribute('data-shortcut-modal') !== 'settings' || !overlay?.classList.contains(SETTINGS.overlay) || overlay.getAttribute('role') !== 'presentation' || overlay.parentElement !== doc.body) continue
            if (panel.getAttribute('role') !== 'dialog' || !childrenAre(panel, [SETTINGS.nav, SETTINGS.content])) continue
            const [nav, content] = panel.children
            if (nav.tagName !== 'NAV' || !childrenAre(nav, [SETTINGS.navTitle, SETTINGS.navList]) || !childrenAre(content, [SETTINGS.header, SETTINGS.options])) continue
            if (Array.from(nav.children[1].children).some(cell => cell.tagName !== 'BUTTON' || !cell.classList.contains(SETTINGS.navCell))) continue
            markers.push(['settings-panel', panel])
          }
          for (const header of match.center.querySelectorAll(`.${HDR.header}`)) {
            if (header.tagName !== 'HEADER' || header.children.length !== 2) continue
            const [leading, wrapper] = header.children
            if (!leading.classList.contains(HDR.headerLeading) || !leading.hasAttribute('data-conversation-header-leading') || wrapper.getAttribute('data-slot') !== 'conversation.session.header') continue
            const [row, tabs] = wrapper.children
            if (wrapper.children.length < 1 || wrapper.children.length > 2 || !row.classList.contains(HDR.titleRow)) continue
            if (tabs && (!tabs.classList.contains(HDR.tabs) || !tabs.hasAttribute('data-conversation-tabs'))) continue
            if (!childrenAre(row, [HDR.titleCluster, HDR.headerUtilities, HDR.headerCorner])) continue
            if (!childrenAre(row.children[0], [HDR.crumbs, HDR.headerActions]) || row.children[0].children[0].tagName !== 'NAV') continue
            markers.push(['menu-clearance', row])
          }
          const activeMain = directSlot(match.center, 'main')
          const activeConversation = activeMain && directSlot(activeMain, 'main.conversation')
          const activeRoot = activeConversation && directClass(activeConversation, HERO.root, [['data-phase', 'active']])
          const activeHeaderSlot = activeRoot && directSlot(activeRoot, 'conversation.header')
          const activeHeader = activeHeaderSlot?.children.length === 1 ? activeHeaderSlot.children[0] : null
          const activeBody = activeRoot && directClass(activeRoot, HERO.shellBody)
          const activeRow = markers.find(([name]) => name === 'menu-clearance')?.[1]
          if (activeMain?.children.length === 1 && activeConversation?.children.length === 1 && activeRoot?.children.length === 2 && activeRoot.children[0] === activeHeaderSlot && activeRoot.children[1] === activeBody && activeHeader?.tagName === 'HEADER' && activeHeader.classList.contains(HDR.header) && !activeHeader.classList.contains(HDR.headerBlank) && activeHeader.children.length === 2 && activeRow?.parentElement === activeHeader.children[1]) {
            markers.push(['main-header-root', activeRow])
          }
          const sidebar = match.sidebarRoot
          if (sidebar?.classList.contains(SIDEBAR_ROOT)) {
            const searchHeaders = Array.from(sidebar.querySelectorAll(`.${SIDEBAR.sectionHeader}`)).filter(header => {
              if (header.children.length !== 5) return false
              const [label, slot, actions, trailing, tail] = header.children
              if (!label.classList.contains(SIDEBAR.sectionLabel) || !slot.classList.contains(SIDEBAR.searchSlot) || !actions.classList.contains(SIDEBAR.headerActions) || trailing.tagName !== 'SPAN' || tail.tagName !== 'DIV') return false
              if (slot.children.length !== 1 || !slot.children[0].classList.contains(SIDEBAR.search)) return false
              const searchRoot = slot.children[0]
              if (searchRoot.children.length !== 2) return false
              const [button, input] = searchRoot.children
              return button.tagName === 'BUTTON' && button.classList.contains(SIDEBAR.searchButton) && button.getAttribute('aria-label') === '搜索会话' && input.tagName === 'INPUT' && input.classList.contains(SIDEBAR.searchInput) && input.getAttribute('placeholder') === '搜索会话名称'
            })
            const search = exactlyOne(sidebar, SIDEBAR.search)
            const footer = exactlyOne(sidebar, SIDEBAR.footer)
            const rows = Array.from(sidebar.querySelectorAll(`.${SIDEBAR.sessionRow}`))
            if (searchHeaders.length === 1 && search && search.querySelectorAll(`.${SIDEBAR.searchInput}`).length === 1) markers.push(['sidebar-search', searchHeaders[0]])
            if (footer && rows.length && rows.every(row => row.getAttribute('role') === 'treeitem')) markers.push(['sidebar-content', sidebar])
          }
          const composer = exactlyOne(match.center, INPUT.root)
          const card = composer && exactlyOne(composer, INPUT.card, [['data-composer-card', 'true']])
          if (card && exactlyOne(card, INPUT.input, [['data-composer-input', 'true']]) && exactlyOne(card, INPUT.modes) && exactlyOne(card, INPUT.trailing)) {
            markers.push(['composer-card', card])
            const inputScrolls = card.querySelectorAll('[data-input-scroll]')
            if (inputScrolls.length === 1) markers.push(['composer-scroll', inputScrolls[0]])
          }
          const main = directSlot(match.center, 'main')
          const conversation = main && directSlot(main, 'main.conversation')
          const heroRoot = conversation && directClass(conversation, HERO.root, [['data-phase', 'hero']])
          const heroHeaderSlot = heroRoot && directSlot(heroRoot, 'conversation.header')
          const heroHeader = heroHeaderSlot?.children.length === 1 ? heroHeaderSlot.children[0] : null
          const heroBody = heroRoot && directClass(heroRoot, HERO.shellBody)
          const scrollBody = heroBody && directClass(heroBody, HERO.scrollBody)
          const composerSeat = scrollBody && directClass(scrollBody, HERO.composerSeat, [['data-composer-seat', '']])
          const composerSlot = composerSeat && directSlot(composerSeat, 'conversation.composer')
          const chain = composerSlot?.children.length === 1 && composerSlot.children[0].getAttribute('data-chain-overlay-fallback') === 'conversation.composer' ? composerSlot.children[0] : null
          const hero = chain && directClass(chain, HERO.composerStack) && directClass(chain, HERO.composerHero) === directClass(chain, HERO.composerStack)
            ? directClass(chain, HERO.composerStack)
            : null
          const scrollChildren = Array.from(scrollBody?.children ?? [])
          const rootChainMatches = main?.children.length === 1 && conversation?.children.length === 1 && heroRoot?.children.length === 2 && heroRoot.children[0] === heroHeaderSlot && heroRoot.children[1] === heroBody && heroBody?.children.length === 1 && scrollChildren.length === 2 && scrollChildren.includes(composerSeat) && scrollChildren.filter(child => child.getAttribute('data-slot') === 'conversation.session').length === 1 && composerSeat?.children.length === 1 && composerSlot?.children.length === 1 && chain?.children.length === 1
          if (rootChainMatches && heroHeader?.tagName === 'HEADER' && heroHeader.classList.contains(HDR.header) && heroHeader.classList.contains(HDR.headerBlank) && heroHeader.children.length === 2 && heroBody && scrollBody && composerSeat && composerSlot && chain && hero) {
            const [leading, sessionHeader] = heroHeader.children
            const leadingSlot = directSlot(leading, 'conversation.header.leading')
            const titleRow = sessionHeader.getAttribute('data-slot') === 'conversation.session.header' && sessionHeader.children.length === 1 ? sessionHeader.children[0] : null
            const corner = titleRow && directClass(titleRow, HDR.headerCorner, [['data-conversation-header-corner', '']])
            const cornerSlot = directSlot(corner, 'conversation.session.header.corner')
            const cornerButton = cornerSlot?.children.length === 1 && cornerSlot.children[0].tagName === 'BUTTON' && cornerSlot.children[0].getAttribute('data-sidebar-right-expand') === 'true' ? cornerSlot.children[0] : null
            const brandRoot = directClass(hero, HERO.shellRoot)
            const brandStack = brandRoot && directClass(brandRoot, HERO.shellStack)
            const brandBody = brandStack && directClass(brandStack, HERO.brandBody)
            const workspaceRow = directClass(hero, HERO.heroWorkspaceRow)
            const inputDock = directSlot(hero, 'conversation.input.dock')
            const composerBar = directSlot(hero, 'conversation.composer.bar')
            const heroInput = composerBar && directClass(composerBar, INPUT.root)
            if (leading.classList.contains(HDR.headerLeading) && leading.hasAttribute('data-conversation-header-leading') && leadingSlot && leadingSlot.children.length === 0 && titleRow?.classList.contains(HDR.titleRow) && titleRow.children.length === 1 && corner && corner.children.length === 1 && cornerSlot && cornerSlot.children.length === 1 && cornerButton && brandRoot?.children.length === 1 && brandStack && brandBody?.children.length === 0 && workspaceRow && inputDock && composerBar && composerBar.children.length === 1 && heroInput) {
              markers.push(['hero-header-clearance', titleRow])
              markers.push(['main-header-root', titleRow])
              markers.push(['hero-composer', hero])
              markers.push(['hero-scroll', scrollBody])
            }
          }
          if (match.frame.hasAttribute('data-rightbar-fullscreen')) {
            const panel = exactlyOne(match.rightbar, RIGHTBAR.panel)
            const panelBody = panel && exactlyOne(panel, RIGHTBAR.panelBody)
            const surface = panelBody && exactlyOne(panelBody, RIGHTBAR.surface, [['data-dockkit-surface', 'true']])
            const tabLayout = surface && exactlyOne(surface, RIGHTBAR.tabLayout)
            const layoutChildren = tabLayout ? Array.from(tabLayout.children) : []
            const tabCells = layoutChildren.filter(node => node.classList.contains(RIGHTBAR.tabCell) && node.getAttribute('data-dockkit-host') === 'dock')
            const paneHosts = tabCells.flatMap(candidate => Array.from(candidate.children).filter(node => node.classList.contains(RIGHTBAR.tabHost) && node.hasAttribute('data-dockkit-pane') && node.getAttribute('data-dockkit-pane-active') === 'true'))
            const host = paneHosts.length === 1 ? paneHosts[0] : null
            const cell = host?.parentElement?.classList.contains(RIGHTBAR.tabCell) && host.parentElement.getAttribute('data-dockkit-host') === 'dock' ? host.parentElement : null
            const header = host && directClass(host, RIGHTBAR.tabHeader)
            const body = host && directClass(host, RIGHTBAR.tabBody)
            const strip = header && directClass(header, RIGHTBAR.tabStrip, [['role', 'tablist'], ['data-dockkit-strip', host.getAttribute('data-dockkit-pane')]])
            const tabs = strip && directClass(strip, RIGHTBAR.stripTabs, [['role', 'presentation'], ['data-dockkit-strip-tabs']])
            const fill = strip && directClass(strip, RIGHTBAR.stripFill, [['data-dockkit-strip-fill', 'true']])
            const chrome = strip && directClass(strip, RIGHTBAR.stripChrome, [['data-dockkit-strip-chrome', 'true']])
            const stripChildren = strip ? Array.from(strip.children) : []
            const chromeChildren = chrome ? Array.from(chrome.children) : []
            const splitHint = stripChildren.find(node => node.tagName === 'SPAN')
            const split = splitHint?.querySelector('[data-dockkit-split-button]')
            const addTabs = stripChildren.filter(node => node.hasAttribute('data-dockkit-add-tab'))
            const tabNodes = tabs ? Array.from(tabs.children) : []
            const activeTabs = tabNodes.filter(node => node.getAttribute('data-dockkit-tab') !== null && node.getAttribute('role') === 'tab')
            const emptyTabSlots = tabNodes.filter(node => {
              if (node.tagName !== 'DIV' || !node.classList.contains(RIGHTBAR.stripTabSlot) || node.children.length !== 0 || typeof node.textContent !== 'string' || node.textContent.trim() !== '') return false
              const attributeNames = Array.from(node.attributes ?? []).map(attribute => Array.isArray(attribute) ? attribute[0] : attribute.name)
              return attributeNames.length === 1 && attributeNames[0] === 'class'
            })
            const selectedTabs = activeTabs.filter(node => node.getAttribute('aria-selected') === 'true')
            const modeButtons = chromeChildren.filter(node => node.tagName === 'BUTTON' && node.getAttribute('type') === 'button' && node.classList.contains('P3OORG_iconButton') && node.getAttribute('data-sidebar-right-mode') === 'push')
            const toggleButtons = chromeChildren.filter(node => node.tagName === 'BUTTON' && node.getAttribute('type') === 'button' && node.classList.contains('P3OORG_iconButton') && node.getAttribute('data-sidebar-right-toggle') === 'true')
            const tooltipBubbles = chromeChildren.filter(node => node.tagName === 'SPAN' && node.classList.contains(RIGHTBAR.tooltipBubble) && node.getAttribute('data-side') === 'bottom' && node.getAttribute('data-align') === 'center' && node.getAttribute('data-has-shortcut') === 'true' && node.getAttribute('role') === 'tooltip' && ['收起侧边栏 Ctrl + Shift + B', '退出全屏 Ctrl + Alt + Enter'].includes(node.getAttribute('aria-label')))
            const toolbar = chrome && modeButtons.length === 1 && toggleButtons.length === 1 && tooltipBubbles.length <= 1 && (chromeChildren.length === 2 || chromeChildren.length === 3) && chromeChildren.every(node => modeButtons.includes(node) || toggleButtons.includes(node) || tooltipBubbles.includes(node))
            const activeTab = tabNodes.length === activeTabs.length + emptyTabSlots.length && emptyTabSlots.length <= 1 && tabNodes.every(node => activeTabs.includes(node) || emptyTabSlots.includes(node)) && activeTabs.length > 0 && selectedTabs.length === 1 && new Set(activeTabs.map(node => node.getAttribute('data-dockkit-tab'))).size === activeTabs.length ? selectedTabs[0] : null
            const activeId = activeTab?.getAttribute('data-dockkit-tab') ?? null
            const title = activeTab && exactlyOne(activeTab, RIGHTBAR.tabTitle, [['data-sidebar-right-tab', activeId]])
            const knownStripOrder = strip && stripChildren[0] === tabs && stripChildren.includes(fill) && stripChildren.includes(splitHint) && stripChildren.includes(chrome) && ((stripChildren.length === 4 && addTabs.length === 0) || (stripChildren.length === 5 && addTabs.length === 1 && stripChildren[1] === addTabs[0]))
            const titleSlots = title ? Array.from(title.querySelectorAll('[data-slot]')).filter(slot => slot.getAttribute('data-slot') === 'sidebar.right.pane.tab.title') : []
            const companionCells = cell ? tabCells.filter(candidate => candidate !== cell) : []
            const companionCellIsKnownEmpty = companionCells.length === 1 && layoutChildren.length === 2 && companionCells[0].children.length === 1 && companionCells[0].getAttribute('data-dockkit-host') === 'dock' && (() => {
              const companionHost = directClass(companionCells[0], RIGHTBAR.tabHost, [['data-dockkit-pane-active', 'true']])
              const companionHeader = companionHost && directClass(companionHost, RIGHTBAR.tabHeader)
              const companionBody = companionHost && directClass(companionHost, RIGHTBAR.tabBody)
              return companionHost?.children.length === 2 && companionHost.getAttribute('data-dockkit-content') && !companionHost.hasAttribute('data-dockkit-pane') && companionHeader?.children.length === 0 && companionBody?.children.length === 0
            })()
            const knownCellLayout = cell && cell.children.length === 1 && tabCells.length === layoutChildren.length && (tabCells.length === 1 || (tabCells.length === 2 && companionCellIsKnownEmpty))
            const tabBody = body && directClass(body, 'P3OORG_tabBody', [['data-sidebar-right-tab', activeId]])
            if (panelBody && surface && tabLayout && knownCellLayout && host && header && body && strip && tabs && fill && chrome && tabBody && title && split && toolbar && knownStripOrder && activeId && title.getAttribute('data-sidebar-right-tab') === activeId && titleSlots.length === 1) {
              markers.push(['rightbar-strip', strip])
            }
          }
          return markers
        },
        navigationGuard(match) {
          const hasContribution = slot => !!slot && (slot.children.length > 0 || (typeof slot.textContent === 'string' && slot.textContent.trim().length > 0))
          if (match.leading?.children?.length) return 'incompatible'
          const slots = Array.from(match.center.querySelectorAll('[data-slot]'))
          const leadingSlots = slots.filter(slot => slot.getAttribute('data-slot') === 'conversation.header.leading')
          if (Array.from(leadingSlots).some(hasContribution)) return 'incompatible'
          const views = modern.subviews(match)
          const isVisible = (node) => {
            if (!node) return false
            const rect = typeof node.getBoundingClientRect === 'function' ? node.getBoundingClientRect() : null
            if (rect && (!(rect.width > 0) || !(rect.height > 0))) return false
            const view = node.ownerDocument?.defaultView
            if (typeof view?.getComputedStyle === 'function') {
              const style = view.getComputedStyle(node)
              if (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse') return false
            }
            return true
          }
          if (match.frame.hasAttribute('data-rightbar-fullscreen')) {
            const strip = views.find(([name]) => name === 'rightbar-strip')?.[1]
            return strip && isVisible(strip) ? 'ready' : 'incompatible'
          }
          const header = views.find(([name]) => name === 'menu-clearance')?.[1]
          const hero = views.find(([name]) => name === 'hero-composer')?.[1]
          const headers = match.center.querySelectorAll(`.${HDR.header}`)
          const semanticHeaders = match.center.querySelectorAll('header')
          const sessionSlots = slots.filter(slot => slot.getAttribute('data-slot') === 'conversation.session.header')
          const publicHeaderSlots = slots.filter(slot => slot.getAttribute('data-slot') === 'conversation.header')
          const mainCandidates = slots.filter(slot => ['main', 'main.conversation'].includes(slot.getAttribute('data-slot')))
          const verifiedMainRoot = views.some(([name]) => name === 'main-header-root')
          const heroes = match.center.querySelectorAll(`.${HERO.composerHero}`)
          const composers = match.center.querySelectorAll(`.${INPUT.root}`)
          const heroHeader = views.find(([name]) => name === 'hero-header-clearance')?.[1]
          const headerAnchor = header ?? heroHeader
          const publicSlotMatchesHeader = publicHeaderSlots.length === 1 && publicHeaderSlots[0].children.length === 1 && publicHeaderSlots[0].children[0] === semanticHeaders[0]
          const validHeader = headerAnchor && isVisible(headerAnchor) && isVisible(semanticHeaders[0]) && headers.length === 1 && semanticHeaders.length === 1 && sessionSlots.length === 1 && publicSlotMatchesHeader && headerAnchor.parentElement === sessionSlots[0] && sessionSlots[0].parentElement === semanticHeaders[0] && (!heroHeader || !!hero)
          if (mainCandidates.length && !verifiedMainRoot) {
            const pendingMain = mainCandidates.some(slot => slot.children.length === 0)
            return pendingMain ? 'pending' : 'incompatible'
          }
          if (headers.length || semanticHeaders.length || sessionSlots.length) {
            if (validHeader) return 'ready'
            const incompleteHeader = Array.from(semanticHeaders).some(header => header.children.length === 0) || Array.from(sessionSlots).some(slot => slot.children.length === 0)
            return incompleteHeader ? 'pending' : 'incompatible'
          }
          if (hero && isVisible(hero) && publicHeaderSlots.length === 0) return 'ready'
          if (!headers.length && !semanticHeaders.length && !sessionSlots.length && !publicHeaderSlots.length && !mainCandidates.length && !heroes.length && !composers.length) return 'not-applicable'
          const incompleteHeader = Array.from(publicHeaderSlots).some(slot => !hasContribution(slot))
          const incompleteHero = Array.from(heroes).some(hero => hero.children.length === 0)
          return incompleteHeader || incompleteHero ? 'pending' : 'incompatible'
        },
      }
      return { legacy, modern, CLS, MSG, STATS, INPUT, HDR, PRESET_LABEL, SUBAGENT, QUESTION, HERO, WS_HDR, SIDEBAR_ROW, TOOLTIP_BUBBLE, SIDEBAR_ROOT, SIDEBAR, RIGHTBAR, SETTINGS }
    }

    function detectLayout(doc, layout, adapters) {
      try { return adapters.modern.detect(doc, layout) ?? adapters.legacy.detect(doc, layout) } catch { return null }
    }

    /** Only the proven UiSession.pendingInteractions observable, never invented remote events. */
    function observeNeedsAction(source, { enabled, show, onFailure = () => {}, onUnsupported = onFailure }) {
      if (typeof source?.getSnapshot !== 'function' || typeof source.subscribe !== 'function') return null
      let disposed = false
      let previous = new Set()
      let off
      const identities = () => {
        const snapshot = source.getSnapshot()
        if (!(snapshot instanceof Map)) throw new TypeError('unsupported pending interaction snapshot')
        const next = new Set()
        for (const [sessionId, interaction] of snapshot) {
          if (!interaction || typeof interaction.key !== 'string' || !interaction.key || typeof interaction.kind !== 'string' || interaction.sessionId !== sessionId) throw new TypeError('unsupported pending interaction value')
          next.add(JSON.stringify([sessionId, interaction.kind, interaction.key]))
        }
        return next
      }
      try { previous = identities() } catch { return null }
      const update = () => {
        if (disposed) return
        let next
        try { next = identities() } catch { disposed = true; off?.(); onUnsupported(); return }
        const fresh = [...next].some(key => !previous.has(key))
        for (const key of next) previous.add(key)
        if (previous.size > 4096) { disposed = true; off?.(); onUnsupported(); return }
        if (fresh && enabled()) Promise.resolve().then(() => {
          if (!disposed && enabled()) return show()
        }).catch(onFailure)
      }
      try { off = source.subscribe(update) } catch { return null }
      if (typeof off !== 'function') return null
      return () => { disposed = true; off() }
    }

    const adapters = createPrivateAdapters({ MOBILE_MQ, HTML_CLASS, ATTR_DETAILS })
    const { CLS, STATS, INPUT, WS_HDR, SIDEBAR_ROW, SETTINGS } = adapters

    function shellDisabled() {
      try {
        if (typeof location === 'undefined') return false
        if (new URLSearchParams(location.search).get('mobileShell') === '0') return true
        if (localStorage.getItem('dsh-mobile-shell') === '0') return true
      } catch (_) {}
      return false
    }

    function getLayout(proxy) {
      return proxy
    }

    function defaultFabPos() {
      return { left: 10, top: 10 }
    }

    function clampFabPos(left, top) {
      const vw = typeof window !== 'undefined' ? window.innerWidth : 375
      const vh = typeof window !== 'undefined' ? window.innerHeight : 667
      const maxX = Math.max(FAB_MARGIN, vw - FAB_SIZE - FAB_MARGIN)
      const maxY = Math.max(FAB_MARGIN, vh - FAB_SIZE - FAB_MARGIN)
      return {
        left: Math.min(maxX, Math.max(FAB_MARGIN, left)),
        top: Math.min(maxY, Math.max(FAB_MARGIN, top)),
      }
    }

    function readFabPos() {
      try {
        const raw = localStorage.getItem(FAB_POS_KEY)
        if (!raw) return null
        const parsed = JSON.parse(raw)
        if (
          typeof parsed?.left !== 'number' ||
          typeof parsed?.top !== 'number' ||
          !Number.isFinite(parsed.left) ||
          !Number.isFinite(parsed.top)
        ) {
          return null
        }
        return clampFabPos(parsed.left, parsed.top)
      } catch (_) {
        return null
      }
    }

    function writeFabPos(pos) {
      try {
        localStorage.setItem(FAB_POS_KEY, JSON.stringify(pos))
      } catch (_) {}
    }

    function useMobile() {
      const [mobile, setMobile] = React.useState(false)
      React.useEffect(() => {
        if (typeof window.matchMedia !== 'function') return
        const mq = window.matchMedia(MOBILE_MQ)
        const update = () => setMobile(mq.matches && !shellDisabled())
        update()
        mq.addEventListener?.('change', update)
        window.addEventListener('storage', update)
        window.addEventListener('hanui:settings-change', update)
        window.addEventListener('popstate', update)
        return () => {
          mq.removeEventListener?.('change', update)
          window.removeEventListener('storage', update)
          window.removeEventListener('hanui:settings-change', update)
          window.removeEventListener('popstate', update)
        }
      }, [])
      return mobile
    }

    function useAdapter(requested, getLayoutFn) {
      const [active, setActive] = React.useState(null)
      const getLayoutRef = React.useRef(getLayoutFn)
      getLayoutRef.current = getLayoutFn
      React.useEffect(() => {
        if (!requested) { setActive(null); return }
        let current = null
        let lease = null
        let raf = 0
        let canary = 0
        let failed = false
        let disposed = false
        const withdraw = () => {
          if (canary) cancelAnimationFrame(canary)
          canary = 0
          if (current) current.alive = false
          lease?.dispose()
          lease = null
          current = null
          setActive(null)
        }
        const sync = () => {
          raf = 0
          if (disposed || failed) return
          const match = detectLayout(document, getLayoutRef.current?.(), adapters)
          if (!match) { withdraw(); return }
          if (match.adapter === adapters.modern) {
            const navigation = adapters.modern.navigationGuard(match)
            if (navigation === 'pending' || navigation === 'incompatible') { withdraw(); return }
          }
          if (current?.adapter === match.adapter && ['frame', 'sidebar', 'sidebarRoot', 'center', 'details', 'rightbar', 'overlay', 'bottom', 'leading'].every(key => current[key] === match[key])) { lease?.syncViews(); return }
          withdraw()
          lease = installLayoutEnhancement(document, match, HTML_CLASS)
          current = match
          match.alive = true
          setActive(match)
          canary = requestAnimationFrame(() => {
            canary = 0
            if (disposed || current !== match) return
            if (current.frame.clientWidth > 0 && current.center.clientWidth === 0) {
              console.warn('[dsh-mobile-hanui] incompatible layout; enhancement stopped')
              failed = true
              withdraw()
            }
          })
        }
        const schedule = () => { if (!raf && !disposed && !failed) raf = requestAnimationFrame(sync) }
        sync()
        const observer = new MutationObserver(schedule)
        observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'type', 'role', 'aria-label', 'aria-selected', 'data-slot', 'data-shortcut-modal', 'data-conversation-header-leading', 'data-conversation-tabs', 'data-phase', 'data-composer-seat', 'data-chain-overlay-fallback', 'data-sidebar-right-expand', 'data-side', 'data-align', 'data-has-shortcut', 'data-sidebar-right-mode', 'data-sidebar-right-toggle', 'data-rightbar-fullscreen', 'data-dockkit-surface', 'data-dockkit-host', 'data-dockkit-pane', 'data-dockkit-pane-active', 'data-dockkit-content', 'data-dockkit-strip', 'data-dockkit-strip-tabs', 'data-dockkit-strip-fill', 'data-dockkit-strip-chrome', 'data-sidebar-right-tab'] })
        return () => {
          disposed = true
          observer.disconnect()
          if (raf) cancelAnimationFrame(raf)
          if (canary) cancelAnimationFrame(canary)
          withdraw()
        }
      }, [requested])
      return active
    }

    // Exact DSH FishLogo path (from @deepseek-ai/dsh-client-ui-primitives) — inline only
    const FISH_LOGO_PATH =
      'M22.9168 1.43018C22.6713 1.31018 22.5658 1.53918 22.4223 1.65519C22.3733 1.69269 22.3318 1.74169 22.2903 1.78669C21.9317 2.1697 21.5127 2.42121 20.9657 2.39121C20.1657 2.34621 19.4827 2.59771 18.8787 3.20973C18.7502 2.45521 18.3236 2.0047 17.6746 1.71569C17.3351 1.56568 16.9916 1.41518 16.7536 1.08867C16.5876 0.856163 16.5421 0.597155 16.4591 0.341647C16.4061 0.187643 16.3536 0.0301382 16.1761 0.00363739C15.9836 -0.0263635 15.9081 0.135141 15.8326 0.270145C15.5306 0.822162 15.4136 1.43018 15.4251 2.0462C15.4516 3.43174 16.0366 4.53527 17.1991 5.3203C17.3311 5.4103 17.3651 5.5003 17.3236 5.63181C17.2441 5.90231 17.1501 6.16482 17.0671 6.43533C17.0141 6.60784 16.9351 6.64584 16.7501 6.57033C16.1121 6.30383 15.5611 5.90931 15.074 5.4328C14.2475 4.63328 13.5 3.75075 12.568 3.05973C12.349 2.89822 12.13 2.74822 11.9034 2.60522C10.9524 1.68169 12.028 0.923165 12.277 0.833162C12.5375 0.739159 12.3675 0.41615 11.5259 0.42015C10.6844 0.42365 9.91439 0.705658 8.93286 1.08117C8.78935 1.13767 8.63835 1.17867 8.48384 1.21267C7.59332 1.04367 6.66829 1.00617 5.70226 1.11517C3.88321 1.31768 2.43016 2.1777 1.36213 3.64575C0.0790928 5.4103 -0.222916 7.41536 0.146595 9.50642C0.535106 11.7105 1.66014 13.535 3.38869 14.9616C5.18125 16.4406 7.24581 17.1657 9.60138 17.0266C11.0319 16.9441 12.6245 16.7526 14.421 15.2321C14.874 15.4576 15.3496 15.5476 16.1381 15.6151C16.7456 15.6716 17.3306 15.5851 17.7836 15.4911C18.4931 15.3411 18.4441 14.6841 18.1876 14.5636C16.1081 13.595 16.5646 13.9891 16.1496 13.67C17.2061 12.42 18.8202 10.1979 19.3182 7.17235C19.3672 6.83834 19.4297 6.36783 19.4222 6.09732C19.4182 5.93231 19.4562 5.86831 19.6447 5.84931C20.1657 5.78931 20.6712 5.64681 21.1357 5.3913C22.4833 4.65528 23.0268 3.44624 23.1548 1.9972C23.1738 1.77569 23.1508 1.54668 22.9168 1.43018ZM11.1749 14.4736C9.15936 12.889 8.18184 12.3675 7.77832 12.39C7.40081 12.4125 7.46881 12.8445 7.55182 13.126C7.63882 13.404 7.75182 13.5955 7.91033 13.8396C8.01983 14.0011 8.09533 14.2411 7.80083 14.4216C7.15181 14.8231 6.02327 14.2866 5.97027 14.2601C4.65673 13.4865 3.5587 12.4655 2.78467 11.069C2.03715 9.72493 1.60314 8.28289 1.53164 6.74384C1.51264 6.37233 1.62214 6.24082 1.99215 6.17332C2.47916 6.08332 2.98118 6.06432 3.46769 6.13582C5.52476 6.43633 7.27581 7.35586 8.74385 8.8129C9.58188 9.64243 10.2159 10.634 10.8689 11.6025C11.5634 12.631 12.3105 13.611 13.262 14.4146C13.598 14.6961 13.866 14.9101 14.1225 15.0681C13.349 15.1546 12.058 15.1731 11.1749 14.4746L11.1749 14.4736ZM12.141 8.25988C12.141 8.09488 12.273 7.96338 12.439 7.96338C12.4765 7.96338 12.5105 7.97088 12.541 7.98188C12.5825 7.99688 12.6205 8.01938 12.6505 8.05338C12.7035 8.10588 12.7335 8.18088 12.7335 8.25988C12.7335 8.42489 12.6015 8.55639 12.4355 8.55639C12.2695 8.55639 12.141 8.42489 12.141 8.25988ZM15.1415 9.79893C14.949 9.87793 14.7565 9.94544 14.5715 9.95294C14.2845 9.96794 13.9715 9.85143 13.8015 9.70893C13.5375 9.48742 13.3485 9.36342 13.2695 8.97691C13.2355 8.8119 13.2545 8.55639 13.2845 8.40989C13.3525 8.09438 13.277 7.89187 13.0545 7.70787C12.8735 7.55786 12.643 7.51636 12.39 7.51636C12.2955 7.51636 12.209 7.47486 12.1445 7.44136C12.039 7.38886 11.9519 7.25735 12.035 7.09585C12.0615 7.04335 12.19 6.91584 12.22 6.89334C12.5635 6.69784 12.9595 6.76184 13.326 6.90834C13.6655 7.04735 13.9225 7.30236 14.292 7.66287C14.6695 8.09838 14.7375 8.21838 14.9525 8.54539C15.1225 8.8009 15.277 9.06341 15.3831 9.36392C15.4471 9.55142 15.3641 9.70493 15.1415 9.79893Z'

    function IconFishLogo() {
      return jsx('svg', {
        viewBox: '0 0 23.16 17.04',
        width: 22,
        height: (22 * 17.04) / 23.16,
        fill: 'none',
        'aria-hidden': true,
        children: jsx('path', {
          d: FISH_LOGO_PATH,
          fill: 'currentColor',
        }),
      })
    }

    function IconMenu() {
      return jsx('svg', {
        viewBox: '0 0 24 24', width: 24, height: 24, fill: 'none',
        stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round',
        'aria-hidden': true,
        children: jsxs(React.Fragment, { children: [
          jsx('path', { d: 'M4 8h16' }), jsx('path', { d: 'M4 16h9' }),
        ] }),
      })
    }

    function IconBell() {
      return jsx('svg', {
        viewBox: '0 0 24 24', width: 18, height: 18, fill: 'none',
        stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round',
        'aria-hidden': true,
        children: jsxs(React.Fragment, { children: [
          jsx('path', { d: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9' }),
          jsx('path', { d: 'M10 21h4' }),
        ] }),
      })
    }

    function classifyStatsGroup(text) {
      const t = String(text || '')
      if ((/轮/.test(t) && /步/.test(t)) || (/turns?/i.test(t) && /steps?/i.test(t))) return 'counts'
      if (/LLM|工具调用|Tool call/i.test(t)) return 'durations'
      if (/TTFT|tok\/s|首 token/i.test(t)) return 'speeds'
      if (/缓存命中|Cache hit/i.test(t)) return 'cacheHit'
      if ((/输入/.test(t) && /输出/.test(t)) || (/Input/i.test(t) && /Output/i.test(t))) return 'tokens'
      return null
    }

    function tagStatsRoot(root, journal) {
      if (!(root instanceof Element)) return
      const groupSpans = Array.from(root.children).filter(
        (el) =>
          el.tagName === 'SPAN' &&
          !el.classList.contains(STATS.sep) &&
          !el.hasAttribute('data-dsh-stats-break'),
      )
      let cacheHitEl = null
      let tokensEl = null
      for (const span of groupSpans) {
        const kind = classifyStatsGroup(span.textContent)
        if (!kind) continue
        if (span.getAttribute('data-dsh-stats') !== kind) {
          journal.setAttribute(span, 'data-dsh-stats', kind)
        }
        if (kind === 'speeds') {
          const prev = span.previousElementSibling
          const next = span.nextElementSibling
          if (prev?.classList?.contains(STATS.sep) && prev.getAttribute('data-dsh-stats') !== 'sep-hide') {
            journal.setAttribute(prev, 'data-dsh-stats', 'sep-hide')
          }
          if (next?.classList?.contains(STATS.sep) && next.getAttribute('data-dsh-stats') !== 'sep-hide') {
            journal.setAttribute(next, 'data-dsh-stats', 'sep-hide')
          }
        } else if (kind === 'cacheHit') {
          cacheHitEl = span
        } else if (kind === 'tokens') {
          tokensEl = span
        }
      }
      const breakTarget = cacheHitEl || tokensEl
      const existingBreaks = Array.from(root.querySelectorAll('[data-dsh-stats-break]'))
      if (existingBreaks.some(node => !journal.ownsNode(node))) return
      if (!breakTarget) {
        if (existingBreaks.length > 0) {
          for (const b of existingBreaks) b.remove()
        }
        return
      }
      let breakEl = existingBreaks[0] || null
      for (let i = 1; i < existingBreaks.length; i++) existingBreaks[i].remove()
      if (!breakEl) {
        breakEl = journal.ownNode(document.createElement('span'))
        breakEl.setAttribute('data-dsh-stats-break', '')
        breakEl.setAttribute('aria-hidden', 'true')
      }
      if (breakEl.nextElementSibling !== breakTarget) {
        root.insertBefore(breakEl, breakTarget)
      }
    }

    function tagAllStatsRoots(journal) {
      if (!document.documentElement.classList.contains(HTML_CLASS)) return
      for (const root of document.querySelectorAll(`.${STATS.root}`)) {
        tagStatsRoot(root, journal)
      }
    }

    function watchPageReady() {
      let sent = false
      let timer
      let observer
      const blocked = () => document.querySelector('[data-dsh-boot], [data-lha-loading]')
      const send = () => {
        if (sent) return
        sent = true
        if (timer) window.clearTimeout(timer)
        observer?.disconnect()
        try { window.HanApp?.postMessage(JSON.stringify({ version: 1, id: 'hanui-ready', type: 'pageReady', payload: {} })) } catch (_) {}
      }
      const check = () => { if (!blocked()) send() }
      timer = window.setTimeout(check, 0)
      if (typeof MutationObserver === 'function' && document.documentElement) {
        observer = new MutationObserver(check)
        observer.observe(document.documentElement, { subtree: true, childList: true, attributes: true })
      }
      return () => { sent = true; if (timer) window.clearTimeout(timer); observer?.disconnect() }
    }

    function MobileChrome({ getLayout: getLayoutFn, layoutState }) {
      const requested = useMobile()
      const active = useAdapter(requested, getLayoutFn)
      const mobile = !!active
      const legacy = active?.adapter === adapters.legacy
      React.useEffect(() => {
        layoutState.set(active)
        return () => layoutState.set(null)
      }, [active, layoutState])
      const timers = React.useMemo(() => createTimers(window), [active])
      React.useEffect(() => () => timers.dispose(), [timers])
      const [frame, setFrame] = React.useState(null)
      const [sidebarEl, setSidebarEl] = React.useState(null)
      const [collapsed, setCollapsed] = React.useState(true)
      const [detailsOpen, setDetailsOpen] = React.useState(false)
      const [fabPos, setFabPos] = React.useState(null)
      const modern = active?.adapter === adapters.modern
      const [menuAnchorAvailable, setMenuAnchorAvailable] = React.useState(false)
      const getLayoutRef = React.useRef(getLayoutFn)
      getLayoutRef.current = getLayoutFn
      const ignoreBackdropClickUntil = React.useRef(0)
      const fabBtnRef = React.useRef(null)
      const fabDragRef = React.useRef({
        active: false,
        dragging: false,
        draggedThisGesture: false,
        pointerId: null,
        startX: 0,
        startY: 0,
        originLeft: 0,
        originTop: 0,
        offsetX: 0,
        offsetY: 0,
        lastLeft: 0,
        lastTop: 0,
      })

      // The button's idle position is owned by React's `style` prop (fabStyle),
      // and imperative left/top writes happen only during an active drag for
      // smooth finger-follow. After commit, React re-renders `style={{left,top}}`
      // from fabPos, so there is nothing to clear — clearing here would wipe the
      // committed position and make the FAB snap back to its CSS default.

      const withLayout = React.useCallback((fn) => {
        try {
          const layout = getLayout(getLayoutRef.current?.())
          if (!layout) return
          return fn(layout)
        } catch (err) {
          console.warn('[dsh-mobile-hanui] layout', err)
        }
      }, [])

      const openSidebar = React.useCallback(() => {
        const layout = getLayout(getLayoutRef.current?.())
        if (!layout?.toggleSidebar) {
          console.warn('[dsh-mobile-hanui] toggleSidebar unavailable')
          const btn = fabBtnRef.current
          if (btn) {
            btn.setAttribute('data-flash', 'true')
            timers.later(() => btn.removeAttribute('data-flash'), 200)
          }
          return
        }
        // The FAB is only rendered while collapsed, so a straight toggle here
        // opens the drawer. Avoid gating on the frame's data-sidebar-collapsed
        // attribute, whose state can lag React and silently no-op the tap.
        layout.toggleSidebar()
      }, [timers])

      const toggleSidebar = React.useCallback(() => {
        withLayout((layout) => layout.toggleSidebar?.())
      }, [withLayout])

      const closeDetails = React.useCallback(() => {
        withLayout((layout) => layout.closeDetails?.())
        setDetailsOpen(false)
      }, [withLayout])

      const onClose = React.useCallback(() => {
        if (detailsOpen || document.documentElement.hasAttribute(ATTR_DETAILS)) closeDetails()
        else toggleSidebar()
      }, [detailsOpen, closeDetails, toggleSidebar])

      React.useEffect(() => {
        setFrame(active?.frame ?? null)
        setSidebarEl(active?.sidebar ?? null)
        if (!active) setDetailsOpen(false)
      }, [active])

      React.useEffect(() => {
        if (!mobile || !modern || !active) { setMenuAnchorAvailable(false); return }
        const sync = () => {
          const anchors = adapters.modern.subviews(active)
          setMenuAnchorAvailable(anchors.some(([name]) => ['menu-clearance', 'hero-composer', 'rightbar-strip'].includes(name)))
        }
        sync()
        const observer = new MutationObserver(sync)
        observer.observe(active.frame, {
          childList: true, subtree: true, attributes: true,
          attributeFilter: ['class', 'type', 'role', 'aria-label', 'aria-selected', 'data-slot', 'data-shortcut-modal', 'data-phase', 'data-composer-seat', 'data-chain-overlay-fallback', 'data-sidebar-right-expand', 'data-side', 'data-align', 'data-has-shortcut', 'data-sidebar-right-mode', 'data-sidebar-right-toggle', 'data-rightbar-fullscreen', 'data-dockkit-surface', 'data-dockkit-host', 'data-dockkit-pane', 'data-dockkit-pane-active', 'data-dockkit-content', 'data-dockkit-strip', 'data-dockkit-strip-tabs', 'data-dockkit-strip-fill', 'data-dockkit-strip-chrome', 'data-sidebar-right-tab'],
        })
        return () => observer.disconnect()
      }, [mobile, modern, active])

      // Session-switch focus should not summon the phone keyboard; direct input
      // taps and keyboard navigation still own focus in the verified composer.
      React.useEffect(() => {
        if (!mobile || !active) return
        let tappedInput = null
        let userTapAt = 0
        let keyboardAt = 0
        const current = () => active.alive && !shellDisabled() && document.documentElement.contains(active.frame) && active.frame.contains(active.center)
        const inputOf = target => {
          if (!(target instanceof Element) || !current()) return null
          if (modern) return adapters.modern.focusInput(active, target)
          return active.center.contains(target) && target.closest(`.${INPUT.root}`)
            ? target.closest('textarea, input[type="text"], input:not([type]), [contenteditable="true"]') : null
        }
        const onPointerDown = e => { tappedInput = inputOf(e.target); userTapAt = tappedInput ? Date.now() : 0 }
        const onKeyDown = e => { if (e.key === 'Tab' && current()) keyboardAt = Date.now() }
        const onFocusIn = e => {
          const input = inputOf(e.target)
          if (!input || input !== e.target) return
          if ((input === tappedInput && Date.now() - userTapAt < 600) || (keyboardAt && Date.now() - keyboardAt < 600)) return
          input.blur?.()
        }
        document.addEventListener('pointerdown', onPointerDown, true)
        document.addEventListener('touchstart', onPointerDown, { capture: true, passive: true })
        document.addEventListener('keydown', onKeyDown, true)
        document.addEventListener('focusin', onFocusIn, true)
        return () => {
          document.removeEventListener('pointerdown', onPointerDown, true)
          document.removeEventListener('touchstart', onPointerDown, true)
          document.removeEventListener('keydown', onKeyDown, true)
          document.removeEventListener('focusin', onFocusIn, true)
        }
      }, [mobile, modern, active])

      // Click the official anchored pager only on the actual conversation
      // scrollport. The modern inner chat list is no longer a scroll container.
      React.useEffect(() => {
        if (!mobile || !active) return
        let lastTapAt = 0
        let raf = 0
        let pendingScroller = null
        const resolve = target => {
          if (!(target instanceof Element) || !active.alive || shellDisabled() || !document.documentElement.contains(active.frame) || !active.frame.contains(active.center) || !active.center.contains(target)) return null
          if (modern) return adapters.modern.historyTarget(active, target)
          if (!target.classList.contains(CLS.chatScroll) && !target.hasAttribute('data-conversation-scroll')) return null
          const rows = target.querySelectorAll(`.${CLS.chatOlder}`)
          const button = rows.length === 1 && rows[0].children.length === 1 ? rows[0].children[0] : null
          return button?.tagName === 'BUTTON' ? { scroller: target, button } : null
        }
        const tick = () => {
          raf = 0
          const page = resolve(pendingScroller)
          pendingScroller = null
          if (!page || page.button.disabled || page.scroller.scrollHeight <= page.scroller.clientHeight || page.scroller.scrollTop > 40) return
          const now = Date.now()
          if (lastTapAt && now - lastTapAt < 500) return
          lastTapAt = now
          page.button.click()
        }
        const onScroll = e => {
          if (!resolve(e.target)) return
          pendingScroller = e.target
          if (!raf) raf = requestAnimationFrame(tick)
        }
        document.addEventListener('scroll', onScroll, { capture: true, passive: true })
        return () => {
          document.removeEventListener('scroll', onScroll, true)
          if (raf) cancelAnimationFrame(raf)
          pendingScroller = null
        }
      }, [mobile, modern, active])

      // StatsLine Option A — tag groups + insert flex break (mobile shell only)
      React.useEffect(() => {
        if (!mobile || !legacy || shellDisabled()) return
        const journal = createDomJournal()
        let raf = 0
        const schedule = () => {
          if (raf) return
          raf = requestAnimationFrame(() => {
            raf = 0
            tagAllStatsRoots(journal)
          })
        }
        schedule()
        const obs = new MutationObserver(schedule)
        // NOTE: observe childList only (new nodes), NOT characterData. Streams
        // mutate text on every token while loading history / generating, which
        // would re-scan all stat roots hundreds of times and slow the phone.
        obs.observe(document.body, { childList: true, subtree: true })
        return () => {
          if (raf) cancelAnimationFrame(raf)
          obs.disconnect()
          journal.dispose()
        }
      }, [mobile, legacy])

      React.useEffect(() => {
        if (!mobile || !legacy) return
        const layout = getLayout(getLayoutRef.current?.())
        const journal = createDomJournal()
        const restore = []
        try {
          restore.push(replaceMethod(layout, 'openDetails', original => function (...args) {
            const result = original.apply(this, args)
            journal.setAttribute(document.documentElement, ATTR_DETAILS, '')
            setDetailsOpen(true)
            return result
          }))
          restore.push(replaceMethod(layout, 'closeDetails', original => function (...args) {
            const result = original.apply(this, args)
            journal.setAttribute(document.documentElement, ATTR_DETAILS, null)
            setDetailsOpen(false)
            return result
          }))
        } catch (_) {
          for (const undo of restore.reverse()) undo()
          journal.dispose()
          return
        }
        return () => {
          for (const undo of restore.reverse()) undo()
          journal.dispose()
        }
      }, [mobile, legacy])

      React.useEffect(() => {
        if (!frame) return
        const read = () => setCollapsed(frame.hasAttribute('data-sidebar-collapsed'))
        read()
        const obs = new MutationObserver(read)
        obs.observe(frame, { attributes: true, attributeFilter: ['data-sidebar-collapsed'] })
        return () => obs.disconnect()
      }, [frame])

      // Swipe-left on visible backdrop → same onClose as backdrop click. No swipe-open.
      React.useEffect(() => {
        setFabPos(legacy ? readFabPos() : null)
      }, [legacy])

      React.useEffect(() => {
        if (!mobile || !active || !frame) return
        let startX = 0
        let startY = 0
        let mode = null // 'close' | null
        let aborted = false

        const onStart = (e) => {
          if (!active.alive || shellDisabled() || frame.hasAttribute('data-sidebar-collapsed') || e.touches?.length !== 1) { mode = null; return }
          const backdrop = document.querySelector('.dshMobBackdrop[data-visible="true"]')
          if (!backdrop) {
            mode = null
            return
          }
          const t = e.touches?.[0]
          if (!t) return
          const target = e.target
          const onBackdrop =
            target === backdrop || (target instanceof Element && backdrop.contains(target))
          if (!onBackdrop) {
            mode = null
            return
          }
          startX = t.clientX
          startY = t.clientY
          aborted = false
          mode = 'close'
        }

        const onMove = (e) => {
          if (!mode || aborted) return
          if (e.touches?.length !== 1) { mode = null; aborted = true; return }
          const t = e.touches?.[0]
          if (!t) return
          const dx = t.clientX - startX
          const dy = t.clientY - startY
          if (Math.abs(dx) < SWIPE_AXIS_LOCK && Math.abs(dy) < SWIPE_AXIS_LOCK) return
          if (Math.abs(dy) > Math.abs(dx)) {
            aborted = true
            mode = null
          }
        }

        const onEnd = (e) => {
          if (!mode || aborted) {
            mode = null
            aborted = false
            return
          }
          mode = null
          const t = e.changedTouches?.[0]
          if (!t) return
          const dx = t.clientX - startX
          const dy = t.clientY - startY
          if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
            ignoreBackdropClickUntil.current = Date.now() + 300
          }
          if (dx > -SWIPE_DX_MIN || Math.abs(dx) < Math.abs(dy) * SWIPE_DX_DY) return
          ignoreBackdropClickUntil.current = Date.now() + 300
          if (active.alive && !shellDisabled() && document.documentElement.contains(frame) && !frame.hasAttribute('data-sidebar-collapsed')) onClose()
        }

        const onCancel = () => { mode = null; aborted = false }
        window.addEventListener('touchstart', onStart, { passive: true })
        window.addEventListener('touchmove', onMove, { passive: true })
        window.addEventListener('touchend', onEnd, { passive: true })
        window.addEventListener('touchcancel', onCancel, { passive: true })
        return () => {
          window.removeEventListener('touchstart', onStart)
          window.removeEventListener('touchmove', onMove)
          window.removeEventListener('touchend', onEnd)
          window.removeEventListener('touchcancel', onCancel)
        }
      }, [mobile, active, frame, onClose])

      // Re-clamp FAB on viewport changes
      React.useEffect(() => {
        if (!mobile || !legacy) return
        const reclamp = () => {
          setFabPos((prev) => {
            if (!prev) return prev
            const next = clampFabPos(prev.left, prev.top)
            if (next.left !== prev.left || next.top !== prev.top) {
              writeFabPos(next)
              return next
            }
            return prev
          })
        }
        window.addEventListener('resize', reclamp)
        window.addEventListener('orientationchange', reclamp)
        const vv = window.visualViewport
        vv?.addEventListener?.('resize', reclamp)
        return () => {
          window.removeEventListener('resize', reclamp)
          window.removeEventListener('orientationchange', reclamp)
          vv?.removeEventListener?.('resize', reclamp)
        }
      }, [mobile, legacy])

      React.useEffect(() => {
        if (!mobile || !sidebarEl || !frame) return
        const onClick = (e) => {
          if (frame.hasAttribute('data-sidebar-collapsed')) return
          const t = e.target
          if (!(t instanceof Element)) return
          // Row action menus / folder chrome — don't close
          if (t.closest(`.${SIDEBAR_ROW.rowActions}, .${SIDEBAR_ROW.iconButton}, .dshMobNotifications, input, textarea, select`)) {
            return
          }
          // Workspace section-header controls (search view, view options, add
          // workspace) open sub-views / menus inside the drawer — keep it open.
          if (t.closest(`.${WS_HDR.sectionHeader}, .${WS_HDR.search}, .${WS_HDR.searchButton}, .${WS_HDR.searchInput}, .${WS_HDR.clearButton}, .${WS_HDR.iconButton}`)) {
            return
          }
          // Session rows are div[role=treeitem].YDXeBa_sessionRow (not <button>)
          const sessionHit = t.closest(`.${SIDEBAR_ROW.session}, .${SIDEBAR_ROW.search}`)
          if (sessionHit) {
            const closeIfOpen = () => {
              if (!active?.alive || shellDisabled()) return
              const match = detectLayout(document, getLayoutRef.current?.(), adapters)
              if (match?.frame !== frame || match.sidebar !== sidebarEl) return
              if (!frame.hasAttribute('data-sidebar-collapsed')) toggleSidebar()
            }
            timers.later(closeIfOpen, 140)
            timers.later(closeIfOpen, 280)
            return
          }
          // Other nav (new chat, settings, …) — skip project/folder expand rows
          if (t.closest(`.${SIDEBAR_ROW.project}`)) return
          // The settings trigger opens a full-screen overlay that lives INSIDE
          // the drawer; closing the drawer here would kill the just-opened panel
          // (the "settings flashes then disappears" bug). Keep the drawer open.
          if (t.closest(`.${SETTINGS.overlay}, .${SETTINGS.trigger}`)) return
          if (!legacy && !adapters.modern.isNewSession(active, t)) return
          const actionable = t.closest(
            'button, a, [role="button"], [role="option"], [role="menuitem"], li, [data-session-id], [data-conversation-id]',
          )
          if (!actionable) return
          const closeIfOpen = () => {
            if (!active?.alive || shellDisabled()) return
            const match = detectLayout(document, getLayoutRef.current?.(), adapters)
            if (match?.frame !== frame || match.sidebar !== sidebarEl) return
            if (!frame.hasAttribute('data-sidebar-collapsed')) toggleSidebar()
          }
          timers.later(closeIfOpen, 140)
          timers.later(closeIfOpen, 280)
        }
        sidebarEl.addEventListener('click', onClick, true)
        return () => sidebarEl.removeEventListener('click', onClick, true)
      }, [mobile, legacy, sidebarEl, frame, toggleSidebar, timers, active])

      React.useEffect(() => {
        if (!mobile) return
        const onKey = (e) => {
          if (e.key !== 'Escape') return
          if (document.documentElement.hasAttribute(ATTR_DETAILS)) {
            closeDetails()
            return
          }
          if (frame && !frame.hasAttribute('data-sidebar-collapsed')) toggleSidebar()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
      }, [mobile, frame, toggleSidebar, closeDetails])

      const onFabPointerDown = (e) => {
        if (e.button != null && e.button !== 0) return
        const el = e.currentTarget
        const rect = el.getBoundingClientRect()
        const left = fabPos?.left ?? rect.left
        const top = fabPos?.top ?? rect.top
        fabDragRef.current = {
          active: true,
          dragging: false,
          draggedThisGesture: false,
          pointerId: e.pointerId,
          startX: e.clientX,
          startY: e.clientY,
          originLeft: left,
          originTop: top,
          offsetX: e.clientX - rect.left,
          offsetY: e.clientY - rect.top,
          lastLeft: left,
          lastTop: top,
        }
        el.setAttribute('data-dragging', 'true')
        // NOTE: do NOT setPointerCapture here — capture disrupts the native
        // click on mobile (iOS Safari / Android Chrome), so a clean tap would
        // never fire onClick (the sole open path). `touch-action: none` already
        // keeps the pointer tracked on the button during a drag without capture.
      }

      const onFabPointerMove = (e) => {
        const st = fabDragRef.current
        if (!st.active || st.pointerId !== e.pointerId) return
        const dx = e.clientX - st.startX
        const dy = e.clientY - st.startY
        if (!st.dragging && Math.hypot(dx, dy) < DRAG_THRESHOLD) return
        if (!st.dragging) {
          st.dragging = true
          st.draggedThisGesture = true
        }
        const next = clampFabPos(e.clientX - st.offsetX, e.clientY - st.offsetY)
        st.lastLeft = next.left
        st.lastTop = next.top
        const el = fabBtnRef.current || e.currentTarget
        if (el) {
          el.style.left = `${next.left}px`
          el.style.top = `${next.top}px`
          el.style.right = 'auto'
          el.style.bottom = 'auto'
        }
        // DO NOT call setFabPos here — React commit only on pointerup
      }

      const endFabPointer = (e) => {
        const st = fabDragRef.current
        if (!st.active || (e.pointerId != null && st.pointerId !== e.pointerId)) return
        const wasDragging = st.dragging
        st.active = false
        st.dragging = false
        st.pointerId = null
        const el = e.currentTarget
        el?.removeAttribute?.('data-dragging')
        if (wasDragging) {
          // Only a real drag must block the trailing click (done via
          // draggedThisGesture in onClick); commit the dragged position.
          const pos = clampFabPos(st.lastLeft, st.lastTop)
          writeFabPos(pos)
          setFabPos(pos) // React re-renders style={{left,top}}; no imperative clear
          return
        }
        // Clean tap: do NOT open here and do NOT suppress the click — the
        // button's onClick is the sole open path (avoids the pointerup/click
        // double-fire that hides the FAB mid-sequence and drops the open).
      }

      const onFabClick = (e) => {
        const st = fabDragRef.current
        if (st.draggedThisGesture) {
          // Just completed a drag in a prior gesture — swallow this click.
          e.preventDefault()
          e.stopPropagation()
          st.draggedThisGesture = false
          return
        }
        openSidebar()
      }

      if (!mobile) return null

      const sidebarOpen = !!frame && !collapsed
      const showMenu = !!frame && collapsed && !detailsOpen && (!modern || menuAnchorAvailable)
      const showBackdrop = sidebarOpen || detailsOpen

      const fabStyle = fabPos
        ? { left: `${fabPos.left}px`, top: `${fabPos.top}px` }
        : undefined

      const onBackdropClick = () => {
        if (Date.now() < ignoreBackdropClickUntil.current) return
        onClose()
      }

      return jsxs(React.Fragment, {
        children: [
          jsx('button', {
            type: 'button',
            ref: fabBtnRef,
            className: modern ? 'dshMobMenu dshMobMenuModern' : 'dshMobMenu dshMobMenuLegacy',
            'data-visible': showMenu ? 'true' : 'false',
            'aria-label': '打开菜单',
            ...(legacy ? {
              style: fabStyle,
              onPointerDown: onFabPointerDown,
              onPointerMove: onFabPointerMove,
              onPointerUp: endFabPointer,
              onPointerCancel: endFabPointer,
            } : {}),
            onClick: modern ? openSidebar : onFabClick,
            children: modern ? jsx(IconMenu, {}) : jsx(IconFishLogo, {}),
          }),
          jsx('button', {
            type: 'button',
            className: 'dshMobBackdrop',
            'data-visible': showBackdrop ? 'true' : 'false',
            'aria-label': '关闭面板',
            onClick: onBackdropClick,
          }),
        ],
      })
    }

    // The official footer owns vertical placement above Settings. Keep the
    // control tied to the single shell lease instead of acquiring another one.
    function MobileNotifications({ wide, getNotifications, layoutState }) {
      const [active, setActive] = React.useState(() => layoutState.getSnapshot())
      const [noticeStatus, setNoticeStatus] = React.useState('')
      const [noticeBusy, setNoticeBusy] = React.useState(false)
      const [detailsOpen, setDetailsOpen] = React.useState(false)
      React.useEffect(() => {
        const update = () => setActive(layoutState.getSnapshot())
        const off = layoutState.subscribe(update)
        update()
        return off
      }, [layoutState])
      React.useEffect(() => {
        const update = () => setNoticeStatus(getNotifications?.()?.deliveryError ?? '')
        update()
        window.addEventListener('hanui:notification-status', update)
        return () => window.removeEventListener('hanui:notification-status', update)
      }, [getNotifications])
      const visible = !!active && wide === true
      const lease = React.useMemo(() => ({ alive: visible, owner: active }), [visible, active])
      React.useEffect(() => {
        lease.alive = visible
        setNoticeBusy(false)
        return () => { lease.alive = false }
      }, [lease, visible])
      if (!visible) return null
      const isCurrent = () => lease.alive && lease.owner?.alive === true && layoutState.getSnapshot() === lease.owner && !lease.owner.frame.hasAttribute('data-sidebar-collapsed') && !shellDisabled()
      const helper = getNotifications?.()
      const enabled = helper?.needsActionEnabled === true
      return jsxs('div', {
        className: 'dshMobNotifications',
        hidden: true,
        children: [
          jsx('button', {
            type: 'button', className: 'dshMobNotificationToggle', disabled: noticeBusy || (!enabled && !helper?.businessSupported),
            'aria-pressed': enabled, 'aria-busy': noticeBusy,
            onClick: async () => {
              if (!isCurrent()) return
              if (helper?.needsActionEnabled) { helper.setNeedsActionEnabled(false); setNoticeStatus('通知已关闭'); return }
              if (!helper?.businessSupported) { setNoticeStatus('当前页面不支持待确认通知'); return }
              setNoticeBusy(true)
              try {
                const permission = await helper.requestPermission({ isCurrent })
                if (!isCurrent()) return
                helper.setNeedsActionEnabled(permission.granted === true)
                setNoticeStatus(permission.granted ? '后台待确认通知已开启' : '未获得通知权限')
              } catch (_) { if (isCurrent()) setNoticeStatus('通知暂不可用，请重试') }
              finally { if (isCurrent()) setNoticeBusy(false) }
            },
            children: jsxs(React.Fragment, { children: [
              jsx(IconBell, {}),
              jsx('span', { className: 'dshMobNotificationLabel', children: '后台待确认通知' }),
              jsx('span', { className: 'dshMobNotificationState', children: enabled ? '已开启' : '已关闭' }),
            ] }),
          }),
          jsx('button', {
            type: 'button', className: 'dshMobNotificationHelp',
            'aria-expanded': detailsOpen, 'aria-controls': 'dshMobNotificationDetails',
            onClick: () => setDetailsOpen(value => !value),
            children: detailsOpen ? '收起说明' : '说明',
          }),
          detailsOpen ? jsx('small', { id: 'dshMobNotificationDetails', children: '开启后，页面在后台时才会提示新的待确认事项。' }) : null,
          noticeStatus ? jsx('span', { role: 'status', children: noticeStatus }) : null,
        ],
      })
    }

    const inject = ['slots', 'layout']

    function apply(ctx) {
      if (typeof ctx?.effect !== 'function' || typeof ctx.slots?.inject !== 'function' || typeof ctx.slots?.register !== 'function') return
      let notifications = null
      const getNotifications = () => notifications
      let active = null
      const listeners = new Set()
      const layoutState = {
        getSnapshot: () => active,
        subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn) },
        set(value) {
          if (active === value) return
          active = value
          for (const fn of listeners) fn()
        },
      }
      ctx.effect(() => {
        const bridge = createBridgeClient(window)
        const helper = createNotificationHelper(window, bridge)
        const state = { enabled: true, supported: false, disposed: false, deliveryError: '' }
        const setDeliveryStatus = message => {
          if (state.disposed) return
          state.deliveryError = message
          window.dispatchEvent(new Event('hanui:notification-status'))
        }
        try { state.enabled = localStorage.getItem('dsh-mobile-notifications-needs-action') !== '0' } catch (_) {}
        notifications = Object.assign(helper, {
          setNeedsActionEnabled(enabled) {
            state.enabled = enabled === true
            setDeliveryStatus('')
            try { localStorage.setItem('dsh-mobile-notifications-needs-action', state.enabled ? '1' : '0') } catch (_) {}
          },
        })
        Object.defineProperties(notifications, {
          needsActionEnabled: { get: () => state.enabled },
          businessSupported: { get: () => state.supported },
          deliveryError: { get: () => state.deliveryError },
        })
        const previous = Object.getOwnPropertyDescriptor(window, 'DSHMobileHanui')
        const api = Object.freeze({
          notifications,
          setEnabled(enabled) {
            try { localStorage.setItem('dsh-mobile-shell', enabled ? '1' : '0') } catch (_) {}
            window.dispatchEvent(new Event('hanui:settings-change'))
          },
        })
        try { window.DSHMobileHanui = api } catch (_) {}
        let disposeInjection
        try { if (typeof ctx.inject === 'function') {
          disposeInjection = ctx.inject(['uiSession'], scope => scope.effect(() => {
            const source = scope.uiSession?.pendingInteractions
            const off = observeNeedsAction(source, {
              enabled: () => !state.disposed && state.supported && state.enabled && document.visibilityState === 'hidden',
              show: async () => {
                const result = await helper.show({ title: '需要你的确认', body: '当前页面有一项待处理操作，请打开页面查看。', targetUrl: location.origin + location.pathname, tag: 'hanui-needs-action' })
                setDeliveryStatus(result.shown === true ? '' : '通知暂未送达，可关闭或重新开启通知')
                return result
              },
              onFailure: () => setDeliveryStatus('通知暂未送达，可关闭或重新开启通知'),
              onUnsupported: () => { state.supported = false; setDeliveryStatus('当前页面不支持待确认通知') },
            })
            state.supported = !!off
            return () => { state.supported = false; off?.() }
          }, 'hanui: public pending interactions'))
        } } catch (_) { state.supported = false }
        return () => {
          state.disposed = true
          notifications = null
          if (typeof disposeInjection === 'function') disposeInjection()
          helper.dispose()
          bridge.dispose()
          if (window.DSHMobileHanui === api) {
            if (previous) Object.defineProperty(window, 'DSHMobileHanui', previous)
            else delete window.DSHMobileHanui
          }
        }
      }, 'hanui: optional notification capability')
      ctx.effect(() => watchPageReady(), 'hanui: page ready')
      ctx.effect(() => ctx.slots.inject('shell.overlay', () => ctx.slots.register({
        name: 'shell.overlay', id: 'dsh-mobile-hanui-chrome', order: 10, label: 'Mobile chrome',
      }, () => jsx(MobileChrome, { getLayout: () => ctx.layout, layoutState }))), 'hanui: shell.overlay')
      ctx.effect(() => ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
        name: 'sidebar.footer.action', id: 'dsh-mobile-hanui-notifications', order: 10, label: 'Mobile notification controls',
      }, ({ wide }) => jsx(MobileNotifications, { wide, getNotifications, layoutState }))), 'hanui: sidebar.footer.action')
    }

    exports.apply = apply
    exports.inject = inject
    return module.exports
  },
})
