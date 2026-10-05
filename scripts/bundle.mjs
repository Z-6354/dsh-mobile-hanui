import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
const root = new URL('../', import.meta.url)
const read = name => readFileSync(new URL(name, root), 'utf8').replace(/\r\n/g, '\n')
const helpers = ['effects.js', 'platform.js', 'private-adapters.js', 'needs-action.js'].map(name => read(`src/${name}`).replace(/^export /gm, '')).join('\n')
const source = read('src/client.entry.js')
const output = source.replace('    /* @HANUI_HELPERS@ */', helpers.split('\n').map(line => line ? `    ${line}` : '').join('\n')).split('\n').map(line => line.trimEnd()).join('\n')
if (process.argv.includes('--check')) {
  if (read('src/client.js') !== output) {
    throw new Error('client.js is stale; run npm run build')
  }
} else writeFileSync(fileURLToPath(new URL('src/client.js', root)), output)
