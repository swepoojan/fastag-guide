import { CarFront, Scale, MousePointerClick } from 'lucide-react'
import { useI18n } from '../i18n'
import { Reveal, Section, SectionHead } from './ui'

export default function HowItWorks() {
  const { t } = useI18n()
  const h = t.how
  const steps = [
    { i: CarFront, t: h.s1, d: h.s1d },
    { i: Scale, t: h.s2, d: h.s2d },
    { i: MousePointerClick, t: h.s3, d: h.s3d },
  ]
  return (
    <Section id="how">
      <SectionHead eyebrow={h.eyebrow} title={h.h2} />
      <Reveal>
      <ol className="mt-12 grid gap-5 md:grid-cols-3">
        {steps.map((s, k) => (
            <li key={s.t} className="relative h-full rounded-3xl bg-paper p-6 sm:p-7">
              <div className="flex items-center justify-between">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-ink shadow-soft ring-1 ring-line"><s.i size={22} /></span>
                <span className="num text-[13px] font-medium text-ink-mute">{k + 1} / 3</span>
              </div>
              <h3 className="mt-6 text-[18px] font-semibold">{s.t}</h3>
              <p className="mt-2 text-[15px] text-ink-soft">{s.d}</p>
            </li>
        ))}
      </ol>
      </Reveal>
    </Section>
  )
}
