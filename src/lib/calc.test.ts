import { describe, expect, it } from 'vitest'
import { annualBreakEven, annualPassCost, computePasses, type PassInputs } from './calc'
import { recommendProviders } from './recommend'
import { providers, upfront } from '../data/providers'

const base: PassInputs = {
  roundTripsPerWeek: 5, homeToll: 105, plaza: 'outside', localEligible: true, hasMonthly: true,
  monthlyPrice: 350, otherCrossings: 24, otherToll: 120, annualEligible: true,
}

describe('computePasses', () => {
  it('daily commuter outside town limits: local pass wins', () => {
    const r = computePasses(base)
    expect(r.homeCrossings).toBe(520)
    expect(r.best.id).toBe('local')
    expect(r.best.cost).toBe(1500 + 24 * 120)
    expect(r.saving).toBe(520 * 105 + 24 * 120 - (1500 + 2880))
  })
  it('inside town limits prices the local pass at ₹3,000', () => {
    expect(computePasses({ ...base, plaza: 'inside' }).best.cost).toBe(3000 + 2880)
    expect(computePasses({ ...base, plaza: 'unsure' }).best.cost).toBe(3000 + 2880)
  })
  it('not eligible for local pass falls back to annual pass', () => {
    const r = computePasses({ ...base, localEligible: false })
    expect(r.best.id).toBe('annual')
    expect(r.best.cost).toBe(3 * 3075) // 544 crossings → 3 passes
    expect(r.options.find((o) => o.id === 'local')?.reason).toBe('notEligible')
  })
  it('occasional driver: annual pass beats local + per-trip', () => {
    const r = computePasses({ ...base, roundTripsPerWeek: 0.5 })
    expect(r.best.id).toBe('annual')
    expect(r.best.cost).toBe(3075)
  })
  it('no home trips and little travel: pay per trip', () => {
    const r = computePasses({ ...base, roundTripsPerWeek: 0, otherCrossings: 6 })
    expect(r.best.id).toBe('pay')
    expect(r.saving).toBe(0)
  })
  it('heavy outstation traveller: annual pass for everything beats local + full toll elsewhere', () => {
    const r = computePasses({ ...base, roundTripsPerWeek: 1, otherCrossings: 300 })
    expect(r.options.find((o) => o.id === 'local')!.cost).toBe(1500 + 300 * 120)
    expect(r.best.id).toBe('annual')
    expect(r.best.cost).toBe(3 * 3075) // 404 crossings
  })
  it('commercial vehicles get only pay per trip', () => {
    const r = computePasses({ ...base, localEligible: false, annualEligible: false })
    expect(r.best.id).toBe('pay')
  })
  it('ignores negative or invalid numbers', () => {
    const r = computePasses({ ...base, roundTripsPerWeek: -3, homeToll: NaN })
    expect(r.homeCrossings).toBe(0)
  })
})

describe('annual pass helpers', () => {
  it('needs a new pass every 200 crossings', () => {
    expect(annualPassCost(0)).toBe(0)
    expect(annualPassCost(200)).toBe(3075)
    expect(annualPassCost(201)).toBe(6150)
  })
  it('break-even', () => {
    const r = annualBreakEven(20, 110)
    expect(r.crossingsYear).toBe(240)
    expect(r.passYear).toBe(6150)
    expect(r.breakEvenCrossings).toBe(28)
  })
})

describe('recommendProviders', () => {
  it('lowest upfront is HDFC with nil minimum balance', () => {
    const low = [...providers].sort((a, b) => upfront(a) - upfront(b))[0]
    expect(low.id).toBe('hdfc')
    expect(recommendProviders('lowest', null)[0].provider.id).toBe('hdfc')
  })
  it('existing bank comes first', () => {
    const r = recommendProviders('existing', 'sbi')
    expect(r[0].provider.id).toBe('sbi')
    expect(r).toHaveLength(3)
    expect(new Set(r.map((x) => x.provider.id)).size).toBe(3)
  })
  it('digital preference picks the app-based issuer', () => {
    expect(recommendProviders('digital', null)[0].provider.id).toBe('airtel')
  })
  it('always returns three distinct providers', () => {
    for (const pref of ['none', 'existing', 'digital', 'lowest'] as const)
      for (const bank of [null, ...providers.map((p) => p.id)]) {
        const r = recommendProviders(pref, bank)
        expect(new Set(r.map((x) => x.provider.id)).size).toBe(r.length)
        expect(r.length).toBe(3)
      }
  })
})
