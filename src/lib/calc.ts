import rates from '../data/rates.json'

// Toll pass prices come from src/data/rates.json, which the automatic checker keeps up to date.
export const PASS = {
  annual: rates.passes.values.annual, // ₹, valid 200 crossings or 1 year
  annualCrossings: 200,
  localOutside: rates.passes.values.localOutside, // ₹/year, plaza outside municipal or town limits
  localInside: rates.passes.values.localInside, // ₹/year, plaza inside municipal or town limits
  monthlyTypical: 350, // ₹/month, varies by plaza
  verifiedOn: rates.passes.lastVerified,
  validUntil: rates.passes.validUntil, // notified prices apply until this date
  status: rates.passes.status as VerifyStatus,
}

export type VerifyStatus = 'ok' | 'pending' | 'unverified'

export type PlazaType = 'outside' | 'inside' | 'unsure'
export type OptionId = 'pay' | 'annual' | 'local' | 'monthly'

export interface PassInputs {
  roundTripsPerWeek: number // at the plaza near home
  homeToll: number // ₹ per crossing at that plaza
  plaza: PlazaType
  localEligible: boolean // non-commercial vehicle, within 20 km, plaza allows local pass
  hasMonthly: boolean
  monthlyPrice: number
  otherCrossings: number // per year, at other NH plazas
  otherToll: number // ₹ average per crossing
  annualEligible: boolean // non-commercial vehicle
}

export interface PassOption {
  id: OptionId
  cost: number
  available: boolean
  reason?: 'notEligible' | 'notOffered' | 'noTrips'
  passes?: number
  othersUsePass?: boolean
  localPrice?: number
}

export interface PassResult {
  homeCrossings: number
  otherCrossings: number
  options: PassOption[]
  best: PassOption
  saving: number // vs paying per trip
}

const pos = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0)

export function annualPassCost(crossings: number) {
  return crossings > 0 ? Math.ceil(crossings / PASS.annualCrossings) * PASS.annual : 0
}

export function computePasses(i: PassInputs): PassResult {
  const home = Math.round(pos(i.roundTripsPerWeek) * 2 * 52)
  const other = Math.round(pos(i.otherCrossings))
  const payHome = home * pos(i.homeToll)
  const payOther = other * pos(i.otherToll)

  // With a local or monthly pass, other trips are priced at normal toll. We don't combine an
  // annual pass on the same FASTag because NHAI hasn't published how two passes interact.
  const othersUsePass = false
  const othersBest = payOther
  const localPrice = i.plaza === 'outside' ? PASS.localOutside : PASS.localInside

  const options: PassOption[] = [
    { id: 'pay', cost: payHome + payOther, available: true },
    {
      id: 'annual',
      cost: annualPassCost(home + other),
      passes: Math.ceil((home + other) / PASS.annualCrossings),
      available: i.annualEligible && home + other > 0,
      reason: !i.annualEligible ? 'notEligible' : 'noTrips',
    },
    {
      id: 'local',
      cost: localPrice + othersBest,
      localPrice,
      othersUsePass,
      available: i.localEligible && home > 0,
      reason: !i.localEligible ? 'notEligible' : 'noTrips',
    },
    {
      id: 'monthly',
      cost: pos(i.monthlyPrice) * 12 + othersBest,
      othersUsePass,
      available: i.localEligible && i.hasMonthly && home > 0,
      reason: !i.localEligible ? 'notEligible' : !i.hasMonthly ? 'notOffered' : 'noTrips',
    },
  ]
  for (const o of options) if (o.available) delete o.reason

  const avail = options.filter((o) => o.available)
  const best = avail.reduce((a, b) => (b.cost < a.cost ? b : a), avail[0])
  return { homeCrossings: home, otherCrossings: other, options, best, saving: payHome + payOther - best.cost }
}

/** Annual pass break-even for the simple calculator. */
export function annualBreakEven(tripsPerMonth: number, avgToll: number) {
  const crossingsYear = Math.round(pos(tripsPerMonth) * 12)
  const payYear = crossingsYear * pos(avgToll)
  const passYear = annualPassCost(crossingsYear)
  const breakEvenCrossings = pos(avgToll) > 0 ? Math.ceil(PASS.annual / avgToll) : null
  return { crossingsYear, payYear, passYear, saving: payYear - passYear, breakEvenCrossings }
}
