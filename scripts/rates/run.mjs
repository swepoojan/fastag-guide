// Automatic rate checker. Runs on a schedule in GitHub Actions; needs only Node 20+.
// Reads each official page twice, validates what it finds, and updates src/data/rates.json.
// It writes files only when something meaningful changed, so most runs commit nothing.
//
//   node scripts/rates/run.mjs            check the live sources
//   node scripts/rates/run.mjs --dry-run  check and print, write nothing

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { sources } from './sources.mjs'
import { applyCheck, extract, htmlToText, trimHistory, validate } from './logic.mjs'

const RATES = new URL('../../src/data/rates.json', import.meta.url)
const REPORT = new URL('./report.json', import.meta.url)
const dry = process.argv.includes('--dry-run')

const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())

async function read(url, spec) {
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(20000),
      headers: {
        'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 FASTAG-GUIDE-rate-check',
        'accept-language': 'en-IN,en;q=0.9',
        accept: 'text/html,application/xhtml+xml',
      },
    })
    if (!res.ok) return { error: `HTTP ${res.status}` }
    const text = htmlToText(await res.text())
    if (text.length < 200) return { error: 'page looked empty (may need a browser)' }
    return extract(text, spec)
  } catch (e) {
    return { error: e.name === 'TimeoutError' ? 'timed out' : `fetch failed: ${e.message}` }
  }
}

async function check(spec, current) {
  const first = await read(spec.url, spec)
  await new Promise((r) => setTimeout(r, 1500))
  const second = await read(spec.url, spec)
  return { result: validate([first, second], current), first }
}

const rates = JSON.parse(readFileSync(RATES, 'utf8'))
const before = JSON.stringify(rates)
const report = { checkedOn: today, sources: {} }
const events = []

for (const [id, spec] of Object.entries(sources.providers)) {
  const { result, first } = await check(spec, rates.providers[id].values)
  const out = applyCheck(rates.providers[id], result, today, id)
  rates.providers[id] = out.entry
  events.push(...out.events)
  report.sources[id] = { url: spec.url, ok: result.ok, reason: result.ok ? undefined : result.reason, found: first.values, snippets: first.snippets, status: out.entry.status }
}
{
  const spec = sources.passes
  const { result, first } = await check(spec, rates.passes.values)
  const out = applyCheck(rates.passes, result, today, 'passes')
  rates.passes = out.entry
  events.push(...out.events)
  report.sources.passes = { url: spec.url, ok: result.ok, reason: result.ok ? undefined : result.reason, found: first.values, snippets: first.snippets, status: out.entry.status }
}

rates.history = trimHistory([...(rates.history ?? []), ...events])

for (const [id, r] of Object.entries(report.sources)) {
  console.log(`${r.ok ? '✓' : '✗'} ${id.padEnd(7)} ${r.status.padEnd(10)} ${r.ok ? JSON.stringify(r.found) : r.reason}`)
}
for (const e of events) console.log(`CHANGE ${e.id} ${e.field}: ₹${e.from} → ₹${e.to}`)

if (dry) process.exit(0)

const changed = JSON.stringify(rates) !== before
if (changed) writeFileSync(RATES, JSON.stringify(rates, null, 2) + '\n')

// The report helps tune page readers. Rewrite it only when its content (not just the date) changes.
const strip = (r) => JSON.stringify({ ...r, checkedOn: undefined })
const old = existsSync(REPORT) ? JSON.parse(readFileSync(REPORT, 'utf8')) : null
if (!old || strip(old) !== strip(report) || changed) writeFileSync(REPORT, JSON.stringify(report, null, 2) + '\n')

// Short summary for the commit message.
const summary = events.length
  ? events.map((e) => `${e.id} ${e.field} ₹${e.from}→₹${e.to}`).join(', ')
  : changed ? 'status updated' : 'no change'
if (process.env.GITHUB_OUTPUT) writeFileSync(process.env.GITHUB_OUTPUT, `summary=${summary}\n`, { flag: 'a' })
console.log('Result:', summary)
