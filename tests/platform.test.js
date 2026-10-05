import test from 'node:test'
import assert from 'node:assert/strict'
import { createBridgeClient, createNotificationHelper, notificationPayload } from '../src/platform.js'

function environment(postMessage) {
  return { location: { origin: 'https://example.test' }, HanApp: postMessage ? { postMessage } : undefined, setTimeout, clearTimeout }
}

test('no bridge leaves the normal browser baseline available without any native request', async () => {
  const win = environment()
  const bridge = createBridgeClient(win)
  assert.equal(bridge.available, false)
  const helper = createNotificationHelper(win, bridge)
  assert.equal((await helper.capabilities()).notifications, false)
  assert.deepEqual(await helper.requestPermission(), { granted: false })
  assert.deepEqual(await helper.show({ title: 'Ready', body: '' }), { shown: false, reason: 'permission-or-capability-unavailable' })
  helper.dispose()
  bridge.dispose()
})

test('JSON replies correlate out of order; malformed and oversized replies are ignored', async () => {
  const messages = []
  const win = environment(message => messages.push(JSON.parse(message)))
  const bridge = createBridgeClient(win)
  const first = bridge.request('capabilities')
  const second = bridge.request('capabilities')
  assert.deepEqual(messages[0].payload, {})
  win.HanApp.onmessage({ data: '{bad' })
  win.HanApp.onmessage({ data: 'x'.repeat(16385) })
  win.HanApp.onmessage({ data: JSON.stringify({ version: 2, id: messages[0].id, ok: true, result: {} }) })
  win.HanApp.onmessage({ data: JSON.stringify({ version: 1, id: messages[0].id, ok: true, result: [] }) })
  win.HanApp.onmessage({ data: JSON.stringify({ version: 1, id: messages[1].id, ok: true, result: { notifications: true } }) })
  win.HanApp.onmessage({ data: JSON.stringify({ version: 1, id: messages[0].id, ok: false, error: 'denied' }) })
  assert.deepEqual(await second, { notifications: true })
  await assert.rejects(first, /denied/)
  bridge.dispose()
})

test('payload limits and exact origin checks reject unsafe targets before posting', async () => {
  const posted = []
  const win = environment(message => posted.push(message))
  const bridge = createBridgeClient(win)
  for (const targetUrl of ['https://evil.test/', 'https://example.test:444/', 'https://user@example.test/', 'javascript:alert(1)', '//evil.test/path']) {
    await assert.rejects(bridge.request('showNotification', { title: 'A', body: '', targetUrl }), /origin/)
  }
  for (const [key, count] of [['title', 121], ['body', 501], ['tag', 81], ['targetUrl', 2049]]) {
    await assert.rejects(bridge.request('showNotification', { title: 'A', body: '', [key]: 'x'.repeat(count) }))
  }
  await assert.rejects(bridge.request('openSession', {}), /unsupported/)
  assert.equal(posted.length, 0)
  assert.equal(notificationPayload({ title: 'A', body: '', targetUrl: '/inbox' }, win.location.origin).targetUrl, 'https://example.test/inbox')
  bridge.dispose()
})

test('pending bound, timeout, disposal and stale page origin are contained', async () => {
  const win = environment(() => {})
  const previous = () => {}
  win.HanApp.onmessage = previous
  const bridge = createBridgeClient(win, { timeout: 15 })
  const pending = Array.from({ length: 32 }, () => bridge.request('capabilities'))
  const results = Promise.allSettled(pending)
  await assert.rejects(bridge.request('capabilities'), /too many/)
  bridge.dispose()
  assert.equal(win.HanApp.onmessage, previous)
  assert.equal((await results).every(result => result.status === 'rejected'), true)
  await assert.rejects(bridge.request('capabilities'), /unavailable/)
  const timerBridge = createBridgeClient(win, { timeout: 5 })
  await assert.rejects(timerBridge.request('capabilities'), /timeout/)
  win.location.origin = 'https://other.test'
  await assert.rejects(timerBridge.request('capabilities'), /unavailable/)
  timerBridge.dispose()
})

test('explicit native permission call and notification carry only generic contract fields', async () => {
  const messages = []
  const win = environment(message => {
    const request = JSON.parse(message)
    messages.push(request)
    queueMicrotask(() => win.HanApp.onmessage({ data: JSON.stringify({ version: 1, id: request.id, ok: true, result: request.type === 'capabilities' ? { notifications: messages.some(item => item.type === 'requestNotificationPermission'), notificationPermission: true } : request.type === 'requestNotificationPermission' ? { granted: true } : { shown: true } }) }))
  })
  const bridge = createBridgeClient(win)
  const helper = createNotificationHelper(win, bridge)
  assert.equal(messages.length, 0)
  assert.deepEqual(await helper.requestPermission(), { granted: true })
  assert.deepEqual(await helper.show({ title: 'Pending', body: 'Open page', sessionId: 'secret', targetUrl: '/app' }), { shown: true })
  assert.deepEqual(messages.at(-1).payload, { title: 'Pending', body: 'Open page', targetUrl: 'https://example.test/app' })
  helper.dispose()
  bridge.dispose()
})

test('browser show and permission continuations stop after helper disposal', async () => {
  let created = 0
  let requested = 0
  const notices = []
  class Notification {
    static permission = 'granted'
    static requestPermission() { requested++; return Promise.resolve('granted') }
    constructor() { created++; notices.push(this) }
    close() { this.closed = true }
  }
  const win = environment(); win.Notification = Notification
  const bridge = createBridgeClient(win)
  const showHelper = createNotificationHelper(win, bridge)
  const showing = showHelper.show({ title: 'Pending', body: '', targetUrl: '/' })
  showHelper.dispose()
  await assert.rejects(showing, /disposed/)
  assert.equal(created, 0)
  const permissionHelper = createNotificationHelper(win, bridge)
  const requesting = permissionHelper.requestPermission()
  permissionHelper.dispose()
  await assert.rejects(requesting, /disposed/)
  assert.equal(requested, 0)
  const activeHelper = createNotificationHelper(win, bridge)
  await activeHelper.show({ title: 'Active', body: '', targetUrl: '/' })
  assert.equal(created, 1)
  activeHelper.dispose()
  assert.equal(notices[0].closed, true)
  assert.equal(notices[0].onclick, null)
  bridge.dispose()
})

test('permission action guard stops native and browser continuation while preserving default callers', async () => {
  const messages = []
  const win = environment(message => messages.push(JSON.parse(message)))
  const bridge = createBridgeClient(win)
  const helper = createNotificationHelper(win, bridge)
  let current = true
  const action = helper.requestPermission({ isCurrent: () => current })
  current = false
  win.HanApp.onmessage({ data: JSON.stringify({ version: 1, id: messages[0].id, ok: true, result: { notifications: false, notificationPermission: true } }) })
  await assert.rejects(action, /retired/)
  assert.deepEqual(messages.map(request => request.type), ['capabilities'])
  helper.dispose(); bridge.dispose()

  let requested = 0
  let grant
  const browserWin = environment()
  browserWin.Notification = { permission: 'default', requestPermission() { requested++; return new Promise(resolve => { grant = resolve }) } }
  const browserBridge = createBridgeClient(browserWin)
  const browserHelper = createNotificationHelper(browserWin, browserBridge)
  current = true
  const before = browserHelper.requestPermission({ isCurrent: () => current })
  current = false
  await assert.rejects(before, /retired/)
  assert.equal(requested, 0, 'retired browser action never prompts')
  current = true
  const after = browserHelper.requestPermission({ isCurrent: () => current })
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(requested, 1)
  current = false; grant('granted')
  await assert.rejects(after, /retired/)
  const defaultAction = browserHelper.requestPermission()
  await new Promise(resolve => setImmediate(resolve))
  grant('granted')
  assert.deepEqual(await defaultAction, { granted: true })
  browserHelper.dispose(); browserBridge.dispose()
})
