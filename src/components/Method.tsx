import { ArrowUpRight, BadgeCheck, CalendarCheck, Landmark, Scale } from 'lucide-react'
import { useI18n } from '../i18n'
import { providers } from '../data/providers'
import { site } from '../config'
import { Section, SectionHead } from './ui'
import { VerifyLine } from './Verify'

/** How the figures are sourced and checked, with the actual source pages. */
export default function Method() {
  const { t } = useI18n()
  const m = t.method
  const points = [
    { i: Landmark, t: m.m1, d: m.m1d },
    { i: CalendarCheck, t: m.m2, d: m.m2d },
    { i: BadgeCheck, t: m.m3, d: m.m3d },
    { i: Scale, t: m.m4, d: m.m4d },
  ]
  return (
    <Section id="how">
      <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div>
          <SectionHead eyebrow={m.eyebrow} title={m.h2} sub={m.sub} />
          <dl className="mt-10 grid gap-7">
            {points.map((p) => (
              <div key={p.t} className="grid grid-cols-[auto_1fr] gap-x-4">
                <dt className="contents">
                  <p.i size={22} className="mt-0.5 text-brand-700" aria-hidden="true" />
                  <span className="text-[17px] font-semibold">{p.t}</span>
                </dt>
                <dd className="col-start-2 mt-1 max-w-[60ch] text-[15.5px] text-ink-soft">{p.d}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="self-start rounded-3xl bg-paper p-6 sm:p-8">
          <h3 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-ink-mute">{m.sourcesH}</h3>
          <ul className="mt-4 divide-y divide-line">
            {providers.map((p) => (
              <li key={p.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3">
                <a href={p.sourceUrl} target="_blank" rel="noopener" className="link inline-flex min-h-[32px] items-center gap-1 text-[15px]">
                  {p.name} <ArrowUpRight size={14} aria-hidden="true" />
                </a>
                <VerifyLine p={p} compact />
              </li>
            ))}
            <li className="py-3">
              <a href={site.official.rajmargYatra} target="_blank" rel="noopener" className="link inline-flex min-h-[32px] items-center gap-1 text-[15px]">
                {m.nhai} <ArrowUpRight size={14} aria-hidden="true" />
              </a>
            </li>
          </ul>
        </div>
      </div>
    </Section>
  )
}
