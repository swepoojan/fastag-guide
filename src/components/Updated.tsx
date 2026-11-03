import { CalendarCheck } from 'lucide-react'
import { useI18n } from '../i18n'
import { fmtDate } from './Results'

/** Small "Last updated" pill. Pass the ISO date of the data shown nearby. */
export default function Updated({ date, label, tone = 'light', unverified = false }: { date: string; label?: string; tone?: 'light' | 'dark'; unverified?: boolean }) {
  const { t, lang } = useI18n()
  if (unverified) label = t.res.unverified
  return (
    <p className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-medium ring-1 ${tone === 'dark' ? 'bg-white/10 text-white/85 ring-white/15' : 'bg-white text-ink-soft ring-line'}`}>
      <CalendarCheck size={14} className={tone === 'dark' ? 'text-brand-200' : 'text-brand-600'} />
      {label ?? t.hero.updated}: <time dateTime={date} className="font-semibold">{fmtDate(date, lang)}</time>
    </p>
  )
}
