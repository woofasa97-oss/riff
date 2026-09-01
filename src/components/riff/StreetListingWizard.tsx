'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Guitar, Loader2 } from 'lucide-react'
import { AppShell, StickyActionBar } from '@/components/riff/AppShell'
import { InstrumentPicker } from '@/components/riff/InstrumentPicker'
import { SubScreenHeader } from '@/components/riff/TopBar'
import { Button, buttonClass } from '@/components/ui/Button'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Slider } from '@/components/ui/Slider'
import { cn } from '@/lib/cn'
import { genreLabel } from '@/lib/labels'
import { AccountRequiredError, useRiffStore } from '@/lib/store'
import { mapZones } from '@/mocks'
import type { Genre, Instrument, MapListing } from '@/types'

const GENRES: Genre[] = ['jazz', 'neo-soul', 'fusion', 'indie', 'rock', 'funk', 'hip-hop']

type Phase = 'form' | 'reviewing' | 'done'

/**
 * Put a busking act on the map for the next few hours. A street spot is public by nature (no home
 * is ever exposed), so the fields and ranges here match the server gate in createListing/buildStreet
 * and the pin sits at the public spot you name.
 */
export function StreetListingWizard() {
  const [instruments, setInstruments] = useState<Instrument[]>([])
  const [genres, setGenres] = useState<Genre[]>([])
  const [neighborhood, setNeighborhood] = useState('')
  const [spotLabel, setSpotLabel] = useState('')
  const [durationHours, setDurationHours] = useState(3)
  const [actName, setActName] = useState('')
  const [blurb, setBlurb] = useState('')

  const [phase, setPhase] = useState<Phase>('form')
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<MapListing | null>(null)

  const create = useRiffStore((s) => s.createListing)

  const toggle = <T,>(list: T[], v: T): T[] =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v]

  const canSubmit = instruments.length > 0 && neighborhood.length > 0 && spotLabel.trim().length >= 2

  async function submit() {
    if (!canSubmit) return
    setError(null)
    setPhase('reviewing')
    try {
      const listing = await create('street', {
        instruments,
        genres,
        neighborhood,
        spotLabel: spotLabel.trim(),
        durationHours,
        actName: actName.trim(),
        blurb: blurb.trim(),
      })
      setCreated(listing)
      setPhase('done')
    } catch (err) {
      if (err instanceof AccountRequiredError) {
        setPhase('form')
        return
      }
      setError(err instanceof Error ? err.message : 'Something went wrong — try again')
      setPhase('form')
    }
  }

  if (phase === 'reviewing') return <ReviewingScreen />
  if (phase === 'done' && created) return <SuccessScreen viewHref={`/street/${created.id}`} />

  return (
    <AppShell
      activeTab="me"
      header={<SubScreenHeader title="Play as a street artist" backHref="/me/listings/new" />}
      mainClassName="px-4 py-6"
      footer={
        <StickyActionBar note="Your act goes live now and drops off the map when your set ends.">
          <Button className="flex-1" disabled={!canSubmit} onClick={submit}>
            Go live on the map
          </Button>
        </StickyActionBar>
      }
    >
      {error && (
        <p
          role="alert"
          className="mb-5 rounded-[12px] border border-destructive/40 bg-destructive/10 px-4 py-3 text-[13px] text-destructive"
        >
          {error}
        </p>
      )}

      <section className="mb-7">
        <SectionHeader>Act name</SectionHeader>
        <input
          value={actName}
          onChange={(e) => setActName(e.target.value.slice(0, 60))}
          placeholder="Defaults to your name"
          aria-label="Act name"
          className="w-full rounded-[12px] border border-border-subtle bg-background px-4 py-3 text-[14px] text-foreground placeholder:text-foreground-dim focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </section>

      <section className="mb-7">
        <SectionHeader>What you play</SectionHeader>
        <InstrumentPicker
          selected={instruments}
          onToggle={(i) => setInstruments((cur) => toggle(cur, i))}
        />
        <p className="mt-2 px-1 text-[12px] text-foreground-dim">Pick at least one.</p>
      </section>

      <section className="mb-7">
        <SectionHeader>Genres</SectionHeader>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((g) => (
            <Chip key={g} on={genres.includes(g)} onClick={() => setGenres((cur) => toggle(cur, g))}>
              {genreLabel(g)}
            </Chip>
          ))}
        </div>
      </section>

      <section className="mb-7">
        <SectionHeader>Neighbourhood</SectionHeader>
        <div className="flex flex-wrap gap-2">
          {mapZones.map((zone) => (
            <Chip
              key={zone.id}
              on={neighborhood === zone.name}
              onClick={() => setNeighborhood(zone.name)}
            >
              {zone.name}
            </Chip>
          ))}
        </div>
      </section>

      <section className="mb-7">
        <SectionHeader>Your spot</SectionHeader>
        <input
          value={spotLabel}
          onChange={(e) => setSpotLabel(e.target.value.slice(0, 80))}
          placeholder="e.g. Bedford Ave & N 7th"
          aria-label="Your spot"
          className="w-full rounded-[12px] border border-border-subtle bg-background px-4 py-3 text-[14px] text-foreground placeholder:text-foreground-dim focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <p className="mt-2 px-1 text-[12px] text-foreground-dim">
          The public spot people will find you at — never a home address.
        </p>
      </section>

      <section className="mb-7">
        <SectionHeader>Playing for</SectionHeader>
        <Slider
          min={1}
          max={6}
          value={durationHours}
          onChange={setDurationHours}
          label="How long you're playing, in hours"
          formatValue={(v) => `${v}h`}
        />
      </section>

      <section className="mb-2">
        <SectionHeader>Blurb</SectionHeader>
        <textarea
          value={blurb}
          onChange={(e) => setBlurb(e.target.value.slice(0, 200))}
          rows={3}
          placeholder="A line about your set — what you're playing, what to expect."
          aria-label="Blurb"
          className="w-full rounded-[12px] border border-border-subtle bg-background px-4 py-3 text-[14px] text-foreground placeholder:text-foreground-dim focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <p className="mt-1 px-1 text-right text-[11px] text-foreground-dim">{blurb.length}/200</p>
      </section>
    </AppShell>
  )
}

function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        'rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-transform active:scale-95',
        on
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border-subtle bg-card text-foreground',
      )}
    >
      {children}
    </button>
  )
}

function ReviewingScreen() {
  return (
    <AppShell
      activeTab="me"
      header={<SubScreenHeader title="Play as a street artist" backHref="/me/listings/new" />}
      mainClassName="flex flex-col items-center justify-center px-6 py-10 text-center"
    >
      <Loader2 size={32} className="mb-4 animate-spin text-primary" />
      <h1 className="font-serif text-[20px] font-bold text-foreground">Reviewing your listing…</h1>
      <p className="mt-2 max-w-[280px] text-[14px] text-foreground-dim">
        We&apos;re running a quick quality check on your set.
      </p>
    </AppShell>
  )
}

function SuccessScreen({ viewHref }: { viewHref: string }) {
  return (
    <AppShell
      activeTab="me"
      header={<SubScreenHeader title="You're on the map" backHref="/me/listings" />}
      mainClassName="flex flex-col items-center justify-center px-6 py-10 text-center"
    >
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--hero-from)] text-primary">
        <Guitar size={30} />
      </div>
      <h1 className="font-serif text-[24px] font-bold text-foreground">You&apos;re on the map!</h1>
      <p className="mt-3 max-w-[300px] text-[14px] text-foreground-dim">
        Your act is live now. It shows as a new community listing — with a “New” rating until it
        earns its first reviews — and your Riff reputation is what people will trust.
      </p>
      <div className="mt-8 flex w-full max-w-[320px] flex-col gap-2">
        <Link href={viewHref} className={buttonClass({ fullWidth: true })}>
          View your listing
        </Link>
        <Link href="/me/listings" className={buttonClass({ variant: 'secondary', fullWidth: true })}>
          Manage your listings
        </Link>
      </div>
    </AppShell>
  )
}
