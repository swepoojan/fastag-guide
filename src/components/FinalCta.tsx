import { ArrowRight } from 'lucide-react'
import { useI18n } from '../i18n'
import { track } from '../lib/analytics'
import { scrollToId } from './ui'

export default function FinalCta() {
  const { t } = useI18n()
  return (
    <section className="gutter py-20 sm:py-28">
      <div className="relative mx-auto max-w-page overflow-hidden rounded-[32px] bg-brand-700 px-6 py-14 text-center text-white sm:px-12 sm:py-20">
        <div className="relative mx-auto max-w-2xl">
          <h2 className="text-[30px] font-semibold leading-tight tracking-tight sm:text-[44px]">{t.final.h2}</h2>
          <p className="mx-auto mt-4 max-w-md text-[17px] text-white/80">{t.final.sub}</p>
          <a href="#find" className="btn mt-8 bg-white !px-7 !py-3.5 text-ink shadow-lift hover:bg-paper"
            onClick={(e) => { e.preventDefault(); track('cta_clicked', { location: 'final' }); scrollToId('find') }}>
            {t.final.cta} <ArrowRight size={18} aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  )
}
