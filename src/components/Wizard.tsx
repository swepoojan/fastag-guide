import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft, ArrowRight, Bus, Building2, Car, CircleHelp, Gauge, Landmark, MapPin,
  Route, Smartphone, Sparkles, Tag, Truck, Wallet, Wrench, RefreshCw, CheckCircle2, CalendarDays, Sun, Plane,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { inr, useI18n } from '../i18n'
import { providers, type ProviderId } from '../data/providers'
import { PASS, type PlazaType } from '../lib/calc'
import type { BankPref } from '../lib/recommend'
import { track } from '../lib/analytics'
import { Section, SectionHead, scrollToId } from './ui'
import Results from './Results'

export type Vehicle = 'car' | 'jeep' | 'comm' | 'other'
export type Status = 'have' | 'new' | 'replace' | 'issue'
export type Freq = 'never' | 'weekly' | 'often' | 'daily'
export type OtherTravel = 'rare' | 'some' | 'often' | 'lots'
export type YNU = 'yes' | 'no' | 'unsure'

export interface Answers {
  vehicle: Vehicle | null
  status: Status | null
  freq: Freq | null
  roundTrips: string
  dist: YNU | null
  town: PlazaType | null
  toll: string
  hasMonthly: boolean
  monthlyPrice: string
  other: OtherTravel | null
  otherToll: string
  pref: BankPref | null
  bank: ProviderId | 'other' | null
}

const FREQ_TRIPS: Record<Freq, number> = { never: 0, weekly: 1, often: 3, daily: 6 }
export const OTHER_CROSSINGS: Record<OtherTravel, number> = { rare: 6, some: 24, often: 60, lots: 150 }

const initial: Answers = {
  vehicle: null, status: null, freq: null, roundTrips: '', dist: null, town: null, toll: '105',
  hasMonthly: false, monthlyPrice: String(PASS.monthlyTypical), other: null, otherToll: '120', pref: null, bank: null,
}

type StepId = 'vehicle' | 'status' | 'home' | 'plaza' | 'other' | 'pref'

export const passVehicle = (v: Vehicle | null) => v === 'car' || v === 'jeep'
export const roundTripsOf = (a: Answers) => {
  const n = parseFloat(a.roundTrips)
  if (a.roundTrips.trim() !== '' && Number.isFinite(n)) return n
  return a.freq ? FREQ_TRIPS[a.freq] : 0
}

function stepsFor(a: Answers): StepId[] {
  const s: StepId[] = ['vehicle', 'status']
  if (passVehicle(a.vehicle)) {
    s.push('home')
    if (roundTripsOf(a) > 0) s.push('plaza')
    s.push('other')
  }
  s.push('pref')
  return s
}

const numOk = (v: string, max: number) => {
  const n = parseFloat(v)
  return v.trim() !== '' && Number.isFinite(n) && n >= 0 && n <= max
}

interface Props {
  compareIds: ProviderId[]
  onToggleCompare: (id: ProviderId) => void
  onBankChange: (id: ProviderId | null) => void
}

export default function Wizard({ compareIds, onToggleCompare, onBankChange }: Props) {
  const { t } = useI18n()
  const w = t.wiz
  const [a, setA] = useState<Answers>(initial)
  const [i, setI] = useState(0)
  const [phase, setPhase] = useState<'ask' | 'done'>('ask')
  const [error, setError] = useState('')
  const started = useRef(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const steps = useMemo(() => stepsFor(a), [a])
  const step = steps[Math.min(i, steps.length - 1)]
  const last = i >= steps.length - 1

  const set = <K extends keyof Answers>(k: K, v: Answers[K]) => {
    if (!started.current) { started.current = true; track('wizard_started') }
    setError('')
    setA((x) => ({ ...x, [k]: v }))
  }

  const valid = (): string => {
    switch (step) {
      case 'vehicle': return a.vehicle ? '' : w.pick
      case 'status': return a.status ? '' : w.pick
      case 'home':
        if (a.roundTrips.trim() !== '' && !numOk(a.roundTrips, 50)) return `${w.numErr} 50.`
        return a.freq || a.roundTrips.trim() !== '' ? '' : w.pick
      case 'plaza':
        if (!a.dist || !a.town) return w.pick
        if (!numOk(a.toll, 2000)) return `${w.numErr} 2000.`
        if (a.hasMonthly && !numOk(a.monthlyPrice, 5000)) return `${w.numErr} 5000.`
        return ''
      case 'other':
        if (!a.other) return w.pick
        return numOk(a.otherToll, 2000) ? '' : `${w.numErr} 2000.`
      case 'pref':
        if (!a.pref) return w.pick
        if (a.pref === 'existing' && !a.bank) return w.pick
        return ''
    }
  }

  const focusCard = () => requestAnimationFrame(() => cardRef.current?.querySelector<HTMLElement>('legend')?.focus())

  const next = () => {
    const err = valid()
    if (err) { setError(err); return }
    if (last) {
      track('wizard_completed', { vehicle: a.vehicle!, status: a.status! })
      setPhase('done')
      requestAnimationFrame(() => {
        scrollToId('find')
        document.getElementById('results-heading')?.focus({ preventScroll: true })
      })
      return
    }
    setI((x) => x + 1); focusCard()
  }
  const back = () => { setError(''); setI((x) => Math.max(0, x - 1)); focusCard() }

  useEffect(() => {
    onBankChange(a.bank && a.bank !== 'other' ? a.bank : null)
  }, [a.bank, onBankChange])

  const edit = () => { setPhase('ask'); setI(0); focusCard() }
  const restart = () => { setA(initial); setPhase('ask'); setI(0); started.current = false }

  return (
    <Section id="find" className="bg-paper">
      <SectionHead eyebrow={w.eyebrow} title={w.h2} sub={w.sub} />
      <div className="mt-10" ref={cardRef}>
        {phase === 'ask' && (
          <form className="card mx-auto max-w-3xl overflow-hidden" noValidate onSubmit={(e) => { e.preventDefault(); next() }}>
            <Progress i={i} n={steps.length} label={`${w.step} ${i + 1} ${w.of} ${steps.length}`} />
            <div className="p-5 sm:p-10">
              <div key={step} className="animate-fade-up">
                <StepBody step={step} a={a} set={set} />
              </div>
              <p role="alert" className="mt-4 min-h-[1.5em] text-[14.5px] font-medium text-[#b4232a]">{error}</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <button type="button" onClick={back} disabled={i === 0} className="btn-ghost !px-4 sm:!px-5">
                  <ArrowLeft size={17} aria-hidden="true" /> {w.back}
                </button>
                <button type="submit" className="btn-brand !px-5 sm:!px-6">
                  {last ? w.see : w.next} <ArrowRight size={17} aria-hidden="true" />
                </button>
              </div>
            </div>
          </form>
        )}
        {phase === 'done' && (
          <Results a={a} onEdit={edit} onRestart={restart} compareIds={compareIds} onToggleCompare={onToggleCompare} />
        )}
      </div>
    </Section>
  )
}

function Progress({ i, n, label }: { i: number; n: number; label: string }) {
  return (
    <div className="border-b border-line px-5 py-4 sm:px-10">
      <p className="text-[13px] font-medium text-ink-mute" aria-live="polite">{label}</p>
      <div className="mt-2.5 flex gap-1.5" aria-hidden="true">
        {Array.from({ length: n }).map((_, k) => (
          <div key={k} className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
            <div className={`h-full rounded-full bg-brand-500 transition-[width] duration-300 ${k <= i ? 'w-full' : 'w-0'}`} />
          </div>
        ))}
      </div>
    </div>
  )
}

type Setter = <K extends keyof Answers>(k: K, v: Answers[K]) => void

function StepBody({ step, a, set }: { step: StepId; a: Answers; set: Setter }) {
  const { t } = useI18n()
  const w = t.wiz
  switch (step) {
    case 'vehicle':
      return (
        <Q title={w.q1} hint={w.q1h}>
          <Choices value={a.vehicle} onChange={(v) => set('vehicle', v)} name="vehicle" options={[
            { v: 'car', l: w.v_car, d: w.v_car_d, i: Car },
            { v: 'jeep', l: w.v_jeep, d: w.v_jeep_d, i: Bus },
            { v: 'comm', l: w.v_comm, d: w.v_comm_d, i: Truck },
            { v: 'other', l: w.v_other, d: w.v_other_d, i: CircleHelp },
          ]} />
        </Q>
      )
    case 'status':
      return (
        <Q title={w.q2}>
          <Choices value={a.status} onChange={(v) => set('status', v)} name="status" options={[
            { v: 'have', l: w.s_have, d: w.s_have_d, i: CheckCircle2 },
            { v: 'new', l: w.s_new, d: w.s_new_d, i: Tag },
            { v: 'replace', l: w.s_replace, d: w.s_replace_d, i: RefreshCw },
            { v: 'issue', l: w.s_issue, d: w.s_issue_d, i: Wrench },
          ]} />
        </Q>
      )
    case 'home':
      return (
        <Q title={w.q3} hint={w.q3h}>
          <Choices value={a.roundTrips.trim() !== '' ? null : a.freq} onChange={(v) => { set('freq', v); set('roundTrips', '') }} name="freq" options={[
            { v: 'never', l: w.f_never, d: w.f_never_d, i: Building2 },
            { v: 'weekly', l: w.f_weekly, d: w.f_weekly_d, i: CalendarDays },
            { v: 'often', l: w.f_often, d: w.f_often_d, i: Route },
            { v: 'daily', l: w.f_daily, d: w.f_daily_d, i: Sun },
          ]} />
          <label htmlFor="rt-exact" className="mt-5 block text-[14.5px] font-medium text-ink-soft">{w.exact}</label>
          <div className="field mt-2 max-w-[200px]">
            <input id="rt-exact" type="number" inputMode="decimal" min={0} max={50} step={0.5} placeholder="—"
              value={a.roundTrips} onChange={(e) => set('roundTrips', e.target.value)} />
          </div>
        </Q>
      )
    case 'plaza':
      return (
        <Q title={w.q4} hint={w.q4h}>
          <div className="grid gap-6">
            <Seg label={w.dist} name="dist" value={a.dist} onChange={(v) => set('dist', v)} icon={MapPin}
              options={[{ v: 'yes', l: w.yes }, { v: 'no', l: w.no }, { v: 'unsure', l: w.unsure }]} />
            <Seg label={w.town} name="town" value={a.town} onChange={(v) => set('town', v)} icon={Landmark}
              options={[{ v: 'outside', l: `${w.outside} · ${inr(PASS.localOutside)}` }, { v: 'inside', l: `${w.inside} · ${inr(PASS.localInside)}` }, { v: 'unsure', l: w.unsure }]} />
            <div>
              <label htmlFor="toll" className="flex items-center gap-2 text-[15px] font-semibold"><Gauge size={17} className="text-ink-mute" aria-hidden="true" /> {w.toll}</label>
              <div className="field mt-2 max-w-[220px]">
                <span className="pl-4 font-mono text-ink-mute">₹</span>
                <input id="toll" type="number" inputMode="numeric" min={0} max={2000} value={a.toll} onChange={(e) => set('toll', e.target.value)} />
              </div>
              <p className="mt-2 text-[13.5px] text-ink-mute">{w.tollh}</p>
            </div>
            <div>
              <label className="flex cursor-pointer items-start gap-3 text-[15px]">
                <input type="checkbox" className="mt-0.5 h-5 w-5 accent-brand-600" checked={a.hasMonthly} onChange={(e) => set('hasMonthly', e.target.checked)} />
                <span>{w.monthly}</span>
              </label>
              {a.hasMonthly && (
                <div className="mt-3 pl-8">
                  <label htmlFor="mprice" className="text-[14px] font-medium text-ink-soft">{w.monthlyPrice}</label>
                  <div className="field mt-1.5 max-w-[200px]">
                    <span className="pl-4 font-mono text-ink-mute">₹</span>
                    <input id="mprice" type="number" inputMode="numeric" min={0} value={a.monthlyPrice} onChange={(e) => set('monthlyPrice', e.target.value)} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </Q>
      )
    case 'other':
      return (
        <Q title={w.q5} hint={w.q5h}>
          <Choices value={a.other} onChange={(v) => set('other', v)} name="other" options={[
            { v: 'rare', l: w.o_rare, d: w.o_rare_d, i: Building2 },
            { v: 'some', l: w.o_some, d: w.o_some_d, i: Route },
            { v: 'often', l: w.o_often, d: w.o_often_d, i: Car },
            { v: 'lots', l: w.o_lots, d: w.o_lots_d, i: Plane },
          ]} />
          <label htmlFor="otoll" className="mt-5 block text-[14.5px] font-medium text-ink-soft">{w.otherToll}</label>
          <div className="field mt-2 max-w-[220px]">
            <span className="pl-4 font-mono text-ink-mute">₹</span>
            <input id="otoll" type="number" inputMode="numeric" min={0} max={2000} value={a.otherToll} onChange={(e) => set('otherToll', e.target.value)} />
          </div>
        </Q>
      )
    case 'pref':
      return (
        <Q title={w.q6} hint={w.q6h}>
          <Choices value={a.pref} onChange={(v) => set('pref', v)} name="pref" options={[
            { v: 'none', l: w.b_none, d: w.b_none_d, i: Sparkles },
            { v: 'existing', l: w.b_existing, d: w.b_existing_d, i: Landmark },
            { v: 'digital', l: w.b_digital, d: w.b_digital_d, i: Smartphone },
            { v: 'lowest', l: w.b_lowest, d: w.b_lowest_d, i: Wallet },
          ]} />
          {(a.pref === 'existing' || a.bank) && (
            <fieldset className="mt-6 min-w-0">
              <legend className="text-[15px] font-semibold">{w.whichBank}</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {[...providers.map((p) => ({ v: p.id as ProviderId | 'other', l: p.name })), { v: 'other' as const, l: w.otherBank }].map((o) => (
                  <Chip key={o.v} name="bank" value={o.v} label={o.l} checked={a.bank === o.v} onChange={() => set('bank', o.v)} />
                ))}
              </div>
            </fieldset>
          )}
        </Q>
      )
  }
}

function Q({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset className="min-w-0">
      <legend tabIndex={-1} className="text-[22px] font-semibold leading-snug tracking-tight outline-none sm:text-[26px]">{title}</legend>
      {hint && <p className="mt-2 text-[15px] text-ink-mute">{hint}</p>}
      <div className="mt-6">{children}</div>
    </fieldset>
  )
}

interface Opt<T> { v: T; l: string; d?: string; i: LucideIcon }

function Choices<T extends string>({ value, onChange, options, name }: { value: T | null; onChange: (v: T) => void; options: Opt<T>[]; name: string }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map(({ v, l, d, i: Icon }) => {
        const on = value === v
        return (
          <label key={v}
            className={`group flex cursor-pointer items-center gap-4 rounded-2xl p-4 ring-1 transition-[box-shadow,background-color,transform] duration-200 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-500 ${on ? 'bg-brand-50 ring-2 ring-brand-500' : 'bg-white ring-line hover:-translate-y-0.5 hover:shadow-soft hover:ring-ink/25'}`}>
            <input type="radio" name={name} value={v} checked={on} onChange={() => onChange(v)} className="sr-only" />
            <span aria-hidden="true" className={`grid h-11 w-11 flex-none place-items-center rounded-xl transition-colors ${on ? 'bg-brand-600 text-white' : 'bg-paper text-ink-soft group-hover:text-ink'}`}>
              <Icon size={21} />
            </span>
            <span className="min-w-0">
              <span className="block text-[16px] font-semibold">{l}</span>
              {d && <span className="mt-0.5 block text-[13.5px] text-ink-mute">{d}</span>}
            </span>
            <span aria-hidden="true" className={`ml-auto h-5 w-5 flex-none rounded-full ring-2 transition-colors ${on ? 'bg-brand-600 ring-brand-600 shadow-[inset_0_0_0_3px_#fff]' : 'ring-line'}`} />
          </label>
        )
      })}
    </div>
  )
}

function Seg<T extends string>({ label, name, value, onChange, options, icon: Icon }: { label: string; name: string; value: T | null; onChange: (v: T) => void; options: { v: T; l: string }[]; icon: LucideIcon }) {
  return (
    <fieldset className="min-w-0">
      <legend className="flex items-center gap-2 text-[15px] font-semibold"><Icon size={17} className="text-ink-mute" aria-hidden="true" /> {label}</legend>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {options.map((o) => <Chip key={o.v} name={name} value={o.v} label={o.l} checked={value === o.v} onChange={() => onChange(o.v)} />)}
      </div>
    </fieldset>
  )
}

function Chip({ name, value, label, checked, onChange }: { name: string; value: string; label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className={`chip min-h-[44px] cursor-pointer has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-500 ${checked ? 'chip-on' : ''}`}>
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="sr-only" />
      {label}
    </label>
  )
}
