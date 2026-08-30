'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Check, Play, Share2, Trophy } from 'lucide-react'
import { AppShell } from '@/components/riff/AppShell'
import { SubScreenHeader } from '@/components/riff/TopBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { iconButtonClass } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { isEntered, prizePool, projectedPayouts } from '@/lib/competition'
import { formatCredits } from '@/lib/labels'
import { useRiffStore } from '@/lib/store'
import {
  ROUND_LABEL,
  ROUND_ORDER,
  getBand,
  getCurrentSeason,
  listBandsFor,
  listBattles,
  seasonBadgeFor,
  voteShare,
  type BattleScope,
} from '@/mocks'
import type { Battle } from '@/types'

const GLASS = 'border border-white/10 bg-white/[0.08] backdrop-blur-xl'

function Side({
  bandId,
  pct,
  won,
  bordered,
  emphasis = false,
  tone,
}: {
  bandId: string
  pct: number
  won: boolean
  bordered: boolean
  emphasis?: boolean
  tone?: string
}) {
  const band = getBand(bandId)
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-2 p-2.5',
        bordered && 'border-b border-white/5',
        won && !emphasis && 'bg-primary/10',
      )}
    >
      <span
        className={cn(
          'min-w-0 truncate font-serif font-bold',
          emphasis
            ? 'text-[15px] text-white'
            : won
              ? 'text-[13px] text-white'
              : 'text-[13px] text-white/60',
        )}
      >
        {band?.name ?? 'TBD'}
      </span>
      <span className="flex shrink-0 items-center gap-1.5">
        <span
          className={cn(
            'text-[11px] font-medium',
            emphasis ? `text-[13px] font-bold ${tone}` : won ? 'text-white/70' : 'text-white/40',
          )}
        >
          {pct}%
        </span>
        {won && !emphasis && <Check size={10} className="text-[#facc15]" strokeWidth={3} />}
      </span>
    </div>
  )
}

function MatchCard({ battle, connectors }: { battle: Battle; connectors: boolean }) {
  const share = voteShare(battle)
  const live = battle.status === 'live'

  return (
    // The connectors live on this wrapper, not on the card — the card clips its own overflow.
    <div className="relative">
      {connectors && (
        <>
          <span className="absolute -left-6 top-1/2 h-px w-6 bg-white/20" aria-hidden />
          <span className="absolute -right-6 top-1/2 h-px w-6 bg-white/20" aria-hidden />
        </>
      )}
      <div
        className={cn(
          'relative overflow-hidden',
          live
            ? 'rounded-[16px] border border-primary/40 bg-surface-dark/80 shadow-[0_0_15px_rgba(138,121,171,0.2)] backdrop-blur-xl'
            : `rounded-[12px] ${GLASS}`,
        )}
      >
        {live && (
          <div className="flex items-center justify-between border-b border-white/5 bg-white/5 p-3">
            <span className="rounded-[3px] bg-live px-1.5 py-0.5 text-[9px] font-bold uppercase leading-none tracking-wider text-white">
              Live
            </span>
            <Link
              href={`/battles/${battle.id}`}
              className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/20 px-3 py-1 text-[11px] font-bold text-primary"
            >
              <Play size={9} fill="currentColor" /> Watch now
            </Link>
          </div>
        )}

        <Side
          bandId={battle.bandAId}
          pct={share.a}
          won={battle.winnerBandId === battle.bandAId}
          bordered
          emphasis={live}
          tone="text-primary"
        />
        <Side
          bandId={battle.bandBId}
          pct={share.b}
          won={battle.winnerBandId === battle.bandBId}
          bordered={false}
          emphasis={live}
          tone="text-accent"
        />
      </div>
    </div>
  )
}

const SCOPES: { id: BattleScope; label: string }[] = [
  { id: 'local', label: 'Brooklyn' },
  { id: 'global', label: 'Global' },
  { id: 'mine', label: 'My matches' },
]

export function BracketView() {
  const [scope, setScope] = useState<BattleScope>('local')
  const season = getCurrentSeason()
  const viewerId = useRiffStore((s) => s.viewerId)
  const entries = useRiffStore((s) => s.competitionEntries)
  const myBand = listBandsFor(viewerId)[0]
  const voted = useRiffStore((s) => s.battleVotes)

  const pool = prizePool(season, entries)
  // viewerId is '' for a guest, so this is safely false — no entry has an empty id.
  const entered = isEntered(entries, viewerId)

  const rounds = useMemo(() => {
    const visible = listBattles(scope, viewerId)
    return ROUND_ORDER.map((round) => ({
      round,
      battles: visible.filter((b) => b.round === round),
    })).filter((column) => column.battles.length > 0)
  }, [scope, viewerId])

  const champion = useMemo(() => {
    const final = listBattles('global').find((b) => b.round === 'final')
    return final?.status === 'finished' && final.winnerBandId
      ? getBand(final.winnerBandId)
      : undefined
  }, [])

  // The final lives in the last, off-screen bracket column, so surface it up top where it
  // can't be scrolled past. Always reads the global draw — the final is the same in any scope.
  const finalMatch = useMemo(() => {
    const final = listBattles('global').find((b) => b.round === 'final')
    if (!final) return undefined
    return {
      id: final.id,
      live: final.status === 'live',
      a: getBand(final.bandAId)?.name ?? 'TBD',
      b: getBand(final.bandBId)?.name ?? 'TBD',
      share: voteShare(final),
    }
  }, [])

  // YOUR RUN reads from the bracket, so it can never contradict it.
  const myRun = useMemo(() => {
    if (!myBand) return undefined
    const played = listBattles('global').filter(
      (b) => b.bandAId === myBand.id || b.bandBId === myBand.id,
    )
    const finished = played.filter((b) => b.status === 'finished')
    const last = finished[finished.length - 1]
    if (!last) return { badge: seasonBadgeFor(myBand.id), line: undefined }
    const isA = last.bandAId === myBand.id
    const share = voteShare(last)
    const opponent = getBand(isA ? last.bandBId : last.bandAId)
    return {
      badge: seasonBadgeFor(myBand.id),
      line: {
        verb: last.winnerBandId === myBand.id ? 'beat' : 'lost to',
        opponent: opponent?.name ?? 'Unknown',
        scoreFor: isA ? share.a : share.b,
        scoreAgainst: isA ? share.b : share.a,
      },
    }
  }, [myBand])

  return (
    <AppShell
      activeTab="live"
      liveIndicator
      surface="dark"
      header={
        <SubScreenHeader
          surface="dark"
          bordered={false}
          title={`Season ${season.number} bracket`}
          backHref="/live"
          action={
            <span className={cn(iconButtonClass('dark'), 'pointer-events-none opacity-60')}>
              <Share2 size={14} />
            </span>
          }
        />
      }
      mainClassName="flex flex-col"
    >
      {/* Frames the bracket as the paid season, not a free-for-all. */}
      <div className="shrink-0 px-4 pb-4 pt-1">
        <div
          className={cn(
            'flex items-center justify-between gap-3 rounded-[12px] px-4 py-2.5',
            GLASS,
          )}
        >
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-primary">
              Prize pool
            </div>
            <div className="font-serif text-[15px] font-bold text-white">{formatCredits(pool)}</div>
          </div>
          <Link href="/competition" className="shrink-0 text-[12px] font-semibold text-primary">
            View competition
          </Link>
        </div>
      </div>

      <div className="no-scrollbar flex shrink-0 gap-2 overflow-x-auto px-4 pb-4">
        {SCOPES.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={scope === s.id}
            onClick={() => setScope(s.id)}
            className={cn(
              'shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-[13px] font-medium transition-transform active:scale-95',
              scope === s.id
                ? 'border border-transparent bg-primary text-white shadow-sm'
                : 'border border-white/20 bg-transparent text-white',
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* The final is the last, off-screen column — pin it above the scroll so it's never missed. */}
      {finalMatch && (
        <div className="shrink-0 px-4 pb-4">
          <div
            className={cn(
              'relative overflow-hidden rounded-[16px] p-4',
              finalMatch.live
                ? 'border border-primary/40 bg-surface-dark/80 shadow-[0_0_15px_rgba(138,121,171,0.2)] backdrop-blur-xl'
                : GLASS,
            )}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-primary">
                Final
              </span>
              {finalMatch.live && (
                <span className="rounded-[3px] bg-live px-1.5 py-0.5 text-[9px] font-bold uppercase leading-none tracking-wider text-white">
                  Live
                </span>
              )}
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="truncate font-serif text-[15px] font-bold text-white">
                  {finalMatch.a}
                </div>
                <div className="text-[12px] font-bold text-primary">{finalMatch.share.a}%</div>
              </div>
              <span className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-white/40">
                vs
              </span>
              <div className="min-w-0 flex-1 text-right">
                <div className="truncate font-serif text-[15px] font-bold text-white">
                  {finalMatch.b}
                </div>
                <div className="text-[12px] font-bold text-accent">{finalMatch.share.b}%</div>
              </div>
            </div>
            <Link
              href={`/battles/${finalMatch.id}`}
              className="mt-3 flex items-center justify-center gap-1.5 rounded-full border border-primary/30 bg-primary/20 px-3 py-2 text-[12px] font-bold text-primary"
            >
              <Play size={11} fill="currentColor" /> Watch now
            </Link>
          </div>
        </div>
      )}

      {rounds.length === 0 ? (
        <div className="px-4 py-6">
          <EmptyState
            className="w-full border-white/15 bg-white/[0.04] text-white"
            title="No matches in this scope"
            body="Try Global to see the whole draw."
          />
        </div>
      ) : (
        <div className="no-scrollbar flex flex-1 items-start gap-12 overflow-x-auto px-4 pb-6">
          {rounds.map((column) => (
            <div
              key={column.round}
              className="relative flex w-[190px] shrink-0 flex-col gap-6 pt-8"
            >
              <span className="absolute left-0 top-0 text-[10px] font-bold uppercase tracking-[0.1em] text-primary">
                {ROUND_LABEL[column.round]}
              </span>
              {column.battles.map((battle) => (
                <MatchCard key={battle.id} battle={battle} connectors={rounds.length > 1} />
              ))}
            </div>
          ))}

          <div className="relative flex w-[150px] shrink-0 flex-col gap-6 pt-8">
            <span className="absolute left-0 top-0 text-[10px] font-bold uppercase tracking-[0.1em] text-primary">
              Champion
            </span>
            {champion ? (
              <div className={cn('rounded-[12px] p-3 text-center', GLASS)}>
                <Trophy size={18} className="mx-auto mb-2 text-[#facc15]" />
                <span className="font-serif text-[14px] font-bold text-white">{champion.name}</span>
              </div>
            ) : (
              <div className="relative flex h-[60px] items-center justify-center rounded-[12px] border border-dashed border-white/20">
                <span className="absolute -left-6 top-1/2 h-px w-6 bg-white/20" aria-hidden />
                <Trophy size={20} className="text-white/20" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* YOUR RUN */}
      {myBand && myRun && (
        <div className="shrink-0 px-4 pb-4">
          <h2 className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-primary">
            Your run
          </h2>
          <Link
            href={`/bands/${myBand.id}`}
            className={cn('flex flex-col gap-1 rounded-[16px] p-4', GLASS)}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="truncate font-serif text-[15px] font-bold text-white">
                {myBand.name}
              </span>
              <span className="shrink-0 text-[12px] font-medium text-white/60">
                {myRun.badge?.replace(`Season ${season.number} · `, '') ?? 'Not entered'}
              </span>
            </div>
            {entered && (
              <p className="mt-1 text-[12px] font-medium text-primary">
                You&apos;re entered — {formatCredits(projectedPayouts(season, entries)[0])} to the
                winner
              </p>
            )}
            {myRun.line && (
              <p className="mt-1 text-[13px] text-white/70">
                {myRun.line.verb}{' '}
                <span className="font-serif text-white">{myRun.line.opponent}</span>{' '}
                {myRun.line.scoreFor} / {myRun.line.scoreAgainst}
              </p>
            )}
            {Object.keys(voted).length > 0 && (
              <p className="mt-1 text-[12px] text-white/50">
                You have voted in {Object.keys(voted).length} match
                {Object.keys(voted).length === 1 ? '' : 'es'} this season.
              </p>
            )}
          </Link>
        </div>
      )}
    </AppShell>
  )
}
