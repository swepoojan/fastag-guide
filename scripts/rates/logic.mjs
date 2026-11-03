// Pure logic for the automatic rate checker. No network or file access here, so it can be tested.

/** Plausible ranges per field (₹). A reading outside these is treated as a misread, never published. */
export const RANGES = {
  issuanceFee: [50, 500],
  securityDeposit: [0, 1000],
  minBalance: [0, 1000],
  annual: [1000, 10000],
  localOutside: [500, 5000],
  localInside: [1000, 10000],
}

/** A single change bigger than this is treated as suspicious and not published. */
export const maxChange = (old) => Math.max(150, Math.abs(old) * 1.0)

/** A source shows "couldn't verify" only after this many failed checks in a row... */
export const FAILS_BEFORE_UNVERIFIED = 2
/** ...and only once its last successful check is at least this many days old. */
export const STALE_AFTER_DAYS = 2

export const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000)

// ---------- text extraction ----------

export function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<(br|\/p|\/div|\/tr|\/td|\/th|\/li|\/h\d)[^>]*>/gi, ' | ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&#8377;|&#x20b9;|&inr;/gi, '₹')
    .replace(/&amp;/gi, '&')
    .replace(/&#39;|&apos;|&rsquo;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

const MONEY = /(?:₹|\brs\.?|\binr)\s*([\d,]+(?:\.\d{1,2})?)/i
const NIL = /\b(nil|zero|no minimum)\b/i
const BARE = /(?<![\d.,])(\d{2,5}(?:\.\d{1,2})?)(?![\d,])/

/**
 * Finds the value for one field: the first label match (after the optional anchor),
 * then the first amount within `window` characters after it.
 */
export function findValue(text, labels, { anchor, window = 160, allowNil = false } = {}) {
  let start = 0
  if (anchor) {
    const a = text.search(anchor)
    if (a < 0) return { value: null, reason: 'anchor not found' }
    start = a
  }
  const scope = text.slice(start)
  for (const label of labels) {
    const re = new RegExp(label.source, label.flags.includes('g') ? label.flags : label.flags + 'g')
    let m
    while ((m = re.exec(scope))) {
      const after = scope.slice(m.index + m[0].length, m.index + m[0].length + window)
      const money = after.match(MONEY)
      const nil = allowNil ? after.match(NIL) : null
      // Take whichever comes first: a currency amount, or "nil" where allowed.
      if (nil && (!money || nil.index < money.index)) return { value: 0, snippet: (m[0] + after.slice(0, nil.index + nil[0].length)).trim() }
      if (money) return { value: parseFloat(money[1].replace(/,/g, '')), snippet: (m[0] + after.slice(0, money.index + money[0].length)).trim() }
      const bare = after.slice(0, 60).match(BARE)
      if (bare) return { value: parseFloat(bare[1]), snippet: (m[0] + after.slice(0, bare.index + bare[0].length)).trim() }
    }
  }
  return { value: null, reason: 'label not found' }
}

/** Extracts every field in a source spec. Returns values plus per-field snippets for the report. */
export function extract(text, spec) {
  const values = {}
  const snippets = {}
  const missing = []
  for (const [field, f] of Object.entries(spec.fields)) {
    const r = findValue(text, f.labels, { anchor: f.anchor ?? spec.anchor, window: f.window, allowNil: f.allowNil })
    if (r.value === null) missing.push(`${field}: ${r.reason}`)
    else { values[field] = r.value; snippets[field] = r.snippet }
  }
  return { values, snippets, missing }
}

/** For the report: where fee-like text appears on a page, to tune readers when a page fails. */
export function diagnose(text, spec) {
  const anchorAt = spec.anchor ? text.search(spec.anchor) : null
  const windows = []
  const re = /(fee|deposit|balance|threshold|top[\s-]*up|₹|\brs\.?\s*\d|\binr\b)/gi
  let m
  while ((m = re.exec(text)) && windows.length < 6) {
    const s = Math.max(0, m.index - 80)
    windows.push(text.slice(s, m.index + 140))
    re.lastIndex = m.index + 140
  }
  return { textLength: text.length, anchorAt, windows }
}

// ---------- decision logic ----------

const same = (a, b) => Object.keys(a).length === Object.keys(b).length && Object.keys(a).every((k) => a[k] === b[k])

/**
 * Validates two independent readings of a page.
 * Returns { ok: true, values } or { ok: false, reason }.
 */
export function validate(readings, current) {
  if (readings.some((r) => r.error)) return { ok: false, reason: readings.find((r) => r.error).error }
  const [a, b] = readings
  if (a.missing.length) return { ok: false, reason: 'missing ' + a.missing.join('; ') }
  if (b && !same(a.values, b.values)) return { ok: false, reason: 'two reads disagreed' }
  for (const [k, v] of Object.entries(a.values)) {
    const range = RANGES[k]
    if (range && (v < range[0] || v > range[1])) return { ok: false, reason: `${k} ₹${v} outside plausible range ₹${range[0]}–₹${range[1]}` }
    if (k in current && Math.abs(v - current[k]) > maxChange(current[k])) return { ok: false, reason: `${k} change ₹${current[k]} → ₹${v} is too large to trust` }
  }
  return { ok: true, values: a.values }
}

/**
 * Applies one check result to one entry of rates.json and returns the new entry
 * plus any change events to append to history.
 *
 * - Same values as published → mark verified today.
 * - New values seen for the first time → hold as "pending", keep old values live.
 * - Same new values seen again on the next check → publish them and log the change.
 * - Failed check → keep old values; after repeated failures show "couldn't verify".
 */
export function applyCheck(entry, result, today, id) {
  const next = structuredClone(entry)
  const events = []

  if (!result.ok) {
    // Capped so a source that keeps failing doesn't rewrite the file (and redeploy) on every run.
    // The failure reason goes to the report, not here, for the same reason.
    next.failures = Math.min(FAILS_BEFORE_UNVERIFIED, (entry.failures ?? 0) + 1)
    if (next.failures >= FAILS_BEFORE_UNVERIFIED && daysBetween(entry.lastVerified, today) >= STALE_AFTER_DAYS) next.status = 'unverified'
    return { entry: next, events }
  }

  next.failures = 0
  const v = result.values

  if (same(v, entry.values)) {
    next.status = 'ok'
    next.lastVerified = today
    next.pending = null
    return { entry: next, events }
  }

  if (entry.pending && same(v, entry.pending.values)) {
    for (const k of Object.keys(v)) {
      if (v[k] !== entry.values[k]) events.push({ date: today, id, field: k, from: entry.values[k], to: v[k] })
    }
    next.values = v
    next.status = 'ok'
    next.lastVerified = today
    next.pending = null
    return { entry: next, events }
  }

  next.pending = { values: v, firstSeen: today }
  next.status = 'pending'
  return { entry: next, events }
}

/** Keeps the history short: last 50 events. */
export function trimHistory(history) {
  return history.slice(-50)
}
