// Demo: runs the real checker logic against fake bank pages to show what happens when a fee changes.
// Never touches the live sources or src/data/rates.json.
//
//   node scripts/rates/simulate.mjs <output.json>
//
// Scenario
//   check 1: HDFC's page now says issuance fee ₹120 (was ₹100); Airtel's page is blocked
//   check 2: HDFC still says ₹120; Airtel still blocked
//   check 3: HDFC still ₹120; Airtel readable again

import { readFileSync, writeFileSync } from 'node:fs'
import { applyCheck, extract, htmlToText, trimHistory, validate } from './logic.mjs'
import { sources } from './sources.mjs'

const out = process.argv[2]
if (!out) { console.error('usage: node scripts/rates/simulate.mjs <output.json>'); process.exit(1) }

const rates = JSON.parse(readFileSync(new URL('../../src/data/rates.json', import.meta.url), 'utf8'))
const page = (name) => htmlToText(readFileSync(new URL(`./fixtures/${name}.html`, import.meta.url), 'utf8'))
const hdfc = (name) => { const r = extract(page(name), sources.providers.hdfc); return [r, r] }
const ok = (id) => [{ values: rates.providers[id].values, missing: [] }, { values: rates.providers[id].values, missing: [] }]
const blocked = [{ error: 'HTTP 403' }, { error: 'HTTP 403' }]

const checks = [
  { when: '2026-11-04', label: 'check 1', pages: { hdfc: hdfc('hdfc-fee-raised'), airtel: blocked } },
  { when: '2026-11-04', label: 'check 2 (5 minutes later)', pages: { hdfc: hdfc('hdfc-fee-raised'), airtel: blocked } },
  { when: '2026-11-05', label: 'check 3 (next day)', pages: { hdfc: hdfc('hdfc-fee-raised') } },
]

let n = 0
for (const c of checks) {
  console.log(`\n${c.label}, ${c.when}`)
  for (const id of Object.keys(rates.providers)) {
    const readings = c.pages[id] ?? ok(id)
    const result = validate(readings, rates.providers[id].values)
    const { entry, events } = applyCheck(rates.providers[id], result, c.when, id)
    rates.providers[id] = entry
    rates.history = trimHistory([...rates.history, ...events])
    if (c.pages[id]) {
      const shown = `live fee ₹${entry.values.issuanceFee}`
      console.log(`  ${id.padEnd(6)} ${result.ok ? 'read OK  ' : 'FAILED   '} → status ${entry.status.padEnd(10)} ${shown}${entry.pending ? `, holding ₹${entry.pending.values.issuanceFee} for confirmation` : ''}${result.ok ? '' : ` (${result.reason})`}`)
    }
    for (const e of events) console.log(`  PUBLISHED ${e.id} ${e.field}: ₹${e.from} → ₹${e.to}`)
  }
  writeFileSync(out.replace(/\.json$/, `-check${++n}.json`), JSON.stringify(rates, null, 2) + '\n')
}

writeFileSync(out, JSON.stringify(rates, null, 2) + '\n')
console.log(`\nwrote ${out}`)
