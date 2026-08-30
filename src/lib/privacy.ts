import type { Jam, Venue } from '@/types'

/**
 * The two location and reputation rules from docs/SPEC.md §5, enforced here rather than
 * left to each screen to remember.
 */

/**
 * Rule 2 — neighbourhood, never address. An exact street address renders only on a jam that is
 * actually confirmed, and only to someone confirmed to be attending it.
 */
export function canRevealAddress(jam: Jam, viewerId: string): boolean {
  if (jam.status !== 'confirmed') return false
  return jam.attendees.some((a) => a.musicianId === viewerId && a.rsvp === 'confirmed')
}

/** What to render in a jam's location block, given who is looking. */
export function jamLocationLines(
  jam: Jam,
  venue: Venue,
  viewerId: string,
): { primary: string; secondary: string; exact: boolean } {
  if (canRevealAddress(jam, viewerId)) {
    return { primary: venue.address, secondary: venue.city, exact: true }
  }
  return {
    primary: venue.neighborhood,
    secondary: 'Exact address is shared once the jam is confirmed',
    exact: false,
  }
}

/**
 * Rules 3 and 4 — only a confirmed co-attendee of a completed jam can vouch, and nobody
 * vouches for themselves.
 */
export function canVouch(jam: Jam, fromId: string, toId: string): boolean {
  if (fromId === toId) return false
  if (jam.status !== 'completed') return false
  const confirmed = (id: string) =>
    jam.attendees.some((a) => a.musicianId === id && a.rsvp === 'confirmed')
  return confirmed(fromId) && confirmed(toId)
}

/** Publishing a recording needs unanimous consent from the confirmed attendees. */
export function hasUnanimousConsent(jam: Jam, consentingIds: string[]): boolean {
  const confirmed = jam.attendees.filter((a) => a.rsvp === 'confirmed')
  return confirmed.every((a) => consentingIds.includes(a.musicianId))
}
