import { useMemo, useState } from 'react'
import { ArrowUpRight, Check, Scale } from 'lucide-react'
import { inr, useI18n } from '../i18n'
import { providers, providerLink, upfront, VERIFIED_ON, type Provider, type ProviderId } from '../data/providers'
import { track } from '../lib/analytics'
import { Reveal, Section, SectionHead } from './ui'
import { ProviderLogo, fmtDate } from './Results'

type Filter = 'all' | 'low' | 'online' | 'upi' | 'bank'

interface Props {
  compareIds: ProviderId[]
  onToggleCompare: (id: ProviderId) => void
  myBank: ProviderId | null
  onBankChange: (id: ProviderId | null) => void
}

export default function Compare({ compareIds, onToggleCompare, myBank, onBankChange }: Props) {
  const { t, lang } = useI18n()
  const c = t.cmp
  const r = t.res
  const [filter, setFilter] = useState<Filter>('all')
  const [onlySelected, setOnlySelected] = useState(false)

  const list = useMemo(() => {
    let l = [...providers]
    if (filter === 'low') l.sort((a, b) => upfront(a) - upfront(b))
    if (filter === 'online') l = l.filter((p) => p.tags.includes('online') || p.tags.includes('app'))
    if (filter === 'upi') l = l.filter((p) => p.tags.includes('freeUpi'))
    if (filter === 'bank' && myBank) l = [...l.filter((p) => p.id === myBank), ...l.filter((p) => p.id !== myBank)]
    if (onlySelected && compareIds.length) l = l.filter((p) => compareIds.includes(p.id))
    return l
  }, [filter, myBank, onlySelected, compareIds])

  const filters: { id: Filter; l: string }[] = [
    { id: 'all', l: c.f_all }, { id: 'low', l: c.f_low }, { id: 'online', l: c.f_online }, { id: 'upi', l: c.f_upi }, { id: 'bank', l: c.f_bank },
  ]

  const rows: { l: string; v: (p: Provider) => React.ReactNode }[] = [
    { l: r.upfront, v: (p) => <span className="num font-semibold">{inr(upfront(p))}</span> },
    { l: r.issuance, v: (p) => <span className="num">{inr(p.issuanceFee)}</span> },
    { l: r.deposit, v: (p) => <span className="num">{inr(p.securityDeposit)}</span> },
    { l: r.minBal, v: (p) => (p.minBalance === null ? '—' : <span className="num">{inr(p.minBalance)}</span>) },
    { l: r.rechargeL, v: (p) => p.recharge[lang] },
    { l: lang === 'hi' ? 'ऐप / ऑनलाइन खरीद' : 'Buy in app / online', v: (p) => yes(p.tags.includes('app') || p.tags.includes('online'), lang) },
    { l: c.f_upi, v: (p) => yes(p.tags.includes('freeUpi'), lang) },
    { l: r.supportL, v: (p) => (p.support ? <span className="num select-all">{p.support}</span> : <span className="text-ink-mute">{r.supportNone}</span>) },
    { l: r.applyL, v: (p) => p.apply[lang] },
  ]

  const view = (p: Provider) => (
    <a href={providerLink(p)} target="_blank" rel={p.affiliateUrl ? 'sponsored noopener' : 'noopener'}
      onClick={() => track('provider_link_clicked', { provider: p.id, source: 'compare', affiliate: Boolean(p.affiliateUrl) })}
      className="btn-primary !px-4 !py-2 !text-[14px]">
      {r.view} <ArrowUpRight size={15} />
    </a>
  )
  const toggle = (p: Provider) => (
    <button type="button" aria-pressed={compareIds.includes(p.id)}
      onClick={() => { onToggleCompare(p.id); track('provider_compared', { provider: p.id, source: 'compare' }) }}
      className={`btn-ghost !px-3 !py-2 !text-[13.5px] ${compareIds.includes(p.id) ? '!bg-brand-50 !ring-brand-500' : ''}`}>
      <Scale size={15} /> {compareIds.includes(p.id) ? r.compared : r.compare}
    </button>
  )

  return (
    <Section id="compare">
      <SectionHead eyebrow={c.eyebrow} title={c.h2} sub={c.sub} />
      <Reveal className="mt-8 flex flex-wrap items-center gap-2">
        {filters.map((f) => (
          <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)} className={`chip ${filter === f.id ? 'chip-on' : ''}`}>
            {f.l}
          </button>
        ))}
        {compareIds.length > 0 && (
          <button type="button" aria-pressed={onlySelected} onClick={() => setOnlySelected((s) => !s)} className={`chip ${onlySelected ? 'chip-on' : ''}`}>
            <Scale size={15} /> {onlySelected ? c.clear : `${c.selected} (${compareIds.length})`}
          </button>
        )}
      </Reveal>
      {filter === 'bank' && (
        <div className="mt-4">
          <label htmlFor="cmp-bank" className="text-[14px] font-medium text-ink-soft">{c.pickBank}</label>
          <select id="cmp-bank" value={myBank ?? ''} onChange={(e) => onBankChange((e.target.value || null) as ProviderId | null)}
            className="ml-3 rounded-full bg-white px-4 py-2 text-[14.5px] ring-1 ring-line">
            <option value="">—</option>
            {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      )}

      {list.length === 0 ? (
        <p className="card mt-6 p-10 text-center text-ink-mute">{c.empty}</p>
      ) : (
        <>
          {/* Desktop table */}
          <Reveal className="mt-6 hidden overflow-x-auto rounded-3xl ring-1 ring-line lg:block">
            <table className="w-full min-w-[960px] border-collapse text-left text-[14px]">
              <thead>
                <tr className="bg-paper">
                  <th scope="col" className="sticky left-0 w-44 bg-paper p-4 text-[12.5px] font-semibold uppercase tracking-[0.1em] text-ink-mute">{c.provider}</th>
                  {list.map((p) => (
                    <th key={p.id} scope="col" className={`p-4 align-top ${p.id === myBank && filter === 'bank' ? 'bg-brand-50' : ''}`}>
                      <div className="flex items-center gap-2.5">
                        <ProviderLogo short={p.short} color={p.color} size={36} />
                        <span className="font-semibold leading-tight">{p.name}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.l} className="border-t border-line">
                    <th scope="row" className="sticky left-0 bg-white p-4 font-medium text-ink-mute">{row.l}</th>
                    {list.map((p) => <td key={p.id} className={`p-4 align-top text-ink-soft ${p.id === myBank && filter === 'bank' ? 'bg-brand-50/60' : ''}`}>{row.v(p)}</td>)}
                  </tr>
                ))}
                <tr className="border-t border-line">
                  <th scope="row" className="sticky left-0 bg-white p-4" />
                  {list.map((p) => (
                    <td key={p.id} className="p-4">
                      <div className="flex flex-col items-start gap-2">{view(p)}{toggle(p)}</div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </Reveal>

          {/* Mobile cards */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:hidden">
            {list.map((p) => (
              <article key={p.id} className={`card p-5 ${p.id === myBank && filter === 'bank' ? '!ring-2 !ring-brand-500' : ''}`}>
                <div className="flex items-center gap-3">
                  <ProviderLogo short={p.short} color={p.color} />
                  <h3 className="text-[17px] font-semibold">{p.name}</h3>
                </div>
                <dl className="mt-4 divide-y divide-line text-[14px]">
                  {rows.map((row) => (
                    <div key={row.l} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-3 py-2.5">
                      <dt className="text-ink-mute">{row.l}</dt>
                      <dd className="text-right text-ink-soft">{row.v(p)}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-4 flex flex-wrap gap-2">{view(p)}{toggle(p)}</div>
              </article>
            ))}
          </div>
        </>
      )}
      <p className="mt-5 max-w-3xl text-[13.5px] text-ink-mute">
        {t.foot.updated}: {fmtDate(VERIFIED_ON, lang)}. {c.note} {t.foot.aff}
      </p>
    </Section>
  )
}

function yes(v: boolean, lang: 'en' | 'hi') {
  return v
    ? <Check size={18} className="inline text-brand-600" role="img" aria-label={lang === 'hi' ? 'हाँ' : 'Yes'} />
    : <span className="text-ink-mute">{lang === 'hi' ? 'नहीं बताया गया' : 'Not stated'}</span>
}
