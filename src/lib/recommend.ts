import { providers, upfront, type Provider, type ProviderId } from '../data/providers'

export type BankPref = 'none' | 'existing' | 'digital' | 'lowest'

export interface ProviderPick {
  kind: 'best' | 'bank' | 'digital' | 'lowest' | 'upi'
  provider: Provider
}

const byUpfront = [...providers].sort((a, b) => upfront(a) - upfront(b))
const get = (id: ProviderId) => providers.find((p) => p.id === id)!

/**
 * Picks are based only on published, verified facts (fees, purchase channel, your own bank).
 * Commission never affects the order.
 */
export function recommendProviders(pref: BankPref, myBank: ProviderId | null): ProviderPick[] {
  const lowest = byUpfront[0]
  const digital = get('airtel') // the only provider whose official page documents buying and managing fully inside one app
  const freeUpi = get('icici') // documents nil fee on UPI recharge

  const best = pref === 'existing' && myBank ? get(myBank) : pref === 'digital' ? digital : lowest
  const candidates: ProviderPick[] = [
    { kind: 'best', provider: best },
    ...(myBank ? [{ kind: 'bank' as const, provider: get(myBank) }] : []),
    { kind: 'lowest', provider: lowest },
    { kind: 'digital', provider: digital },
    { kind: 'upi', provider: freeUpi },
    ...byUpfront.map((p) => ({ kind: 'lowest' as const, provider: p })),
  ]

  const seen = new Set<ProviderId>()
  const picks: ProviderPick[] = []
  for (const c of candidates) {
    if (seen.has(c.provider.id)) continue
    seen.add(c.provider.id)
    picks.push(c)
    if (picks.length === 3) break
  }
  return picks
}
