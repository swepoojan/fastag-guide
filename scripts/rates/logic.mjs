// Pure logic for the automatic rate checker. No network or file access here, so it can be tested.

/** Plausible ranges per field (₹). A reading outside these is treated as a misread, never published. */
export const RANGES = {
  issuanceFee: [50, 500],
  securityDeposit: [0, 1000],
  minBalance: [0, 1000],
}

/** A single change bigger than this is treated as suspicious and not published: ₹100 or 50%, whichever is larger. */
export const maxChange = (old) => Math.max(100, Math.abs(old) * 0.5)

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

// Amounts in label mode must carry a currency marker, so phone numbers, years and
// class numbers are never mistaken for prices.
const MONEY = /(?:₹|\brs\.?|\binr)\s*([\d,]+(?:\.\d{1,2})?)/i
const NIL = /\b(nil|zero|no minimum)\b/i

/**
 * Label mode: the first label match (after the optional anchor), then the first
 * currency amount within `window` characters after it.
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
    }
  }
  return { value: null, reason: 'label not found' }
}

// A table cell: "NIL", or a number with an optional currency marker.
const CELL = /\b(nil)\b|(?:₹|\brs\.?|\binr)?\s*(?<![\w.])(\d[\d,]*(?:\.\d{1,2})?)(?![\d,]|\.\d)/gi

/**
 * Row mode, for fee tables: find the table's header row (which names the columns), then the
 * vehicle row after it, then read that row's cells in order. `cells` maps each cell to a field,
 * with null for a cell to skip (such as a class number).
 */
export function readRow(text, row) {
  const h = row.header.exec(text) ?? null
  row.header.lastIndex = 0
  if (!h) return { error: 'table header not found' }
  const afterHeader = text.slice(h.index + h[0].length)
  const a = afterHeader.match(row.anchor)
  if (!a) return { error: 'vehicle row not found under the table header' }
  const start = a.index + a[0].length
  const rowText = afterHeader.slice(start, start + (row.window ?? 220))
  const tokens = []
  let m
  CELL.lastIndex = 0
  while ((m = CELL.exec(rowText)) && tokens.length < row.cells.length) {
    tokens.push({ value: m[1] ? null : parseFloat(m[2].replace(/,/g, '')), nil: Boolean(m[1]), end: m.index + m[0].length })
  }
  const values = {}
  const missing = []
  row.cells.forEach((field, i) => {
    if (!field) return
    const t = tokens[i]
    if (!t) missing.push(`${field}: cell ${i + 1} not found in row`)
    else if (t.nil && !(row.allowNil ?? []).includes(field)) missing.push(`${field}: cell says NIL`)
    else values[field] = t.nil ? 0 : t.value
  })
  const last = tokens[Math.min(tokens.length, row.cells.length) - 1]
  const snippet = (a[0] + rowText.slice(0, last ? last.end : 0)).trim()
  const excerpt = text.slice(h.index, h.index + h[0].length + start + 160)
  return { values, missing, snippet, excerpt }
}

/** Extracts every field in a source spec. Returns values plus snippets and excerpts for the report. */
export function extract(text, spec) {
  const values = {}
  const snippets = {}
  const missing = []
  const excerpts = []
  for (const row of spec.rows ?? []) {
    const r = readRow(text, row)
    if (r.error) { missing.push(...row.cells.filter(Boolean).map((f) => `${f}: ${r.error}`)); continue }
    Object.assign(values, r.values)
    missing.push(...r.missing)
    for (const f of Object.keys(r.values)) snippets[f] = r.snippet
    excerpts.push(r.excerpt)
  }
  for (const [field, f] of Object.entries(spec.fields ?? {})) {
    const anchor = 'anchor' in f ? f.anchor : spec.anchor
    const r = findValue(text, f.labels, { anchor, window: f.window, allowNil: f.allowNil })
    if (r.value === null) missing.push(`${field}: ${r.reason}`)
    else { values[field] = r.value; snippets[field] = r.snippet }
  }
  return { values, snippets, missing, excerpts }
}

/** For the report: where fee-like text appears on a page, to tune readers when a page fails. */
export function diagnose(text, spec) {
  const anchorAt = spec.anchor ? text.search(spec.anchor) : null
  const windows = []
  const re = /(fee|deposit|balance|threshold|top[\s-]*up|₹|\brs\.?\s*\d|\binr\b)/gi
  let m
  while ((m = re.exec(text)) && windows.length < 8) {
    const s = Math.max(0, m.index - 80)
    windows.push(text.slice(s, m.index + 200))
    re.lastIndex = m.index + 200
  }
  // For table readers: the text right after each header that was found, to see how the rows look.
  const afterHeaders = (spec.rows ?? []).map((row) => {
    const h = text.match(row.header)
    return h ? text.slice(h.index, h.index + h[0].length + 600) : null
  })
  return { textLength: text.length, anchorAt, afterHeaders, windows }
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
 * `reader` identifies the page reader that produced the result (a hash of its rules).
 * A reader must first read the already-verified figures correctly ("prove" itself)
 * before any different figure it reads can be published. A new or edited reader that
 * misreads a page can therefore never publish a wrong number; it can only fail.
 *
 * - Same values as published → mark verified today; the reader is now proven.
 * - Different values from an unproven reader → treated as a failed check.
 * - Different values from a proven reader, first sighting → held as "pending", old values stay live.
 * - Same new values seen again on the next check → published and logged.
 * - Failed check → keep old values; after repeated failures over 2+ days show "couldn't verify".
 */
export function applyCheck(entry, result, today, id, reader) {
  const next = structuredClone(entry)
  const events = []
  let outcome = result

  if (outcome.ok && !same(outcome.values, entry.values) && entry.provenBy !== reader) {
    outcome = { ok: false, reason: `read ${JSON.stringify(outcome.values)}, but this reader has not yet matched the verified figures, so it cannot publish changes` }
  }

  if (!outcome.ok) {
    // Capped so a source that keeps failing doesn't rewrite the file (and redeploy) on every run.
    // The failure reason goes to the report, not here, for the same reason.
    next.failures = Math.min(FAILS_BEFORE_UNVERIFIED, (entry.failures ?? 0) + 1)
    if (next.failures >= FAILS_BEFORE_UNVERIFIED && daysBetween(entry.lastVerified, today) >= STALE_AFTER_DAYS) next.status = 'unverified'
    return { entry: next, events, outcome }
  }

  next.failures = 0
  const v = outcome.values

  if (same(v, entry.values)) {
    next.status = 'ok'
    next.lastVerified = today
    next.pending = null
    next.provenBy = reader
    return { entry: next, events, outcome }
  }

  if (entry.pending && same(v, entry.pending.values)) {
    for (const k of Object.keys(v)) {
      if (v[k] !== entry.values[k]) events.push({ date: today, id, field: k, from: entry.values[k], to: v[k] })
    }
    next.values = v
    next.status = 'ok'
    next.lastVerified = today
    next.pending = null
    return { entry: next, events, outcome }
  }

  next.pending = { values: v, firstSeen: today }
  next.status = 'pending'
  return { entry: next, events, outcome }
}

/** Keeps the history short: last 50 events. */
export function trimHistory(history) {
  return history.slice(-50)
}

/** Toll pass prices are fixed by government notification for the tax year, so they are not scraped.
 *  Once the notified validity date has passed, the site shows them as unverified until updated. */
export function passStatus(passes, today) {
  return passes.validUntil && today > passes.validUntil ? 'unverified' : 'ok'
}
