import { AlertTriangle, CheckCircle2, Loader, TrendingUp } from 'lucide-react'
import { useI18n } from '../i18n'
import { inr } from '../lib/format'
import { recentChanges, type Provider } from '../data/providers'
import { fmtDate } from './Results'

/** Shows whether this provider's figures were confirmed by the latest automatic check. */
export function VerifyLine({ p, compact = false }: { p: Provider; compact?: boolean }) {
  const { t, lang } = useI18n()
  const r = t.res
  const size = compact ? 'text-[13px]' : 'text-[12.5px]'
  if (p.status === 'unverified')
    return <span className={`inline-flex items-start gap-1.5 font-medium text-[#8a5a00] ${size}`}><AlertTriangle size={14} aria-hidden="true" className="mt-0.5 flex-none" /> {r.unverified} {fmtDate(p.verifiedOn, lang)}</span>
  if (p.status === 'pending' && p.pendingSince)
    return <span className={`inline-flex items-start gap-1.5 text-ink-soft ${size}`}><Loader size={14} aria-hidden="true" className="mt-0.5 flex-none" /> {r.pending} {fmtDate(p.pendingSince, lang)}</span>
  return <span className={`inline-flex items-start gap-1.5 text-ink-mute ${size}`}><CheckCircle2 size={14} aria-hidden="true" className="mt-0.5 flex-none text-brand-600" /> {r.verified} {fmtDate(p.verifiedOn, lang)}</span>
}

/** Recent fee changes, so returning visitors can see what moved. */
export function ChangeNotes({ p }: { p: Provider }) {
  const { t, lang } = useI18n()
  const r = t.res
  const names: Record<string, string> = { issuanceFee: r.issuance, securityDeposit: r.deposit, minBalance: r.minBal }
  const changes = recentChanges(p.id)
  if (!changes.length) return null
  return (
    <ul className="grid gap-1">
      {changes.slice(0, 2).map((c) => (
        <li key={c.date + c.field} className="flex items-start gap-1.5 rounded-xl bg-brand-50 px-3 py-2 text-[13px] text-brand-900 ring-1 ring-brand-100">
          <TrendingUp size={14} aria-hidden="true" className="mt-0.5 flex-none" /> {r.changed(fmtDate(c.date, lang), names[c.field] ?? c.field, inr(c.from), inr(c.to))}
        </li>
      ))}
    </ul>
  )
}
