// Automatic rate checker. Runs on a schedule in GitHub Actions.
// Reads each official page twice, validates what it finds, and updates src/data/rates.json.
// Pages are first downloaded directly; if the figures aren't in the raw page (common when a
// site fills its tables with JavaScript), a headless browser renders the page instead.
// It writes files only when something meaningful changed, so most runs commit nothing.
//
//   node scripts/rates/run.mjs            check the live sources
//   node scripts/rates/run.mjs --dry-run  check and print, write nothing

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { sources } from './sources.mjs'
import { applyCheck, diagnose, extract, htmlToText, trimHistory, validate } from './logic.mjs'

const RATES = new URL('../../src/data/rates.json', import.meta.url)
const REPORT = new URL('./report.json', import.meta.url)
const dry = process.argv.includes('--dry-run')
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'

const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())

// ---------- page readers ----------

async function viaFetch(url) {
  const res = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(20000),
    headers: { 'user-agent': UA, 'accept-language': 'en-IN,en;q=0.9', accept: 'text/html,application/xhtml+xml' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return htmlToText(await res.text())
}

let browser = null
async function viaBrowser(url) {
  if (browser === null) {
    try {
      const { chromium } = await import('playwright')
      browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {})
    } catch {
      browser = false
    }
  }
  if (!browser) throw new Error('no browser available')
  const page = await browser.newPage({ userAgent: UA, locale: 'en-IN' })
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 })
    await page.waitForTimeout(1500)
    // Expand accordions and tabs that hide fee tables.
    await page.evaluate(() => document.querySelectorAll('details').forEach((d) => (d.open = true)))
    const text = await page.evaluate(() => document.body.innerText)
    return text.replace(/\s+/g, ' ').trim()
  } finally {
    await page.close()
  }
}

/** Reads a page with the given method and extracts its fields. */
async function readWith(method, spec) {
  try {
    const text = method === 'browser' ? await viaBrowser(spec.url) : await viaFetch(spec.url)
    if (text.length < 200) return { error: 'page looked empty', method, diag: diagnose(text, spec) }
    const r = extract(text, spec)
    return { ...r, method, diag: r.missing.length ? diagnose(text, spec) : undefined }
  } catch (e) {
    const msg = e.name === 'TimeoutError' ? 'timed out' : e.message
    return { error: msg.startsWith('HTTP') || msg.startsWith('no browser') ? msg : `could not load: ${msg}`, method }
  }
}

const works = (r) => !r.error && r.missing.length === 0

async function check(spec, current) {
  let method = spec.browser ? 'browser' : 'fetch'
  let first = await readWith(method, spec)
  if (!works(first) && method === 'fetch') {
    const viaB = await readWith('browser', spec)
    if (works(viaB) || viaB.error !== 'no browser available') { first = viaB; method = 'browser' }
  }
  await new Promise((r) => setTimeout(r, 1500))
  const second = works(first) ? await readWith(method, spec) : first
  return { result: validate([first, second], current), first }
}

// ---------- run ----------

const rates = JSON.parse(readFileSync(RATES, 'utf8'))
const before = JSON.stringify(rates)
const report = { checkedOn: today, sources: {} }
const events = []

const record = (id, spec, result, first, entry) => {
  report.sources[id] = {
    url: spec.url,
    ok: result.ok,
    method: first.method,
    reason: result.ok ? undefined : result.reason,
    found: first.values,
    snippets: first.snippets,
    status: entry.status,
    diagnostics: result.ok ? undefined : first.diag,
  }
}

for (const [id, spec] of Object.entries(sources.providers)) {
  const { result, first } = await check(spec, rates.providers[id].values)
  const out = applyCheck(rates.providers[id], result, today, id)
  rates.providers[id] = out.entry
  events.push(...out.events)
  record(id, spec, result, first, out.entry)
}
{
  const spec = sources.passes
  const { result, first } = await check(spec, rates.passes.values)
  const out = applyCheck(rates.passes, result, today, 'passes')
  rates.passes = out.entry
  events.push(...out.events)
  record('passes', spec, result, first, out.entry)
}
if (browser) await browser.close()

rates.history = trimHistory([...(rates.history ?? []), ...events])

for (const [id, r] of Object.entries(report.sources)) {
  console.log(`${r.ok ? '✓' : '✗'} ${id.padEnd(7)} ${String(r.method).padEnd(8)} ${r.status.padEnd(10)} ${r.ok ? JSON.stringify(r.found) : r.reason}`)
}
for (const e of events) console.log(`CHANGE ${e.id} ${e.field}: ₹${e.from} → ₹${e.to}`)

if (dry) process.exit(0)

const changed = JSON.stringify(rates) !== before
if (changed) writeFileSync(RATES, JSON.stringify(rates, null, 2) + '\n')

// The report helps tune page readers. Rewrite it only when its content (not just the date) changes.
const strip = (r) => JSON.stringify({ ...r, checkedOn: undefined })
const old = existsSync(REPORT) ? JSON.parse(readFileSync(REPORT, 'utf8')) : null
if (!old || strip(old) !== strip(report) || changed) writeFileSync(REPORT, JSON.stringify(report, null, 2) + '\n')

const summary = events.length
  ? events.map((e) => `${e.id} ${e.field} ₹${e.from}→₹${e.to}`).join(', ')
  : changed ? 'status updated' : 'no change'
if (process.env.GITHUB_OUTPUT) writeFileSync(process.env.GITHUB_OUTPUT, `summary=${summary}\n`, { flag: 'a' })
console.log('Result:', summary)
