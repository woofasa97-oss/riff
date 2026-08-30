import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { formatRelativeShort, formatShortDateTime } from '@/lib/datetime'
import { intentLabel, playerLabel } from '@/lib/labels'
import { getMusician, getVenue } from '@/mocks'
import type { JamRequest } from '@/types'

/**
 * An incoming jam request, as it reads on the Requests tab.
 *
 * Read-only by design: accepting or declining is the whole job of the incoming-request screen
 * (docs/BUILD-PLAN.md P2-05), and accepting is what creates a confirmed jam. Nothing here may
 * shortcut that — a request is a proposal, never a booking (docs/SPEC.md §5.1).
 */
export function RequestCard({ request, now }: { request: JamRequest; now: string }) {
  const from = getMusician(request.fromId)
  if (!from) return null
  const venue = request.venueId ? getVenue(request.venueId) : undefined

  return (
    <Card className="mb-3 p-4">
      <div className="flex items-start gap-3">
        <Avatar src={from.avatarUrl} name={from.name} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-serif text-[15px] font-bold text-foreground">{from.name}</h3>
            <span className="shrink-0 text-[12px] text-foreground-dim">
              {formatRelativeShort(request.createdAt, now)}
            </span>
          </div>
          <p className="text-[13px] text-foreground-dim">
            {playerLabel(from.instruments[0])} · {from.neighborhood}, {from.distanceMi} mi
          </p>
        </div>
      </div>

      <blockquote className="mt-3 border-l-2 border-border-subtle pl-3 text-[14px] italic text-foreground">
        “{request.message}”
      </blockquote>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-[13px]">
        <div>
          <dt className="text-[11px] font-bold uppercase tracking-[0.08em] text-foreground-dim">
            When
          </dt>
          <dd className="mt-0.5 text-foreground">
            {request.proposedTimes.map((t) => formatShortDateTime(t)).join(' or ')}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-bold uppercase tracking-[0.08em] text-foreground-dim">
            Where
          </dt>
          {/* Zone-level only. Nothing is confirmed, so no address exists to show. */}
          <dd className="mt-0.5 text-foreground">
            {venue ? venue.name : (request.venueSuggestion ?? 'To be decided')}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex items-center justify-between">
        <Badge tone="primary">{intentLabel(request.intent)}</Badge>
        <span className="text-[12px] text-foreground-dim">Waiting on your reply</span>
      </div>
    </Card>
  )
}
