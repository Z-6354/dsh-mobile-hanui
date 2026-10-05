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
    /* @HANUI_HELPERS@ */
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
