import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, CheckCircle2, ChevronDown, Info, Pencil, Phone, RotateCcw, Scale, ShieldCheck, XCircle } from 'lucide-react'
import { inr, useI18n } from '../i18n'
import { computePasses, type OptionId, type PassOption } from '../lib/calc'
import { recommendProviders, type ProviderPick } from '../lib/recommend'
import { providerLink, upfront, type ProviderId } from '../data/providers'
import { track } from '../lib/analytics'
import { site } from '../config'
import { scrollToId } from './ui'
import { OTHER_CROSSINGS, passVehicle, roundTripsOf, type Answers } from './Wizard'

interface Props {
  a: Answers
  onEdit: () => void
  onRestart: () => void
  compareIds: ProviderId[]
  onToggleCompare: (id: ProviderId) => void
}

export default function Results({ a, onEdit, onRestart, compareIds, onToggleCompare }: Props) {
  const { t, lang } = useI18n()
  const r = t.res
  const eligibleVehicle = passVehicle(a.vehicle)

  const pass = useMemo(() => {
    if (!eligibleVehicle) return null
    return computePasses({
      roundTripsPerWeek: roundTripsOf(a),
      homeToll: parseFloat(a.toll) || 0,
      plaza: a.town ?? 'unsure',
      localEligible: a.dist !== 'no',
      hasMonthly: a.hasMonthly,
      monthlyPrice: parseFloat(a.monthlyPrice) || 0,
      otherCrossings: a.other ? OTHER_CROSSINGS[a.other] : 0,
      otherToll: parseFloat(a.otherToll) || 0,
      annualEligible: true,
    })
  }, [a, eligibleVehicle])

  const myBank = a.bank && a.bank !== 'other' ? a.bank : null
  const picks = useMemo(() => recommendProviders(a.pref ?? 'none', myBank), [a.pref, myBank])
  const providersFirst = a.status !== 'have' || !eligibleVehicle
  const [showProviders, setShowProviders] = useState(providersFirst)

  useEffect(() => {
    track('recommendation_generated', { best_pass: pass?.best.id ?? 'none', best_provider: picks[0].provider.id })
  }, [pass, picks])

  const homeTrips = roundTripsOf(a)
  const warns: string[] = []
  if (!eligibleVehicle) warns.push(a.vehicle === 'comm' ? r.w_comm : r.w_other)
  if (pass && homeTrips > 0 && a.town === 'unsure' && a.dist !== 'no') warns.push(r.w_unsureTown)
  if (pass && homeTrips > 0 && a.dist === 'unsure') warns.push(r.w_unsureDist)

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="grid gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-[24px] font-semibold tracking-tight sm:text-[28px]">{r.h2}</h3>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onEdit} className="btn-ghost !py-2.5"><Pencil size={16} /> {t.wiz.edit}</button>
          <button type="button" onClick={onRestart} className="btn-ghost !py-2.5"><RotateCcw size={16} /> {t.wiz.restart}</button>
        </div>
      </div>

      {pass && <PassCard pass={pass} status={a.status} />}

      {warns.length > 0 && (
        <ul className="grid gap-2">
          {warns.map((x) => (
            <li key={x} className="flex gap-2.5 rounded-2xl bg-[#fff8e6] p-4 text-[14.5px] text-[#6b4b00] ring-1 ring-[#f3dc9c]">
              <Info size={18} className="mt-0.5 flex-none" /> {x}
            </li>
          ))}
        </ul>
      )}

      <div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-[20px] font-semibold tracking-tight">{providersFirst ? r.provH : r.provHHave}</h3>
            <p className="mt-1 text-[14.5px] text-ink-mute">{r.provSub}</p>
          </div>
          {!providersFirst && (
            <button type="button" className="btn-ghost !py-2.5" aria-expanded={showProviders} onClick={() => setShowProviders((s) => !s)}>
              {showProviders ? r.hide : r.show} <ChevronDown size={16} className={`transition ${showProviders ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
        {showProviders && (
          <>
            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              {picks.map((p, k) => (
                <ProviderCard key={p.provider.id + p.kind} pick={p} featured={k === 0} lang={lang}
                  inCompare={compareIds.includes(p.provider.id)} onToggle={() => { onToggleCompare(p.provider.id); track('provider_compared', { provider: p.provider.id, source: 'results' }) }} />
              ))}
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="max-w-2xl text-[13.5px] text-ink-mute">{t.foot.aff}</p>
              {compareIds.length > 0 && (
                <button type="button" className="btn-primary !py-2.5" onClick={() => scrollToId('compare')}>
                  <Scale size={16} /> {r.compareGo(compareIds.length)}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </motion.div>
  )
}

function PassCard({ pass, status }: { pass: ReturnType<typeof computePasses>; status: Answers['status'] }) {
  const { t } = useI18n()
  const r = t.res
  const label = (id: OptionId) => ({ pay: r.opt_pay, annual: r.opt_annual, local: r.opt_local, monthly: r.opt_monthly })[id]
  const note = (o: PassOption) => {
    if (o.id === 'pay') return r.n_pay(pass.homeCrossings, pass.otherCrossings)
    if (o.id === 'annual') return (o.passes ?? 1) > 1 ? r.n_annualN(o.passes!) : r.n_annual1
    return o.othersUsePass ? r.n_withPass : r.n_withPay
  }
  const reason = (o: PassOption) => (o.reason === 'notEligible' ? r.r_notEligible : o.reason === 'notOffered' ? r.r_notOffered : r.r_noTrips)
  const how = { pay: r.getPay, annual: r.getAnnual, local: r.getLocal, monthly: r.getMonthly }[pass.best.id]
  const sorted = [...pass.options].sort((x, y) => Number(y.available) - Number(x.available) || x.cost - y.cost)
  const bestName = label(pass.best.id) + (pass.best.id === 'local' ? ` (${inr(pass.best.localPrice!)})` : '')

  return (
    <div className="card overflow-hidden">
      <div className="grid gap-0 lg:grid-cols-[1fr_1.1fr]">
        <div className="relative bg-ink p-6 text-white sm:p-8">
          <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(80%_60%_at_100%_0%,rgba(16,163,107,.35),transparent_70%)]" />
          <div className="relative">
            <p className="text-[12.5px] font-semibold uppercase tracking-[0.12em] text-brand-200">{r.yourPass}</p>
            <p className="mt-4 text-[14px] text-white/70">{r.cheapest}</p>
            <p className="mt-1 text-[28px] font-semibold leading-tight tracking-tight sm:text-[32px]">{bestName}</p>
            <p className="mt-3 flex items-baseline gap-2">
              <span className="num text-[40px] font-semibold leading-none">{inr(Math.round(pass.best.cost))}</span>
              <span className="text-white/70">{r.perYear}</span>
            </p>
            <p className="mt-4 text-[15px] text-white/85">
              {pass.saving > 0 ? r.save(inr(Math.round(pass.saving))) : r.noSave}
            </p>
            <div className="mt-6 rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
              <p className="text-[13px] font-semibold text-white/90">{r.howGet}</p>
              <p className="mt-1 text-[14px] text-white/80">{how}</p>
              {(pass.best.id === 'local' || pass.best.id === 'annual') && (
                <a href={pass.best.id === 'local' ? site.official.rajmargYatraLocalPass : site.official.rajmargYatra}
                  target="_blank" rel="noopener" className="mt-3 inline-flex items-center gap-1.5 text-[14px] font-semibold text-brand-200 hover:text-white">
                  {r.official} <ArrowUpRight size={15} />
                </a>
              )}
            </div>
            {status === 'have' && <p className="mt-4 flex gap-2 text-[13.5px] text-white/75"><ShieldCheck size={16} className="mt-0.5 flex-none" /> {r.keepTag}</p>}
          </div>
        </div>
        <ul className="divide-y divide-dashed divide-line p-6 sm:p-8">
          {sorted.map((o) => {
            const best = o === pass.best
            return (
              <li key={o.id} className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-1 py-4 first:pt-0 last:pb-0">
                <span className={`flex items-center gap-2 font-semibold ${o.available ? '' : 'text-ink-mute'}`}>
                  {label(o.id)}{o.id === 'local' && o.available ? ` (${inr(o.localPrice!)})` : ''}
                  {best && <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#2a2100]">{r.best}</span>}
                </span>
                <span className={`num text-right ${o.available ? 'text-[18px] font-semibold' : 'text-[14px] text-ink-mute'}`}>
                  {o.available ? inr(Math.round(o.cost)) : reason(o)}
                </span>
                {o.available && <span className="col-span-2 text-[13.5px] text-ink-mute">{note(o)}</span>}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

function ProviderCard({ pick, featured, lang, inCompare, onToggle }: { pick: ProviderPick; featured: boolean; lang: 'en' | 'hi'; inCompare: boolean; onToggle: () => void }) {
  const { t } = useI18n()
  const r = t.res
  const p = pick.provider
  const kind = { best: r.k_best, bank: r.k_bank, lowest: r.k_lowest, digital: r.k_digital, upi: t.cmp.f_upi }[pick.kind]
  const row = (l: string, v: React.ReactNode) => (
    <div className="flex items-baseline justify-between gap-3 py-2 text-[14px]">
      <dt className="text-ink-mute">{l}</dt><dd className="text-right font-medium">{v}</dd>
    </div>
  )
  return (
    <article className={`relative flex flex-col rounded-3xl bg-white p-5 transition sm:p-6 ${featured ? 'ring-2 ring-brand-500 shadow-lift' : 'ring-1 ring-line shadow-soft'}`}>
      <div className="flex items-center gap-3">
        <ProviderLogo short={p.short} color={p.color} />
        <div className="min-w-0">
          <p className={`text-[12px] font-semibold uppercase tracking-[0.1em] ${featured ? 'text-brand-700' : 'text-ink-mute'}`}>{kind}</p>
          <h4 className="truncate text-[17px] font-semibold">{p.name}</h4>
        </div>
      </div>
      <p className="mt-3 text-[14px] text-ink-soft">{p.apply[lang]}</p>
      <div className="mt-4 flex items-baseline justify-between rounded-2xl bg-paper px-4 py-3">
        <span className="text-[13.5px] text-ink-mute">{r.upfront}</span>
        <span className="num text-[20px] font-semibold">{inr(upfront(p))}</span>
      </div>
      <dl className="mt-2 divide-y divide-line">
        {row(r.issuance, <span className="num">{inr(p.issuanceFee)}</span>)}
        {row(r.deposit, <span className="num">{inr(p.securityDeposit)}</span>)}
        {row(r.minBal, p.minBalance === null ? '—' : <span className="num">{inr(p.minBalance)}</span>)}
      </dl>
      <p className="mt-2 text-[13.5px] text-ink-mute"><span className="font-medium text-ink-soft">{r.rechargeL}:</span> {p.recharge[lang]}</p>
      <ul className="mt-4 grid gap-1.5 text-[14px]">
        {p.pros[lang].map((x) => <li key={x} className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 flex-none text-brand-600" /> {x}</li>)}
        {p.cons[lang].map((x) => <li key={x} className="flex gap-2 text-ink-soft"><XCircle size={16} className="mt-0.5 flex-none text-ink-mute" /> {x}</li>)}
      </ul>
      <p className="mt-4 flex items-center gap-1.5 text-[13.5px] text-ink-soft">
        <Phone size={14} /> {p.support ? <span className="num select-all">{p.support}</span> : r.supportNone}
      </p>
      <p className="mt-1 text-[12.5px] text-ink-mute">{r.verified} {fmtDate(p.verifiedOn, lang)}</p>
      <div className="mt-5 flex flex-wrap gap-2 pt-1 sm:mt-auto">
        <a href={providerLink(p)} target="_blank" rel={p.affiliateUrl ? 'sponsored noopener' : 'noopener'}
          onClick={() => track('provider_link_clicked', { provider: p.id, source: 'results', affiliate: Boolean(p.affiliateUrl) })}
          className={`${featured ? 'btn-brand' : 'btn-primary'} flex-1 !py-2.5`}>
          {r.view} <ArrowUpRight size={16} />
        </a>
        <button type="button" onClick={onToggle} aria-pressed={inCompare} className={`btn-ghost !py-2.5 ${inCompare ? '!bg-brand-50 !ring-brand-500' : ''}`}>
          <Scale size={16} /> {inCompare ? r.compared : r.compare}
        </button>
      </div>
    </article>
  )
}

export function ProviderLogo({ short, color, size = 44 }: { short: string; color: string; size?: number }) {
  return (
    <span aria-hidden="true" className="grid flex-none place-items-center rounded-2xl font-semibold tracking-tight text-white"
      style={{ width: size, height: size, background: color, fontSize: short.length > 2 ? 13 : 15 }}>
      {short}
    </span>
  )
}

export function fmtDate(iso: string, lang: 'en' | 'hi') {
  return new Date(iso + 'T00:00:00').toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
