'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, ChevronDown, Crown, Info, MoreVertical, Trophy } from 'lucide-react'
import { AppShell } from '@/components/riff/AppShell'
import { SubScreenHeader } from '@/components/riff/TopBar'
import { Avatar } from '@/components/ui/Avatar'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { IconButton } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/cn'
import { useRiffStore } from '@/lib/store'
import { getCurrentSeason, getMusician } from '@/mocks'
import type { LeaderboardEntry } from '@/types'

function Row({
  entry,
  topPoints,
  highlighted = false,
}: {
  entry: LeaderboardEntry
  topPoints: number
  highlighted?: boolean
}) {
  const viewerId = useRiffStore((s) => s.viewerId)
  const musician = getMusician(entry.musicianId)
  if (!musician) return null
  const share = Math.round((entry.points / topPoints) * 100)

  const isMe = entry.musicianId === viewerId
  const href = isMe ? '/me' : `/musicians/${entry.musicianId}`
  const rowClass = cn(
    'relative flex items-center overflow-hidden rounded-[16px] border p-3 shadow-sm',
    highlighted
      ? 'border-l-4 border-border-subtle border-l-primary bg-[color:var(--hero-from)]'
      : 'border-border-subtle bg-card',
  )

  const inner = (
    <>
      <span
        className={cn(
          'w-6 shrink-0 text-center font-serif text-[15px]',
          highlighted ? 'font-bold text-primary' : 'text-foreground-dim',
        )}
      >
        {entry.rank}
      </span>
      <Avatar
        src={musician.avatarUrl}
        name={musician.name}
        size="lg"
        className="ml-2 h-[42px] w-[42px]"
      />
      <div className="ml-3 min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-serif text-[14px] font-bold text-foreground">
            {musician.name}
          </span>
          {highlighted && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary-foreground">
              You
            </span>
          )}
        </div>
        <div className="mt-0.5 truncate text-[12px] text-foreground-dim">
          {entry.instrumentLabel}
        </div>
      </div>
      <span
        className={cn(
          'ml-2 shrink-0 text-[14px] font-semibold',
          highlighted ? 'text-primary' : 'text-foreground',
        )}
      >
        {entry.points.toLocaleString('en-US')}
      </span>
      {/* Points as a share of first place — the ranking made legible at a glance. */}
      <span
        className="absolute bottom-0 left-0 h-[3px] rounded-r-full bg-primary"
        style={{ width: `${share}%` }}
      />
    </>
  )

  return (
    <Link href={href} className={rowClass}>
      {inner}
    </Link>
  )
}

/** The three-up podium. Same navigation rule as the rows. */
function PodiumPlace({
  entry,
  place,
  avatarClass,
  padClass,
}: {
  entry: LeaderboardEntry
  place: number
  avatarClass: string
  padClass: string
}) {
  const viewerId = useRiffStore((s) => s.viewerId)
  const musician = getMusician(entry.musicianId)
  if (!musician) return null
  const isFirst = place === 1
  const isMe = entry.musicianId === viewerId
  const href = isMe ? '/me' : `/musicians/${entry.musicianId}`
  const wrapperClass = cn('relative flex flex-1 flex-col items-center', padClass)

  const inner = (
    <>
      {isFirst && (
        <Crown
          size={18}
          className="absolute -top-5 text-[#facc15] drop-shadow"
          fill="currentColor"
        />
      )}
      <span
        className={cn(
          'mb-2 flex items-center justify-center rounded-full font-bold',
          isFirst
            ? 'h-6 w-6 bg-[#facc15] text-[12px] text-black shadow'
            : 'h-5 w-5 bg-white/20 text-[11px] text-white backdrop-blur-sm',
        )}
      >
        {place}
      </span>
      <Avatar
        src={musician.avatarUrl}
        name={musician.name}
        ring={false}
        size="xl"
        className={cn(
          'mb-2 object-cover shadow-md',
          avatarClass,
          isFirst ? 'border-[3px] border-[#facc15]' : 'border-2 border-white',
        )}
      />
      <span
        className={cn(
          'text-center font-serif leading-tight text-white',
          isFirst ? 'text-[15px] font-bold' : 'text-[13px] font-medium',
        )}
      >
        {musician.name}
      </span>
      <span
        className={cn('mt-0.5 text-[11px]', isFirst ? 'font-bold text-white' : 'text-white/90')}
      >
        {entry.points.toLocaleString('en-US')} pts
      </span>
    </>
  )

  return (
    <Link href={href} className={wrapperClass}>
      {inner}
    </Link>
  )
}

export function LeaderboardView() {
  const [showPoints, setShowPoints] = useState(false)
  // Which scope picker is open. Only one option each in v1, but the chip's chevron promises a
  // picker, so tapping opens a real one instead of lying about being interactive.
  const [scope, setScope] = useState<'city' | 'scene' | null>(null)
  const season = getCurrentSeason()
  const viewerId = useRiffStore((s) => s.viewerId)
  // Standings computed server-side from recorded jams, recaps, vouches and battle votes.
  const rows = useRiffStore((s) => s.leaderboard)
  const me = rows.find((e) => e.musicianId === viewerId)
  // Points separating the viewer from 10th place, from the same computed list. Undefined when
  // the viewer is inside the top 10 (or the board is too short to have a 10th place yet).
  const tenth = rows.find((e) => e.rank === 10)
  const gap = me && tenth && me.rank > 10 ? tenth.points - me.points : undefined
  const podium = rows.slice(0, 3)
  const rest = rows.slice(3).filter((e) => e.musicianId !== viewerId)
  const topPoints = rows[0]?.points ?? 1

  // Podium order is 2 · 1 · 3 so first place stands in the middle.
  const [second, first, third] = [podium[1], podium[0], podium[2]]

  return (
    <AppShell
      activeTab="me"
      header={
        <SubScreenHeader
          title="Leaderboard"
          backHref="/me"
          bordered={false}
          action={
            <IconButton label="How points work" onClick={() => setShowPoints((v) => !v)}>
              <Info size={15} />
            </IconButton>
          }
        />
      }
      mainClassName="pb-4"
      footer={
        me && (
          <div className="z-20 shrink-0">
            <div className="px-4 pb-3">
              <Row entry={me} topPoints={topPoints} highlighted />
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-border-subtle bg-card/95 px-5 py-3.5 backdrop-blur-md">
              <span className="text-[13px] font-medium text-foreground">
                {gap === undefined
                  ? `You are inside the top 10 of ${season.city} ${season.scene}`
                  : `You are ${gap} points from the top 10`}
              </span>
              <button
                type="button"
                onClick={() => setShowPoints((v) => !v)}
                className="shrink-0 text-[13px] font-semibold text-primary underline underline-offset-2"
              >
                How points work
              </button>
            </div>
          </div>
        )
      }
    >
      {/* Scope pills. City and scene open a picker; the season stays fixed in v1. */}
      <div className="no-scrollbar flex shrink-0 gap-2 overflow-x-auto px-4 py-3">
        <button
          type="button"
          aria-haspopup="dialog"
          aria-label={`City: ${season.city}. Change scope`}
          onClick={() => setScope('city')}
          className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-border-subtle bg-card px-4 py-1.5 text-[13px] font-medium text-foreground shadow-sm transition-transform active:scale-95"
        >
          {season.city} <ChevronDown size={10} className="text-foreground-dim" />
        </button>
        <button
          type="button"
          aria-haspopup="dialog"
          aria-label={`Scene: ${season.scene}. Change scope`}
          onClick={() => setScope('scene')}
          className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-border-subtle bg-card px-4 py-1.5 text-[13px] font-medium text-foreground shadow-sm transition-transform active:scale-95"
        >
          {season.scene} <ChevronDown size={10} className="text-foreground-dim" />
        </button>
        <span className="shrink-0 whitespace-nowrap rounded-full bg-foreground px-4 py-1.5 text-[13px] font-medium text-white shadow-sm">
          Season {season.number}
        </span>
      </div>

      {showPoints && (
        <div className="px-4 pb-4">
          <Card className="p-4">
            <h2 className="mb-2 font-serif text-[15px] font-bold text-foreground">
              How points work
            </h2>
            <ul className="space-y-1.5 text-[13px] text-foreground-dim">
              <li>Showing up to a confirmed jam, every time.</li>
              <li>Vouches from people you actually played with.</li>
              <li>Battle results across the season.</li>
            </ul>
            <p className="mt-3 text-[12px] text-foreground-dim">
              Nothing here can be bought or edited.
            </p>
            <Button
              size="sm"
              variant="secondary"
              className="mt-4 w-full"
              onClick={() => setShowPoints(false)}
            >
              Got it
            </Button>
          </Card>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="px-4">
          <EmptyState
            icon={<Trophy size={20} />}
            title="No points earned yet this season"
            body="Points come from real sessions — show up to a confirmed jam to get on the board."
          />
        </div>
      ) : (
        <>
          {/* PODIUM — renders whatever top places exist, even a field of one or two. */}
          <div className="mb-4 px-4">
            <div className="relative flex h-[220px] items-end justify-center gap-3 overflow-hidden rounded-[16px] border border-border-subtle bg-gradient-to-br from-primary to-accent px-4 pb-6 shadow-sm">
              {[
                { entry: second, place: 2, avatarClass: 'h-[52px] w-[52px]', padClass: 'pb-2' },
                { entry: first, place: 1, avatarClass: 'h-[64px] w-[64px]', padClass: 'pb-6' },
                { entry: third, place: 3, avatarClass: 'h-[48px] w-[48px]', padClass: 'pb-0' },
              ].map(({ entry, place, avatarClass, padClass }) =>
                entry ? (
                  <PodiumPlace
                    key={entry.musicianId}
                    entry={entry}
                    place={place}
                    avatarClass={avatarClass}
                    padClass={padClass}
                  />
                ) : null,
              )}
            </div>
          </div>

          {/* RANKED LIST */}
          <div className="flex flex-col gap-2 px-4">
            {rest.map((entry) => (
              <Row key={entry.musicianId} entry={entry} topPoints={topPoints} />
            ))}
            {me && (
              <div className="flex justify-center py-2 text-border">
                <MoreVertical size={14} />
              </div>
            )}
          </div>
        </>
      )}

      {/*
        Scope picker. The season carries one city and one scene, so the sheet shows that single
        option selected rather than inventing others — the chevron now leads somewhere honest.
      */}
      <BottomSheet
        open={scope !== null}
        onClose={() => setScope(null)}
        title={scope === 'city' ? 'Choose city' : 'Choose scene'}
      >
        {scope && (
          <>
            <h2 className="mb-3 pr-8 font-serif text-[17px] font-bold text-foreground">
              {scope === 'city' ? 'City' : 'Scene'}
            </h2>
            <button
              type="button"
              onClick={() => setScope(null)}
              aria-current="true"
              className="flex w-full items-center justify-between rounded-[12px] border border-primary bg-primary/5 px-4 py-3 text-left transition-transform active:scale-[0.99]"
            >
              <span className="text-[14px] font-medium text-foreground">
                {scope === 'city' ? season.city : season.scene}
              </span>
              <Check size={16} className="shrink-0 text-primary" />
            </button>
            <p className="mt-3 text-[12px] text-foreground-dim">
              More {scope === 'city' ? 'cities' : 'scenes'} are coming.
            </p>
          </>
        )}
      </BottomSheet>
    </AppShell>
  )
}
