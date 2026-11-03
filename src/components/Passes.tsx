import { useRef, useState } from 'react'
import { ArrowUpRight, CalendarRange, Check, MapPin } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { inr, useI18n } from '../i18n'
import { annualBreakEven, PASS } from '../lib/calc'
import Updated from './Updated'
import { track } from '../lib/analytics'
import { site } from '../config'
import { Section, SectionHead } from './ui'

export default function Passes() {
  const { t } = useI18n()
  const p = t.pass
  const [trips, setTrips] = useState('20')
  const [avg, setAvg] = useState('110')
  const used = useRef(false)

  const tn = parseFloat(trips), an = parseFloat(avg)
  const ok = trips.trim() !== '' && avg.trim() !== '' && tn >= 0 && an >= 0 && tn <= 500 && an <= 2000
  const res = ok ? annualBreakEven(tn, an) : null
  const passes = res && res.crossingsYear > 200 ? Math.ceil(res.crossingsYear / 200) : 1

  const onCalc = (fn: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    fn(e.target.value)
    if (!used.current) { used.current = true; track('annual_calc_used') }
  }

  return (
    <Section id="passes" className="bg-ink text-white">
      <div className="[&_.eyebrow]:text-brand-200 [&_.h2]:text-white [&_.lead]:text-white/70">
        <SectionHead eyebrow={p.eyebrow} title={p.h2} sub={p.sub} />
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Updated date={PASS.verifiedOn} label={p.asOf} tone="dark" unverified={PASS.status === 'unverified'} />
        <span className="text-[13px] text-white/60">{p.source}</span>
      </div>

      <div className="mt-12 grid gap-5 lg:grid-cols-2">
        <PassBlock icon={CalendarRange} title={p.annualH} price={p.annualPrice} items={[p.a1, p.a2, p.a3, p.a4, p.a5]} />
        <PassBlock icon={MapPin} title={p.localH} price={p.localPrice} items={[p.l1, p.l2, p.l3, p.l4]} accent />
      </div>

      <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-6 rounded-3xl bg-white p-5 text-ink sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10">
        <div>
          <h3 className="text-[22px] font-semibold tracking-tight">{p.calcH}</h3>
          <p className="mt-2 text-[15px] text-ink-mute">{p.calcSub}</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="calc-trips" className="text-[14.5px] font-medium">{p.trips}</label>
              <div className="field mt-2"><input id="calc-trips" type="number" inputMode="numeric" min={0} max={500} value={trips} onChange={onCalc(setTrips)} /></div>
            </div>
            <div>
              <label htmlFor="calc-avg" className="text-[14.5px] font-medium">{p.avg}</label>
              <div className="field mt-2"><span className="pl-4 font-mono text-ink-mute">₹</span><input id="calc-avg" type="number" inputMode="numeric" min={0} max={2000} value={avg} onChange={onCalc(setAvg)} /></div>
            </div>
          </div>
          {!ok && <p role="alert" className="mt-3 text-[14px] font-medium text-[#b4232a]">{t.wiz.numErr} 500 / 2000.</p>}
          <p className="mt-4 text-[13px] text-ink-mute">{p.estimate}</p>
        </div>
        <div className="rounded-2xl bg-paper p-5 sm:p-6" aria-live="polite">
          {res ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[13px] text-ink-mute">{p.youPay}</p>
                  <p className="num mt-1 text-[24px] font-semibold">{inr(Math.round(res.payYear))}</p>
                </div>
                <div>
                  <p className="text-[13px] text-ink-mute">{p.passCost}</p>
                  <p className="num mt-1 text-[24px] font-semibold">{inr(res.passYear)}</p>
                </div>
              </div>
              <Bars pay={res.payYear} pass={res.passYear} />
              <p className={`mt-4 text-[16px] font-semibold ${res.saving > 0 ? 'text-brand-700' : 'text-ink'}`}>
                {res.saving > 0 ? p.verdictYes(inr(Math.round(res.saving))) : p.verdictNo}
              </p>
              {res.breakEvenCrossings && <p className="mt-1 text-[14px] text-ink-soft">{p.breakEven(res.breakEvenCrossings)}</p>}
              {passes > 1 && <p className="mt-1 text-[14px] text-ink-soft">{p.passesNeeded(passes)}</p>}
            </>
          ) : <p className="text-ink-mute">—</p>}
          <div className="mt-6 flex flex-wrap gap-2">
            <a href={site.official.rajmargYatra} target="_blank" rel="noopener" className="btn-primary !whitespace-normal !py-2.5 text-left">{p.ctaAnnual} <ArrowUpRight size={16} aria-hidden="true" /></a>
            <a href={site.official.rajmargYatraLocalPass} target="_blank" rel="noopener" className="btn-ghost !whitespace-normal !py-2.5 text-left">{p.ctaLocal} <ArrowUpRight size={16} aria-hidden="true" /></a>
          </div>
        </div>
      </div>
    </Section>
  )
}

function PassBlock({ icon: Icon, title, price, items, accent = false }: { icon: LucideIcon; title: string; price: string; items: string[]; accent?: boolean }) {
  return (
    <div className={`rounded-3xl p-6 ring-1 sm:p-8 ${accent ? 'bg-brand-900/60 ring-brand-500/40' : 'bg-white/5 ring-white/10'}`}>
      <div className="flex items-center gap-3">
        <span className={`grid h-11 w-11 place-items-center rounded-xl ${accent ? 'bg-brand-500 text-white' : 'bg-white/10 text-white'}`}><Icon size={21} aria-hidden="true" /></span>
        <div>
          <h3 className="text-[19px] font-semibold">{title}</h3>
          <p className="num text-[15px] text-brand-200">{price}</p>
        </div>
      </div>
      <ul className="mt-6 grid gap-3 text-[15px] text-white/80">
        {items.map((x) => <li key={x} className="flex gap-3"><Check size={18} aria-hidden="true" className="mt-0.5 flex-none text-brand-200" /> {x}</li>)}
      </ul>
    </div>
  )
}

function Bars({ pay, pass }: { pay: number; pass: number }) {
  const max = Math.max(pay, pass, 1)
  return (
    <div className="mt-5 grid gap-2" aria-hidden="true">
      <div className="h-2.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-ink-soft transition-all duration-500" style={{ width: `${(pay / max) * 100}%` }} /></div>
      <div className="h-2.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-brand-500 transition-all duration-500" style={{ width: `${(pass / max) * 100}%` }} /></div>
    </div>
  )
}
