import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, Landmark, ListChecks, ReceiptIndianRupee } from 'lucide-react'
import { useI18n } from '../i18n'
import { scrollToId } from './ui'
import { track } from '../lib/analytics'

export default function Hero() {
  const { t } = useI18n()
  const ease = [0.22, 1, 0.36, 1] as const
  return (
    <section id="top" className="gutter relative overflow-hidden pb-16 pt-8 sm:pb-24 sm:pt-14">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[620px] bg-[radial-gradient(60%_55%_at_70%_20%,#d2f3e4_0%,rgba(255,255,255,0)_70%)]" />
      <div className="mx-auto grid max-w-page items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
        <div className="min-w-0">
          <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}
            className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[13px] font-semibold text-brand-700 ring-1 ring-brand-200">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" /> {t.hero.eyebrow}
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05, ease }}
            className="mt-6 text-[40px] font-semibold leading-[1.04] tracking-[-0.03em] sm:text-[56px] lg:text-[54px] xl:text-[60px]">
            {t.hero.h1a}
            <span className="block text-ink-mute">{t.hero.h1b}</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.12, ease }}
            className="lead mt-6 max-w-[34rem]">
            {t.hero.sub}
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.18, ease }}
            className="mt-8 flex flex-wrap gap-3">
            <a href="#find" className="btn-primary group !px-6 !py-3.5"
              onClick={(e) => { e.preventDefault(); track('cta_clicked', { location: 'hero' }); scrollToId('find') }}>
              {t.hero.cta} <ArrowRight size={18} className="transition group-hover:translate-x-0.5" />
            </a>
            <a href="#compare" className="btn-ghost !px-6 !py-3.5" onClick={(e) => { e.preventDefault(); scrollToId('compare') }}>
              {t.hero.cta2}
            </a>
          </motion.div>
          <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-[14.5px] text-ink-soft">
            {[
              { i: ListChecks, l: t.hero.t1 },
              { i: ReceiptIndianRupee, l: t.hero.t2 },
              { i: Landmark, l: t.hero.t3 },
            ].map(({ i: Icon, l }) => (
              <li key={l} className="flex items-center gap-2"><Icon size={17} className="text-brand-600" /> {l}</li>
            ))}
          </motion.ul>
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.1, ease }} className="min-w-0">
          <HeroArt />
        </motion.div>
      </div>
    </section>
  )
}

function HeroArt() {
  const { t } = useI18n()
  return (
    <div className="relative mx-auto w-full max-w-[560px]">
      <div className="relative aspect-[5/4] max-w-full overflow-hidden rounded-[32px] bg-[linear-gradient(180deg,#f3faf6_0%,#e7f2ec_55%,#dfe8e3_100%)] ring-1 ring-line shadow-lift">
        <svg viewBox="0 0 500 400" className="absolute inset-0 h-full w-full" role="img" aria-label="A car approaching a highway toll plaza FASTag lane">
          {/* distant hills */}
          <path d="M0 210 Q90 170 180 196 T360 186 T500 196 V260 H0Z" fill="#d6e6dc" />
          {/* road */}
          <path d="M210 200 L290 200 L470 400 L30 400 Z" fill="#2a3545" />
          <path d="M248 205 L252 205 L262 400 L238 400 Z" fill="#f5c430" opacity=".9" />
          <g fill="#fff" opacity=".55">
            <path d="M232 205 l3 0 -42 195 -10 0z" />
            <path d="M265 205 l3 0 49 195 -10 0z" />
          </g>
          {/* toll canopy */}
          <rect x="120" y="118" width="260" height="22" rx="4" fill="#0e1b2c" />
          <rect x="136" y="140" width="10" height="72" fill="#3b4a5e" />
          <rect x="354" y="140" width="10" height="72" fill="#3b4a5e" />
          <rect x="245" y="140" width="10" height="64" fill="#3b4a5e" />
          <rect x="186" y="96" width="128" height="24" rx="5" fill="#10a36b" />
          <text x="250" y="113" textAnchor="middle" fontFamily="Geist, system-ui, sans-serif" fontSize="12" fontWeight="600" fill="#fff" letterSpacing=".04em">{t.hero.artLane}</text>
          {/* lane lights */}
          <circle cx="200" cy="129" r="4" fill="#10a36b" />
          <circle cx="300" cy="129" r="4" fill="#10a36b" />
          {/* barrier arm, raised */}
          <path d="M256 196 L300 168" stroke="#f5c430" strokeWidth="5" strokeLinecap="round" />
          {/* car, rear view */}
          <g transform="translate(196 262)">
            <ellipse cx="54" cy="96" rx="64" ry="8" fill="#000" opacity=".25" />
            <path d="M12 46 Q16 12 54 10 Q92 12 96 46 L104 58 Q108 70 104 86 H4 Q0 70 4 58 Z" fill="#e8ecef" />
            <path d="M22 40 Q26 18 54 17 Q82 18 86 40 Z" fill="#2f3d50" />
            <rect x="8" y="58" width="92" height="20" rx="6" fill="#d5dbe0" />
            <rect x="12" y="62" width="18" height="8" rx="3" fill="#e5484d" />
            <rect x="78" y="62" width="18" height="8" rx="3" fill="#e5484d" />
            <rect x="38" y="64" width="32" height="10" rx="2" fill="#fff" stroke="#9aa6b2" strokeWidth="1" />
            <rect x="4" y="84" width="20" height="12" rx="4" fill="#1b2430" />
            <rect x="84" y="84" width="20" height="12" rx="4" fill="#1b2430" />
            {/* FASTag sticker on windscreen */}
            <rect x="46" y="22" width="16" height="10" rx="2" fill="#f5c430" />
          </g>
          {/* RFID waves */}
          <g stroke="#10a36b" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity=".85">
            <path d="M262 262 q10 -10 0 -20" />
            <path d="M270 268 q18 -18 0 -36" />
          </g>
        </svg>
      </div>
      {/* floating result card */}
      <div className="absolute -bottom-6 left-4 right-4 sm:-left-6 sm:right-auto sm:w-[290px]">
        <div className="card p-4 shadow-lift">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold uppercase tracking-[0.1em] text-ink-mute">{t.hero.artBest}</span>
            <span className="rounded-full bg-paper px-2 py-0.5 text-[11px] font-medium text-ink-mute ring-1 ring-line">{t.hero.artExample}</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-[17px] font-semibold">{t.hero.artLocal}</span>
            <span className="num ml-auto text-[22px] font-semibold">₹1,500</span>
            <span className="text-[13px] text-ink-mute">{t.hero.artPerYear}</span>
          </div>
          <p className="mt-1.5 flex items-center gap-1.5 text-[13.5px] text-brand-700">
            <CheckCircle2 size={15} /> {t.hero.artSave}
          </p>
        </div>
      </div>
    </div>
  )
}
