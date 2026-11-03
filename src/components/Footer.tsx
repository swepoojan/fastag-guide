import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { legal, useI18n } from '../i18n'
import { site } from '../config'
import { VERIFIED_ON } from '../data/providers'
import { Logo } from './ui'
import { fmtDate } from './Results'

type Doc = 'about' | 'privacy' | 'terms' | 'affiliate' | 'disclaimer' | 'contact'

export default function Footer() {
  const { t, lang } = useI18n()
  const f = t.foot
  const [doc, setDoc] = useState<Doc | null>(null)
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (doc && !d.open) d.showModal()
    if (!doc && d.open) d.close()
  }, [doc])

  const items: { id: Doc; l: string }[] = [
    { id: 'about', l: f.about },
    ...(site.contactEmail ? [{ id: 'contact' as Doc, l: f.contact }] : []),
    { id: 'privacy', l: f.privacy },
    { id: 'terms', l: f.terms },
    { id: 'affiliate', l: f.affiliate },
    { id: 'disclaimer', l: f.disclaimer },
  ]
  const title = items.find((i) => i.id === doc)?.l ?? ''

  return (
    <footer className="gutter border-t border-line pb-10 pt-14">
      <div className="mx-auto max-w-page">
        <div className="flex flex-wrap items-start justify-between gap-8">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5 font-semibold tracking-[0.06em]"><Logo /> {site.name}</div>
            <p className="mt-3 text-[14px] text-ink-soft">
              {f.by}{' '}
              <a href={site.publisher.url} className="link" rel="noopener">{site.publisher.name}</a>
            </p>
            <p className="mt-1 text-[14px] text-ink-mute">{f.updated}: {fmtDate(VERIFIED_ON, lang)}</p>
          </div>
          <nav aria-label="About and legal" className="flex flex-wrap gap-x-5 gap-y-1 text-[14.5px]">
            {items.map((i) => (
              <button key={i.id} type="button" onClick={() => setDoc(i.id)} className="min-h-[40px] text-ink-soft underline-offset-4 hover:text-ink hover:underline">{i.l}</button>
            ))}
          </nav>
        </div>
        <p className="mt-10 max-w-4xl text-[13px] leading-relaxed text-ink-mute">{f.disc}</p>
        <p className="mt-3 max-w-4xl text-[13px] leading-relaxed text-ink-mute">{f.aff}</p>
        <p className="mt-6 text-[13px] text-ink-mute">© {VERIFIED_ON.slice(0, 4)} {site.name} · {site.publisher.name}</p>
      </div>

      <dialog ref={ref} aria-labelledby="legal-title" onClose={() => setDoc(null)} onClick={(e) => { if (e.target === ref.current) setDoc(null) }}
        className="w-[min(560px,calc(100vw-32px))] rounded-3xl p-0 shadow-lift backdrop:bg-ink/40 backdrop:backdrop-blur-sm">
        {doc && <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <h2 id="legal-title" className="text-[20px] font-semibold">{title}</h2>
            <button type="button" onClick={() => setDoc(null)} aria-label={f.closeD} className="grid h-10 w-10 place-items-center rounded-full ring-1 ring-line hover:bg-paper"><X size={18} aria-hidden="true" /></button>
          </div>
          <div className="mt-4 grid gap-3 text-[15px] leading-relaxed text-ink-soft">
            {doc === 'contact'
              ? <p className="select-all font-medium text-ink">{site.contactEmail}</p>
              : legal[lang][doc].map((p) => <p key={p}>{p}</p>)}
          </div>
        </div>}
      </dialog>
    </footer>
  )
}
