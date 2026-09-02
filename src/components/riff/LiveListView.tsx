'use client'

import Link from 'next/link'
import { Coins, Eye, RadioTower, Swords, Trophy } from 'lucide-react'
import { AppShell } from '@/components/riff/AppShell'
import { TopBar } from '@/components/riff/TopBar'
import { buttonClass } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { prizePool, SEASON_STATUS_LABEL } from '@/lib/competition'
import { formatDurationMinutes, liveElapsedMinutes } from '@/lib/datetime'
import { compactCount, formatCredits } from '@/lib/labels'
import { useRiffStore } from '@/lib/store'
import { getBand, getVenue, listLiveBattles, listLiveSessions, voteShare } from '@/mocks'

/** A LIVE badge + viewer count overlaid on a thumbnail — the Twitch card corner treatment. */
function LiveCorners({ viewers }: { viewers?: number }) {
  return (
    <>
      <span className="absolute left-2 top-2 rounded-[3px] bg-live px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm">
        Live
      </span>
      {viewers !== undefined && (
        <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-[4px] bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
          <Eye size={9} /> {compactCount(viewers)}
        </span>
      )}
    </>
  )
}

/**
 * The Live browse screen: a Twitch-style gallery. A grid of live jam streams, then a grid of live
 * band battles (several at once — the season final plus casual head-to-heads), then the season.
 */
export function LiveListView() {
  const now = useRiffStore((s) => s.now)
  const season = useRiffStore((s) => s.season)
  const entries = useRiffStore((s) => s.competitionEntries)
  const sessions = listLiveSessions()
  const battles = listLiveBattles()

  const nothingLive = sessions.length === 0 && battles.length === 0

  return (
    <AppShell activeTab="live" liveIndicator={!nothingLive} header={<TopBar />} mainClassName="px-4 py-6">
      <h1 className="sr-only">Live now</h1>
      {nothingLive ? (
        <EmptyState
          icon={<RadioTower size={22} />}
          title="Nothing live right now"
          body="When a jam goes live, or a battle starts, it shows up here."
          action={
            <Link href="/jams" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
              Go to your jams
            </Link>
          }
        />
      ) : (
        <>
          {sessions.length > 0 && (
            <section className="mb-8">
              <SectionHeader>Live jams</SectionHeader>
              <p className="mb-3 text-[12px] text-foreground-dim">
                Preview — live viewer counts are illustrative.
              </p>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
                {sessions.map((session) => {
                  const band = getBand(session.bandId ?? '')
                  const venue = getVenue(session.venueId)
                  const elapsed = liveElapsedMinutes(now)
                  return (
                    <Link key={session.id} href={`/live/${session.id}`} className="group flex flex-col gap-2">
                      <div className="relative aspect-video overflow-hidden rounded-[12px] bg-surface-muted shadow-sm">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={session.posterUrl}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
                        <LiveCorners viewers={session.viewerCount} />
                      </div>
                      <div className="flex items-start gap-2">
                        {band && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={band.coverUrl}
                            alt=""
                            className="mt-0.5 h-8 w-8 shrink-0 rounded-[8px] object-cover"
                          />
                        )}
                        <div className="min-w-0">
                          <h3 className="truncate font-serif text-[14px] font-bold leading-tight text-foreground">
                            {band?.name ?? 'Live jam'}
                          </h3>
                          <p className="truncate text-[11px] text-foreground-dim">
                            {band ? `${band.genre} · ` : ''}
                            {venue?.name}
                          </p>
                          <p className="truncate text-[10px] text-foreground-dim">
                            {formatDurationMinutes(elapsed)} in
                          </p>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}

          {battles.length > 0 && (
            <section className="mb-8">
              <SectionHeader
                action={
                  <Link href="/battles/bracket" className="text-[13px] font-medium text-primary">
                    Bracket
                  </Link>
                }
              >
                Battle of the bands
              </SectionHeader>
              <p className="mb-3 text-[12px] text-foreground-dim">
                {battles.length} live now — vote on any of them. The season final is the one to watch.
              </p>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
                {battles.map((battle) => {
                  const bandA = getBand(battle.bandAId)
                  const bandB = getBand(battle.bandBId)
                  const share = voteShare(battle)
                  const isFinal = battle.kind !== 'casual'
                  return (
                    <Link key={battle.id} href={`/battles/${battle.id}`} className="group flex flex-col gap-2">
                      <div className="relative aspect-video overflow-hidden rounded-[12px] shadow-sm">
                        <div className="absolute inset-0 flex">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={bandA?.coverUrl} alt="" className="h-full w-1/2 object-cover" />
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={bandB?.coverUrl} alt="" className="h-full w-1/2 object-cover" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold italic text-white shadow">
                          VS
                        </span>
                        <LiveCorners viewers={battle.viewerCount} />
                        {isFinal && (
                          <span className="absolute right-2 top-2 rounded-[4px] bg-primary/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                            Final
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="flex items-center gap-1 truncate font-serif text-[13px] font-bold leading-tight text-foreground">
                          <Swords size={12} className="shrink-0 text-primary" />
                          <span className="truncate">
                            {bandA?.name} vs {bandB?.name}
                          </span>
                        </h3>
                        <div className="mt-1.5 flex h-2 w-full overflow-hidden rounded-full">
                          <div className="h-full bg-primary" style={{ width: `${share.a}%` }} />
                          <div className="h-full bg-accent" style={{ width: `${share.b}%` }} />
                        </div>
                        <div className="mt-0.5 flex items-center justify-between text-[10px]">
                          <span className="font-bold text-primary">{share.a}%</span>
                          <span className="truncate px-1 text-foreground-dim">{battle.stageLabel}</span>
                          <span className="font-bold text-accent">{share.b}%</span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}

          <section>
            <SectionHeader>This season</SectionHeader>
            {/* The season is the paid competition; the free battles above are the on-ramp. */}
            <Link
              href="/competition"
              className="mb-3 block overflow-hidden rounded-[16px] bg-gradient-to-br from-primary to-accent p-4 text-white shadow-lg transition-transform active:scale-95"
            >
              <div className="mb-2 flex items-center gap-1.5">
                <Coins size={13} />
                <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/80">
                  {SEASON_STATUS_LABEL[season.status]}
                </span>
              </div>
              <div className="font-serif text-[18px] font-bold leading-tight">
                Season {season.number} Competition
              </div>
              <div className="mt-0.5 text-[13px] font-medium text-white/85">
                {formatCredits(prizePool(season, entries))} prize pool
              </div>
            </Link>
            <p className="mb-3 text-[12px] text-foreground-dim">
              Casual battles are free to play — the season is the paid competition.
            </p>
            <div className="flex gap-3">
              <Link
                href="/battles/bracket"
                className="flex flex-1 items-center justify-center gap-2 rounded-[12px] border border-border-subtle bg-card px-3 py-3 text-[14px] font-medium text-foreground shadow-sm transition-transform active:scale-95"
              >
                <Swords size={15} className="text-primary" /> Bracket
              </Link>
              <Link
                href="/leaderboard"
                className="flex flex-1 items-center justify-center gap-2 rounded-[12px] border border-border-subtle bg-card px-3 py-3 text-[14px] font-medium text-foreground shadow-sm transition-transform active:scale-95"
              >
                <Trophy size={15} className="text-primary" /> Leaderboard
              </Link>
            </div>
          </section>
        </>
      )}
    </AppShell>
  )
}
