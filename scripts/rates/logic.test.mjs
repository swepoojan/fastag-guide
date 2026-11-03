// Simulates a bank changing its FASTag fee and checks how the robot reacts at each step.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { applyCheck, extract, findValue, htmlToText, validate } from './logic.mjs'
import { sources } from './sources.mjs'

const page = (name) => htmlToText(readFileSync(new URL(`./fixtures/${name}.html`, import.meta.url), 'utf8'))
const spec = sources.providers.hdfc
const readTwice = (name) => [extract(page(name), spec), extract(page(name), spec)]

const published = {
  values: { issuanceFee: 100, securityDeposit: 200, minBalance: 0 },
  status: 'ok', lastVerified: '2026-11-03', pending: null, failures: 0,
}

const step = (entry, pages, day) => {
  const result = validate(Array.isArray(pages) ? pages : readTwice(pages), entry.values)
  return { ...applyCheck(entry, result, day, 'hdfc'), result }
}

describe('reading a bank page', () => {
  it('finds all three car fees, including "Nil" minimum balance', () => {
    const r = extract(page('hdfc-original'), spec)
    expect(r.missing).toEqual([])
    expect(r.values).toEqual({ issuanceFee: 100, securityDeposit: 200, minBalance: 0 })
  })
  it('reads decimal amounts and Rs / INR prefixes', () => {
    expect(findValue('Issuance fee ₹ 99.12 incl GST', [/issuance fee/i]).value).toBe(99.12)
    expect(findValue('Tag cost: INR 100', [/tag cost/i]).value).toBe(100)
    expect(findValue('one-time fee of Rs 1,000', [/one-time fee/i]).value).toBe(1000)
  })
})

describe('simulated fee change: HDFC raises issuance fee ₹100 → ₹120', () => {
  it('day 1, page unchanged: stays published, date moves forward', () => {
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

describe('safety guards', () => {
  it('implausible jump (deposit ₹200 → ₹950) is never published', () => {
    const one = step(published, 'hdfc-misread', '2026-11-05')
    expect(one.result.ok).toBe(false)
    expect(one.result.reason).toMatch(/too large to trust/)
    expect(one.entry.values.securityDeposit).toBe(200)
    expect(one.entry.status).toBe('ok') // one failure is tolerated

    const two = step(one.entry, 'hdfc-misread', '2026-11-05')
    expect(two.entry.status).toBe('unverified') // failing and last success 2+ days old: "couldn't verify"
    expect(two.entry.values.securityDeposit).toBe(200)
    expect(two.entry.lastVerified).toBe('2026-11-03')
  })

  it('page layout changed (labels gone): unverified, old values kept', () => {
    const one = step(published, 'hdfc-layout-changed', '2026-11-05')
    expect(one.result.reason).toMatch(/missing/)
    const two = step(one.entry, 'hdfc-layout-changed', '2026-11-05')
    expect(two.entry.status).toBe('unverified')
    expect(two.entry.values).toEqual(published.values)
  })

  it('bank page blocked: unverified after two tries, recovers when readable again', () => {
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

  it('values outside the plausible range are rejected even if the change looks small', () => {
    const r = validate([{ values: { issuanceFee: 20, securityDeposit: 200, minBalance: 0 }, missing: [] }], { issuanceFee: 60, securityDeposit: 200, minBalance: 0 })
    expect(r.ok).toBe(false)
    expect(r.reason).toMatch(/outside plausible range/)
  })
})
