import { Columns3, FileCheck2, UserRoundCheck, Scale } from 'lucide-react'
import { useI18n } from '../i18n'
import { Reveal, Section, SectionHead } from './ui'

export default function WhyUs() {
  const { t } = useI18n()
  const w = t.why
  const items = [
    { i: Columns3, t: w.c1, d: w.c1d },
    { i: FileCheck2, t: w.c2, d: w.c2d },
    { i: UserRoundCheck, t: w.c3, d: w.c3d },
    { i: Scale, t: w.c4, d: w.c4d },
  ]
  return (
    <Section id="why">
      <SectionHead eyebrow={w.eyebrow} title={w.h2} />
      <div className="mt-12 grid gap-px overflow-hidden rounded-3xl bg-line ring-1 ring-line sm:grid-cols-2">
        {items.map((x, k) => (
          <Reveal key={x.t} delay={k * 0.06} className="bg-white p-6 sm:p-8">
            <x.i size={22} className="text-brand-600" />
            <h3 className="mt-5 text-[18px] font-semibold">{x.t}</h3>
            <p className="mt-2 max-w-md text-[15px] text-ink-soft">{x.d}</p>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
