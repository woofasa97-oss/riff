'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { CalendarClock, Check, Minus, Music2, Plus, Star, Wallet as WalletIcon } from 'lucide-react'
import { AppShell, StickyActionBar } from '@/components/riff/AppShell'
import { SubScreenHeader } from '@/components/riff/TopBar'
import { Avatar } from '@/components/ui/Avatar'
import { Button, buttonClass } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { cn } from '@/lib/cn'
import { formatCredits } from '@/lib/labels'
import { AccountRequiredError, useListingById, useRiffStore } from '@/lib/store'
import { bands } from '@/mocks'
import type { Band } from '@/types'

const DAY_CHOICES = [
  { label: 'Tomorrow', days: 1 },
  { label: 'This weekend', days: 3 },
  { label: 'Next week', days: 7 },
] as const

const HOUR_CHOICES = [
  { label: '6 PM', hour: 18 },
  { label: '7 PM', hour: 19 },
  { label: '8 PM', hour: 20 },
] as const

/**
 * A shop owner books a band for an in-store show. The CR fee leaves the wallet when the offer
 * goes out (held, not paid), the band answers after a beat, and every state — waiting,
 * confirmed, declined-with-refund — is visible on the owner dashboard. Bands pass on fees
 * under 50 CR, which the form says out loud rather than letting the owner find out the hard way.
 */
export function BookBandView({ shopId }: { shopId: string }) {
  const listing = useListingById(shopId)
  const me = useRiffStore((s) => s.viewerId)
  const wallet = useRiffStore((s) => s.wallet)
  const sendGigOffer = useRiffStore((s) => s.sendGigOffer)

  const [bandId, setBandId] = useState<string | null>(null)
  const [dayIdx, setDayIdx] = useState(0)
  const [hourIdx, setHourIdx] = useState(1)
  const [fee, setFee] = useState(150)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const isOwner = listing?.kind === 'shop' && listing.ownerId === me
  const balance = wallet?.balanceCredits ?? 0

  const startsAt = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + DAY_CHOICES[dayIdx].days)
    d.setHours(HOUR_CHOICES[hourIdx].hour, 0, 0, 0)
    return d.toISOString()
  }, [dayIdx, hourIdx])

  if (!isOwner) {
    return (
      <AppShell
        activeTab="me"
        header={<SubScreenHeader title="Book a band" backHref="/me/business" />}
        mainClassName="flex items-center px-4 py-6"
      >
        <EmptyState
          className="w-full"
          title="Not your shop"
          body="Only a shop's owner can book bands for it."
          action={
            <Link href="/me/business" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
              Back to your dashboard
            </Link>
          }
        />
      </AppShell>
    )
  }

  const shopName = listing.shop?.name ?? 'your shop'

  if (sent) {
    return (
      <AppShell
        activeTab="me"
        header={<SubScreenHeader title="Offer sent" backHref="/me/business" />}
        mainClassName="flex flex-col items-center justify-center px-6 py-10 text-center"
      >
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--hero-from)] text-primary">
          <CalendarClock size={30} />
        </div>
        <h1 className="font-serif text-[24px] font-bold text-foreground">Offer sent</h1>
        <p className="mt-3 max-w-[300px] text-[14px] text-foreground-dim">
          The fee is held from your wallet while the band decides. You&apos;ll get a notification
          either way — if they pass, every credit comes straight back.
        </p>
        <div className="mt-8 flex w-full max-w-[320px] flex-col gap-2">
          <Link href="/me/business" className={buttonClass({ fullWidth: true })}>
            Track it on your dashboard
          </Link>
          <Link href={`/shops/${shopId}`} className={buttonClass({ variant: 'secondary', fullWidth: true })}>
            View your shop page
          </Link>
        </div>
      </AppShell>
    )
  }

  const feeShort = balance < fee
  const canSubmit = bandId !== null && !feeShort

  async function submit() {
    if (!canSubmit || busy || bandId === null) return
    setBusy(true)
    setError(null)
    try {
      await sendGigOffer({ shopId, bandId, startsAt, feeCredits: fee, note: note.trim() })
      setSent(true)
    } catch (err) {
      if (err instanceof AccountRequiredError) return
      setError(err instanceof Error ? err.message : 'Could not send the offer — try again')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppShell
      activeTab="me"
      header={<SubScreenHeader title={`Book a band — ${shopName}`} backHref="/me/business" />}
      mainClassName="px-4 py-6"
      footer={
        <StickyActionBar note="Nothing is confirmed until the band accepts. Declined offers refund in full.">
          <Button className="flex-1" disabled={!canSubmit || busy} onClick={submit}>
            <Music2 size={16} />
            {busy ? 'Sending…' : `Offer ${formatCredits(fee)}`}
          </Button>
        </StickyActionBar>
      }
    >
      <section className="mb-7">
        <SectionHeader>Pick a band</SectionHeader>
        <div className="flex flex-col gap-2">
          {bands.map((band) => (
            <BandPickRow
              key={band.id}
              band={band}
              on={bandId === band.id}
              onPick={() => setBandId(band.id)}
            />
          ))}
        </div>
      </section>

      <section className="mb-7">
        <SectionHeader>When</SectionHeader>
        <div className="flex flex-wrap gap-2">
          {DAY_CHOICES.map((d, i) => (
            <PickChip key={d.label} on={dayIdx === i} onClick={() => setDayIdx(i)}>
              {d.label}
            </PickChip>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {HOUR_CHOICES.map((h, i) => (
            <PickChip key={h.label} on={hourIdx === i} onClick={() => setHourIdx(i)}>
              {h.label}
            </PickChip>
          ))}
        </div>
      </section>

      <section className="mb-7">
        <SectionHeader>The fee</SectionHeader>
        <Card className="flex items-center justify-between p-4">
          <button
            type="button"
            aria-label="Lower the fee"
            onClick={() => setFee((f) => Math.max(25, f - 25))}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-muted text-foreground transition-transform active:scale-90"
          >
            <Minus size={16} />
          </button>
          <div className="text-center">
            <div className="font-serif text-[28px] font-bold text-foreground">
              {formatCredits(fee)}
            </div>
            <div className="text-[11px] text-foreground-dim">held until the band answers</div>
          </div>
          <button
            type="button"
            aria-label="Raise the fee"
            onClick={() => setFee((f) => Math.min(5000, f + 25))}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-muted text-foreground transition-transform active:scale-90"
          >
            <Plus size={16} />
          </button>
        </Card>
        <p className="mt-2 flex items-center gap-1.5 px-1 text-[12px] text-foreground-dim">
          <WalletIcon size={13} /> Your balance: {formatCredits(balance)}
          {fee < 50 && ' · heads up: bands around here pass on offers under 50 CR'}
        </p>
        {feeShort && (
          <p className="mt-1 px-1 text-[12px] text-destructive">
            Not enough credits to cover this fee.{' '}
            <Link href="/wallet" className="font-semibold underline underline-offset-2">
              See your wallet
            </Link>
          </p>
        )}
      </section>

      <section className="mb-2">
        <SectionHeader>A note for the band</SectionHeader>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 300))}
          rows={3}
          placeholder="What kind of set, what gear you have in the shop, load-in details…"
          aria-label="Note for the band"
          className="w-full resize-none rounded-[12px] border border-border-subtle bg-background px-4 py-3 text-[14px] text-foreground placeholder:text-foreground-dim focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </section>

      {error && (
        <p role="alert" className="mt-3 rounded-[12px] border border-destructive/40 bg-destructive/10 px-4 py-3 text-[13px] text-destructive">
          {error}
        </p>
      )}
    </AppShell>
  )
}

function BandPickRow({ band, on, onPick }: { band: Band; on: boolean; onPick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onPick}
      className={cn(
        'flex w-full items-center gap-3 rounded-[16px] border bg-card p-3 text-left shadow-sm transition-transform active:scale-[0.99]',
        on ? 'border-primary ring-1 ring-primary' : 'border-border-subtle',
      )}
    >
      <Avatar src={band.coverUrl} name={band.name} size="md" ring={false} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-bold text-foreground">{band.name}</span>
        <span className="mt-0.5 flex items-center gap-1.5 text-[12px] text-foreground-dim">
          {band.genre}
          <Star size={10} className="text-[#facc15]" fill="currentColor" />
          {band.rating.toFixed(1)}
        </span>
      </span>
      <span
        className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border',
          on ? 'border-primary bg-primary text-primary-foreground' : 'border-border-subtle text-transparent',
        )}
      >
        <Check size={14} />
      </span>
    </button>
  )
}

function PickChip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        'rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-transform active:scale-95',
        on ? 'border-primary bg-primary text-primary-foreground' : 'border-border-subtle bg-card text-foreground',
      )}
    >
      {children}
    </button>
  )
}
