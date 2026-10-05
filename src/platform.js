/** Optional, website-neutral AndroidX WebMessage client. No DSH wire protocol. */
export const LIMITS = Object.freeze({ title: 120, body: 500, tag: 80, targetUrl: 2048, message: 16384, pending: 32 })

export function notificationPayload(value, origin) {
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

export function createBridgeClient(win, { timeout = 10000 } = {}) {
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
export function createNotificationHelper(win, bridge) {
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
