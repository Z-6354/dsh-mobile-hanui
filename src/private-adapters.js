/** Private DOM fingerprints are quarantined here; missing parts mean no enhancement. */
export function createPrivateAdapters({ MOBILE_MQ, HTML_CLASS, ATTR_DETAILS }) {
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

export function detectLayout(doc, layout, adapters) {
  try { return adapters.modern.detect(doc, layout) ?? adapters.legacy.detect(doc, layout) } catch { return null }
}
