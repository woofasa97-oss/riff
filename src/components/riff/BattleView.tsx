'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { SendHorizontal, Share2, Trophy, Users } from 'lucide-react'
import { AppShell } from '@/components/riff/AppShell'
import { TopBar } from '@/components/riff/TopBar'
import { Button, buttonClass } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { iconButtonClass } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { compactCount } from '@/lib/labels'
import { useRiffStore } from '@/lib/store'
import { ROUND_LABEL, getBand, getBattle, voteShare } from '@/mocks'
import type { Band, Battle } from '@/types'

/** Handle colours cycle through the chart tokens, keyed by handle so they stay stable. */
const HANDLE_TONES = ['text-accent', 'text-primary', 'text-[#facc15]', 'text-chart-3']
function toneFor(handle: string): string {
  let h = 0
  for (let i = 0; i < handle.length; i++) h = (h * 31 + handle.charCodeAt(i)) % 997
  return HANDLE_TONES[h % HANDLE_TONES.length]
}

function ChallengerCard({
  band,
  side,
  onVote,
  voted,
  disabled,
}: {
  band: Band
  side: 'A' | 'B'
  onVote: () => void
  voted: boolean
  disabled: boolean
}) {
  return (
    <div className="relative w-full overflow-hidden rounded-[20px] shadow-lg">
      <div className="absolute inset-0 z-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={band.coverUrl} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      </div>
      <div className="relative z-10 flex flex-col gap-1 p-5 pt-24">
        <span className="mb-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/70">
          Challenger {side}
        </span>
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={`/bands/${band.id}`}
              className="block truncate font-serif text-[24px] font-bold leading-tight text-white"
            >
              {band.name}
            </Link>
            <p className="mt-1 truncate text-[13px] italic text-white/60">
              {band.genre} · {band.city}
            </p>
          </div>
          <button
            type="button"
            onClick={onVote}
            disabled={disabled}
            className={cn(
              'shrink-0 rounded-full border border-white/10 px-5 py-2 text-[13px] font-semibold shadow-md transition-transform active:scale-95',
              voted ? 'bg-white text-foreground' : 'bg-primary text-white disabled:opacity-40',
            )}
          >
            {voted ? 'Voted' : `Vote ${side}`}
          </button>
        </div>
      </div>
    </div>
  )
}

/** One band as a compact, read-only row in a recap. Links to the band profile. */
function RecapBandCard({ band, pct, won }: { band: Band; pct: number; won: boolean }) {
  return (
    <Link
      href={`/bands/${band.id}`}
      className={cn(
        'flex items-center gap-3 rounded-[16px] border p-3 transition-transform active:scale-[0.99]',
        won ? 'border-[#facc15]/30 bg-[#facc15]/[0.06]' : 'border-white/10 bg-white/[0.04]',
      )}
    >
      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-[10px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={band.coverUrl} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate font-serif text-[15px] font-bold text-white">{band.name}</span>
          {won && <Trophy size={12} className="shrink-0 text-[#facc15]" />}
        </div>
        <p className="truncate text-[12px] italic text-white/50">
          {band.genre} · {band.city}
        </p>
      </div>
      <span
        className={cn('shrink-0 text-[13px] font-bold', won ? 'text-[#facc15]' : 'text-white/40')}
      >
        {pct}%
      </span>
    </Link>
  )
}

/**
 * Read-only recap for a battle that is not live (finished, scheduled, or anything else).
 * No voting, no chat, no "watching" count — just the result and both bands.
 */
function BattleRecap({
  battle,
  bandA,
  bandB,
  share,
}: {
  battle: Battle
  bandA: Band
  bandB: Band
  share: { a: number; b: number }
}) {
  const winner = battle.winnerBandId ? getBand(battle.winnerBandId) : undefined
  const winnerIsA = winner?.id === bandA.id
  const loser = winner ? (winnerIsA ? bandB : bandA) : undefined
  const winPct = winnerIsA ? share.a : share.b
  const losePct = winnerIsA ? share.b : share.a

  return (
    <AppShell
      activeTab="live"
      surface="dark"
      header={
        <TopBar
          surface="dark"
          actions={
            <span className={cn(iconButtonClass('dark'), 'pointer-events-none opacity-60')}>
              <Share2 size={14} />
            </span>
          }
        />
      }
      mainClassName="space-y-4 px-4 pb-6"
    >
      <div className="flex flex-col gap-1 px-1">
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
          {ROUND_LABEL[battle.round]} · Recap
        </span>
        <h1 className="font-serif text-[24px] font-bold leading-tight text-white">
          Battle of the Bands
        </h1>
        <p className="text-[13px] font-medium text-white/50">{battle.stageLabel}</p>
      </div>

      {/* WINNER BANNER — or the matchup, if this one has not been decided yet. */}
      {winner && loser ? (
        <div className="relative overflow-hidden rounded-[20px] border border-[#facc15]/30 bg-white/[0.06] p-6 text-center backdrop-blur-xl">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#facc15]/15">
            <Trophy size={24} className="text-[#facc15]" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#facc15]">
            Winner
          </span>
          <Link
            href={`/bands/${winner.id}`}
            className="mt-1 block font-serif text-[26px] font-bold leading-tight text-white"
          >
            {winner.name}
          </Link>
          <p className="mt-2 text-[14px] text-white/70">
            {winner.name} beat {loser.name}{' '}
            <span className="font-bold text-white">
              {winPct}/{losePct}
            </span>
          </p>
        </div>
      ) : (
        <div className="rounded-[20px] border border-white/10 bg-white/[0.06] p-6 text-center backdrop-blur-xl">
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
            {battle.status === 'scheduled' ? 'Upcoming' : 'Result pending'}
          </span>
          <p className="mt-2 text-[15px] font-medium text-white">
            <span className="font-serif font-bold">{bandA.name}</span> vs{' '}
            <span className="font-serif font-bold">{bandB.name}</span>
          </p>
        </div>
      )}

      {/* FINAL VOTE SPLIT — same bar as the live view, framed as final. */}
      <div className="flex flex-col gap-2 rounded-[16px] border border-white/10 bg-white/[0.04] px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-[15px] font-bold text-primary">{share.a}%</span>
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/40">
            Final result
          </span>
          <span className="text-[15px] font-bold text-accent">{share.b}%</span>
        </div>
        <div
          className="flex h-3 w-full overflow-hidden rounded-full"
          role="img"
          aria-label={`Final: ${bandA.name} ${share.a} percent, ${bandB.name} ${share.b} percent`}
        >
          <div className="h-full bg-primary" style={{ width: `${share.a}%` }} />
          <div className="h-full bg-accent" style={{ width: `${share.b}%` }} />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <RecapBandCard band={bandA} pct={share.a} won={winner?.id === bandA.id} />
        <RecapBandCard band={bandB} pct={share.b} won={winner?.id === bandB.id} />
      </div>

      <Link
        href="/battles/bracket"
        className="mx-auto mt-2 block text-center text-[13px] font-medium text-white/60 underline underline-offset-4"
      >
        Back to bracket
      </Link>
    </AppShell>
  )
}

export function BattleView({ battleId }: { battleId: string }) {
  const [draft, setDraft] = useState('')
  const votes = useRiffStore((s) => s.battleVotes)
  const vote = useRiffStore((s) => s.voteInBattle)
  const battleChat = useRiffStore((s) => s.battleChat)
  const sendBattleComment = useRiffStore((s) => s.sendBattleComment)

  const battle: Battle | undefined = getBattle(battleId)
  const bandA = battle ? getBand(battle.bandAId) : undefined
  const bandB = battle ? getBand(battle.bandBId) : undefined
  const share = useMemo(() => (battle ? voteShare(battle) : { a: 50, b: 50 }), [battle])

  if (!battle || !bandA || !bandB) {
    return (
      <AppShell activeTab="live" header={<TopBar />} mainClassName="flex items-center px-4 py-6">
        <EmptyState
          className="w-full"
          title="This battle is over"
          body="Nothing is running on this link any more."
          action={
            <Link
              href="/battles/bracket"
              className={buttonClass({ variant: 'secondary', size: 'sm' })}
            >
              See the bracket
            </Link>
          }
        />
      </AppShell>
    )
  }

  // Anything not live gets the read-only recap: no voting, no chat, no watching count.
  if (battle.status !== 'live') {
    return <BattleRecap battle={battle} bandA={bandA} bandB={bandB} share={share} />
  }

  const myVote = votes[battle.id]
  const closed = battle.status !== 'live'

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const body = draft.trim()
    if (!body || !battle) return
    sendBattleComment(battle.id, body)
    setDraft('')
  }

  return (
    <AppShell
      activeTab="live"
      liveIndicator
      surface="dark"
      header={
        <TopBar
          surface="dark"
          lead={
            battle.status === 'live' ? (
              <span className="rounded-[3px] bg-live px-1.5 py-0.5 text-[9px] font-bold uppercase leading-none tracking-wider text-white">
                Live
              </span>
            ) : undefined
          }
          actions={
            <>
              {battle.viewerCount !== undefined && (
                <span className="flex items-center gap-1.5 rounded-full border border-white/5 bg-white/[0.12] px-3 py-1.5 backdrop-blur-md">
                  <Users size={10} className="text-white/80" />
                  <span className="text-[12px] font-medium text-white/90">
                    {compactCount(battle.viewerCount)} watching
                  </span>
                </span>
              )}
              <span className={cn(iconButtonClass('dark'), 'pointer-events-none opacity-60')}>
                <Share2 size={14} />
              </span>
            </>
          }
        />
      }
      mainClassName="space-y-4 px-4 pb-6"
    >
      <div className="flex flex-col gap-1 px-1">
        <h1 className="font-serif text-[24px] font-bold leading-tight text-white">
          {battle.kind === 'casual'
            ? 'Battle of the Bands'
            : `Battle of the Bands: ${battle.round === 'final' ? 'Finals' : `${battle.round} finals`}`}
        </h1>
        <p className="text-[13px] font-medium text-white/50">{battle.stageLabel}</p>
        {/* Honesty note: watching and vote counts here are a preview sample, not a live tally. */}
        <p className="mt-0.5 text-[11px] text-white/40">
          Preview — watching and vote counts are illustrative.
        </p>
      </div>

      <ChallengerCard
        band={bandA}
        side="A"
        voted={myVote === 'A'}
        disabled={closed || Boolean(myVote)}
        onVote={() => vote(battle.id, 'A')}
      />

      {/* VOTE BAR */}
      <div className="flex flex-col gap-2 px-2 py-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[15px] font-bold text-primary">{share.a}%</span>
          <span className="text-[12px] font-bold italic text-white/40">VS</span>
          <span className="text-[15px] font-bold text-accent">{share.b}%</span>
        </div>
        <div
          className="flex h-3 w-full overflow-hidden rounded-full"
          role="img"
          aria-label={`${bandA.name} ${share.a} percent, ${bandB.name} ${share.b} percent`}
        >
          <div className="h-full bg-primary transition-all" style={{ width: `${share.a}%` }} />
          <div className="h-full bg-accent transition-all" style={{ width: `${share.b}%` }} />
        </div>
        {myVote && (
          <p className="text-center text-[12px] text-white/60">
            Your vote for {myVote === 'A' ? bandA.name : bandB.name} is in — one vote each in this
            preview tally.
          </p>
        )}
      </div>

      <ChallengerCard
        band={bandB}
        side="B"
        voted={myVote === 'B'}
        disabled={closed || Boolean(myVote)}
        onVote={() => vote(battle.id, 'B')}
      />

      {/* CHAT */}
      <div className="relative mt-2 min-h-[220px] w-full overflow-hidden rounded-[20px] shadow-lg">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#3a1f3f] to-[#141019]" />
        <div className="relative z-10 flex h-full flex-col justify-end gap-3 p-4 pt-12">
          <div className="flex flex-col gap-3">
            {(battleChat[battle.id] ?? []).map((line) => (
              <div
                key={line.id}
                className="max-w-[85%] self-start rounded-[14px] bg-black/40 px-3 py-2 backdrop-blur-md"
              >
                <span className={cn('mr-1 text-[11px] font-semibold', toneFor(line.handle))}>
                  {line.handle}
                </span>
                <span className="text-[13px] text-white/90">{line.body}</span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSend} className="mt-2 flex items-center gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Say something..."
              aria-label="Say something"
              className="h-[44px] flex-1 rounded-full border border-white/15 bg-black/50 px-4 text-[14px] text-white backdrop-blur-md placeholder:text-white/50 focus:outline-none focus:ring-1 focus:ring-white/40"
            />
            <button
              type="submit"
              disabled={draft.trim().length === 0}
              aria-label="Send"
              className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-white shadow-lg transition-transform active:scale-90 disabled:opacity-40"
            >
              <SendHorizontal size={15} />
            </button>
          </form>
        </div>
      </div>

      <Link
        href="/battles/bracket"
        className="mx-auto mt-2 text-[13px] font-medium text-white/60 underline underline-offset-4"
      >
        See the full bracket
      </Link>
    </AppShell>
  )
}
