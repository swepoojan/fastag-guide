// Injects the build-time render and structured data into dist/index.html.
import { readFileSync, writeFileSync, rmSync } from 'node:fs'

const { render, structuredData } = await import('../dist-ssr/entry-server.js')
const file = new URL('../dist/index.html', import.meta.url)
let html = readFileSync(file, 'utf8')

const ld = structuredData()
  .map((o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`)
  .join('\n    ')

if (!html.includes('<!--app-html-->') || !html.includes('<!--structured-data-->')) throw new Error('index.html placeholders missing')
html = html.replace('<!--app-html-->', render()).replace('<!--structured-data-->', ld)
writeFileSync(file, html)
rmSync(new URL('../dist-ssr', import.meta.url), { recursive: true, force: true })
console.log(`prerendered dist/index.html (${Math.round(html.length / 1024)} KB, ${ld.split('ld+json').length - 1} structured data blocks)`)
