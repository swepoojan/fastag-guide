// Tests the page readers against copies shaped like the real bank pages, and simulates
// a bank changing its FASTag fee to check how the robot reacts at each step.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { applyCheck, extract, findValue, htmlToText, passStatus, validate } from './logic.mjs'
import { sources } from './sources.mjs'

const page = (name) => htmlToText(readFileSync(new URL(`./fixtures/${name}.html`, import.meta.url), 'utf8'))
const spec = sources.providers.hdfc
const readTwice = (name) => [extract(page(name), spec), extract(page(name), spec)]
const READER = 'hdfc-reader-v1'

const published = {
  values: { issuanceFee: 100, securityDeposit: 200, minBalance: 0 },
  status: 'ok', lastVerified: '2026-11-03', pending: null, failures: 0, provenBy: READER,
}

const step = (entry, pages, day, reader = READER) => {
  const result = validate(Array.isArray(pages) ? pages : readTwice(pages), entry.values)
  return applyCheck(entry, result, day, 'hdfc', reader)
}

describe('reading the bank pages', () => {
  it('HDFC: issuance fee by label, deposit and NIL minimum balance from the Class 4 table row', () => {
    const r = extract(page('hdfc-original'), spec)
    expect(r.missing).toEqual([])
    expect(r.values).toEqual({ issuanceFee: 100, securityDeposit: 200, minBalance: 0 })
  })
  it('HDFC: "Reissuance fee" is not mistaken for the issuance fee', () => {
    const t = page('hdfc-original').replace('FASTag Issuance fee (One time) | ₹100', 'FASTag Issuance fee (One time) | ₹110')
    expect(extract(t, spec).values.issuanceFee).toBe(110)
  })
  it('SBI: all three figures from the Car / Jeep / Van row, including a hidden tab', () => {
    const r = extract(page('sbi'), sources.providers.sbi)
    expect(r.missing).toEqual([])
    expect(r.values).toEqual({ issuanceFee: 100, securityDeposit: 200, minBalance: 100 })
  })
  it('IDFC FIRST: skips the tag class cell and reads deposit and minimum balance', () => {
    const r = extract(page('idfc'), sources.providers.idfc)
    expect(r.missing).toEqual([])
    expect(r.values).toEqual({ issuanceFee: 100, securityDeposit: 200, minBalance: 100 })
  })
  it('IDFC FIRST: a sentence naming the same columns is not taken for the table header', () => {
    const prose = 'The Security Deposit and Minimum Balance are applicable as on the current date. Tag Class rules apply. '
    const r = extract(prose + 'x '.repeat(1000) + page('idfc') + ' ' + prose, sources.providers.idfc)
    expect(r.values).toEqual({ issuanceFee: 100, securityDeposit: 200, minBalance: 100 })
  })
  it('ICICI: joining fee with paise, and the class 4 row', () => {
    const r = extract(page('icici'), sources.providers.icici)
    expect(r.missing).toEqual([])
    expect(r.values).toEqual({ issuanceFee: 99.12, securityDeposit: 200, minBalance: 100 })
  })
  it('reads Rs / INR prefixes and decimals in label mode', () => {
    expect(findValue('Issuance fee ₹ 99.12 incl GST', [/issuance fee/i]).value).toBe(99.12)
    expect(findValue('Tag cost: INR 100', [/tag cost/i]).value).toBe(100)
    expect(findValue('one-time fee of Rs 1,000', [/one-time fee/i]).value).toBe(1000)
  })
  it('never reads a bare number such as a helpline as a price', () => {
    // A real misread seen on the NHAI page before this rule existed.
    expect(findValue('Annual Pass Route Planner Toll Info 1033', [/annual\s*pass/i]).value).toBeNull()
  })
})

describe('simulated fee change: HDFC raises issuance fee ₹100 → ₹120', () => {
  it('page unchanged: stays published, date moves forward', () => {
    const { entry, events } = step(published, 'hdfc-original', '2026-11-04')
    expect(entry.status).toBe('ok')
    expect(entry.lastVerified).toBe('2026-11-04')
    expect(entry.values.issuanceFee).toBe(100)
    expect(events).toEqual([])
  })

  it('first sighting of ₹120: held as pending, site still shows ₹100', () => {
    const { entry, events } = step(published, 'hdfc-fee-raised', '2026-11-04')
    expect(entry.status).toBe('pending')
    expect(entry.values.issuanceFee).toBe(100)
    expect(entry.pending.values.issuanceFee).toBe(120)
    expect(entry.lastVerified).toBe('2026-11-03')
    expect(events).toEqual([])
  })

  it('second sighting of ₹120 on the next check: published and logged', () => {
    const first = step(published, 'hdfc-fee-raised', '2026-11-04').entry
    const { entry, events } = step(first, 'hdfc-fee-raised', '2026-11-05')
    expect(entry.status).toBe('ok')
    expect(entry.values.issuanceFee).toBe(120)
    expect(entry.lastVerified).toBe('2026-11-05')
    expect(entry.pending).toBeNull()
    expect(events).toEqual([{ date: '2026-11-05', id: 'hdfc', field: 'issuanceFee', from: 100, to: 120 }])
  })

  it('one-off glitch: ₹120 seen once, then ₹100 again → change discarded', () => {
    const first = step(published, 'hdfc-fee-raised', '2026-11-04').entry
    const { entry, events } = step(first, 'hdfc-original', '2026-11-04')
    expect(entry.status).toBe('ok')
    expect(entry.values.issuanceFee).toBe(100)
    expect(entry.pending).toBeNull()
    expect(events).toEqual([])
  })
})

describe('a new or edited reader must prove itself first', () => {
  it('an unproven reader that reads different figures cannot publish them', () => {
    const fresh = { ...published, provenBy: undefined }
    const a = step(fresh, 'hdfc-fee-raised', '2026-11-04', 'new-reader')
    expect(a.outcome.ok).toBe(false)
    expect(a.outcome.reason).toMatch(/not yet matched the verified figures/)
    const b = step(a.entry, 'hdfc-fee-raised', '2026-11-04', 'new-reader')
    expect(b.entry.values.issuanceFee).toBe(100)
    expect(b.entry.pending ?? null).toBeNull()
  })
  it('a reader becomes proven when it reads the verified figures correctly', () => {
    const fresh = { ...published, provenBy: undefined }
    const { entry } = step(fresh, 'hdfc-original', '2026-11-04', 'new-reader')
    expect(entry.provenBy).toBe('new-reader')
    expect(entry.status).toBe('ok')
    // Once proven, a later change can go through the normal two-check confirmation.
    const p1 = step(entry, 'hdfc-fee-raised', '2026-11-05', 'new-reader').entry
    expect(p1.status).toBe('pending')
  })
  it('editing a reader resets its proof', () => {
    const a = step(published, 'hdfc-fee-raised', '2026-11-04', 'edited-reader')
    expect(a.outcome.ok).toBe(false)
  })
})

describe('safety guards', () => {
  it('implausible jump (deposit ₹200 → ₹950) is never published', () => {
    const one = step(published, 'hdfc-misread', '2026-11-05')
    expect(one.outcome.ok).toBe(false)
    expect(one.outcome.reason).toMatch(/too large to trust/)
    expect(one.entry.values.securityDeposit).toBe(200)
    expect(one.entry.status).toBe('ok') // one failure is tolerated

    const two = step(one.entry, 'hdfc-misread', '2026-11-05')
    expect(two.entry.status).toBe('unverified') // failing and last success 2+ days old: "couldn't verify"
    expect(two.entry.values.securityDeposit).toBe(200)
    expect(two.entry.lastVerified).toBe('2026-11-03')
  })

  it('changes over 50% are rejected even inside the plausible range', () => {
    const r = validate([{ values: { issuanceFee: 100, securityDeposit: 200, minBalance: 0 }, missing: [] }], { issuanceFee: 300, securityDeposit: 200, minBalance: 0 })
    expect(r.ok).toBe(false)
  })

  it('page layout changed (labels gone): unverified, old values kept', () => {
    const one = step(published, 'hdfc-layout-changed', '2026-11-05')
    expect(one.outcome.reason).toMatch(/missing/)
    const two = step(one.entry, 'hdfc-layout-changed', '2026-11-05')
    expect(two.entry.status).toBe('unverified')
    expect(two.entry.values).toEqual(published.values)
  })

  it('bank page blocked: unverified after two days of failures, recovers when readable again', () => {
    const blocked = [{ error: 'HTTP 403' }, { error: 'HTTP 403' }]
    const a = step(published, blocked, '2026-11-05').entry
    const b = step(a, blocked, '2026-11-05').entry
    expect(b.status).toBe('unverified')
    const c = step(b, blocked, '2026-11-05').entry
    expect(c).toEqual(b) // keeps failing → file doesn't change → no redeploy
    const d = step(c, 'hdfc-original', '2026-11-06').entry
    expect(d.status).toBe('ok')
    expect(d.lastVerified).toBe('2026-11-06')
  })

  it('a bad day does not show warnings: failures within 2 days keep the last checked date', () => {
    const blocked = [{ error: 'HTTP 503' }, { error: 'HTTP 503' }]
    const a = step(published, blocked, '2026-11-04').entry
    const b = step(a, blocked, '2026-11-04').entry
    expect(b.status).toBe('ok')
    expect(b.lastVerified).toBe('2026-11-03')
  })

  it('two reads that disagree are rejected', () => {
    const r = validate([extract(page('hdfc-original'), spec), extract(page('hdfc-fee-raised'), spec)], published.values)
    expect(r).toEqual({ ok: false, reason: 'two reads disagreed' })
  })

  it('values outside the plausible range are rejected', () => {
    const r = validate([{ values: { issuanceFee: 20, securityDeposit: 200, minBalance: 0 }, missing: [] }], { issuanceFee: 60, securityDeposit: 200, minBalance: 0 })
    expect(r.ok).toBe(false)
    expect(r.reason).toMatch(/outside plausible range/)
  })
})

describe('toll pass prices', () => {
  it('stay verified until the notified validity date, then show as unverified', () => {
    const passes = { validUntil: '2027-03-31' }
    expect(passStatus(passes, '2026-11-04')).toBe('ok')
    expect(passStatus(passes, '2027-03-31')).toBe('ok')
    expect(passStatus(passes, '2027-04-01')).toBe('unverified')
  })
})
