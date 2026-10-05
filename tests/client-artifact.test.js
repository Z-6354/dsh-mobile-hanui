import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { readFileSync } from 'node:fs'
import { createDomJournal, replaceMethod, createTimers, installMobileAttachmentMenu } from '../src/effects.js'
import { createPrivateAdapters } from '../src/private-adapters.js'

class Events {
  listeners = new Map()
  addEventListener(name, fn) { if (!this.listeners.has(name)) this.listeners.set(name, new Set()); this.listeners.get(name).add(fn) }
  removeEventListener(name, fn) { this.listeners.get(name)?.delete(fn) }
  dispatchEvent(event) { for (const fn of this.listeners.get(event.type) ?? []) fn(event) }
  get listenerCount() { return [...this.listeners.values()].reduce((n, list) => n + list.size, 0) }
}
class Element extends Events {
  constructor(classes = [], tag = 'div') {
    super()
    this.attributes = new Map()
    this.children = []
    this.tagName = tag.toUpperCase()
    this.dataset = {}
    this.style = {}
    this.clientWidth = 300
    const tokens = new Set(classes)
    this.classList = { contains: cls => tokens.has(cls), add: cls => tokens.add(cls), remove: cls => tokens.delete(cls), [Symbol.iterator]: () => tokens[Symbol.iterator]() }
  }
  setAttribute(name, value) { this.attributes.set(name, String(value)) }
  getAttribute(name) { return this.attributes.get(name) ?? null }
  removeAttribute(name) { this.attributes.delete(name) }
  hasAttribute(name) { return this.attributes.has(name) }
  appendChild(node) { node.remove(); node.parentElement = this; node.ownerDocument = this.ownerDocument; this.children.push(node); return node }
  insertBefore(node, before) { node.remove(); node.parentElement = this; this.children.splice(this.children.indexOf(before), 0, node) }
  remove() { if (this.parentElement) this.parentElement.children = this.parentElement.children.filter(el => el !== this); this.parentElement = null }
  get previousElementSibling() { return this.parentElement?.children[this.parentElement.children.indexOf(this) - 1] }
  get nextElementSibling() { return this.parentElement?.children[this.parentElement.children.indexOf(this) + 1] }
  querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null }
  contains(node) { return node === this || this.children.some(child => child.contains(node)) }
  closest(selector) {
    const parts = selector.split(',').map(part => part.trim())
    if (parts.some(part => {
      const tag = part.match(/^([A-Za-z][\w-]*)/)?.[1]
      const cls = part.match(/\.([\w-]+)/)?.[1]
      if (tag && this.tagName !== tag.toUpperCase()) return false
      if (cls && !this.classList.contains(cls)) return false
      if (part.includes(':not([type])') && this.hasAttribute('type')) return false
      const positive = part.replace(':not([type])', '')
      return [...positive.matchAll(/\[([^\]=]+)(?:=["']?([^\]"']+)["']?)?\]/g)].every(([, key, value]) => this.hasAttribute(key) && (value === undefined || this.getAttribute(key) === value))
    })) return this
    return this.parentElement?.closest(selector) ?? null
  }
  querySelectorAll(selector) {
    const hits = []
    const matches = el => selector.split(',').some(part => {
      part = part.trim()
      const classMatch = part.match(/\.([\w-]+)/)
      const attrs = [...part.matchAll(/\[([^\]=]+)(?:=["']?([^\]"']+)["']?)?\]/g)]
      const tag = part.match(/^([A-Za-z][\w-]*)/)?.[1]
      if (tag && el.tagName !== tag.toUpperCase()) return false
      if (classMatch && !el.classList.contains(classMatch[1])) return false
      return attrs.every(([, name, value]) => el.hasAttribute(name) && (value === undefined || el.getAttribute(name) === value))
    })
    const walk = node => { for (const child of node.children) { if (matches(child)) hits.push(child); walk(child) } }
    walk(this)
    return hits
  }
}

function reactHarness() {
  const hooks = []
  let index = 0
  let pending = []
  let dirty = false
  let element
  let rendered
  const same = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]))
  const React = {
    Fragment: Symbol('Fragment'),
    useState(seed) {
      const slot = index++
      hooks[slot] ??= { state: typeof seed === 'function' ? seed() : seed }
      return [hooks[slot].state, value => {
        const next = typeof value === 'function' ? value(hooks[slot].state) : value
        if (!Object.is(next, hooks[slot].state)) { hooks[slot].state = next; dirty = true }
      }]
    },
    useEffect(fn, deps) {
      const slot = index++
      if (!same(hooks[slot]?.deps, deps)) pending.push(() => {
        hooks[slot]?.cleanup?.()
        hooks[slot] = { deps, cleanup: fn() }
      })
    },
    useMemo(fn, deps) {
      const slot = index++
      if (!same(hooks[slot]?.deps, deps)) hooks[slot] = { deps, memo: fn() }
      return hooks[slot].memo
    },
    useCallback(fn, deps) { return React.useMemo(() => fn, deps) },
    useRef(seed) { return React.useMemo(() => ({ current: seed }), []) },
  }
  return {
    React,
    mount(next) { element = next; dirty = true },
    flush() {
      for (let round = 0; dirty; round++) {
        assert.ok(round < 30, 'hooks settle')
        dirty = false
        index = 0
        rendered = element.type(element.props)
        const effects = pending; pending = []
        for (const effect of effects) effect()
      }
      return rendered
    },
    dispose() { for (const hook of hooks) hook.cleanup?.(); dirty = false },
  }
}

function loadArtifact({ kind = 'modern', mobile = true, native = false, pendingSource, nativeReply, manualTimers = false, leading = false, sidebarWrapper = false, unknownSidebarRoot = false, notificationPreference = '0', shellOff = false } = {}) {
  const html = new Element(['official-root'])
  const body = new Element()
  const head = new Element()
  html.appendChild(head); html.appendChild(body)
  const frame = body.appendChild(new Element([kind === 'legacy' ? 'pI_x6G_frame' : 'newhash_frame']))
  const sidebar = frame.appendChild(new Element([kind === 'legacy' ? 'pI_x6G_sidebarCol' : 'newhash_sidebarCol']))
  let sidebarRoot
  if (sidebarWrapper) {
    const wrapper = sidebar.appendChild(new Element())
    wrapper.style.display = 'contents'
    sidebarRoot = wrapper.appendChild(new Element([unknownSidebarRoot ? 'unknown_root' : 'hHd-Xa_root']))
    sidebarRoot.style.width = '280px'
  }
  const center = frame.appendChild(new Element([kind === 'legacy' ? 'pI_x6G_centerCol' : 'newhash_centerCol']))
  const rightbar = frame.appendChild(new Element([kind === 'legacy' ? 'pI_x6G_detailsCol' : 'newhash_rightbarCol']))
  if (kind !== 'legacy') rightbar.setAttribute('data-rightbar-col', '')
  if (kind === 'modern-bottom') frame.appendChild(new Element(['newhash_bottomRow'])).setAttribute('data-shell-bottom', '')
  const overlay = frame.appendChild(new Element([kind === 'legacy' ? 'pI_x6G_overlayLayer' : 'newhash_overlayLayer']))
  overlay.setAttribute('data-shell-overlay', '')
  if (leading) {
    html.setAttribute('data-platform', 'darwin')
    frame.appendChild(new Element(['newhash_leadingSeat'])).setAttribute('data-shell-leading', '')
  }
  frame.setAttribute('data-sidebar-collapsed', '')
  const doc = new Events()
  Object.assign(doc, { documentElement: html, body, head, visibilityState: 'visible', createElement: tag => new Element([], tag), querySelector: selector => html.querySelector(selector), querySelectorAll: selector => html.querySelectorAll(selector) })
  const ownDocument = node => { node.ownerDocument = doc; for (const child of node.children) ownDocument(child) }
  ownDocument(html)
  const win = new Events()
  const mq = new Events(); mq.matches = mobile
  const storage = new Map()
  if (notificationPreference !== null) storage.set('dsh-mobile-notifications-needs-action', notificationPreference)
  if (shellOff) storage.set('dsh-mobile-shell', '0')
  const localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) }
  const rafs = new Map(); let rafSequence = 0
  const observers = new Set()
  class MutationObserver {
    constructor(fn) { this.fn = fn }
    observe(target, options) { this.target = target; this.options = options; observers.add(this) }
    disconnect() { observers.delete(this) }
  }
  Object.assign(win, { location: { origin: 'https://example.test', pathname: '/', search: '' }, matchMedia: () => mq, setTimeout, clearTimeout, innerWidth: 390, innerHeight: 844 })
  const timers = new Map(); let timerSequence = 0
  if (manualTimers) Object.assign(win, { setTimeout(fn, ms) { const id = ++timerSequence; timers.set(id, { fn, ms }); return id }, clearTimeout(id) { timers.delete(id) } })
  const nativeRequests = []
  const readinessRequests = []
  if (native) win.HanApp = { postMessage(message) {
    const request = JSON.parse(message)
    if (request.type === 'pageReady') { readinessRequests.push(request); return }
    nativeRequests.push(request)
    const reply = nativeReply ? nativeReply(request) : { ok: true, result: request.type === 'capabilities' ? { notifications: nativeRequests.some(item => item.type === 'requestNotificationPermission'), notificationPermission: true } : request.type === 'requestNotificationPermission' ? { granted: true } : { shown: true } }
    if (reply) queueMicrotask(() => win.HanApp.onmessage({ data: JSON.stringify({ version: 1, id: request.id, ...reply }) }))
  } }
  const react = reactHarness()
  const footerReact = reactHarness()
  let rendering = react.React
  const runtimeReact = { Fragment: react.React.Fragment }
  for (const name of ['useState', 'useEffect', 'useMemo', 'useCallback', 'useRef']) runtimeReact[name] = (...args) => rendering[name](...args)
  const jsx = (type, props) => ({ type, props })
  let plugin
  const requests = []
  const sandbox = { window: win, document: doc, location: win.location, localStorage, URL, URLSearchParams, Event, Element, MutationObserver, Map, Set, console, requestAnimationFrame: fn => { const id = ++rafSequence; rafs.set(id, fn); return id }, cancelAnimationFrame: id => rafs.delete(id) }
  win.__ModuleLoader__ = { load({ id, factory }) {
    assert.equal(id, 'dsh-mobile-hanui')
    plugin = factory(name => {
      requests.push(name)
      if (name === 'react') return runtimeReact
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx }
      throw new Error(`Unexpected runtime dependency: ${name}`)
    })
  } }
  vm.runInNewContext(readFileSync(new URL('../src/client.js', import.meta.url), 'utf8'), sandbox)
  assert.deepEqual(requests, ['react', 'react/jsx-runtime'])
  const disposers = []
  const slots = new Map()
  const layout = { toggleSidebar() {} }
  if (kind === 'legacy') Object.assign(layout, { openDetails() { return 42 }, closeDetails() {} })
  else Object.assign(layout, { openRightbar() {}, closeRightbar() {} })
  const ctx = { layout, effect(fn) { const off = fn(); disposers.push(off); return off }, slots: { inject(name, fn) { assert.ok(['shell.overlay', 'sidebar.footer.action'].includes(name)); return fn() }, register(options, component) { slots.set(options.name, component); return () => { slots.delete(options.name) } } } }
  if (pendingSource) ctx.inject = (names, fn) => {
    assert.equal(names[0], 'uiSession')
    return fn({ uiSession: { pendingInteractions: pendingSource }, effect: ctx.effect })
  }
  plugin.apply(ctx)
  react.mount(slots.get('shell.overlay')())
  const footer = (wide = !frame.hasAttribute('data-sidebar-collapsed')) => {
    const component = slots.get('sidebar.footer.action')
    if (!component) return null
    rendering = footerReact.React
    footerReact.mount(component({ wide }))
    const output = footerReact.flush()
    rendering = react.React
    return output
  }
  const flush = () => {
    rendering = react.React
    let output = react.flush()
    for (let loop = 0; rafs.size; loop++) {
      assert.ok(loop < 20, 'animation queue settles')
      const callbacks = [...rafs.values()]; rafs.clear()
      for (const callback of callbacks) callback()
      output = react.flush()
    }
    return output
  }
  return { plugin, win, doc, html, frame, sidebar, sidebarRoot, center, rightbar, head, layout, localStorage, mq, observers, react, nativeRequests, readinessRequests, slots, footer, flush, runTimers() { const entries = [...timers.values()]; timers.clear(); for (const { fn } of entries) fn() }, mutate() { for (const observer of observers) observer.fn() }, dispose() { react.dispose(); footerReact.dispose(); for (const off of disposers.reverse()) off?.() } }
}

function settingsFixture(app, portal = true) {
  const overlay = (portal ? app.doc.body : app.sidebar).appendChild(new Element(['VOzbGW_overlay']))
  overlay.setAttribute('role', 'presentation')
  const panel = overlay.appendChild(new Element(['VOzbGW_panel']))
  panel.setAttribute('role', 'dialog')
  panel.setAttribute('data-shortcut-modal', 'settings')
  const nav = panel.appendChild(new Element(['VOzbGW_nav'], 'nav'))
  nav.appendChild(new Element(['VOzbGW_navTitle']))
  const list = nav.appendChild(new Element(['VOzbGW_navList']))
  list.appendChild(new Element(['VOzbGW_navCell'], 'button'))
  const content = panel.appendChild(new Element(['VOzbGW_content']))
  content.appendChild(new Element(['VOzbGW_header']))
  const options = content.appendChild(new Element(['VOzbGW_options']))
  return { overlay, panel, nav, list, content, options }
}

function headerFixture(app) {
  const main = app.center.appendChild(new Element())
  main.setAttribute('data-slot', 'main')
  const conversation = main.appendChild(new Element())
  conversation.setAttribute('data-slot', 'main.conversation')
  const root = conversation.appendChild(new Element(['wSkVaW_root']))
  root.setAttribute('data-phase', 'active')
  const publicHeader = root.appendChild(new Element())
  publicHeader.setAttribute('data-slot', 'conversation.header')
  publicHeader.style.display = 'contents'
  publicHeader.getBoundingClientRect = () => ({ width: 0, height: 0 })
  const header = publicHeader.appendChild(new Element(['wSkVaW_header'], 'header'))
  const leading = header.appendChild(new Element(['wSkVaW_headerLeading']))
  leading.setAttribute('data-conversation-header-leading', '')
  leading.appendChild(new Element()).setAttribute('data-slot', 'conversation.header.leading')
  const wrapper = header.appendChild(new Element())
  wrapper.setAttribute('data-slot', 'conversation.session.header')
  wrapper.style.display = 'contents'
  const row = wrapper.appendChild(new Element(['wSkVaW_titleRow']))
  const cluster = row.appendChild(new Element(['wSkVaW_titleCluster']))
  cluster.appendChild(new Element(['wSkVaW_crumbs'], 'nav'))
  cluster.appendChild(new Element(['wSkVaW_headerActions']))
  row.appendChild(new Element(['wSkVaW_headerUtilities']))
  row.appendChild(new Element(['wSkVaW_headerCorner']))
  const tabs = wrapper.appendChild(new Element(['wSkVaW_tabs']))
  tabs.setAttribute('data-conversation-tabs', '')
  const body = root.appendChild(new Element(['wSkVaW_body']))
  const scrollBody = body.appendChild(new Element(['wSkVaW_scrollBody']))
  scrollBody.appendChild(new Element()).setAttribute('data-slot', 'conversation.session')
  scrollBody.appendChild(new Element(['wSkVaW_composerSeat'])).setAttribute('data-composer-seat', '')
  body.appendChild(new Element(['wSkVaW_widthHandle']))
  body.appendChild(new Element(['wSkVaW_widthHandle']))
  return { main, conversation, root, publicHeader, header, leading, wrapper, row, tabs }
}

function sidebarVisualFixture(app) {
  const root = app.sidebarRoot
  const header = root.appendChild(new Element(['bhn1Oq_sectionHeader']))
  header.appendChild(new Element(['bhn1Oq_sectionLabel'], 'span'))
  const slot = header.appendChild(new Element(['bhn1Oq_searchSlot']))
  const search = slot.appendChild(new Element(['bhn1Oq_search']))
  search.appendChild(new Element(['bhn1Oq_searchButton'], 'button')).setAttribute('aria-label', '搜索会话')
  const input = search.appendChild(new Element(['bhn1Oq_searchInput'], 'input'))
  input.setAttribute('placeholder', '搜索会话名称')
  header.appendChild(new Element(['bhn1Oq_headerActions']))
  header.appendChild(new Element([], 'span'))
  header.appendChild(new Element([], 'div'))
  root.appendChild(new Element(['YDXeBa_selected', 'YDXeBa_sessionRow'])).setAttribute('role', 'treeitem')
  root.appendChild(new Element(['hHd-Xa_footArea']))
  return { root, header, slot, search, input }
}

function composerFixture(app, parent = app.center) {
  const root = parent.appendChild(new Element(parent === app.center ? ['uV2eYG_root'] : ['uV2eYG_root', 'uV2eYG_hero']))
  const card = root.appendChild(new Element(['uV2eYG_card']))
  card.setAttribute('data-composer-card', 'true')
  card.appendChild(new Element(['uV2eYG_input'])).setAttribute('data-composer-input', 'true')
  card.appendChild(new Element(['uV2eYG_modes']))
  card.appendChild(new Element(['uV2eYG_trailing']))
  return { root, card }
}

test('手机相册复用官方选择器，取消和停用后恢复文件类型，未知菜单不增强', () => {
  const app = loadArtifact()
  app.doc.createElementNS = (_, tag) => new Element([], tag)
  const { root, card } = composerFixture(app)
  const contains = function (node) { while (node) { if (node === this) return true; node = node.parentElement } return false }
  root.contains = contains
  const picker = root.appendChild(new Element([], 'input'))
  picker.setAttribute('type', 'file')
  let picks = 0
  picker.click = () => { picks++; assert.equal(picker.getAttribute('accept'), 'image/*') }
  const menu = card.appendChild(new Element())
  menu.contains = contains
  menu.setAttribute('data-trigger-menu', '')
  const grid = menu.appendChild(new Element())
  grid.setAttribute('role', 'listbox')
  const row = grid.appendChild(new Element([], 'button'))
  row.id = 'dsh-slash-option-command-0'
  row.setAttribute('role', 'option')
  const icon = row.appendChild(new Element(['known_itemIcon']))
  const label = row.appendChild(new Element(['known_itemName']))
  const detail = row.appendChild(new Element(['known_itemDescription']))
  const match = { center: app.center, alive: true }
  const lease = installMobileAttachmentMenu(app.doc, match, 'dsh-mobile-shell')
  lease.sync()
  const album = grid.children[0]
  assert.equal(album.getAttribute('aria-label'), '相册')
  assert.equal(icon.getAttribute('data-hanui-tile-icon'), '')
  assert.equal(label.getAttribute('data-hanui-tile-label'), '')
  assert.equal(detail.getAttribute('data-hanui-tile-detail'), '')
  lease.sync()
  assert.equal(grid.children.length, 2)
  album.dispatchEvent({ type: 'click' })
  assert.equal(picks, 1)
  picker.dispatchEvent({ type: 'cancel' })
  assert.equal(picker.getAttribute('accept'), null)
  picker.setAttribute('accept', '*/*')
  album.dispatchEvent({ type: 'click' })
  picker.dispatchEvent({ type: 'change' })
  assert.equal(picker.getAttribute('accept'), '*/*')
  album.dispatchEvent({ type: 'click' })
  lease.dispose()
  assert.equal(picker.getAttribute('accept'), '*/*')
  assert.equal(picker.listenerCount, 0)
  assert.equal(grid.children.length, 1)
  assert.equal(detail.getAttribute('data-hanui-tile-detail'), null)
  album.dispatchEvent({ type: 'click' })
  assert.equal(picks, 3)
  row.id = 'dsh-slash-option-reference-0'
  lease.sync()
  assert.equal(grid.children.length, 1)
  assert.equal(menu.getAttribute('data-hanui-attachment-menu'), null)
  lease.dispose()
  app.dispose()
})

test('手机触点尺寸只作用于工具栏，不拉高缩略图删除按钮', () => {
  const adapters = createPrivateAdapters({ MOBILE_MQ:'(max-width:1023px)', HTML_CLASS:'dsh-mobile-shell', ATTR_DETAILS:'data-details' })
  assert.doesNotMatch(adapters.modern.css, /\[data-hanui-composer-card\] button\s*\{[^}]*min-height:\s*44px/)
})

function rightbarFixture(app, { addTab = false, tooltipLabel = null, twoTabCells = false } = {}) {
  app.frame.setAttribute('data-rightbar-fullscreen', '')
  const panel = app.rightbar.appendChild(new Element(['P3OORG_panel']))
  const panelBody = panel.appendChild(new Element(['P3OORG_panelBody']))
  const surface = panelBody.appendChild(new Element(['_surface_6nhg2_125']))
  surface.setAttribute('data-dockkit-surface', 'true')
  const layout = surface.appendChild(new Element(['_tabLayout_6nhg2_134']))
  const cell = layout.appendChild(new Element(['_tabCell_6nhg2_142']))
  cell.setAttribute('data-dockkit-host', 'dock')
  cell.setAttribute('data-dockkit-column', '0')
  const host = cell.appendChild(new Element(['_tabHost_6nhg2_162']))
  host.setAttribute('data-dockkit-pane-active', 'true')
  host.setAttribute('data-dockkit-content', twoTabCells ? 'tab6' : 'tab2')
  host.setAttribute('data-dockkit-pane', 'pane1')
  host.setAttribute('data-dockkit-column', '0')
  const header = host.appendChild(new Element(['_tabHostHeader_6nhg2_177']))
  const strip = header.appendChild(new Element(['_tabStrip_6nhg2_237']))
  strip.setAttribute('role', 'tablist'); strip.setAttribute('data-dockkit-strip', 'pane1')
  const tabs = strip.appendChild(new Element(['_stripTabs_6nhg2_257']))
  tabs.setAttribute('role', 'presentation'); tabs.setAttribute('data-dockkit-strip-tabs', 'pane1')
  let companionCell = null
  if (twoTabCells) {
    const inactive = tabs.appendChild(new Element(['_tab_6nhg2_134']))
    inactive.setAttribute('role', 'tab'); inactive.setAttribute('data-dockkit-tab', 'tab3'); inactive.setAttribute('aria-selected', 'false')
    inactive.appendChild(new Element(['P3OORG_tabTitle'], 'span')).setAttribute('data-sidebar-right-tab', 'tab3')
    const emptySlot = tabs.appendChild(new Element(['_slot_6nhg2_327']))
    emptySlot.setAttribute('class', '_slot_6nhg2_327')
    emptySlot.textContent = ''
    const slotAttributes = emptySlot.attributes
    emptySlot.attributes = {
      get: name => slotAttributes.get(name), has: name => slotAttributes.has(name), set: (name, value) => slotAttributes.set(name, value), delete: name => slotAttributes.delete(name),
      get length() { return slotAttributes.size },
      [Symbol.iterator]() { return Array.from(slotAttributes, ([name, value]) => ({ name, value }))[Symbol.iterator]() },
    }
  }
  const activeId = twoTabCells ? 'tab6' : 'tab2'
  const active = tabs.appendChild(new Element(['_tab_6nhg2_134']))
  active.setAttribute('role', 'tab'); active.setAttribute('data-dockkit-tab', activeId)
  active.setAttribute('aria-selected', 'true')
  const title = active.appendChild(new Element(['P3OORG_tabTitle'], 'span'))
  title.setAttribute('data-sidebar-right-tab', activeId)
  title.appendChild(new Element()).setAttribute('data-slot', 'sidebar.right.pane.tab.title')
  if (addTab) {
    const add = new Element(['_addTab_6nhg2_449'], 'button')
    add.setAttribute('data-dockkit-add-tab', ''); add.setAttribute('aria-label', '新标签页')
    strip.appendChild(add)
  }
  strip.appendChild(new Element(['_stripFill_6nhg2_288'])).setAttribute('data-dockkit-strip-fill', 'true')
  const splitHint = strip.appendChild(new Element([], 'span'))
  splitHint.appendChild(new Element([], 'button')).setAttribute('data-dockkit-split-button', 'pane1')
  const chrome = strip.appendChild(new Element(['_stripChrome_6nhg2_296']))
  chrome.setAttribute('data-dockkit-strip-chrome', 'true')
  const mode = chrome.appendChild(new Element(['P3OORG_iconButton'], 'button'))
  mode.setAttribute('type', 'button'); mode.setAttribute('data-sidebar-right-mode', 'push')
  const toggle = chrome.appendChild(new Element(['P3OORG_iconButton'], 'button'))
  toggle.setAttribute('type', 'button'); toggle.setAttribute('data-sidebar-right-toggle', 'true')
  if (tooltipLabel) {
    const bubble = chrome.appendChild(new Element(['_bubble_12mhf_1'], 'span'))
    bubble.setAttribute('data-side', 'bottom'); bubble.setAttribute('data-align', 'center'); bubble.setAttribute('data-has-shortcut', 'true')
    bubble.setAttribute('role', 'tooltip'); bubble.setAttribute('aria-label', tooltipLabel)
  }
  const body = host.appendChild(new Element(['_tabHostBody_6nhg2_181']))
  body.appendChild(new Element(['P3OORG_tabBody'])).setAttribute('data-sidebar-right-tab', activeId)
  if (twoTabCells) {
    companionCell = new Element(['_tabCell_6nhg2_142'])
    layout.insertBefore(companionCell, cell)
    companionCell.setAttribute('data-dockkit-host', 'dock'); companionCell.setAttribute('data-dockkit-column', '0')
    const companionHost = companionCell.appendChild(new Element(['_tabHost_6nhg2_162', '_pane_6nhg2_209']))
    companionHost.setAttribute('data-dockkit-content', 'tab3'); companionHost.setAttribute('data-dockkit-pane-active', 'true'); companionHost.setAttribute('data-dockkit-column', '0')
    companionHost.appendChild(new Element(['_tabHostHeader_6nhg2_177']))
    companionHost.appendChild(new Element(['_tabHostBody_6nhg2_181', '_paneBody_6nhg2_318']))
  }
  return { panel, strip, title, active, layout, host, companionCell }
}

function heroFixture(app) {
  // This is the parent/class/slot topology captured in mobile-hero-dom-20261005.json:
  // main → main.conversation → data-phase=hero root → public header/body/scroll/seat
  // → composer slot → chain fallback → composerStack.composerHero → composer.bar.
  const main = app.center.appendChild(new Element())
  main.setAttribute('data-slot', 'main')
  const conversation = main.appendChild(new Element())
  conversation.setAttribute('data-slot', 'main.conversation')
  const heroRoot = conversation.appendChild(new Element(['wSkVaW_root']))
  heroRoot.setAttribute('data-phase', 'hero')
  const publicHeader = heroRoot.appendChild(new Element())
  publicHeader.setAttribute('data-slot', 'conversation.header')
  publicHeader.style.display = 'contents'
  publicHeader.getBoundingClientRect = () => ({ width: 0, height: 0 })
  const header = publicHeader.appendChild(new Element(['wSkVaW_header', 'wSkVaW_headerBlank'], 'header'))
  const leading = header.appendChild(new Element(['wSkVaW_headerLeading']))
  leading.setAttribute('data-conversation-header-leading', '')
  leading.appendChild(new Element()).setAttribute('data-slot', 'conversation.header.leading')
  const sessionHeader = header.appendChild(new Element())
  sessionHeader.setAttribute('data-slot', 'conversation.session.header')
  const titleRow = sessionHeader.appendChild(new Element(['wSkVaW_titleRow']))
  const corner = titleRow.appendChild(new Element(['wSkVaW_headerCorner']))
  corner.setAttribute('data-conversation-header-corner', '')
  const cornerSlot = corner.appendChild(new Element())
  cornerSlot.setAttribute('data-slot', 'conversation.session.header.corner')
  cornerSlot.appendChild(new Element([], 'button')).setAttribute('data-sidebar-right-expand', 'true')
  const body = heroRoot.appendChild(new Element(['wSkVaW_body']))
  const scrollBody = body.appendChild(new Element(['wSkVaW_scrollBody']))
  scrollBody.appendChild(new Element()).setAttribute('data-slot', 'conversation.session')
  const composerSeat = scrollBody.appendChild(new Element(['wSkVaW_composerSeat']))
  composerSeat.setAttribute('data-composer-seat', '')
  const composerSlot = composerSeat.appendChild(new Element())
  composerSlot.setAttribute('data-slot', 'conversation.composer')
  const chain = composerSlot.appendChild(new Element())
  chain.setAttribute('data-chain-overlay-fallback', 'conversation.composer')
  const stack = chain.appendChild(new Element(['wSkVaW_composerStack', 'wSkVaW_composerHero']))
  const brandRoot = stack.appendChild(new Element(['pXSMma_root']))
  const brandStack = brandRoot.appendChild(new Element(['pXSMma_stack']))
  brandStack.appendChild(new Element(['pXSMma_headline']))
  brandStack.appendChild(new Element(['pXSMma_body']))
  stack.appendChild(new Element(['wSkVaW_heroWorkspaceRow']))
  stack.appendChild(new Element()).setAttribute('data-slot', 'conversation.input.dock')
  const composerBar = stack.appendChild(new Element())
  composerBar.setAttribute('data-slot', 'conversation.composer.bar')
  const composer = composerFixture(app, composerBar)
  return { main, conversation, hero: stack, heroRoot, publicHeader, header, leading, titleRow, composer, scrollBody }
}

test('actual classic client artifact activates current layout and fully removes its effects on disable/dispose', () => {
  const app = loadArtifact()
  app.flush()
  assert.equal(app.html.classList.contains('dsh-mobile-shell'), true)
  assert.equal(app.head.children.length, 1)
  assert.equal(app.frame.hasAttribute('data-hanui-frame'), true)
  assert.equal(app.frame.getAttribute('data-sidebar-collapsed'), '')
  app.win.DSHMobileHanui.setEnabled(false)
  app.flush()
  assert.equal(app.head.children.length, 0)
  assert.equal(app.html.classList.contains('dsh-mobile-shell'), false)
  assert.equal(app.html.classList.contains('official-root'), true)
  assert.equal(app.frame.hasAttribute('data-hanui-frame'), false)
  app.dispose()
  assert.equal(app.win.DSHMobileHanui, undefined)
  assert.equal(app.win.listenerCount, 0)
  assert.equal(app.doc.listenerCount, 0)
  assert.equal(app.mq.listenerCount, 0)
  assert.equal(app.observers.size, 0)
})

test('desktop and incompatible layout preserve official DOM and install no CSS', () => {
  const desktop = loadArtifact({ mobile: false }); desktop.flush()
  assert.equal(desktop.head.children.length, 0)
  desktop.dispose()
  const incompatible = loadArtifact()
  incompatible.center.classList.remove('newhash_centerCol')
  incompatible.flush()
  assert.equal(incompatible.head.children.length, 0)
  assert.equal(incompatible.html.classList.contains('dsh-mobile-shell'), false)
  incompatible.dispose()
})

test('actual updated official bottom-seat layout activates without rewriting the bottom or legacy composer', () => {
  const app = loadArtifact({ kind: 'modern-bottom' }); app.flush()
  assert.equal(app.head.children.length, 1)
  assert.equal(app.center.hasAttribute('data-hanui-center'), true)
  assert.equal(app.frame.children[2].hasAttribute('data-hanui-rightbar'), true)
  assert.equal(app.frame.children[4].hasAttribute('data-hanui-overlay'), true)
  assert.equal(app.frame.children[3].hasAttribute('data-shell-bottom'), true)
  assert.doesNotMatch(app.head.children[0].textContent, /grid-template-areas|html\.dsh-mobile-shell \.uV2eYG_|\.wSkVaW_tabs\s*\{/)
  app.win.DSHMobileHanui.setEnabled(false); app.flush()
  assert.equal(app.frame.children[2].hasAttribute('data-hanui-rightbar'), false)
  assert.equal(app.frame.children[4].hasAttribute('data-hanui-overlay'), false)
  assert.equal(app.frame.children[3].hasAttribute('data-shell-bottom'), true)
  app.dispose()
})

test('updated layout accepts audited Darwin leading seat while desktop and unknown seats preserve official layout', () => {
  const darwin = loadArtifact({ kind: 'modern-bottom', leading: true })
  for (const side of ['sidebar', 'rightbar']) darwin.frame.appendChild(new Element(['newhash_handle'])).setAttribute('data-side', side)
  darwin.flush()
  assert.equal(darwin.head.children.length, 1); darwin.dispose()
  const desktop = loadArtifact({ kind: 'modern-bottom', leading: true, mobile: false }); desktop.flush()
  assert.equal(desktop.head.children.length, 0); desktop.dispose()
  for (const invalid of ['unknown', 'wrong-bottom', 'wrong-leading-platform', 'unrecognized-handle']) {
    const app = loadArtifact({ kind: 'modern-bottom', leading: invalid === 'wrong-leading-platform' })
    if (invalid === 'wrong-bottom') app.frame.children[3].classList.remove('newhash_bottomRow')
    else if (invalid === 'wrong-leading-platform') app.html.setAttribute('data-platform', 'android')
    else {
      const extra = app.frame.appendChild(new Element(['newhash_unknownSeat']))
      if (invalid === 'unrecognized-handle') extra.setAttribute('data-side', 'sidebar')
    }
    app.flush(); assert.equal(app.head.children.length, 0, invalid); app.dispose()
  }
})

test('modern geometry pins the rightbar and releases the overlay stacking context below plugin chrome', () => {
  const app = loadArtifact(); app.flush()
  const css = app.head.children[0].textContent
  assert.match(css, /\[data-hanui-rightbar\]\s*\{[^}]*grid-column:\s*3[^}]*grid-row:\s*1/)
  assert.match(css, /\[data-hanui-overlay\]\s*\{[^}]*z-index:\s*auto\s*!important/)
  assert.match(css, /\[data-hanui-sidebar\]\s*\{[^}]*z-index:\s*50/)
  assert.match(css, /\.dshMobBackdrop\s*\{[^}]*z-index:\s*45/)
  app.dispose()
})

test('modern shell uses a stationary hamburger only with a verified header and ignores legacy FAB storage', () => {
  const app = loadArtifact()
  app.localStorage.setItem('dsh-mobile-fab-pos', JSON.stringify({ left: 220, top: 400 }))
  const header = headerFixture(app)
  let output = app.flush()
  let menu = output.props.children.find(child => child.props.className?.includes('dshMobMenuModern'))
  assert.ok(menu)
  assert.equal(menu.props['data-visible'], 'true')
  assert.equal(menu.props.style, undefined)
  assert.equal(menu.props.onPointerDown, undefined)
  assert.equal(menu.props.onPointerMove, undefined)
  assert.equal(menu.props.children.type.name, 'IconMenu')
  assert.match(app.head.children[0].textContent, /\.dshMobMenuModern\s*\{[^}]*top:\s*calc\(12px[^}]*left:\s*calc\(12px[^}]*box-shadow:\s*none/)
  header.wrapper.setAttribute('data-slot', 'unknown.header')
  app.mutate(); output = app.flush()
  assert.equal(output, null, 'unknown real header withdraws mobile chrome and cannot be covered by the plugin button')
  assert.equal(app.head.children.length, 0, 'unknown real header withdraws the layout lease instead of hiding the official sidebar')
  header.wrapper.setAttribute('data-slot', 'conversation.session.header')
  app.mutate(); output = app.flush()
  menu = output.props.children.find(child => child.props.className?.includes('dshMobMenuModern'))
  assert.equal(app.head.children.length, 1, 'a restored verified header reacquires the lease')
  assert.equal(menu.props['data-visible'], 'true')
  header.row.getBoundingClientRect = () => ({ width: 0, height: 48 })
  app.mutate(); output = app.flush()
  assert.equal(output, null, 'a structurally valid but non-visible header withdraws the modern lease')
  assert.equal(app.head.children.length, 0)
  header.row.getBoundingClientRect = () => ({ width: 360, height: 48 })
  app.mutate(); output = app.flush()
  assert.equal(app.head.children.length, 1, 'a visible verified header reacquires after it becomes visible')
  app.dispose()
})

test('modern hamburger hides with the open drawer while the backdrop remains the close surface', () => {
  const app = loadArtifact()
  headerFixture(app); app.flush()
  app.frame.removeAttribute('data-sidebar-collapsed'); app.mutate()
  const output = app.flush()
  const menu = output.props.children.find(child => child.props.className?.includes('dshMobMenuModern'))
  const backdrop = output.props.children.find(child => child.props.className === 'dshMobBackdrop')
  assert.equal(menu.props['data-visible'], 'false')
  assert.equal(backdrop.props['data-visible'], 'true')
  app.dispose()
})

test('public conversation header candidates withdraw a stale or unknown header lease even with a valid hero', () => {
  const app = loadArtifact()
  const header = headerFixture(app)
  app.flush()
  assert.equal(app.head.children.length, 1)
  header.header.classList.remove('wSkVaW_header')
  header.wrapper.removeAttribute('data-slot')
  const hero = heroFixture(app)
  app.mutate(); const output = app.flush()
  assert.equal(output, null, 'a hero marker cannot bypass the now-unknown main header candidate')
  assert.equal(app.head.children.length, 0, 'the public header slot prevents a false not-applicable result')
  assert.equal(hero.hero.hasAttribute('data-hanui-hero-composer'), false)
  hero.main.remove()
  header.header.classList.add('wSkVaW_header')
  header.wrapper.setAttribute('data-slot', 'conversation.session.header')
  app.mutate(); app.flush()
  assert.equal(app.head.children.length, 1, 'complete verified header reacquires after recovery')
  app.dispose()
})

test('unknown public main and main.conversation slots cannot take the pure outer fixture path', () => {
  const app = loadArtifact()
  const main = app.center.appendChild(new Element())
  main.setAttribute('data-slot', 'main')
  const conversation = main.appendChild(new Element())
  conversation.setAttribute('data-slot', 'main.conversation')
  conversation.appendChild(new Element(['future-business-panel']))
  const output = app.flush()
  assert.equal(output, null, 'real main slots without an audited navigation subtree withdraw the enhancement')
  assert.equal(app.head.children.length, 0)
  assert.equal(app.frame.hasAttribute('data-hanui-frame'), false)
  app.dispose()
})

test('conversation header leading slot text or controls retire and later reacquire the full lease', () => {
  const app = loadArtifact()
  const header = headerFixture(app)
  app.flush()
  const leadingSlot = header.header.children[0].children[0]
  leadingSlot.appendChild(new Element([], 'button'))
  app.mutate(); let output = app.flush()
  assert.equal(output, null)
  assert.equal(app.head.children.length, 0, 'a contributed leading control is protected from overlay')
  leadingSlot.children[0].remove()
  leadingSlot.textContent = 'Future official badge'
  app.mutate(); output = app.flush()
  assert.equal(output, null, 'non-whitespace leading text is also treated as an official contribution')
  assert.equal(app.head.children.length, 0)
  leadingSlot.textContent = ''
  app.mutate(); app.flush()
  assert.equal(app.head.children.length, 1, 'empty leading slot permits verified enhancement to return')
  app.dispose()
})

test('legacy menu keeps its saved coordinates and pointer drag handlers', () => {
  const app = loadArtifact({ kind: 'legacy' })
  app.localStorage.setItem('dsh-mobile-fab-pos', JSON.stringify({ left: 71, top: 122 }))
  const output = app.flush()
  const menu = output.props.children.find(child => child.props.className?.includes('dshMobMenuLegacy'))
  assert.equal(menu.props.style.left, '71px')
  assert.equal(menu.props.style.top, '122px')
  assert.equal(typeof menu.props.onPointerDown, 'function')
  assert.equal(typeof menu.props.onPointerMove, 'function')
  app.dispose()
})

test('audited rightbar strip reserves the hamburger lane for fullscreen, including file tabs and tooltip, and retires on exit', () => {
  for (const addTab of [false, true]) for (const tooltipLabel of [null, '收起侧边栏 Ctrl + Shift + B', '退出全屏 Ctrl + Alt + Enter']) {
    const app = loadArtifact()
    const view = rightbarFixture(app, { addTab, tooltipLabel })
    const adapters = createPrivateAdapters({ MOBILE_MQ: '(max-width: 1023px)', HTML_CLASS: 'dsh-mobile-shell', ATTR_DETAILS: 'data-dsh-mobile-details-open' })
    const matchedLayout = { frame: app.frame, rightbar: app.rightbar, center: app.center, sidebarRoot: null }
    assert.deepEqual(adapters.modern.subviews(matchedLayout).map(([name]) => name), ['rightbar-strip'])
    const output = app.flush()
    assert.equal(view.strip.hasAttribute('data-hanui-rightbar-strip'), true, `addTab=${addTab}, tooltip=${tooltipLabel}`)
    assert.equal(output.props.children[0].props['data-visible'], 'true')
    assert.match(app.head.children[0].textContent, /\[data-hanui-rightbar-strip\]\s*\{[^}]*min-height:\s*64px[^}]*padding-inline-start:\s*64px/)
    assert.match(app.head.children[0].textContent, /\[data-hanui-rightbar-strip\] \[data-sidebar-right-mode\],[^\{]+\[data-sidebar-right-toggle\]\s*\{[^}]*min-width:\s*44px[^}]*min-height:\s*44px/)
    assert.match(app.head.children[0].textContent, /\[data-hanui-rightbar-strip\] \[data-sidebar-right-mode\],[^\{]+\[data-sidebar-right-toggle\]\s*\{[^}]*min-width:\s*44px[^}]*min-height:\s*44px/)
    app.frame.removeAttribute('data-rightbar-fullscreen'); app.mutate(); app.flush()
    assert.equal(view.strip.hasAttribute('data-hanui-rightbar-strip'), false)
    app.dispose()
  }
})

test('rightbar tabs retain all known tabs and match the selected active tab title', () => {
  const app = loadArtifact()
  const view = rightbarFixture(app)
  const inactive = new Element(['_tab_6nhg2_134'])
  inactive.setAttribute('role', 'tab')
  inactive.setAttribute('data-dockkit-tab', 'tab1')
  inactive.setAttribute('aria-selected', 'false')
  const inactiveTitle = inactive.appendChild(new Element(['P3OORG_tabTitle'], 'span'))
  inactiveTitle.setAttribute('data-sidebar-right-tab', 'tab1')
  inactiveTitle.appendChild(new Element()).setAttribute('data-slot', 'sidebar.right.pane.tab.title')
  view.strip.children[0].insertBefore(inactive, view.active)
  app.mutate(); app.flush()
  assert.equal(app.head.children.length, 1, 'two tabs with one selected tab still match the audited strip')
  assert.equal(view.strip.hasAttribute('data-hanui-rightbar-strip'), true)
  assert.equal(view.active.getAttribute('aria-selected'), 'true')
  app.dispose()
})

test('two-tab rightbar uses its unique pane host and permits the captured empty tab slot', () => {
  // Copied from mobile-rightbar-two-tabs-flat-20261005.json: two dock cells;
  // the first host has an empty header/body placeholder, the pane1 host owns
  // the strip, and stripTabs contains tab3, one empty _slot, then active tab6.
  const app = loadArtifact()
  const view = rightbarFixture(app, { twoTabCells: true })
  app.flush()
  assert.equal(app.head.children.length, 1)
  assert.equal(view.strip.hasAttribute('data-hanui-rightbar-strip'), true)
  assert.equal(view.active.getAttribute('data-dockkit-tab'), 'tab6')
  const companionHeader = view.companionCell.children[0].children[0]
  companionHeader.appendChild(new Element())
  app.mutate(); const output = app.flush()
  assert.equal(view.strip.hasAttribute('data-hanui-rightbar-strip'), false, 'unknown content in the known empty host invalidates the strip')
  assert.equal(output, null, 'invalid two-cell structure withdraws the whole fullscreen lease')
  app.dispose()
})

test('unknown rightbar strip children and future leading seats do not retain a menu anchor', () => {
  const app = loadArtifact()
  const view = rightbarFixture(app)
  app.flush()
  view.strip.appendChild(new Element(['unknown-strip-child']))
  app.mutate(); const output = app.flush()
  assert.equal(view.strip.hasAttribute('data-hanui-rightbar-strip'), false)
  assert.equal(output, null, 'invalid rightbar toolbar withdraws modern layout styles')
  assert.equal(app.head.children.length, 0, 'fullscreen strip mismatch retires the whole layout lease')
  app.dispose()
  const unknownChrome = loadArtifact()
  const chromeView = rightbarFixture(unknownChrome)
  unknownChrome.flush()
  chromeView.strip.querySelector('._stripChrome_6nhg2_296').appendChild(new Element([], 'span'))
  unknownChrome.mutate(); const chromeOutput = unknownChrome.flush()
  assert.equal(chromeView.strip.hasAttribute('data-hanui-rightbar-strip'), false, 'unknown chrome children remain rejected')
  assert.equal(chromeOutput, null, 'unknown chrome children withdraw the whole fullscreen lease')
  unknownChrome.dispose()
  const contributed = loadArtifact({ kind: 'modern-bottom', leading: true })
  const leading = contributed.frame.children[5]
  const contribution = leading.appendChild(new Element(['official-leading-control'], 'button'))
  headerFixture(contributed)
  contributed.flush()
  assert.equal(contributed.head.children.length, 0, 'a contributing leading seat owns the top-left area')
  contribution.remove(); contributed.mutate(); contributed.flush()
  assert.equal(contributed.head.children.length, 1, 'the verified header can reacquire after the contribution leaves')
  contributed.dispose()
  const unknown = loadArtifact({ kind: 'modern-bottom', leading: true })
  unknown.frame.appendChild(new Element(['future-leading-seat'])).setAttribute('data-shell-leading', '')
  headerFixture(unknown); const rejected = unknown.flush()
  assert.equal(unknown.head.children.length, 0)
  assert.equal(rejected, null, 'unrecognized outer leading seat is rejected as a whole')
  unknown.dispose()
})

test('verified sidebar, composer and hero styles use reversible local markers', () => {
  const app = loadArtifact({ sidebarWrapper: true })
  headerFixture(app)
  const sidebar = sidebarVisualFixture(app)
  const composer = composerFixture(app)
  app.flush()
  assert.equal(sidebar.root.getAttribute('data-hanui-sidebar-content'), '')
  assert.equal(sidebar.header.getAttribute('data-hanui-sidebar-search'), '')
  assert.equal(composer.card.getAttribute('data-hanui-composer-card'), '')
  assert.match(app.head.children[0].textContent, /\[data-hanui-sidebar-search\]\s*>\s*\.bhn1Oq_searchSlot\s*\{[^}]*flex:\s*0 0 100%/)
  assert.match(app.head.children[0].textContent, /\[data-hanui-sidebar-search\]\s*\{[^}]*height:\s*auto !important[^}]*min-height:\s*36px[^}]*overflow:\s*visible !important/)
  assert.match(app.head.children[0].textContent, /\[data-hanui-sidebar-search\]\s*>\s*\.bhn1Oq_searchSlot\s*\{[^}]*max-width:\s*none !important[^}]*flex:\s*0 0 100% !important[^}]*width:\s*100% !important/)
  assert.match(app.head.children[0].textContent, /\[data-hanui-sidebar-search\] \.bhn1Oq_search\s*\{[^}]*width:\s*100% !important[^}]*max-width:\s*none !important/)
  assert.match(app.head.children[0].textContent, /\[data-hanui-sidebar-search\] \.bhn1Oq_searchInput\s*\{[^}]*width:\s*auto !important[^}]*min-width:\s*0[^}]*height:\s*44px[^}]*opacity:\s*1 !important[^}]*pointer-events:\s*auto !important/)
  assert.match(app.head.children[0].textContent, /\.YDXeBa_selected\s*\{[^}]*border-radius:\s*16px/)
  assert.match(app.head.children[0].textContent, /\.YDXeBa_selected\s*\{[^}]*background:\s*rgba\(65,118,230,\.12\);/)
  assert.match(app.head.children[0].textContent, /@supports\s*\(background:\s*color-mix\(in srgb, blue 14%, white\)\)\s*\{[^}]*\.YDXeBa_selected\s*\{[^}]*background:\s*color-mix/)
  assert.match(app.head.children[0].textContent, /\[data-hanui-composer-card\]\s*\{[^}]*border-radius:\s*28px/)
  assert.match(app.head.children[0].textContent, /\[data-hanui-composer-card\] \.uV2eYG_trailing button\s*\{[^}]*min-height:\s*44px/)
  assert.match(app.head.children[0].textContent, /\[data-hanui-composer-card\] \.uV2eYG_add, html\.dsh-mobile-shell \[data-hanui-composer-card\] \.uV2eYG_primary\s*\{[^}]*min-width:\s*44px/)
  assert.match(app.head.children[0].textContent, /\[data-hanui-composer-card\] \[data-slot="conversation\.input\.model"\] button\s*\{[^}]*min-height:\s*44px/)
  const originalRow = sidebar.root.querySelector('.YDXeBa_sessionRow')
  originalRow.remove()
  sidebar.root.appendChild(new Element(['filtered-result-row']))
  app.mutate(); app.flush()
  assert.equal(sidebar.header.getAttribute('data-hanui-sidebar-search'), '')
  assert.equal(sidebar.root.hasAttribute('data-hanui-sidebar-content'), false, 'unknown filtered rows do not receive session styling')
  sidebar.root.querySelector('.filtered-result-row').remove()
  sidebar.root.appendChild(originalRow)
  app.mutate(); app.flush()
  assert.equal(sidebar.header.getAttribute('data-hanui-sidebar-search'), '', 'clearing restores the normal searchable header')
  assert.equal(sidebar.root.getAttribute('data-hanui-sidebar-content'), '')
  const scroll = composer.card.appendChild(new Element(['uV2eYG_scroll']))
  scroll.setAttribute('data-input-scroll', '')
  app.mutate(); app.flush()
  assert.equal(scroll.getAttribute('data-hanui-composer-scroll'), '')
  assert.match(app.head.children[0].textContent, /\[data-hanui-composer-scroll\]\s*\{[^}]*max-height:\s*min\(336px,40vh\)[^}]*height:\s*auto[^}]*overflow-y:\s*auto/)
  composer.card.querySelector('.uV2eYG_trailing').remove()
  app.mutate(); app.flush()
  assert.equal(composer.card.hasAttribute('data-hanui-composer-card'), false)
  assert.equal(scroll.hasAttribute('data-hanui-composer-scroll'), false)
  sidebar.input.setAttribute('placeholder', 'future search')
  app.mutate(); app.flush()
  assert.equal(sidebar.header.hasAttribute('data-hanui-sidebar-search'), false)
  assert.equal(sidebar.root.getAttribute('data-hanui-sidebar-content'), '', 'valid session rows keep their own style marker when the search subtree is unknown')
  sidebar.input.setAttribute('placeholder', '搜索会话名称')
  app.mutate(); app.flush()
  assert.equal(sidebar.header.getAttribute('data-hanui-sidebar-search'), '')
  app.win.DSHMobileHanui.setEnabled(false); app.flush()
  assert.equal(sidebar.root.hasAttribute('data-hanui-sidebar-content'), false)
  app.dispose()
  const heroApp = loadArtifact()
  const hero = heroFixture(heroApp)
  heroApp.flush()
  assert.equal(hero.hero.hasAttribute('data-hanui-hero-composer'), true)
  assert.equal(hero.scrollBody.hasAttribute('data-hanui-hero-scroll'), true)
  assert.match(heroApp.head.children[0].textContent, /\[data-hanui-hero-scroll\]\s*\{[^}]*justify-content:\s*flex-end/)
  assert.equal(hero.titleRow.hasAttribute('data-hanui-hero-header-clearance'), true)
  assert.match(heroApp.head.children[0].textContent, /\[data-hanui-hero-header-clearance\][^}]*padding-inline-start:\s*max\(calc\(44px/)
  assert.doesNotMatch(heroApp.head.children[0].textContent, /\[data-hanui-hero-composer\]\s*\{[^}]*padding-top/)
  heroApp.dispose()
  assert.equal(hero.hero.hasAttribute('data-hanui-hero-composer'), false)
  assert.equal(hero.scrollBody.hasAttribute('data-hanui-hero-scroll'), false)
})

test('actual artifact withdraws enhancement after official DOM replacement and width canary failure', () => {
  const app = loadArtifact(); app.flush()
  app.center.classList.remove('newhash_centerCol')
  app.mutate(); app.flush()
  assert.equal(app.head.children.length, 0)
  assert.equal(app.frame.hasAttribute('data-hanui-frame'), false)
  app.dispose()
  const narrow = loadArtifact(); narrow.center.clientWidth = 0; narrow.flush()
  assert.equal(narrow.head.children.length, 0)
  narrow.dispose()
})

test('confirmed sidebar root behind the official contents wrapper fills the drawer and restores its marker', () => {
  const app = loadArtifact({ kind: 'modern-bottom', sidebarWrapper: true })
  app.sidebarRoot.setAttribute('data-hanui-sidebar-root', 'original')
  app.flush()
  assert.equal(app.sidebarRoot.getAttribute('data-hanui-sidebar-root'), '')
  assert.equal(app.sidebarRoot.style.width, '280px', 'official inline width is preserved')
  assert.match(app.head.children[0].textContent, /\[data-hanui-sidebar-root\]\s*\{[^}]*width:\s*100%\s*!important/)
  const replacement = new Element(['hHd-Xa_root'])
  const wrapper = app.sidebarRoot.parentElement
  wrapper.appendChild(replacement); app.sidebarRoot.remove(); app.mutate(); app.flush()
  assert.equal(app.sidebarRoot.getAttribute('data-hanui-sidebar-root'), 'original')
  assert.equal(replacement.getAttribute('data-hanui-sidebar-root'), '')
  app.win.DSHMobileHanui.setEnabled(false); app.flush()
  assert.equal(replacement.hasAttribute('data-hanui-sidebar-root'), false)
  app.dispose()
  const unknown = loadArtifact({ sidebarWrapper: true, unknownSidebarRoot: true }); unknown.flush()
  assert.equal(unknown.sidebarRoot.hasAttribute('data-hanui-sidebar-root'), false)
  unknown.dispose()
})

test('notification controls occupy the public footer above settings instead of covering it from the overlay', () => {
  const app = loadArtifact({ kind: 'modern-bottom', sidebarWrapper: true }); app.flush()
  assert.ok(app.slots.has('sidebar.footer.action'))
  assert.equal(app.footer(false), null, 'collapsed rail does not contain wide controls')
  app.frame.removeAttribute('data-sidebar-collapsed'); app.mutate()
  const overlay = app.flush()
  assert.equal(overlay.props.children.some(child => child?.props.className === 'dshMobNotifications'), false)
  assert.equal(app.footer(true).props.className, 'dshMobNotifications')
  const css = app.head.children[0].textContent
  const rule = css.match(/\.dshMobNotifications\s*\{([^}]*)\}/)[1]
  assert.doesNotMatch(rule, /position:\s*(fixed|absolute)|z-index|bottom:/)
  assert.match(rule, /width:\s*100%/)
  app.win.innerHeight = 616
  app.win.dispatchEvent({ type: 'resize' }); app.flush()
  assert.ok(app.footer(true), 'footer stays in normal flow at the shorter viewport')
  app.win.DSHMobileHanui.setEnabled(false); app.flush()
  assert.equal(app.footer(true), null)
  app.dispose()
  for (const options of [{ mobile: false }, {}]) {
    const stopped = loadArtifact(options)
    if (options.mobile !== false) stopped.center.classList.remove('newhash_centerCol')
    stopped.flush(); assert.equal(stopped.footer(true), null); stopped.dispose()
  }
})

test('valid column replacements in the same frame reacquire every marker and rerun the width canary', () => {
  const app = loadArtifact(); app.flush()
  const replacementCenter = new Element(['newhash_centerCol'])
  app.frame.insertBefore(replacementCenter, app.center); app.center.remove()
  app.mutate(); app.flush()
  assert.equal(app.center.hasAttribute('data-hanui-center'), false)
  assert.equal(replacementCenter.hasAttribute('data-hanui-center'), true)
  const replacementSidebar = new Element(['newhash_sidebarCol'])
  app.frame.insertBefore(replacementSidebar, app.sidebar); app.sidebar.remove()
  app.mutate(); app.flush()
  assert.equal(app.sidebar.hasAttribute('data-hanui-sidebar'), false)
  assert.equal(replacementSidebar.hasAttribute('data-hanui-sidebar'), true)
  const zeroCenter = new Element(['newhash_centerCol']); zeroCenter.clientWidth = 0
  app.frame.insertBefore(zeroCenter, replacementCenter); replacementCenter.remove()
  app.mutate(); app.flush()
  assert.equal(app.head.children.length, 0)
  assert.equal(zeroCenter.hasAttribute('data-hanui-center'), false)
  app.dispose()
})

test('legacy delayed sidebar closes cannot toggle a compatible replacement frame', () => {
  const app = loadArtifact({ kind: 'legacy', manualTimers: true }); app.flush()
  let toggles = 0; app.layout.toggleSidebar = () => { toggles++ }
  app.frame.removeAttribute('data-sidebar-collapsed'); app.mutate(); app.flush()
  const row = app.sidebar.appendChild(new Element(['YDXeBa_sessionRow']))
  app.sidebar.dispatchEvent({ type: 'click', target: row })
  const replacement = new Element(['pI_x6G_frame'])
  for (const suffix of ['sidebarCol', 'centerCol', 'detailsCol', 'overlayLayer']) replacement.appendChild(new Element([`pI_x6G_${suffix}`]))
  replacement.children[3].setAttribute('data-shell-overlay', '')
  app.doc.body.insertBefore(replacement, app.frame); app.frame.remove()
  app.mutate(); app.flush(); app.runTimers(); app.flush()
  assert.equal(toggles, 0)
  assert.equal(app.head.children.length, 1)
  app.dispose()
})

test('legacy details wrappers preserve original function identity and restore original DOM attributes', () => {
  const app = loadArtifact({ kind: 'legacy' })
  const open = app.layout.openDetails
  const close = app.layout.closeDetails
  app.html.setAttribute('data-dsh-mobile-details-open', 'original')
  app.flush()
  assert.notEqual(app.layout.openDetails, open)
  assert.equal(app.layout.openDetails(), 42)
  app.flush()
  app.win.DSHMobileHanui.setEnabled(false); app.flush()
  assert.equal(app.layout.openDetails, open)
  assert.equal(app.layout.closeDetails, close)
  assert.equal(app.html.getAttribute('data-dsh-mobile-details-open'), 'original')
  app.dispose()
})

test('journal preserves originals and external changes; method wrapper restores inherited ownership', () => {
  const el = new Element()
  el.setAttribute('a', 'original')
  const journal = createDomJournal()
  journal.setAttribute(el, 'a', 'mobile')
  journal.setAttribute(el, 'new', '')
  journal.setAttribute(el, 'external', '')
  el.setAttribute('external', 'official-update')
  const node = journal.ownNode(new Element())
  el.appendChild(node)
  journal.dispose(); journal.dispose()
  assert.equal(el.getAttribute('a'), 'original')
  assert.equal(el.getAttribute('new'), null)
  assert.equal(el.getAttribute('external'), 'official-update')
  assert.equal(el.children.length, 0)
  const proto = { run() { return this.value } }
  const target = Object.create(proto); target.value = 7
  const restore = replaceMethod(target, 'run', original => function () { return original.call(this) + 1 })
  assert.equal(target.run(), 8)
  restore()
  assert.equal(Object.hasOwn(target, 'run'), false)
  assert.equal(target.run, proto.run)
})

test('disable cancels delayed sidebar actions', async () => {
  let count = 0
  const timers = createTimers({ setTimeout, clearTimeout })
  timers.later(() => count++, 5)
  timers.dispose()
  timers.later(() => count++, 1)
  await new Promise(resolve => setTimeout(resolve, 15))
  assert.equal(count, 0)
})

test('actual bundle binds a visible opt-in button to permission and genuine public pending interaction notifications', async () => {
  let snapshot = new Map()
  const listeners = new Set()
  const pendingSource = { getSnapshot: () => snapshot, subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn) } }
  const app = loadArtifact({ native: true, pendingSource })
  app.flush()
  assert.equal(app.nativeRequests.length, 0)
  assert.equal(app.win.DSHMobileHanui.notifications.needsActionEnabled, false)
  app.frame.removeAttribute('data-sidebar-collapsed')
  app.mutate()
  const output = app.flush()
  const panel = app.footer()
  assert.equal(output.props.children.some(child => child?.props.className === 'dshMobNotifications'), false)
  assert.ok(panel)
  await panel.props.children[0].props.onClick()
  app.flush()
  assert.equal(app.win.DSHMobileHanui.notifications.needsActionEnabled, true)
  assert.ok(app.nativeRequests.some(request => request.type === 'requestNotificationPermission'))
  app.doc.visibilityState = 'hidden'
  snapshot = new Map([['s1', { sessionId: 's1', kind: 'question', key: 'new-request' }]])
  for (const listener of listeners) listener()
  await new Promise(resolve => setImmediate(resolve))
  const notification = app.nativeRequests.find(request => request.type === 'showNotification')
  assert.ok(notification)
  assert.deepEqual(Object.keys(notification.payload).sort(), ['body', 'tag', 'targetUrl', 'title'])
  assert.equal(notification.payload.targetUrl, 'https://example.test/')
  app.dispose()
  assert.equal(listeners.size, 0)
})

test('新用户默认开启后台通知，隐藏设置区域且不自动申请权限', async () => {
  let snapshot = new Map()
  const listeners = new Set()
  const pendingSource = { getSnapshot: () => snapshot, subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn) } }
  const app = loadArtifact({native:true,pendingSource,notificationPreference:null,nativeReply:()=>({ok:true,result:{notifications:true,notificationPermission:true,shown:true}})})
  app.flush()
  assert.equal(app.win.DSHMobileHanui.notifications.needsActionEnabled,true)
  assert.equal(app.nativeRequests.some(request=>request.type==='requestNotificationPermission'),false)
  app.frame.removeAttribute('data-sidebar-collapsed')
  app.mutate();app.flush()
  assert.equal(app.footer().props.hidden,true)
  app.doc.visibilityState='hidden'
  snapshot=new Map([['new',{sessionId:'new',kind:'question',key:'new'}]])
  for(const listener of listeners)listener()
  await new Promise(resolve=>setImmediate(resolve))
  assert.ok(app.nativeRequests.some(request=>request.type==='showNotification'))
  assert.equal(app.nativeRequests.some(request=>request.type==='requestNotificationPermission'),false)
  app.dispose()
})

test('系统尚未授权时进入页面也不会自动申请原生通知权限', async () => {
  const app = loadArtifact({ native: true, nativeReply: () => ({ ok: true, result: { notifications: false, notificationPermission: true, shown: true } }) })
  app.flush()
  await new Promise(resolve => setImmediate(resolve))
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(app.nativeRequests.some(request => request.type === 'requestNotificationPermission'), false)
  app.dispose()
})

test('actual bundle keeps opt-out and retry available after transient notification delivery failure', async () => {
  let snapshot = new Map()
  const listeners = new Set()
  const source = { getSnapshot: () => snapshot, subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn) } }
  let failDelivery = true
  const app = loadArtifact({ native: true, pendingSource: source, nativeReply(request) {
    if (request.type === 'capabilities') return { ok: true, result: { notifications: true, notificationPermission: true } }
    if (request.type === 'showNotification' && failDelivery) { failDelivery = false; return { ok: false, error: 'temporary timeout' } }
    return { ok: true, result: { shown: true } }
  } })
  app.flush(); app.frame.removeAttribute('data-sidebar-collapsed'); app.mutate()
  const button = () => { app.flush(); return app.footer().props.children[0] }
  await button().props.onClick(); app.flush()
  app.doc.visibilityState = 'hidden'
  snapshot = new Map([['s1', { sessionId: 's1', kind: 'question', key: 'failed-notice' }]])
  for (const listener of listeners) listener()
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(app.win.DSHMobileHanui.notifications.businessSupported, true)
  assert.equal(listeners.size, 1)
  await button().props.onClick()
  assert.equal(app.win.DSHMobileHanui.notifications.needsActionEnabled, false)
  await button().props.onClick()
  assert.equal(app.win.DSHMobileHanui.notifications.needsActionEnabled, true)
  snapshot = new Map([['s1', { sessionId: 's1', kind: 'question', key: 'retried-new-notice' }]])
  for (const listener of listeners) listener()
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(app.nativeRequests.filter(request => request.type === 'showNotification').length, 2)
  app.dispose()
})

test('actual bundle retries capabilities on the next user action after an early bridge timeout', async () => {
  const source = { getSnapshot: () => new Map(), subscribe() { return () => {} } }
  let ready = false
  const app = loadArtifact({ native: true, manualTimers: true, pendingSource: source, nativeReply(request) {
    if (!ready) return null
    return { ok: true, result: { notifications: true, notificationPermission: true } }
  } })
  app.flush(); app.frame.removeAttribute('data-sidebar-collapsed'); app.mutate()
  const button = () => { app.flush(); return app.footer().props.children[0] }
  const earlyAction = button().props.onClick()
  app.runTimers()
  await earlyAction
  assert.equal(app.win.DSHMobileHanui.notifications.needsActionEnabled, false)
  assert.equal(app.win.DSHMobileHanui.notifications.businessSupported, true)
  ready = true
  await button().props.onClick()
  assert.equal(app.win.DSHMobileHanui.notifications.needsActionEnabled, true)
  assert.equal(app.nativeRequests.filter(request => request.type === 'capabilities').length, 2)
  app.dispose()
})

test('notification disclosure is single tap and permission starts only from the explicit toggle', async () => {
  const source = { getSnapshot: () => new Map(), subscribe() { return () => {} } }
  const app = loadArtifact({ native: true, pendingSource: source })
  app.flush()
  app.frame.removeAttribute('data-sidebar-collapsed'); app.mutate(); app.flush()
  let panel = app.footer(true)
  const [toggle, help] = panel.props.children
  assert.equal(toggle.props['aria-pressed'], false)
  assert.equal(toggle.props['aria-busy'], false)
  assert.equal(toggle.props.disabled, false)
  assert.equal(panel.props.children[2], null, 'the page-scope explanation is hidden by default')
  await help.props.onClick()
  panel = app.footer(true)
  assert.equal(panel.props.children[1].props['aria-expanded'], true)
  assert.equal(app.nativeRequests.length, 0, 'opening the explanation never requests permission')
  await panel.props.children[0].props.onClick()
  await new Promise(resolve => setImmediate(resolve))
  panel = app.footer(true)
  assert.ok(app.nativeRequests.some(request => request.type === 'requestNotificationPermission'))
  assert.equal(panel.props.children[0].props['aria-pressed'], true)
  app.dispose()
})

test('an enabled notification toggle remains available to opt out after its business source becomes unsupported', async () => {
  const app = loadArtifact()
  app.win.DSHMobileHanui.notifications.setNeedsActionEnabled(true)
  app.flush(); app.frame.removeAttribute('data-sidebar-collapsed'); app.mutate(); app.flush()
  const toggle = () => app.footer(true).props.children[0]
  assert.equal(app.win.DSHMobileHanui.notifications.businessSupported, false)
  assert.equal(toggle().props['aria-pressed'], true)
  assert.equal(toggle().props.disabled, false, 'unsupported business observation must not trap the user in enabled state')
  await toggle().props.onClick()
  assert.equal(app.win.DSHMobileHanui.notifications.needsActionEnabled, false)
  assert.equal(toggle().props['aria-pressed'], false)
  assert.equal(toggle().props.disabled, true, 'an unsupported disabled feature cannot be enabled')
  assert.equal(app.nativeRequests.length, 0, 'opt-out never requests notification permission')
  app.dispose()
})

test('footer permission completion cannot enable notifications after its wide lease closes or shell is disabled', async () => {
  for (const stop of ['collapse', 'disable']) {
    const source = { getSnapshot: () => new Map(), subscribe() { return () => {} } }
    let reply
    const app = loadArtifact({ native: true, pendingSource: source, nativeReply(request) {
      if (request.type === 'capabilities') return { ok: true, result: { notifications: false, notificationPermission: true } }
      reply = request
      return null
    } })
    app.flush(); app.frame.removeAttribute('data-sidebar-collapsed'); app.mutate(); app.flush()
    const action = app.footer(true).props.children[0].props.onClick()
    await new Promise(resolve => setImmediate(resolve))
    assert.equal(reply.type, 'requestNotificationPermission')
    if (stop === 'collapse') app.frame.setAttribute('data-sidebar-collapsed', '')
    else app.win.DSHMobileHanui.setEnabled(false)
    app.mutate(); app.flush(); app.footer(stop !== 'collapse')
    // Reopen before the old result arrives: the old lease is still retired.
    app.frame.removeAttribute('data-sidebar-collapsed')
    app.win.DSHMobileHanui.setEnabled(true); app.mutate(); app.flush(); app.footer(true)
    app.win.HanApp.onmessage({ data: JSON.stringify({ version: 1, id: reply.id, ok: true, result: { granted: true } }) })
    await action
    assert.equal(app.win.DSHMobileHanui.notifications.needsActionEnabled, false, stop)
    app.dispose()
    assert.equal(app.win.listenerCount, 0)
  }
})

test('legacy footer controls do not schedule navigation drawer auto-close', () => {
  const app = loadArtifact({ kind: 'legacy', manualTimers: true }); app.flush()
  let toggles = 0; app.layout.toggleSidebar = () => { toggles++ }
  app.frame.removeAttribute('data-sidebar-collapsed'); app.mutate(); app.flush()
  const panel = app.sidebar.appendChild(new Element(['dshMobNotifications']))
  const button = panel.appendChild(new Element([], 'button'))
  app.sidebar.dispatchEvent({ type: 'click', target: button }); app.runTimers()
  assert.equal(toggles, 0)
  app.dispose()
})

test('modern and legacy footer CSS both keep the notification panel in normal layout flow', () => {
  for (const kind of ['modern-bottom', 'legacy']) {
    const app = loadArtifact({ kind }); app.flush()
    const rules = [...app.head.children[0].textContent.matchAll(/\.dshMobNotifications\s*\{([^}]*)\}/g)]
    const finalDeclarations = new Map()
    for (const [, body] of rules) for (const declaration of body.split(';')) {
      const colon = declaration.indexOf(':')
      if (colon !== -1) finalDeclarations.set(declaration.slice(0, colon).trim(), declaration.slice(colon + 1).trim())
    }
    assert.ok(rules.length)
    assert.ok(!['fixed', 'absolute'].includes(finalDeclarations.get('position')), kind)
    assert.ok(!finalDeclarations.has('bottom'), kind)
    assert.ok(!finalDeclarations.has('z-index'), kind)
    assert.equal(finalDeclarations.get('width'), '100%', kind)
    app.dispose()
  }
})

test('closing the footer while capabilities is pending prevents any subsequent permission request', async () => {
  const source = { getSnapshot: () => new Map(), subscribe() { return () => {} } }
  const app = loadArtifact({ native: true, pendingSource: source, nativeReply() { return null } })
  app.flush(); app.frame.removeAttribute('data-sidebar-collapsed'); app.mutate(); app.flush()
  const action = app.footer(true).props.children[0].props.onClick()
  const caps = app.nativeRequests[0]
  assert.equal(caps.type, 'capabilities')
  app.frame.setAttribute('data-sidebar-collapsed', ''); app.mutate(); app.flush(); app.footer(false)
  app.win.HanApp.onmessage({ data: JSON.stringify({ version: 1, id: caps.id, ok: true, result: { notifications: false, notificationPermission: true } }) })
  await new Promise(resolve => setImmediate(resolve))
  const permissions = app.nativeRequests.filter(request => request.type === 'requestNotificationPermission').length
  app.dispose(); await action
  assert.equal(permissions, 0)
})

test('a valid center replacement retires a pending footer permission even when both layouts remain visible', async () => {
  const source = { getSnapshot: () => new Map(), subscribe() { return () => {} } }
  let permission
  const app = loadArtifact({ native: true, pendingSource: source, nativeReply(request) {
    if (request.type === 'capabilities') return { ok: true, result: { notifications: false, notificationPermission: true } }
    permission = request
    return null
  } })
  app.flush(); app.frame.removeAttribute('data-sidebar-collapsed'); app.mutate(); app.flush()
  const action = app.footer(true).props.children[0].props.onClick()
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(permission.type, 'requestNotificationPermission')
  const replacement = new Element(['newhash_centerCol'])
  app.frame.insertBefore(replacement, app.center); app.center.remove(); app.mutate(); app.flush()
  assert.ok(app.footer(true), 'new owner still renders the footer')
  app.win.HanApp.onmessage({ data: JSON.stringify({ version: 1, id: permission.id, ok: true, result: { granted: true } }) })
  await action
  const enabled = app.win.DSHMobileHanui.notifications.needsActionEnabled
  assert.equal(enabled, false)
  const newAction = app.footer(true).props.children[0].props.onClick()
  await new Promise(resolve => setImmediate(resolve))
  app.win.HanApp.onmessage({ data: JSON.stringify({ version: 1, id: permission.id, ok: true, result: { granted: true } }) })
  await newAction
  assert.equal(app.win.DSHMobileHanui.notifications.needsActionEnabled, true, 'new owner still permits an explicit user action')
  app.dispose()
})

test('audited settings modal uses a top scrolling nav and full width content with reversible markers', () => {
  const app = loadArtifact({ kind: 'modern-bottom' }); app.flush()
  const view = settingsFixture(app)
  view.panel.setAttribute('data-hanui-settings-panel', 'original')
  const originalChildren = [...view.panel.children]
  app.mutate(); app.flush()
  assert.equal(view.panel.getAttribute('data-hanui-settings-panel'), '')
  assert.deepEqual(view.panel.children, originalChildren, 'official DOM order is retained')
  const css = app.head.children[0].textContent
  assert.match(css, /\[data-hanui-settings-panel\]\s*\{[^}]*flex-direction:\s*column/)
  assert.match(css, /\[data-hanui-settings-panel\]\s*>\s*\.VOzbGW_nav\s*\{[^}]*width:\s*100%/)
  assert.match(css, /\.VOzbGW_navList\s*\{[^}]*flex-direction:\s*row[^}]*overflow-x:\s*auto/)
  assert.match(css, /\[data-hanui-settings-panel\]\s*>\s*\.VOzbGW_content\s*\{[^}]*width:\s*100%[^}]*min-height:\s*0/)
  view.options.classList.remove('VOzbGW_options'); app.mutate(); app.flush()
  assert.equal(view.panel.getAttribute('data-hanui-settings-panel'), 'original', 'unknown content structure retires the marker')
  view.options.classList.add('VOzbGW_options'); app.mutate(); app.flush()
  assert.equal(view.panel.getAttribute('data-hanui-settings-panel'), '')
  app.win.DSHMobileHanui.setEnabled(false); app.flush()
  assert.equal(view.panel.getAttribute('data-hanui-settings-panel'), 'original')
  app.dispose()
})

test('current session header behind its public slot wrapper reserves menu space without rewriting tabs', () => {
  const app = loadArtifact({ kind: 'modern-bottom' }); app.flush()
  const navigationObserver = [...app.observers].find(observer => observer.target === app.frame && observer.options?.attributeFilter?.includes('data-phase'))
  assert.ok(navigationObserver, 'menu anchor observer watches navigation identity attributes')
  for (const attribute of ['data-phase', 'data-composer-seat', 'data-chain-overlay-fallback', 'data-sidebar-right-expand', 'aria-selected', 'aria-label', 'data-side', 'data-align', 'data-has-shortcut', 'data-sidebar-right-mode', 'data-sidebar-right-toggle', 'data-dockkit-pane', 'data-dockkit-content']) {
    assert.ok(navigationObserver.options.attributeFilter.includes(attribute), `${attribute} changes recheck the navigation anchor`)
  }
  const view = headerFixture(app)
  const originalChildren = [...view.wrapper.children]
  app.mutate(); app.flush()
  assert.equal(view.row.hasAttribute('data-hanui-menu-clearance'), true)
  assert.deepEqual(view.wrapper.children, originalChildren)
  assert.equal(view.tabs.hasAttribute('data-hanui-menu-clearance'), false)
  const css = app.head.children[0].textContent
  assert.match(css, /\[data-hanui-menu-clearance\],[^\{]+\[data-hanui-hero-header-clearance\]\s*\{[^}]*padding-inline-start:\s*max\(calc\(44px[^}]*min-height:\s*44px/)
  assert.doesNotMatch(css, /grid-template-areas|html\.dsh-mobile-shell \.uV2eYG_|\.wSkVaW_tabs\s*\{/)
  view.wrapper.setAttribute('data-slot', 'unknown.header')
  app.mutate(); app.flush()
  assert.equal(view.row.hasAttribute('data-hanui-menu-clearance'), false)
  view.wrapper.setAttribute('data-slot', 'conversation.session.header'); app.mutate(); app.flush()
  assert.equal(view.row.hasAttribute('data-hanui-menu-clearance'), true)
  app.dispose()
  assert.equal(view.row.hasAttribute('data-hanui-menu-clearance'), false)
  const desktop = loadArtifact({ mobile: false })
  const official = headerFixture(desktop); const settings = settingsFixture(desktop)
  desktop.flush()
  assert.equal(official.row.hasAttribute('data-hanui-menu-clearance'), false)
  assert.equal(settings.panel.hasAttribute('data-hanui-settings-panel'), false)
  desktop.dispose()
})

test('unchanged subview identities do not rewrite markers on unrelated subtree observations', () => {
  const app = loadArtifact(); app.flush()
  const settings = settingsFixture(app)
  headerFixture(app)
  let writes = 0
  const original = settings.panel.setAttribute.bind(settings.panel)
  settings.panel.setAttribute = (name, value) => { if (name === 'data-hanui-settings-panel') writes++; original(name, value) }
  app.mutate(); app.flush()
  assert.equal(writes, 1)
  for (let i = 0; i < 5; i++) { app.mutate(); app.flush() }
  assert.equal(writes, 1, 'stream and unrelated mutations do not churn identical markers')
  app.dispose()
})

test('official settings BODY portal is enhanced but unrelated or reparented dialogs stay untouched', () => {
  const app = loadArtifact(); app.flush()
  const view = settingsFixture(app, true)
  app.mutate(); app.flush()
  assert.equal(view.panel.getAttribute('data-hanui-settings-panel'), '', 'real BODY portal gets its marker')
  app.sidebar.appendChild(view.overlay); app.mutate(); app.flush()
  assert.equal(view.panel.hasAttribute('data-hanui-settings-panel'), false, 'portal location changes retire the marker')
  app.doc.body.appendChild(view.overlay); app.mutate(); app.flush()
  assert.equal(view.panel.hasAttribute('data-hanui-settings-panel'), true)
  view.panel.setAttribute('data-shortcut-modal', 'other'); app.mutate(); app.flush()
  assert.equal(view.panel.hasAttribute('data-hanui-settings-panel'), false)
  view.panel.setAttribute('data-shortcut-modal', 'settings'); app.mutate(); app.flush()
  assert.equal(view.panel.hasAttribute('data-hanui-settings-panel'), true)
  view.overlay.setAttribute('role', 'dialog'); app.mutate(); app.flush()
  assert.equal(view.panel.hasAttribute('data-hanui-settings-panel'), false)
  view.overlay.setAttribute('role', 'presentation'); app.mutate(); app.flush()
  app.win.DSHMobileHanui.setEnabled(false); app.flush()
  assert.equal(view.panel.hasAttribute('data-hanui-settings-panel'), false)
  app.dispose()
})

test('ready signal preserves the existing notification reply handler and stops on disposal', () => {
  const app = loadArtifact({ kind: 'modern', native: true, manualTimers: true })
  const receive = app.win.HanApp.onmessage
  app.flush(); app.runTimers()
  assert.equal(app.readinessRequests.length, 1)
  assert.deepEqual(JSON.parse(JSON.stringify(app.readinessRequests[0].payload)), {})
  assert.equal(app.win.HanApp.onmessage, receive)
  app.dispose(); app.runTimers()
  assert.equal(app.readinessRequests.length, 1)
})


test('modern conversation selection closes drawer but row menus and settings do not', () => {
  const app = loadArtifact({ manualTimers: true }); app.flush()
  let closes = 0
  app.layout.toggleSidebar = () => { closes++; app.frame.setAttribute('data-sidebar-collapsed', '') }
  app.frame.removeAttribute('data-sidebar-collapsed'); app.mutate(); app.flush()
  const row = app.sidebar.appendChild(new Element(['YDXeBa_sessionRow']))
  const menu = row.appendChild(new Element(['YDXeBa_iconButton'], 'button'))
  app.sidebar.dispatchEvent({ type: 'click', target: menu }); app.runTimers()
  assert.equal(closes, 0)
  app.sidebar.dispatchEvent({ type: 'click', target: row }); app.runTimers()
  assert.equal(closes, 1)
  app.frame.removeAttribute('data-sidebar-collapsed')
  const settings = app.sidebar.appendChild(new Element(['VOzbGW_trigger'], 'button'))
  app.sidebar.dispatchEvent({ type: 'click', target: settings }); app.runTimers()
  assert.equal(closes, 1)
  app.dispose()
})


test('native launch cover waits while official boot surface is present', () => {
 const app=loadArtifact({native:true,manualTimers:true})
 const boot=app.doc.body.appendChild(new Element());boot.setAttribute('data-dsh-boot','')
 app.flush();app.runTimers();assert.equal(app.readinessRequests.length,0)
 boot.remove();app.mutate();app.runTimers();assert.equal(app.readinessRequests.length,1)
 app.dispose();app.runTimers();assert.equal(app.readinessRequests.length,1)
})

test('pageReady is sent once on desktop viewports and when the mobile shell is off', () => {
  for (const options of [{ mobile: false }, { shellOff: true }]) {
    const app = loadArtifact({ native: true, manualTimers: true, ...options })
    app.flush(); app.runTimers(); app.runTimers()
    assert.equal(app.readinessRequests.length, 1)
    assert.equal(app.readinessRequests[0].type, 'pageReady')
    app.dispose(); app.runTimers()
    assert.equal(app.readinessRequests.length, 1)
  }
})


function migrationFixture(kind='modern', mobile=true) {
 const app=loadArtifact({kind,mobile,manualTimers:true,sidebarWrapper:true})
 headerFixture(app);const composer=composerFixture(app)
 const editor=composer.card.querySelector('.uV2eYG_input');editor.setAttribute('contenteditable','true')
 let blurs=0;editor.blur=()=>blurs++
 app.flush()
 return {...app,editor,composer,blurs:()=>blurs}
}

test('migration: modern focus guard preserves taps and Tab focus, retires on disable',()=>{
 const app=migrationFixture()
 app.doc.dispatchEvent({type:'focusin',target:app.editor});assert.equal(app.blurs(),1)
 app.doc.dispatchEvent({type:'pointerdown',target:app.editor})
 app.doc.dispatchEvent({type:'focusin',target:app.editor});assert.equal(app.blurs(),1)
 app.dispose()
 const keyboard=migrationFixture()
 keyboard.doc.dispatchEvent({type:'keydown',key:'Tab',target:keyboard.doc.body})
 keyboard.doc.dispatchEvent({type:'focusin',target:keyboard.editor});assert.equal(keyboard.blurs(),0)
 keyboard.win.DSHMobileHanui.setEnabled(false);keyboard.flush()
 keyboard.doc.dispatchEvent({type:'focusin',target:keyboard.editor});assert.equal(keyboard.blurs(),0)
 keyboard.dispose()
 const desktop=migrationFixture('modern',false)
 desktop.doc.dispatchEvent({type:'focusin',target:desktop.editor});assert.equal(desktop.blurs(),0);desktop.dispose()
})

function historyFixture(app) {
 const outer=app.center.appendChild(new Element());outer.setAttribute('data-conversation-scroll','')
 Object.assign(outer,{scrollHeight:1000,clientHeight:400,scrollTop:0})
 const inner=outer.appendChild(new Element(['Md3f7G_scroll']));Object.assign(inner,{scrollHeight:100,clientHeight:100,scrollTop:0})
 const column=inner.appendChild(new Element());column.setAttribute('data-chat-flow','')
 const older=column.appendChild(new Element(['Md3f7G_older']))
 const button=older.appendChild(new Element([],'button'));button.setAttribute('type','button')
 let clicks=0;button.click=()=>clicks++
 return {outer,inner,column,button,clicks:()=>clicks}
}

test('migration: history uses current outer scrollport and cancels pending work on disable',()=>{
 const app=migrationFixture();const history=historyFixture(app)
 app.doc.dispatchEvent({type:'scroll',target:history.outer});app.flush();assert.equal(history.clicks(),1)
 app.doc.dispatchEvent({type:'scroll',target:history.outer});app.flush();assert.equal(history.clicks(),1,'throttled')
 app.dispose()
 const pending=migrationFixture();const other=historyFixture(pending)
 pending.doc.dispatchEvent({type:'scroll',target:other.outer})
 pending.win.DSHMobileHanui.setEnabled(false);pending.flush();assert.equal(other.clicks(),0)
 pending.dispose()
 const disabled=migrationFixture();const waiting=historyFixture(disabled);waiting.button.disabled=true
 disabled.doc.dispatchEvent({type:'scroll',target:waiting.outer});disabled.flush();assert.equal(waiting.clicks(),0)
 waiting.button.disabled=false;waiting.outer.scrollTop=200
 disabled.doc.dispatchEvent({type:'scroll',target:waiting.outer});disabled.flush();assert.equal(waiting.clicks(),0)
 disabled.dispose()
})

function openMigrationDrawer(app) {
 let closes=0;app.layout.toggleSidebar=()=>{closes++;app.frame.setAttribute('data-sidebar-collapsed','')}
 app.frame.removeAttribute('data-sidebar-collapsed');app.mutate();app.flush()
 const backdrop=app.doc.body.appendChild(new Element(['dshMobBackdrop']));backdrop.setAttribute('data-visible','true')
 return {backdrop,closes:()=>closes}
}
function swipe(app,target,dx,dy,end='touchend') {
 app.win.dispatchEvent({type:'touchstart',target,touches:[{clientX:180,clientY:150}]})
 app.win.dispatchEvent({type:'touchmove',target,touches:[{clientX:180+dx,clientY:150+dy}]})
 app.win.dispatchEvent({type:end,target,changedTouches:[{clientX:180+dx,clientY:150+dy}]})
}
test('migration: backdrop left swipe closes modern drawer but vertical, cancelled and content gestures do not',()=>{
 const app=migrationFixture();const drawer=openMigrationDrawer(app)
 swipe(app,drawer.backdrop,-100,2,'touchcancel');assert.equal(drawer.closes(),0)
 swipe(app,drawer.backdrop,-100,160);assert.equal(drawer.closes(),0)
 swipe(app,app.sidebar,-100,2);assert.equal(drawer.closes(),0)
 swipe(app,drawer.backdrop,-100,2);assert.equal(drawer.closes(),1)
 app.dispose()
})

test('migration: modern new-session button and brand close drawer, unrelated buttons stay open',()=>{
 for(const brand of [false,true]) {
  const app=migrationFixture();const drawer=openMigrationDrawer(app)
  const parent=brand?app.sidebarRoot.appendChild(new Element(['hHd-Xa_logoRow'])):app.sidebarRoot
  const button=parent.appendChild(new Element([brand?'hHd-Xa_brand':'hHd-Xa_newSession'],'button'));button.setAttribute('type','button')
  const unrelated=app.sidebarRoot.appendChild(new Element([],'button'))
  app.sidebar.dispatchEvent({type:'click',target:unrelated});app.runTimers();assert.equal(drawer.closes(),0)
  app.sidebar.dispatchEvent({type:'click',target:button});app.runTimers();assert.equal(drawer.closes(),1)
  app.dispose()
 }
})


test('migration: focus ignores unknown composer and nested controls without stealing accessibility focus',()=>{
 const app=migrationFixture()
 const chip=app.editor.appendChild(new Element([],'button'));let chipBlurs=0;chip.blur=()=>chipBlurs++
 app.doc.dispatchEvent({type:'focusin',target:chip});assert.equal(app.blurs(),0);assert.equal(chipBlurs,0)
 app.composer.card.querySelector('.uV2eYG_modes').remove()
 app.doc.dispatchEvent({type:'focusin',target:app.editor});assert.equal(app.blurs(),0,'unknown composer unchanged')
 app.dispose()
 const legacy=migrationFixture('legacy')
 legacy.doc.dispatchEvent({type:'focusin',target:legacy.editor});assert.equal(legacy.blurs(),1)
 legacy.doc.dispatchEvent({type:'pointerdown',target:legacy.editor});legacy.doc.dispatchEvent({type:'focusin',target:legacy.editor});assert.equal(legacy.blurs(),1)
 legacy.dispose()
})

test('migration: detached pager, unknown history and desktop scroll never trigger automatic loading',()=>{
 const app=migrationFixture();const page=historyFixture(app)
 app.doc.dispatchEvent({type:'scroll',target:page.outer});page.outer.remove();app.flush();assert.equal(page.clicks(),0)
 const unknown=historyFixture(app);unknown.column.removeAttribute('data-chat-flow')
 app.doc.dispatchEvent({type:'scroll',target:unknown.outer});app.flush();assert.equal(unknown.clicks(),0)
 app.dispose()
 const desktop=migrationFixture('modern',false);const desktopPage=historyFixture(desktop)
 desktop.doc.dispatchEvent({type:'scroll',target:desktopPage.outer});desktop.flush();assert.equal(desktopPage.clicks(),0);desktop.dispose()
 const legacy=migrationFixture('legacy');const legacyPage=historyFixture(legacy)
 legacyPage.inner.scrollHeight=1000;legacyPage.inner.clientHeight=400
 legacy.doc.dispatchEvent({type:'scroll',target:legacyPage.inner});legacy.flush();assert.equal(legacyPage.clicks(),1);legacy.dispose()
})

test('migration: swipe and pending new-session navigation retire with the layout lease',()=>{
 const app=migrationFixture();const drawer=openMigrationDrawer(app)
 app.win.dispatchEvent({type:'touchstart',target:drawer.backdrop,touches:[{clientX:180,clientY:150}]})
 app.win.DSHMobileHanui.setEnabled(false);app.flush()
 app.win.dispatchEvent({type:'touchend',target:drawer.backdrop,changedTouches:[{clientX:50,clientY:150}]})
 assert.equal(drawer.closes(),0);app.dispose()
 const pending=migrationFixture();const next=openMigrationDrawer(pending)
 const button=pending.sidebarRoot.appendChild(new Element(['hHd-Xa_newSession'],'button'));button.setAttribute('type','button')
 pending.sidebar.dispatchEvent({type:'click',target:button})
 pending.sidebarRoot.remove();pending.mutate();pending.flush();pending.runTimers()
 assert.equal(next.closes(),0);pending.dispose()
})
