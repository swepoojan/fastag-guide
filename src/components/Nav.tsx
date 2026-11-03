import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { useI18n } from '../i18n'
import { site } from '../config'
import { Logo, scrollToId } from './ui'
import { track } from '../lib/analytics'

export default function Nav() {
  const { t, lang, setLang } = useI18n()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  const links = [
    { id: 'compare', label: t.nav.compare },
    { id: 'how', label: t.nav.how },
    { id: 'passes', label: t.nav.annual },
    { id: 'faq', label: t.nav.faq },
  ]

  const go = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    setOpen(false)
    scrollToId(id)
  }

  const LangToggle = () => (
    <div className="flex rounded-full bg-paper p-0.5 ring-1 ring-line" role="group" aria-label={t.foot.lang}>
      {(['en', 'hi'] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`rounded-full px-2.5 py-1 text-[13px] font-semibold transition ${lang === l ? 'bg-white text-ink shadow-sm' : 'text-ink-mute hover:text-ink'}`}
        >
          {l === 'en' ? 'EN' : 'हिं'}
        </button>
      ))}
    </div>
  )

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-40 h-[env(safe-area-inset-top,0px)] bg-white/90" aria-hidden="true" />
      <header
        className={`gutter sticky z-40 transition-all duration-300 ${scrolled ? 'bg-white/85 shadow-[0_1px_0_#e3e7ea] backdrop-blur-xl' : 'bg-white/0'}`}
        style={{ top: 'env(safe-area-inset-top, 0px)' }}
      >
        <nav className="mx-auto flex h-16 max-w-page items-center justify-between gap-4" aria-label="Main">
          <a href="#top" onClick={go('top')} className="flex items-center gap-2.5 font-semibold tracking-tight">
            <Logo />
            <span className="text-[15px] tracking-[0.06em]">{site.name}</span>
          </a>
          <div className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <a key={l.id} href={`#${l.id}`} onClick={go(l.id)} className="rounded-full px-3.5 py-2 text-[14.5px] font-medium text-ink-soft transition hover:bg-paper hover:text-ink">
                {l.label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:block"><LangToggle /></div>
            <a
              href="#find"
              onClick={(e) => { track('cta_clicked', { location: 'nav' }); go('find')(e) }}
              className="btn-primary hidden !px-4 !py-2.5 !text-[14px] sm:inline-flex"
            >
              {t.nav.cta}
            </a>
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full ring-1 ring-line md:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? t.nav.close : t.nav.menu}
              onClick={() => setOpen((o) => !o)}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>
        <AnimatePresence>
          {open && (
            <motion.div
              id="mobile-menu"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="mx-auto max-w-page pb-4 md:hidden"
            >
              <div className="card grid gap-1 p-2">
                {links.map((l) => (
                  <a key={l.id} href={`#${l.id}`} onClick={go(l.id)} className="rounded-2xl px-4 py-3 text-[16px] font-medium hover:bg-paper">
                    {l.label}
                  </a>
                ))}
                <div className="flex items-center justify-between gap-3 px-2 pt-2">
                  <LangToggle />
                  <a href="#find" onClick={(e) => { track('cta_clicked', { location: 'mobile_menu' }); go('find')(e) }} className="btn-primary !py-2.5">
                    {t.nav.cta}
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  )
}
