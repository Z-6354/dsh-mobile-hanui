import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

test('login style stays static and scopes the requested white and blue design', () => {
  const css = readFileSync(new URL('../src/login.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
  assert.doesNotMatch(css, /@import|url\(|javascript|expression\(/i)
  assert.match(css, /background:\s*#fff/)
  assert.match(css, /background:\s*#4169ff/)
  assert.match(css, /font-size:\s*16px/)
  assert.match(css, /min-height:\s*54px/)
  assert.match(css, /env\(safe-area-inset/)
  const selectors = css.matchAll(/(?:^|\})\s*([^{}@]+)\{/g)
  for (const [, selector] of selectors) for (const part of selector.split(',')) assert.match(part.trim(), /^body\.han-login(?:\[data-checking\])?(?:\s|$)/)
})
