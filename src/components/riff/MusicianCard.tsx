'use client'

import Link from 'next/link'
import { CalendarDays, Check, MapPin } from 'lucide-react'
import { AudioClipPlayer } from '@/components/riff/AudioClipPlayer'
import { Avatar } from '@/components/ui/Avatar'
import { Card } from '@/components/ui/Card'
import { DemoTag } from '@/components/ui/DemoTag'
import { freeDaysLabel } from '@/lib/availability'
import { cn } from '@/lib/cn'
import { genreLane, intentLabel, playerLabel } from '@/lib/labels'
import { useMusicianStats } from '@/lib/store'
import type { Musician } from '@/types'

const INTENT_PILL: Record<Musician['intent'], string> = {
  casual: 'bg-accent-soft text-accent',
  serious: 'bg-surface-muted text-primary',
  gigging: 'bg-warning-soft text-warning',
}

/**
 * The Discover feed card (docs/BUILD-PLAN.md P2-01, from 20-discover.html): identity, an
 * earned badge, the clip, distance + availability, and the two actions. The badge line is
 * derived — every state is computed from recorded sessions, never authored copy.
 */
export function MusicianCard({ musician, className }: { musician: Musician; className?: string }) {
  const stats = useMusicianStats(musician.id)

  const badge = stats?.topReliability
    ? { lead: 'TOP RELIABILITY', detail: `${stats.repeatJams} repeat jams` }
    : stats?.isNew
      ? { lead: 'NEW HERE', detail: 'first jams welcome' }
      : stats
        ? { lead: `${stats.reliabilityPct}% RELIABILITY`, detail: `${stats.vouchCount} vouches` }
        : undefined

  return (
    <Card className={cn('relative flex flex-col p-4', className)}>
      <div className="mb-3 flex items-start gap-3">
        <Avatar
          src={musician.avatarUrl}
          name={musician.name}
          size="lg"
          className="h-12 w-12 shadow-sm"
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex min-w-0 items-center gap-1.5">
            <h3 className="truncate font-serif text-[18px] font-bold leading-tight text-foreground">
              {musician.name}
            </h3>
            {musician.isSeed && <DemoTag />}
          </div>
          <span className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-primary">
            {playerLabel(musician.instruments[0]).toUpperCase()} · {genreLane(musician.genres)}
          </span>
        </div>
        {/* In flow rather than absolutely positioned, so a long name truncates instead of
            running underneath it. */}
        <span
          className={cn(
            'shrink-0 whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.06em]',
            INTENT_PILL[musician.intent],
          )}
        >
          {intentLabel(musician.intent)}
        </span>
      </div>

      {badge && (
        <div className="mb-3 flex items-center gap-1.5">
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-success">
            <Check size={9} strokeWidth={4} className="text-white" />
          </span>
          <span className="text-[12px] font-semibold text-foreground">
            {badge.lead} · <span className="font-normal text-muted-foreground">{badge.detail}</span>
          </span>
        </div>
      )}

      {musician.clip && (
        <AudioClipPlayer clip={musician.clip} label={`${musician.name}'s clip`} className="mb-3" />
      )}

      <div className="mb-4 flex items-center gap-4 text-[12px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <MapPin size={12} />
          {/* Zone-level only: borough + rounded distance, never an address. */}
          {musician.city.split(',')[0]}, {musician.distanceMi} mi
        </span>
        <span className="flex items-center gap-1.5">
          <CalendarDays size={12} />
          {freeDaysLabel(musician.availability)}
        </span>
      </div>

      <div className="mt-auto flex items-center gap-2">
        <Link
          href={`/musicians/${musician.id}`}
          className="flex h-[48px] flex-1 items-center justify-center rounded-[12px] bg-surface-muted text-[15px] font-semibold text-foreground transition-transform active:scale-95"
        >
          View profile
        </Link>
        <Link
          href={`/musicians/${musician.id}/request`}
          className="flex h-[48px] flex-1 items-center justify-center rounded-[12px] bg-primary text-[15px] font-semibold text-primary-foreground shadow-sm transition-transform active:scale-95"
        >
          Request jam
        </Link>
      </div>
    </Card>
  )
}
