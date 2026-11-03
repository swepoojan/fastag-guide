import { useEffect, useState, type ReactNode } from 'react'

export function Section({ id, children, className = '' }: { id?: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={`gutter py-20 sm:py-28 ${className}`}>
      <div className="mx-auto max-w-page">{children}</div>
    </section>
  )
}

export function SectionHead({ eyebrow, title, sub, center = false }: { eyebrow: string; title: string; sub?: string; center?: boolean }) {
  return (
    <div className={`max-w-2xl ${center ? 'mx-auto text-center' : ''}`}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="h2 mt-3">{title}</h2>
      {sub && <p className="lead mt-4">{sub}</p>}
    </div>
  )
}

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#0e1b2c" />
      <path d="M9 22 L14 10 h4 l5 12" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 13.5 v2.5 M16 18.5 v2.5" stroke="#f5c430" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="24.5" cy="8.5" r="2.5" fill="#10a36b" />
    </svg>
  )
}

export function scrollToId(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
  history.replaceState(null, '', '#' + id)
}

/** True when the media query matches. Starts true so the prerendered HTML uses the wide layout. */
export function useMedia(query: string) {
  const [matches, setMatches] = useState(true)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const update = () => setMatches(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [query])
  return matches
}
