import test from 'node:test'
import assert from 'node:assert/strict'
import { observeNeedsAction } from '../src/needs-action.js'

function source(initial = new Map()) {
  let value = initial
  const listeners = new Set()
  return { getSnapshot: () => value, subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn) }, update(next) { value = next; for (const listener of listeners) listener() }, listeners }
}
const pending = key => new Map([['s1', { sessionId: 's1', key, kind: 'question' }]])
const tick = () => new Promise(resolve => setImmediate(resolve))

test('public observable seeds baseline, honors opt-in, dedupes and disposes', async () => {
  const observable = source(pending('existing'))
  let enabled = false
  let count = 0
  const off = observeNeedsAction(observable, { enabled: () => enabled, show: () => { count++ } })
  observable.update(pending('while-off'))
  enabled = true
  observable.update(pending('while-off'))
  await tick()
  assert.equal(count, 0)
  observable.update(pending('new'))
  observable.update(pending('new'))
  await tick()
  assert.equal(count, 1)
  observable.update(new Map())
  observable.update(pending('new'))
  await tick()
  assert.equal(count, 1)
  observable.update(pending('racing-dispose'))
  off()
  await tick()
  assert.equal(count, 1)
  assert.equal(observable.listeners.size, 0)
})

test('missing/changed contract disables the observer; transport errors are contained', async () => {
  assert.equal(observeNeedsAction({}, { enabled: () => true, show() {} }), null)
  assert.equal(observeNeedsAction(source([]), { enabled: () => true, show() {} }), null)
  const observable = source()
  let failures = 0
  const off = observeNeedsAction(observable, { enabled: () => true, show: () => Promise.reject(new Error('bridge offline')), onFailure: () => failures++ })
  observable.update(pending('a'))
  await tick()
  assert.equal(failures, 1)
  observable.update(new Map([['s1', { sessionId: 'wrong', key: 'b', kind: 'question' }]]))
  assert.equal(failures, 2)
  assert.equal(observable.listeners.size, 0)
  off()
})
