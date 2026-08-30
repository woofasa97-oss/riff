'use client'

import Link from 'next/link'
import { ChevronLeft, Share2, Star, UserPlus } from 'lucide-react'
import { AppShell } from '@/components/riff/AppShell'
import { WaveformPlayer } from '@/components/riff/WaveformPlayer'
import { SubScreenHeader } from '@/components/riff/TopBar'
import { Avatar } from '@/components/ui/Avatar'
import { Button, buttonClass, iconButtonClass } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { StatTile } from '@/components/ui/StatTile'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/datetime'
import { compactCount, formatClock, instrumentLabel } from '@/lib/labels'
import { statsFor, useReputationContext, useRiffStore } from '@/lib/store'
import { peaksFor } from '@/lib/waveform'
import { getBand, getMusician, seasonBadgeFor } from '@/mocks'

export function BandView({ bandId }: { bandId: string }) {
  const band = getBand(bandId)
  const followed = useRiffStore((s) => s.followedBandIds)
  const toggleFollow = useRiffStore((s) => s.toggleFollowBand)
  const viewerId = useRiffStore((s) => s.viewerId)
  const ctx = useReputationContext()

  if (!band) {
    return (
      <AppShell
        activeTab="discover"
        header={<SubScreenHeader title="Band" backHref="/discover" />}
        mainClassName="flex items-center px-4 py-6"
      >
        <EmptyState
          className="w-full"
          title="This band is gone"
          body="They may have broken up, or the link is out of date."
          action={
            <Link href="/discover" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
              Back to Discover
            </Link>
          }
        />
      </AppShell>
    )
  }

  const isFollowing = followed.includes(band.id)
  const badge = seasonBadgeFor(band.id)

  return (
    <AppShell activeTab="discover" mainClassName="pb-6">
      {/* DARK HERO — the one inverted block on an otherwise light screen. */}
      <div className="relative flex flex-col items-center bg-gradient-to-br from-[#1a1725] to-[#2d2740] px-4 pb-6 pt-[56px]">
        <div className="absolute left-0 top-0 flex h-[56px] w-full items-center justify-between px-4">
          <Link
            href="/discover"
            aria-label="Back"
            className="flex h-9 w-9 items-center justify-center text-white"
          >
            <ChevronLeft size={18} />
          </Link>
          <span className={cn(iconButtonClass('dark'), 'pointer-events-none opacity-60')}>
            <Share2 size={14} />
          </span>
        </div>

        <Avatar
          src={band.coverUrl}
          name={band.name}
          ring={false}
          size="xl"
          className="mb-4 h-[100px] w-[100px] border-2 border-white shadow-lg"
        />
        <h1 className="mb-1 text-center font-serif text-[24px] font-bold leading-tight text-white">
          {band.name}
        </h1>
        <p className="mb-3 text-[13px] font-medium text-white/80">
          {band.genre} · {band.city}
        </p>
        {badge && (
          <span className="mb-6 rounded-full bg-live px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm">
            {badge}
          </span>
        )}

        <div className="flex w-full gap-3 px-2">
          <Button
            className={cn('flex-1', isFollowing && 'bg-white/15 text-white')}
            onClick={() => toggleFollow(band.id)}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-white/30 bg-transparent text-white"
            disabled
            title="Band messaging is not built yet"
          >
            Message
          </Button>
        </div>
      </div>

      <div className="relative -mt-4 flex justify-between gap-3 rounded-t-[24px] bg-background px-4 py-6">
        <StatTile
          value={band.sessionCount}
          label="Sessions"
          className="[&_span:first-child]:text-[18px]"
        />
        <StatTile
          value={band.rating}
          label="Rating"
          adornment={<Star size={10} className="text-[#facc15]" fill="currentColor" />}
          className="[&_span:first-child]:text-[18px]"
        />
        <StatTile
          value={compactCount(band.followers + (isFollowing ? 1 : 0))}
          label="Followers"
          className="[&_span:first-child]:text-[18px]"
        />
      </div>

      {/* MEMBERS — reliability is derived per musician, never stored on the band. */}
      <section className="mb-6 px-4">
        <SectionHeader>Members</SectionHeader>
        <Card className="flex flex-col p-1">
          {band.members.map((member) => {
            const musician = getMusician(member.musicianId)
            if (!musician) return null
            const stats = statsFor(member.musicianId, ctx)
            return (
              <Link
                key={member.musicianId}
                href={member.musicianId === viewerId ? '/me' : `/musicians/${member.musicianId}`}
                className="flex items-center border-b border-border-hairline p-3 last:border-0"
              >
                <Avatar
                  src={musician.avatarUrl}
                  name={musician.name}
                  size="lg"
                  ring={false}
                  className="border border-border-subtle"
                />
                <div className="ml-3 min-w-0 flex-1">
                  <div className="truncate font-serif text-[14px] font-bold text-foreground">
                    {musician.name}
                  </div>
                  <div className="text-[12px] text-foreground-dim">{member.role}</div>
                </div>
                {stats && (
                  <span className="shrink-0 rounded-full bg-[color:var(--hero-from)] px-2 py-1 text-[10px] font-bold text-primary">
                    {stats.isNew ? 'New' : `${stats.reliabilityPct}%`}
                  </span>
                )}
              </Link>
            )
          })}

          {band.openSeats.map((seat) => (
            <div
              key={seat}
              className="m-1 flex items-center rounded-[12px] border-2 border-dashed border-border-subtle bg-background/60 p-3"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-dashed border-border-subtle bg-card text-foreground-dim">
                <UserPlus size={15} />
              </span>
              <div className="ml-3 flex-1 text-[13px] font-medium text-foreground">
                Open seat · {instrumentLabel(seat)}
              </div>
              <Button
                size="sm"
                variant="secondary"
                className="h-auto rounded-[8px] px-3 py-1.5 text-[11px] font-semibold text-primary"
                disabled
                title="Applying to a band seat is not built yet"
              >
                Apply
              </Button>
            </div>
          ))}
        </Card>
      </section>

      {/* LISTEN */}
      <section className="mb-6 px-4">
        <SectionHeader>Listen</SectionHeader>
        {band.recordings.length === 0 ? (
          <p className="px-1 text-[13px] text-foreground-dim">
            Nothing published yet. Recordings appear once every player agrees to share them.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {band.recordings.map((rec) => (
              <Card key={rec.id} className="p-4">
                <div className="mb-3">
                  <div className="font-serif text-[15px] font-bold text-foreground">
                    {rec.title}
                  </div>
                  <div className="mt-0.5 text-[11px] text-foreground-dim">
                    Recorded {formatDate(rec.recordedAt)}
                    {rec.venueName ? ` · ${rec.venueName}` : ''} · {formatClock(rec.durationSec)}
                  </div>
                </div>
                <WaveformPlayer
                  peaks={peaksFor(rec.id, 24)}
                  durationSec={rec.durationSec}
                  label={rec.title}
                  className="border-0 bg-transparent p-0"
                />
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* BATTLE HISTORY — folded out of the battles fixture, so it agrees with the bracket. */}
      <section className="mb-8 px-4">
        <SectionHeader
          action={
            <Link href="/battles/bracket" className="text-[13px] font-medium text-primary">
              Bracket
            </Link>
          }
        >
          Battle history
        </SectionHeader>
        {band.battleHistory.length === 0 ? (
          <p className="px-1 text-[13px] text-foreground-dim">No battles played yet.</p>
        ) : (
          <Card className="flex flex-col p-1">
            {band.battleHistory.map((entry, i) => {
              const opponent = getBand(entry.opponentBandId)
              return (
                <div
                  key={`${entry.opponentBandId}-${i}`}
                  className="flex items-center justify-between border-b border-border-hairline p-3 last:border-0"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="text-[12px] text-foreground-dim">vs</span>
                    <span className="truncate font-serif text-[14px] font-bold text-foreground">
                      {opponent?.name ?? 'Unknown'}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-[12px] font-medium text-foreground">
                      {entry.scoreFor}% - {entry.scoreAgainst}%
                    </span>
                    <span
                      className={cn(
                        'w-12 rounded-sm px-2 py-1 text-center text-[10px] font-bold',
                        entry.result === 'won'
                          ? 'bg-success/15 text-success'
                          : 'bg-background text-foreground-dim',
                      )}
                    >
                      {entry.result === 'won' ? 'Won' : 'Lost'}
                    </span>
                  </div>
                </div>
              )
            })}
          </Card>
        )}
      </section>
    </AppShell>
  )
}
