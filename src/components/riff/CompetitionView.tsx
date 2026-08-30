'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Clock, Coins, Lock, PartyPopper, Trophy, Users, Wallet } from 'lucide-react'
import { AppShell } from '@/components/riff/AppShell'
import { SubScreenHeader } from '@/components/riff/TopBar'
import { Avatar } from '@/components/ui/Avatar'
import { Button, buttonClass } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { cn } from '@/lib/cn'
import { formatShortDateTime } from '@/lib/datetime'
import { formatCredits } from '@/lib/labels'
import { getMusician } from '@/mocks'
import {
  SEASON_STATUS_LABEL,
  isEntered,
  isSeedCompetitor,
  prizePool,
  projectedPayouts,
} from '@/lib/competition'
import { AccountRequiredError, useCurrentUser, useIsGuest, useRiffStore } from '@/lib/store'
import type { CompetitionEntry, Season } from '@/types'

/** 1 → "1st", 2 → "2nd", 3 → "3rd", 11 → "11th". */
function ordinal(n: number): string {
  const tens = n % 100
  const ones = n % 10
  const suffix =
    tens >= 11 && tens <= 13
      ? 'th'
      : ones === 1
        ? 'st'
        : ones === 2
          ? 'nd'
          : ones === 3
            ? 'rd'
            : 'th'
  return `${n}${suffix}`
}

export function CompetitionView() {
  const season = useRiffStore((s) => s.season)
  const entries = useRiffStore((s) => s.competitionEntries)
  const wallet = useRiffStore((s) => s.wallet)
  const enterCompetition = useRiffStore((s) => s.enterCompetition)
  const requireAccount = useRiffStore((s) => s.requireAccount)
  const currentUser = useCurrentUser()
  const isGuest = useIsGuest()

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pool = prizePool(season, entries)
  const payouts = projectedPayouts(season, entries)
  const fee = season.entryFeeCredits
  const regOpen = season.status === 'registration'
  const finished = season.status === 'finished'
  const myEntry = currentUser ? entries.find((e) => e.competitorId === currentUser.id) : undefined
  const entered = currentUser ? isEntered(entries, currentUser.id) : false

  async function handleEnter() {
    // A guest never reaches here (they get the sign-up card), but honour the gate defensively.
    if (!requireAccount('enter the competition')) return
    setError(null)
    setBusy(true)
    try {
      await enterCompetition()
    } catch (e) {
      if (e instanceof AccountRequiredError) return
      setError(e instanceof Error ? e.message : 'Could not enter — try again')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppShell
      activeTab="live"
      header={
        <SubScreenHeader title={`Season ${season.number} · ${season.scene}`} backHref="/live" />
      }
      mainClassName="pb-2"
    >
      <div className="space-y-6 px-4 pb-10 pt-4">
        {/* 1 · HERO — the pool is the headline; the fee and deadline frame the ask. */}
        <div className="relative overflow-hidden rounded-[16px] bg-gradient-to-br from-primary to-accent p-5 text-white shadow-sm">
          <Trophy
            size={120}
            strokeWidth={1}
            className="pointer-events-none absolute -right-5 -top-6 text-white/10"
          />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[12px] font-medium backdrop-blur-sm">
              {finished ? (
                <Trophy size={12} />
              ) : regOpen ? (
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
              )}
              {SEASON_STATUS_LABEL[season.status]}
            </span>
            <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.1em] text-white/75">
              Prize pool
            </p>
            <p className="font-serif text-[40px] font-bold leading-none">{formatCredits(pool)}</p>
            <p className="mt-1 text-[12px] text-white/70">{season.city} · grows with every entry</p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-[12px] bg-white/10 px-3 py-2.5 backdrop-blur-sm">
                <p className="text-[10px] font-medium uppercase tracking-[0.06em] text-white/70">
                  Entry fee
                </p>
                <p className="mt-0.5 font-serif text-[16px] font-bold">{formatCredits(fee)}</p>
              </div>
              <div className="rounded-[12px] bg-white/10 px-3 py-2.5 backdrop-blur-sm">
                <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.06em] text-white/70">
                  <Clock size={10} />
                  {regOpen ? 'Reg. closes' : 'Registration'}
                </p>
                <p className="mt-0.5 text-[12px] font-semibold leading-tight">
                  {regOpen ? formatShortDateTime(season.registrationClosesAt) : 'Closed'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 2 · HOW THE PRIZE WORKS */}
        <section>
          <SectionHeader>How the prize works</SectionHeader>
          <Card className="p-4">
            <ol className="space-y-2.5">
              {[
                'Pay the entry fee to enter the season.',
                'The pool is the base pool plus every entry.',
                'The top places split it at season end.',
              ].map((line, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[color:var(--hero-from)] text-[11px] font-bold text-primary">
                    {i + 1}
                  </span>
                  <span className="text-[13px] leading-snug text-foreground">{line}</span>
                </li>
              ))}
            </ol>

            {payouts.length > 0 && (
              <>
                <p className="mb-2 mt-4 text-[10px] font-bold uppercase tracking-[0.08em] text-foreground-dim">
                  Projected split
                </p>
                <div className="flex gap-2">
                  {payouts.map((amount, i) => (
                    <div
                      key={i}
                      className="flex flex-1 flex-col items-center rounded-[12px] border border-border-subtle bg-background px-2 py-2.5"
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wide text-foreground-dim">
                        {ordinal(i + 1)}
                      </span>
                      <span className="mt-0.5 font-serif text-[15px] font-bold text-foreground">
                        {formatCredits(amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <p className="mt-4 flex items-center gap-1.5 text-[11px] text-foreground-dim">
              <Coins size={12} />
              Riff Credits — play money while we&rsquo;re in preview.
            </p>
          </Card>
        </section>

        {/* 3 · YOUR ENTRY — the branch depends on guest / entered / registration status. */}
        <section>
          <SectionHeader>Your entry</SectionHeader>

          {isGuest ? (
            <Card className="p-5 text-center">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[color:var(--hero-from)] text-primary">
                <Trophy size={20} />
              </div>
              <h3 className="font-serif text-[16px] font-bold text-foreground">
                Sign up to enter this season
              </h3>
              <p className="mx-auto mt-1.5 max-w-[260px] text-[13px] text-foreground-dim">
                New accounts get a starting credit grant — enough to enter once. Play the{' '}
                {season.scene}.
              </p>
              <Link href="/signup" className={cn(buttonClass({ fullWidth: true }), 'mt-4')}>
                Create an account
              </Link>
            </Card>
          ) : myEntry ? (
            <Card className="border-success-border bg-success-soft p-4">
              <div className="flex items-center gap-2">
                <PartyPopper size={18} className="text-success" />
                <h3 className="font-serif text-[16px] font-bold text-foreground">
                  {finished && myEntry.finalRank
                    ? `You finished ${ordinal(myEntry.finalRank)}`
                    : "You're in — good luck"}
                </h3>
              </div>
              <p className="mt-1.5 text-[13px] text-foreground">
                {finished
                  ? myEntry.payoutCredits
                    ? `You won ${formatCredits(myEntry.payoutCredits)}, paid to your wallet.`
                    : 'The season has settled. Thanks for playing this one.'
                  : `You're 1 of ${entries.length} ${entries.length === 1 ? 'act' : 'acts'} competing for the ${formatCredits(pool)} pool. Top prize projects at ${formatCredits(payouts[0] ?? 0)}.`}
              </p>
              {!finished && (
                <p className="mt-2 text-[11px] text-foreground-dim">
                  Paid {formatCredits(myEntry.feePaidCredits)} on entry
                  {wallet ? ` · ${formatCredits(wallet.balanceCredits)} left in wallet` : ''}.
                </p>
              )}
            </Card>
          ) : regOpen ? (
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[13px] text-foreground-dim">
                  <Wallet size={15} />
                  Your balance
                </span>
                <span className="font-serif text-[18px] font-bold text-foreground">
                  {wallet ? formatCredits(wallet.balanceCredits) : formatCredits(0)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-border-subtle pt-2 text-[13px]">
                <span className="text-foreground-dim">Entry fee</span>
                <span className="font-medium text-foreground">{formatCredits(fee)}</span>
              </div>

              {wallet && wallet.balanceCredits >= fee ? (
                <>
                  <Button fullWidth className="mt-4" onClick={handleEnter} disabled={busy}>
                    {busy ? 'Entering…' : `Enter — ${formatCredits(fee)}`}
                  </Button>
                  {error && (
                    <p className="mt-2 text-center text-[12px] text-destructive">{error}</p>
                  )}
                </>
              ) : (
                <>
                  <Button fullWidth className="mt-4" disabled>
                    Not enough credits
                  </Button>
                  <p className="mt-2 text-center text-[11px] text-foreground-dim">
                    Riff Credits are granted when you sign up — enough to enter once.
                  </p>
                </>
              )}
            </Card>
          ) : (
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Lock size={16} className="text-foreground-dim" />
                <h3 className="font-serif text-[15px] font-bold text-foreground">
                  {finished ? 'The season has finished' : 'Registration is closed'}
                </h3>
              </div>
              <p className="mt-1.5 text-[13px] text-foreground-dim">
                {finished
                  ? 'Entries are settled and the pool has been paid out. A new season opens soon.'
                  : "Entries are locked for this season. You'll be able to enter the next one."}
              </p>
            </Card>
          )}
        </section>

        {/* 4 · ENTRANTS */}
        <section>
          <SectionHeader>Entrants{entries.length > 0 ? ` · ${entries.length}` : ''}</SectionHeader>
          {entries.length === 0 ? (
            <EmptyState
              icon={<Users size={20} />}
              title="No entrants yet"
              body={
                regOpen
                  ? 'Be the first act to enter this season.'
                  : 'This season closed without any entrants.'
              }
            />
          ) : (
            <div className="flex flex-col gap-2">
              {entries.map((entry) => (
                <EntrantRow
                  key={entry.id}
                  entry={entry}
                  season={season}
                  isViewer={entry.competitorId === currentUser?.id}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  )
}

function EntrantRow({
  entry,
  season,
  isViewer,
}: {
  entry: CompetitionEntry
  season: Season
  isViewer: boolean
}) {
  const musician = getMusician(entry.competitorId)
  const seed = isSeedCompetitor(musician)
  const finished = season.status === 'finished'
  const name = musician?.name ?? entry.competitorName
  // Seed acts are house crew and have no public profile; real entrants link to theirs / yours.
  const href = seed || !musician ? null : isViewer ? '/me' : `/musicians/${entry.competitorId}`

  const inner = (
    <>
      {musician ? (
        <Avatar src={musician.avatarUrl} name={name} size="lg" className="h-[42px] w-[42px]" />
      ) : (
        <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-muted font-serif text-[15px] font-bold text-foreground-dim">
          {name.charAt(0)}
        </span>
      )}
      <div className="ml-3 min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-serif text-[14px] font-bold text-foreground">{name}</span>
          {isViewer && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary-foreground">
              You
            </span>
          )}
          {seed && (
            <span className="rounded-full border border-border-subtle bg-background px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-foreground-dim">
              Riff crew
            </span>
          )}
        </div>
        <span className="mt-0.5 block text-[12px] text-foreground-dim">
          Entry {formatCredits(entry.feePaidCredits)}
        </span>
      </div>

      {finished && entry.finalRank != null && (
        <div className="ml-2 flex shrink-0 flex-col items-end">
          {entry.finalRank === 1 ? (
            <span className="flex items-center gap-1 text-[13px] font-bold text-foreground">
              <Trophy size={14} className="text-[#facc15]" fill="currentColor" />
              1st
            </span>
          ) : (
            <span className="text-[13px] font-semibold text-foreground-dim">
              {ordinal(entry.finalRank)}
            </span>
          )}
          {entry.payoutCredits ? (
            <span className="text-[12px] font-semibold text-success">
              +{formatCredits(entry.payoutCredits)}
            </span>
          ) : null}
        </div>
      )}
    </>
  )

  const rowClass =
    'flex items-center rounded-[16px] border border-border-subtle bg-card p-3 shadow-sm'

  return href ? (
    <Link href={href} className={cn(rowClass, 'transition-transform active:scale-[0.99]')}>
      {inner}
    </Link>
  ) : (
    <div className={rowClass}>{inner}</div>
  )
}
