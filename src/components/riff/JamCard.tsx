import Link from 'next/link'
import { Clock, MapPin } from 'lucide-react'
import { AvatarStack } from '@/components/ui/Avatar'
import { Card } from '@/components/ui/Card'
import { formatDayAndTime, formatShortDateTime, relativeDayLabel } from '@/lib/datetime'
import { directionsHref, shortNeighborhood } from '@/lib/labels'
import { canRevealAddress } from '@/lib/privacy'
import { getMusician, getVenue } from '@/mocks'
import type { Jam } from '@/types'

function attendeePeople(jam: Jam) {
  return jam.attendees
    .filter((a) => a.rsvp !== 'declined')
    .map((a) => getMusician(a.musicianId))
    .filter((m): m is NonNullable<typeof m> => Boolean(m))
    .map((m) => ({ id: m.id, name: m.name, avatarUrl: m.avatarUrl }))
}

/**
 * The lead card on the Jams tab: gradient hero, then a two-button action strip.
 * `Directions` appears only when the server actually disclosed the address to this viewer
 * (jam.revealedAddress — docs/SPEC.md §5.2).
 */
export function JamHeroCard({ jam, now, viewerId }: { jam: Jam; now: string; viewerId: string }) {
  const venue = getVenue(jam.venueId)
  const people = attendeePeople(jam)
  const showDirections = canRevealAddress(jam, viewerId) && venue && jam.revealedAddress

  return (
    <Card className="mb-4 overflow-hidden">
      <Link
        href={`/jams/${jam.id}`}
        className="relative block bg-gradient-to-br from-hero-from to-hero-to p-4"
      >
        <span className="absolute right-4 top-4 rounded-full bg-card/90 px-2.5 py-1 text-[11px] font-semibold text-foreground backdrop-blur-sm">
          {relativeDayLabel(jam.startsAt, now)}
        </span>
        <h3 className="mb-1 pr-16 font-serif text-[20px] font-bold leading-tight text-foreground">
          {jam.title}
        </h3>
        <div className="mb-3 text-[14px] font-medium text-primary">
          {formatDayAndTime(jam.startsAt)}
        </div>
        {venue && (
          <div className="mb-4 flex items-center gap-1.5 text-[13px] text-foreground">
            <MapPin size={14} className="shrink-0 text-foreground-dim" />
            {venue.name}, {shortNeighborhood(venue.neighborhood)}
          </div>
        )}
        <AvatarStack people={people} max={3} />
      </Link>

      <div className="flex gap-3 p-4">
        <Link
          href={`/messages/${jam.threadId}`}
          className="flex h-[44px] flex-1 items-center justify-center rounded-[12px] bg-surface-muted text-[14px] font-medium text-foreground transition-transform active:scale-95"
        >
          Message group
        </Link>
        {showDirections ? (
          <a
            href={directionsHref(`${jam.revealedAddress}, ${venue.city}`)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-[44px] flex-1 items-center justify-center rounded-[12px] border border-border-subtle bg-card text-[14px] font-medium text-foreground transition-transform active:scale-95"
          >
            Directions
          </a>
        ) : (
          <Link
            href={`/jams/${jam.id}`}
            className="flex h-[44px] flex-1 items-center justify-center rounded-[12px] border border-border-subtle bg-card text-[14px] font-medium text-foreground transition-transform active:scale-95"
          >
            View details
          </Link>
        )}
      </div>
    </Card>
  )
}

/** The quieter card used for every jam after the first. */
export function JamCompactCard({ jam, trailing }: { jam: Jam; trailing?: React.ReactNode }) {
  const venue = getVenue(jam.venueId)
  const people = attendeePeople(jam)
  const awaiting = jam.attendees.filter((a) => a.rsvp === 'pending').length

  return (
    <Card className="mb-3 p-4">
      {/* The title block is the link; the footer sits outside it so `trailing` can be a link too. */}
      <Link href={`/jams/${jam.id}`} className="block">
        <h3 className="mb-1 font-serif text-[17px] font-bold leading-tight text-foreground">
          {jam.title}
        </h3>
        <div className="text-[13px] text-foreground-dim">
          {venue ? `${venue.name} · ` : ''}
          {formatShortDateTime(jam.startsAt)}
        </div>
      </Link>
      <div className="mt-4 flex items-center justify-between gap-3">
        <AvatarStack people={people} max={3} size="sm" />
        {trailing ??
          (awaiting > 0 ? (
            <span className="flex items-center gap-1.5 rounded-full bg-background px-2.5 py-1 text-[12px] text-foreground-dim">
              <Clock size={11} />
              Awaiting {awaiting} {awaiting === 1 ? 'reply' : 'replies'}
            </span>
          ) : null)}
      </div>
    </Card>
  )
}

export function jamGroupLabel(jam: Jam, now: string): string {
  const days = (Date.parse(jam.startsAt) - Date.parse(now)) / 86_400_000
  return days <= 7 ? 'This week' : 'Later'
}
