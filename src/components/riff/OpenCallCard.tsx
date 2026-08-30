'use client'

import Link from 'next/link'
import { AvatarStack } from '@/components/ui/Avatar'
import { formatRelativeShort, formatTime, relativeDayLabel } from '@/lib/datetime'
import { cn } from '@/lib/cn'
import { joinNames } from '@/lib/labels'
import { useRiffStore } from '@/lib/store'
import { CURRENT_USER_ID, NOW, getMusician } from '@/mocks'
import type { Jam } from '@/types'

/**
 * An open call interleaved in the Discover feed (from 20-discover.html). Applying files an
 * OpenCallApplication — it never seats you on the jam; the host still has to accept
 * (docs/SPEC.md §5.1).
 */
export function OpenCallCard({ jam, className }: { jam: Jam; className?: string }) {
  const applications = useRiffStore((s) => s.applications)
  const applyToOpenCall = useRiffStore((s) => s.applyToOpenCall)
  const viewer = getMusician(CURRENT_USER_ID)

  const isMine = jam.hostId === CURRENT_USER_ID
  const applied = applications.some((a) => a.jamId === jam.id && a.applicantId === CURRENT_USER_ID)
  const applicantCount = applications.filter((a) => a.jamId === jam.id).length

  const hosts = jam.attendees
    .filter((a) => a.rsvp === 'confirmed')
    .map((a) => getMusician(a.musicianId))
    .filter((m): m is NonNullable<typeof m> => Boolean(m))

  // Apply on the seat you actually play, falling back to whatever is open.
  const seat = jam.openSeats.find((s) => viewer?.instruments.includes(s)) ?? jam.openSeats[0]

  return (
    <article
      className={cn(
        'relative flex w-full flex-col rounded-[16px] border border-dashed border-border bg-card p-4 shadow-sm',
        className,
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-primary">
          Open call
        </span>
        {jam.postedAt && (
          <span className="text-[11px] text-foreground-dim">
            {/* "2h" composes with "ago"; "Yesterday"/"Tue" already carry their own tense. */}
            {(() => {
              const label = formatRelativeShort(jam.postedAt, NOW)
              return /^\d/.test(label)
                ? `Posted ${label} ago`
                : `Posted ${label.toLowerCase() === label ? label : label.charAt(0).toLowerCase() + label.slice(1)}`
            })()}
          </span>
        )}
      </div>

      <h3 className="mb-2 pr-4 font-serif text-[18px] font-bold leading-tight text-foreground">
        {jam.title}
      </h3>

      {jam.message && (
        <p className="mb-4 text-[13px] italic text-muted-foreground">“{jam.message}”</p>
      )}

      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <AvatarStack
            people={hosts.map((m) => ({ id: m.id, name: m.name, avatarUrl: m.avatarUrl }))}
            max={2}
            size="sm"
          />
          <span className="truncate text-[12px] font-medium text-foreground">
            Hosted by {joinNames(hosts.map((m) => m.name.split(' ')[0]))}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="rounded bg-surface-muted px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
            {relativeDayLabel(jam.startsAt, NOW)}
          </span>
          <span className="rounded bg-surface-muted px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
            {formatTime(jam.startsAt)}
          </span>
        </div>
      </div>

      {isMine ? (
        <Link
          href={`/jams/${jam.id}`}
          className="flex h-[48px] w-full items-center justify-center rounded-[12px] border border-border-subtle bg-background text-[15px] font-semibold text-foreground transition-transform active:scale-95"
        >
          Your open call · {applicantCount} applied
        </Link>
      ) : applied ? (
        <div className="flex h-[48px] w-full items-center justify-center rounded-[12px] bg-warning-soft text-[15px] font-semibold text-warning">
          Applied · Pending
        </div>
      ) : (
        <button
          type="button"
          disabled={!seat}
          onClick={() => seat && applyToOpenCall(jam.id, seat)}
          className="h-[48px] w-full rounded-[12px] border border-primary bg-card text-[15px] font-semibold text-primary transition-transform active:scale-95 disabled:opacity-40"
        >
          Apply to join
        </button>
      )}
    </article>
  )
}
