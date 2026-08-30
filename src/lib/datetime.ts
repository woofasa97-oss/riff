/**
 * Every date in this app is formatted in one fixed zone.
 *
 * Two reasons, both load-bearing:
 *  1. Server Components render on the server and hydrate on the client. If formatting used the
 *     ambient zone, the two would disagree and React would throw a hydration mismatch.
 *  2. The fixtures are a fixed scene (see src/mocks/clock.ts). Rendering them in the viewer's
 *     zone would drift the copy the reference screens specify.
 */
const ZONE = 'America/New_York'

const cache = new Map<string, Intl.DateTimeFormat>()

function fmt(options: Intl.DateTimeFormatOptions) {
  const key = JSON.stringify(options)
  let f = cache.get(key)
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', { timeZone: ZONE, ...options })
    cache.set(key, f)
  }
  return f
}

/** Calendar date in ZONE as YYYY-MM-DD, so two instants can be compared by day. */
function zonedDateKey(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso))
}

function zonedHour(iso: string): number {
  return Number(fmt({ hour: 'numeric', hour12: false }).format(new Date(iso)))
}

/** Whole calendar days from `from` to `to` in ZONE. Negative when `to` is in the past. */
export function dayDelta(from: string, to: string): number {
  const a = Date.parse(`${zonedDateKey(from)}T00:00:00Z`)
  const b = Date.parse(`${zonedDateKey(to)}T00:00:00Z`)
  return Math.round((b - a) / 86_400_000)
}

export function isSameDay(a: string, b: string): boolean {
  return zonedDateKey(a) === zonedDateKey(b)
}

/** "7:00 PM" */
export function formatTime(iso: string): string {
  return fmt({ hour: 'numeric', minute: '2-digit' }).format(new Date(iso))
}

/** "FRI" — the uppercase context suffix on message rows. */
export function formatWeekdayAbbr(iso: string): string {
  return fmt({ weekday: 'short' }).format(new Date(iso)).toUpperCase()
}

/** "Friday, 7:00 PM" */
export function formatDayAndTime(iso: string): string {
  return `${fmt({ weekday: 'long' }).format(new Date(iso))}, ${formatTime(iso)}`
}

/** "Sun 30 Aug, 4:00 PM" */
export function formatShortDateTime(iso: string): string {
  const d = new Date(iso)
  const weekday = fmt({ weekday: 'short' }).format(d)
  const day = fmt({ day: 'numeric' }).format(d)
  const month = fmt({ month: 'short' }).format(d)
  return `${weekday} ${day} ${month}, ${formatTime(iso)}`
}

/** "30 Aug 2026" */
export function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${fmt({ day: 'numeric' }).format(d)} ${fmt({ month: 'short' }).format(d)} ${fmt({ year: 'numeric' }).format(d)}`
}

/**
 * The pill on an upcoming jam card: "Tonight", "Tomorrow", "In 2 days".
 * Anything past a week falls back to a date so the pill never lies.
 */
export function relativeDayLabel(iso: string, now: string): string {
  const delta = dayDelta(now, iso)
  if (delta === 0) return zonedHour(iso) >= 17 ? 'Tonight' : 'Today'
  if (delta === 1) return 'Tomorrow'
  if (delta === -1) return 'Yesterday'
  if (delta > 1 && delta <= 6) return `In ${delta} days`
  if (delta < -1 && delta >= -6) return `${Math.abs(delta)} days ago`
  return `${fmt({ day: 'numeric' }).format(new Date(iso))} ${fmt({ month: 'short' }).format(new Date(iso))}`
}

/** Message-list timestamp: "4m", "1h", "Yesterday", "Tue", "14 Aug". */
export function formatRelativeShort(iso: string, now: string): string {
  const minutes = Math.round((Date.parse(now) - Date.parse(iso)) / 60_000)
  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m`
  const delta = dayDelta(iso, now)
  if (delta === 0) return `${Math.floor(minutes / 60)}h`
  if (delta === 1) return 'Yesterday'
  if (delta <= 6) return fmt({ weekday: 'short' }).format(new Date(iso))
  return `${fmt({ day: 'numeric' }).format(new Date(iso))} ${fmt({ month: 'short' }).format(new Date(iso))}`
}

/** Whole minutes from `iso` to `now`, floored at zero. Feeds formatDurationMinutes. */
export function minutesSince(iso: string, now: string): number {
  return Math.max(0, Math.round((Date.parse(now) - Date.parse(iso)) / 60_000))
}

/** 102 → "1h 42m". Used for the session-recap duration line. */
export function formatDurationMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function addHours(iso: string, hours: number): string {
  return new Date(Date.parse(iso) + hours * 3_600_000).toISOString()
}

/** Day separator inside a conversation: "Today", "Yesterday", "Fri 21 Aug". */
export function formatDayHeading(iso: string, now: string): string {
  const delta = dayDelta(iso, now)
  if (delta === 0) return 'Today'
  if (delta === 1) return 'Yesterday'
  const d = new Date(iso)
  return `${fmt({ weekday: 'short' }).format(d)} ${fmt({ day: 'numeric' }).format(d)} ${fmt({ month: 'short' }).format(d)}`
}

/** Groups a chronological message list into day buckets, preserving order. */
export function groupByDay<T extends { sentAt: string }>(
  items: T[],
): { key: string; items: T[] }[] {
  const out: { key: string; items: T[] }[] = []
  for (const item of items) {
    const key = zonedDateKey(item.sentAt)
    const last = out[out.length - 1]
    if (last && last.key === key) last.items.push(item)
    else out.push({ key, items: [item] })
  }
  return out
}
