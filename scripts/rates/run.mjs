// Automatic rate checker. Runs on a schedule in GitHub Actions.
// Reads each bank's official FASTag fee page twice, validates what it finds, and updates
// src/data/rates.json. Pages are first downloaded directly; if the figures can't be read that
// way (common when a site builds its tables with JavaScript), a headless browser renders the
// page and the full page source, including hidden tabs, is read instead.
// It writes files only when something meaningful changed, so most runs commit nothing.
//
//   node scripts/rates/run.mjs            check the live sources
//   node scripts/rates/run.mjs --dry-run  check and print, write nothing

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { sources } from './sources.mjs'
import { applyCheck, diagnose, extract, htmlToText, passStatus, trimHistory, validate } from './logic.mjs'

const RATES = new URL('../../src/data/rates.json', import.meta.url)
const REPORT = new URL('./report.json', import.meta.url)
const dry = process.argv.includes('--dry-run')
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'

const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())

/** Identifies a page reader by its rules, so an edited reader has to prove itself again. */
const readerId = (spec) =>
  createHash('sha1').update(JSON.stringify(spec, (_k, v) => (v instanceof RegExp ? v.toString() : v))).digest('hex').slice(0, 10)

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
    // The rendered page source, not just visible text: fee tables often sit in hidden tabs.
    return htmlToText(await page.content())
  } finally {
    await page.close()
  }
}

/** Reads a page with the given method and extracts its fields. */
async function readWith(method, spec) {
  try {
    const text = method === 'browser' ? await viaBrowser(spec.url) : await viaFetch(spec.url)
    if (text.length < 200) return { error: 'page looked empty', method }
    const r = extract(text, spec)
    return { ...r, method, diag: r.missing.length ? diagnose(text, spec) : undefined }
  } catch (e) {
    const msg = e.name === 'TimeoutError' ? 'timed out' : e.message
    return { error: msg.startsWith('HTTP') || msg.startsWith('no browser') ? msg : `could not load: ${msg}`, method }
  }
}

const works = (r) => !r.error && r.missing.length === 0

async function check(spec, current) {
  let method = 'fetch'
  let first = await readWith(method, spec)
  if (!works(first)) {
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

for (const [id, spec] of Object.entries(sources.providers)) {
  const { result, first } = await check(spec, rates.providers[id].values)
  const out = applyCheck(rates.providers[id], result, today, id, readerId(spec))
  rates.providers[id] = out.entry
  events.push(...out.events)
  report.sources[id] = {
    url: spec.url,
    ok: out.outcome.ok,
    method: first.method,
    reason: out.outcome.ok ? undefined : out.outcome.reason,
    found: first.values,
    snippets: first.snippets,
    tableExcerpts: first.excerpts?.length ? first.excerpts : undefined,
    status: out.entry.status,
    diagnostics: out.outcome.ok ? undefined : first.diag,
  }
}
if (browser) await browser.close()

// Toll pass prices: fixed by notification for the tax year; flagged once the validity date passes.
rates.passes.status = passStatus(rates.passes, today)
report.sources.passes = {
  basis: 'Government notification; not scraped',
  validUntil: rates.passes.validUntil,
  status: rates.passes.status,
}

rates.history = trimHistory([...(rates.history ?? []), ...events])

for (const [id, r] of Object.entries(report.sources)) {
  if (id === 'passes') { console.log(`• passes  notified, valid until ${r.validUntil} → ${r.status}`); continue }
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
