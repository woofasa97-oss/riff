import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/cn'
import { instrumentLabel } from '@/lib/labels'
import type { Instrument, MusicianStats, Rsvp } from '@/types'

/** A thin bar under the percentage. Reliability is a number people compare, so show its scale. */
function ReliabilityMeter({ pct }: { pct: number }) {
  return (
    <div
      className="mt-1 h-[3px] w-[42px] overflow-hidden rounded-full bg-muted"
      role="img"
      aria-label={`${pct}% reliability`}
    >
      <div
        className={cn('h-full rounded-full', pct >= 95 ? 'bg-success' : 'bg-primary')}
        style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
      />
    </div>
  )
}

export function AttendeeRow({
  name,
  avatarUrl,
  instrument,
  stats,
  rsvp,
  isYou = false,
  className,
}: {
  name: string
  avatarUrl: string
  instrument: Instrument
  stats?: MusicianStats
  rsvp: Rsvp
  isYou?: boolean
  className?: string
}) {
  return (
    <div className={cn('flex items-center justify-between gap-3 p-4', className)}>
      <div className="flex min-w-0 items-center gap-3">
        <Avatar src={avatarUrl} name={name} size="lg" />
        <div className="min-w-0">
          <div className="truncate font-serif text-[15px] font-bold text-foreground">
            {name}
            {isYou && <span className="ml-1.5 font-sans text-[12px] text-foreground-dim">You</span>}
          </div>
          <div className="text-[13px] text-foreground-dim">
            {instrumentLabel(instrument)}
            {rsvp === 'pending' && ' · not replied yet'}
            {rsvp === 'declined' && ' · cannot make it'}
          </div>
        </div>
      </div>
      {stats && rsvp === 'confirmed' && (
        <div className="shrink-0 text-right">
          <div className="text-[14px] font-bold text-foreground">{stats.reliabilityPct}%</div>
          <div className="text-[10px] text-foreground-dim">reliability</div>
          <ReliabilityMeter pct={stats.reliabilityPct} />
        </div>
      )}
    </div>
  )
}
