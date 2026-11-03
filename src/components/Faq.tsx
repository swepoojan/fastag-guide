import { useState } from 'react'
import { ArrowUpRight, Plus } from 'lucide-react'
import { faqs, useI18n } from '../i18n'
import { Section, SectionHead } from './ui'

export default function Faq() {
  const { t, lang } = useI18n()
  const [open, setOpen] = useState<number | null>(0)
  return (
    <Section id="faq" className="bg-paper">
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionHead eyebrow={t.faq.eyebrow} title={t.faq.h2} />
        <div className="card divide-y divide-line overflow-hidden">
          {faqs[lang].map((f, k) => {
            const isOpen = open === k
            return (
              <div key={f.q}>
                <h3>
                  <button type="button" id={`faq-b-${k}`} aria-expanded={isOpen} aria-controls={`faq-p-${k}`}
                    onClick={() => setOpen(isOpen ? null : k)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left text-[16px] font-semibold transition-colors hover:bg-paper/60 sm:px-7">
                    {f.q}
                    <Plus size={20} aria-hidden="true" className={`flex-none text-ink-mute transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`} />
                  </button>
                </h3>
                {/* Answers stay in the HTML when collapsed, so search engines can read every one. */}
                <div id={`faq-p-${k}`} role="region" aria-labelledby={`faq-b-${k}`} {...({ inert: isOpen ? undefined : '' } as object)}
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                  <div className="overflow-hidden">
                    <div className="px-5 pb-6 text-[15px] leading-relaxed text-ink-soft sm:px-7">
                      <p className="max-w-[62ch]">{f.a}</p>
                      {f.link && (
                        <a href={f.link.href} target="_blank" rel="noopener" className="link mt-3 inline-flex items-center gap-1 text-[14.5px]">
                          {f.link.label} <ArrowUpRight size={15} aria-hidden="true" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Section>
  )
}
