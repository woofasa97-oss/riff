'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Disc3,
  MapPin,
  Quote,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Trophy,
  Zap,
} from 'lucide-react'
import { AppShell, StickyActionBar } from '@/components/riff/AppShell'
import { AvailabilityGrid } from '@/components/riff/AvailabilityGrid'
import { RecordingRow } from '@/components/riff/RecordingRow'
import { SubScreenHeader } from '@/components/riff/TopBar'
import { Avatar } from '@/components/ui/Avatar'
import { Button, buttonClass } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { StatTile } from '@/components/ui/StatTile'
import { genreLane, playerLabel, shortNeighborhood, vouchTagLabel } from '@/lib/labels'
import { vouchesFor } from '@/lib/reputation'
import { hasUnanimousConsent } from '@/lib/privacy'
import { useMusicianStats, useReputationContext, useRiffStore } from '@/lib/store'
import { getCurrentSeason, getLeaderboardEntry, getMusician } from '@/mocks'

/**
 * How a musician looks to everyone else (42-profile-musician.html). Everything reputational —
 * badges, tiles, ranking, vouches — is derived via useMusicianStats / vouchesFor, never read
 * from an editable field (product rule 3). The viewer's own profile lives on /me; only the
 * client knows who the viewer is, so the redirect there happens here, not in the route.
 */
export function MusicianProfileView({ musicianId }: { musicianId: string }) {
  const router = useRouter()
  const viewerId = useRiffStore((s) => s.viewerId)
  const jams = useRiffStore((s) => s.jams)
  const openDirectThread = useRiffStore((s) => s.openDirectThread)
  const recordingConsents = useRiffStore((s) => s.recordingConsents)
  const ctx = useReputationContext()
  const stats = useMusicianStats(musicianId)
  const musician = getMusician(musicianId)

  const [messageBusy, setMessageBusy] = useState(false)
  const [messageError, setMessageError] = useState<string | null>(null)

  const isSelf = musicianId === viewerId
  useEffect(() => {
    if (isSelf) router.replace('/me')
  }, [isSelf, router])

  // Completed sessions this musician actually played that carry a recording — and only when
  // every confirmed attendee agreed to publish it. A recording without unanimous consent is
  // private, full stop (docs/SPEC.md §4.6, docs/DATA-MODEL.md publishRecording).
  const recordedJams = useMemo(
    () =>
      jams
        .filter(
          (jam) =>
            jam.status === 'completed' &&
            Boolean(jam.recordingId) &&
            jam.attendees.some((a) => a.musicianId === musicianId && a.rsvp === 'confirmed') &&
            hasUnanimousConsent(jam, recordingConsents[jam.id] ?? []),
        )
        .sort((a, b) => Date.parse(b.startsAt) - Date.parse(a.startsAt)),
    [jams, musicianId, recordingConsents],
  )

  // Only confirmed co-attendees can vouch (product rule 4) — vouchesFor is the sole source.
  const allVouches = useMemo(
    () =>
      vouchesFor(musicianId, ctx).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    [musicianId, ctx],
  )

  if (isSelf) return null

  if (!musician || !stats) {
    return (
      <AppShell
        activeTab="discover"
        header={<SubScreenHeader title="Profile" backHref="/discover" />}
        mainClassName="flex items-center px-4 py-6"
      >
        <EmptyState
          className="w-full"
          title="No one here by that name"
          body="This musician is not on Riff, or the link is out of date."
          action={
            <Link href="/discover" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
              Back to Discover
            </Link>
          }
        />
      </AppShell>
    )
  }

  const entry = getLeaderboardEntry(musicianId)
  const season = getCurrentSeason()
  const firstName = musician.name.split(' ')[0]
  const preview = allVouches.slice(0, 2)
  const isSeed = musician.avatarUrl.startsWith('/mock/')

  return (
    <AppShell
      activeTab="discover"
      header={<SubScreenHeader title="Profile" backHref="/discover" />}
      mainClassName="pb-6"
      footer={
        <StickyActionBar
          note={
            messageError ? (
              <span className="text-destructive">{messageError}</span>
            ) : (
              `A request is a proposal — nothing is confirmed until ${firstName} accepts.`
            )
          }
        >
          <Button
            variant="secondary"
            className="flex-1"
            disabled={messageBusy}
            onClick={async () => {
              setMessageBusy(true)
              setMessageError(null)
              try {
                const thread = await openDirectThread(musicianId)
                router.push(`/messages/${thread.id}`)
              } catch (err) {
                setMessageError(
                  err instanceof Error ? err.message : 'Something went wrong — try again',
                )
                setMessageBusy(false)
              }
            }}
          >
            Message
          </Button>
          <Link
            href={`/musicians/${musicianId}/request`}
            className="flex h-[48px] flex-1 items-center justify-center rounded-[12px] bg-primary text-[15px] font-medium text-primary-foreground shadow-sm transition-transform active:scale-95"
          >
            Request jam
          </Link>
        </StickyActionBar>
      }
    >
      {isSeed && (
        <p className="px-4 pt-3 text-center text-[11px] text-foreground-dim">
          Riff crew · demo profile — they won&apos;t reply to requests
        </p>
      )}

      {/* IDENTITY — neighbourhood and distance only, never an address (product rule 2). */}
      <section className="flex flex-col items-center px-4 pb-8 pt-6 text-center">
        <div className="relative mb-4">
          <Avatar
            src={musician.avatarUrl}
            name={musician.name}
            size="xl"
            className="h-28 w-28 shadow-sm"
          />
          {musician.availableTonight && (
            <span
              className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-success text-white shadow-sm"
              title="Free tonight"
            >
              <Zap size={13} fill="currentColor" />
            </span>
          )}
        </div>
        <h2 className="mb-1 font-serif text-[28px] font-bold text-foreground">{musician.name}</h2>
        <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.1em] text-primary">
          {playerLabel(musician.instruments[0]).toUpperCase()} · {genreLane(musician.genres)}
        </p>
        <p className="mb-4 flex items-center gap-1 text-[13px] font-medium text-foreground-dim">
          <MapPin size={12} />
          {shortNeighborhood(musician.neighborhood)} · {musician.distanceMi} mi away
        </p>
        {(stats.topReliability || musician.verified) && (
          <div className="flex items-center gap-2">
            {stats.topReliability && (
              <span className="flex items-center gap-1.5 rounded-full bg-[color:var(--hero-from)] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.06em] text-primary">
                <Zap size={11} />
                Top reliability
              </span>
            )}
            {musician.verified && (
              <span className="flex items-center gap-1.5 rounded-full border border-success-border bg-success-soft px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.06em] text-success">
                <ShieldCheck size={11} />
                Verified
              </span>
            )}
          </div>
        )}
      </section>

      {/* STATS — computed from session recaps, not editable (product rule 3). */}
      <div className="mb-8 flex justify-between gap-3 px-4">
        <StatTile
          value={stats.isNew ? '—' : `${stats.reliabilityPct}%`}
          label={stats.isNew ? 'New here' : 'Reliability'}
        />
        <StatTile value={stats.repeatJams} label="Repeat jams" />
        <StatTile value={stats.vouchCount} label="Vouches" />
      </div>

      {/* SEASON RANKING — skipped entirely when this musician is unranked. */}
      {entry && (
        <section className="mb-8 px-4">
          <div className="relative overflow-hidden rounded-[16px] bg-gradient-to-br from-primary to-accent p-5 shadow-sm">
            <Trophy
              size={120}
              aria-hidden
              className="absolute -bottom-6 -right-6 text-white opacity-10"
            />
            <div className="relative z-10 mb-4 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/90">
                Battle of the Bands ranking
              </span>
              <span className="rounded-full bg-card px-2 py-0.5 text-[10px] font-bold text-primary">
                Season {season.number}
              </span>
            </div>
            <div className="relative z-10 mb-4 flex items-end gap-2">
              <span className="font-serif text-[42px] font-bold leading-none text-white">
                #{entry.rank}
              </span>
              <span className="pb-1.5 text-[14px] font-medium text-white/90">
                in {season.city} {season.scene}
              </span>
            </div>
            <div className="relative z-10 mb-4 h-px w-full bg-white/20" />
            <div className="relative z-10 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[13px] font-medium text-white">
                {entry.delta > 0 ? (
                  <>
                    <TrendingUp size={14} />+{entry.delta} spots this week
                  </>
                ) : entry.delta < 0 ? (
                  <>
                    <TrendingDown size={14} />
                    {entry.delta} spots this week
                  </>
                ) : (
                  'Holding steady this week'
                )}
              </span>
              <Link
                href="/leaderboard"
                className="text-[13px] font-semibold text-white underline decoration-white/50 underline-offset-2"
              >
                View leaderboard
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="mb-8 px-4">
        <SectionHeader>Past jams</SectionHeader>
        {recordedJams.length === 0 ? (
          <EmptyState
            icon={<Disc3 size={22} />}
            title="No recordings yet"
            body={`When ${firstName} plays a session and everyone agrees to publish the recording, it lands here.`}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {recordedJams.map((jam) => (
              <RecordingRow key={jam.id} jam={jam} />
            ))}
          </div>
        )}
      </section>

      <section className="mb-8 px-4">
        <SectionHeader>
          {stats.vouchCount > 0 ? `${stats.vouchCount} vouches` : 'Vouches'}
        </SectionHeader>
        {preview.length === 0 ? (
          <EmptyState
            icon={<Quote size={22} />}
            title="No vouches yet"
            body={`Vouches come from confirmed co-attendees after a session — play with ${firstName} and leave the first one.`}
          />
        ) : (
          <>
            <div className="flex flex-col gap-3">
              {preview.map((vouch) => {
                const from = getMusician(vouch.fromId)
                if (!from) return null
                return (
                  <Card key={vouch.id} className="p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar src={from.avatarUrl} name={from.name} size="lg" />
                        <div className="min-w-0">
                          <div className="truncate text-[15px] font-bold text-foreground">
                            {from.name}
                          </div>
                          <div className="text-[12px] text-foreground-dim">
                            {vouch.sessionsTogether === 1
                              ? '1 session together'
                              : `${vouch.sessionsTogether} sessions together`}
                          </div>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-[6px] border border-border-subtle bg-card px-2 py-1 text-[10px] font-bold uppercase text-foreground">
                        {playerLabel(from.instruments[0])}
                      </span>
                    </div>
                    {vouch.note && (
                      <p className="mb-3 text-[14px] italic leading-relaxed text-foreground">
                        &ldquo;{vouch.note}&rdquo;
                      </p>
                    )}
                    {vouch.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {vouch.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md bg-[color:var(--hero-from)] px-2.5 py-1 text-[11px] font-medium text-primary"
                          >
                            {vouchTagLabel(tag)}
                          </span>
                        ))}
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
            <Link
              href={`/musicians/${musicianId}/vouches`}
              className="mt-3 flex h-[48px] w-full items-center justify-center rounded-[12px] bg-surface-muted text-[15px] font-semibold text-foreground transition-transform active:scale-95"
            >
              See all collaborator feedback
            </Link>
          </>
        )}
      </section>

      <section className="mb-4 px-4">
        <SectionHeader>Availability</SectionHeader>
        <Card className="p-4">
          <AvailabilityGrid value={musician.availability.grid} readOnly />
          {musician.availability.note && (
            <p className="mt-4 text-center text-[13px] italic text-foreground-dim">
              {musician.availability.note}
            </p>
          )}
        </Card>
      </section>
    </AppShell>
  )
}
