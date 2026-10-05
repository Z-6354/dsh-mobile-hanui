/** Record only plugin-owned DOM writes, restoring originals on disable/dispose. */
export function createDomJournal() {
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
export function createTimers(win) {
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
export function replaceMethod(target, name, factory) {
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

export function installLayoutEnhancement(doc, match, htmlClass) {
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

export function installMobileAttachmentMenu(doc, match, htmlClass) {
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
