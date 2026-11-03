// Configurable analytics layer. No personal data is ever sent: only event names and coarse, non-identifying values.
export type AnalyticsEvent =
  | 'cta_clicked'
  | 'wizard_started'
  | 'wizard_completed'
  | 'recommendation_generated'
  | 'provider_compared'
  | 'provider_link_clicked'
  | 'annual_calc_used'

type Props = Record<string, string | number | boolean>

type Sink = (event: AnalyticsEvent, props: Props) => void

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    plausible?: (event: string, opts?: { props?: Props }) => void
    va?: (event: 'event', payload: { name: string; data?: Props }) => void
  }
}

const sinks: Sink[] = [
  (e, p) => window.gtag?.('event', e, p),
  (e, p) => window.plausible?.(e, { props: p }),
  (e, p) => window.va?.('event', { name: e, data: p }),
]

if (import.meta.env.DEV) sinks.push((e, p) => console.info('[analytics]', e, p))

const once = new Set<string>()

export function track(event: AnalyticsEvent, props: Props = {}, opts?: { onceKey?: string }) {
  if (opts?.onceKey) {
    if (once.has(opts.onceKey)) return
    once.add(opts.onceKey)
  }
  for (const s of sinks) {
    try {
      s(event, props)
    } catch {
      /* analytics must never break the page */
    }
  }
}

export function addAnalyticsSink(sink: Sink) {
  sinks.push(sink)
}
