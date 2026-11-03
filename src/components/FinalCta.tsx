import { ArrowRight } from 'lucide-react'
import { useI18n } from '../i18n'
import { track } from '../lib/analytics'
import { Reveal, scrollToId } from './ui'

export default function FinalCta() {
  const { t } = useI18n()
  return (
    <section className="gutter py-20 sm:py-28">
      <Reveal className="relative mx-auto max-w-page overflow-hidden rounded-[36px] bg-[linear-gradient(135deg,#08704a_0%,#0b8a5a_45%,#10a36b_100%)] px-6 py-14 text-center text-white sm:px-12 sm:py-20">
        <div aria-hidden="true" className="absolute inset-0 opacity-30 [background:repeating-linear-gradient(115deg,transparent_0_38px,rgba(255,255,255,.08)_38px_40px)]" />
        <div className="relative mx-auto max-w-2xl">
          <h2 className="text-[30px] font-semibold leading-tight tracking-tight sm:text-[44px]">{t.final.h2}</h2>
          <p className="mx-auto mt-4 max-w-md text-[17px] text-white/80">{t.final.sub}</p>
          <a href="#find" className="btn mt-8 bg-white !px-7 !py-3.5 text-ink shadow-lift hover:bg-paper"
            onClick={(e) => { e.preventDefault(); track('cta_clicked', { location: 'final' }); scrollToId('find') }}>
            {t.final.cta} <ArrowRight size={18} />
          </a>
        </div>
      </Reveal>
    </section>
  )
}
