'use client'

import Link from 'next/link'
import { Eye, RadioTower, Swords, Trophy } from 'lucide-react'
import { AppShell } from '@/components/riff/AppShell'
import { TopBar } from '@/components/riff/TopBar'
import { Button, buttonClass } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { formatDurationMinutes, minutesSince } from '@/lib/datetime'
import { compactCount } from '@/lib/labels'
import { useRiffStore } from '@/lib/store'
import { getBand, getLiveBattle, getVenue, listLiveSessions, voteShare } from '@/mocks'

/** What is broadcasting now: jam sessions first, then the season's live battle. */
export function LiveListView() {
  const now = useRiffStore((s) => s.now)
  const sessions = listLiveSessions()
  const battle = getLiveBattle()
  const bandA = battle ? getBand(battle.bandAId) : undefined
  const bandB = battle ? getBand(battle.bandBId) : undefined
  const share = battle ? voteShare(battle) : undefined

  const nothingLive = sessions.length === 0 && !battle

  return (
    <AppShell
      activeTab="live"
      liveIndicator={!nothingLive}
      header={<TopBar />}
      mainClassName="px-4 py-6"
    >
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
            <section className="mb-6">
              <SectionHeader>On now</SectionHeader>
              {sessions.map((session) => {
                const band = getBand(session.bandId ?? '')
                const venue = getVenue(session.venueId)
                const elapsed = minutesSince(session.startedAt, now)
                return (
                  <Link
                    key={session.id}
                    href={`/live/${session.id}`}
                    className="relative mb-3 block overflow-hidden rounded-[16px] shadow-lg"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={session.posterUrl} alt="" className="h-[180px] w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40" />
                    <span className="absolute left-4 top-4 rounded-[3px] bg-live px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                      Live
                    </span>
                    <span className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-md">
                      <Eye size={10} /> {compactCount(session.viewerCount)}
                    </span>
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="font-serif text-[18px] font-bold text-white">
                        {band?.name ?? 'Live session'}
                      </h3>
                      <p className="text-[12px] text-white/70">
                        {venue?.name} · started {formatDurationMinutes(elapsed)} ago
                      </p>
                    </div>
                  </Link>
                )
              })}
            </section>
          )}

          {battle && bandA && bandB && share && (
            <section className="mb-6">
              <SectionHeader
                action={
                  <Link href="/battles/bracket" className="text-[13px] font-medium text-primary">
                    Bracket
                  </Link>
                }
              >
                Battle of the bands
              </SectionHeader>
              <Link
                href={`/battles/${battle.id}`}
                className="block overflow-hidden rounded-[16px] border border-border-subtle bg-card p-4 shadow-sm"
              >
                <div className="mb-3 flex items-center gap-2">
                  <Swords size={14} className="text-primary" />
                  <span className="text-[13px] font-medium text-foreground">
                    {bandA.name} vs {bandB.name}
                  </span>
                </div>
                <div className="mb-2 flex h-3 w-full overflow-hidden rounded-full">
                  <div className="h-full bg-primary" style={{ width: `${share.a}%` }} />
                  <div className="h-full bg-accent" style={{ width: `${share.b}%` }} />
                </div>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="font-bold text-primary">{share.a}%</span>
                  <span className="text-foreground-dim">{battle.stageLabel}</span>
                  <span className="font-bold text-accent">{share.b}%</span>
                </div>
              </Link>
            </section>
          )}

          <section>
            <SectionHeader>This season</SectionHeader>
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
