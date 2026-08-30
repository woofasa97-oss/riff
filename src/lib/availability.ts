import { formatShortDateTime } from '@/lib/datetime'
import type { Availability, Slot, Weekday } from '@/types'

export const WEEKDAYS: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

export const WEEKDAY_LABEL: Record<Weekday, string> = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
}

export const SLOTS: Slot[] = ['morning', 'afternoon', 'evening']

export const SLOT_LABEL: Record<Slot, string> = {
  morning: 'Morn',
  afternoon: 'Aft',
  evening: 'Eve',
}

/** A grid with nothing selected — the onboarding starting point. */
export function emptyGrid(): Record<Weekday, Slot[]> {
  return { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] }
}

/** "Free Tue, Thu, Sun" — the summary line on a musician card. */
export function freeDaysLabel(availability: Availability): string {
  const days = WEEKDAYS.filter((d) => (availability.grid[d] ?? []).length > 0).map(
    (d) => WEEKDAY_LABEL[d],
  )
  if (days.length === 0) return 'No regular days yet'
  if (days.length === 7) return 'Free most days'
  return `Free ${days.join(', ')}`
}

/** When each slot starts, as an hour of the day. Used to turn a grid cell into a real time. */
const SLOT_HOUR: Record<Slot, number> = { morning: 10, afternoon: 14, evening: 19 }

/**
 * The next `count` concrete times a musician's availability grid produces, starting from `now`.
 * This is what makes the time chips on "Request a jam" honest — they are drawn from the
 * target's real availability, not invented (docs/BUILD-PLAN.md P2-04).
 *
 * The fixture world lives entirely inside America/New_York daylight time, so the offset is
 * fixed at -04:00 rather than computed. Revisit when the mock clock ever leaves EDT.
 */
export function nextAvailableSlots(
  availability: Availability,
  nowIso: string,
  count = 3,
): { startsAt: string; slot: Slot; label: string }[] {
  const out: { startsAt: string; slot: Slot; label: string }[] = []
  const nowMs = Date.parse(nowIso)
  const dateFmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const weekdayFmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
  })

  // Start from tomorrow: "tonight" is its own toggle, and proposing a slot that starts in an
  // hour reads as pushy rather than useful.
  for (let offset = 1; offset <= 14 && out.length < count; offset++) {
    const dayMs = nowMs + offset * 86_400_000
    const weekday = weekdayFmt.format(new Date(dayMs)).toLowerCase() as Weekday
    const slots = availability.grid[weekday] ?? []
    for (const slot of SLOTS) {
      if (out.length >= count) break
      if (!slots.includes(slot)) continue
      const startsAt = `${dateFmt.format(new Date(dayMs))}T${String(SLOT_HOUR[slot]).padStart(2, '0')}:00:00-04:00`
      if (Date.parse(startsAt) <= nowMs) continue
      out.push({ startsAt, slot, label: formatShortDateTime(startsAt) })
    }
  }
  return out
}
