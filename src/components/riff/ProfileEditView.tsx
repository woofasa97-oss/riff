'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AppShell, StickyActionBar } from '@/components/riff/AppShell'
import { InstrumentPicker } from '@/components/riff/InstrumentPicker'
import { IntentPicker } from '@/components/riff/IntentPicker'
import { SubScreenHeader } from '@/components/riff/TopBar'
import { Button, buttonClass } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Slider } from '@/components/ui/Slider'
import { cn } from '@/lib/cn'
import { genreLabel } from '@/lib/labels'
import { useCurrentUser, useRiffStore } from '@/lib/store'
import { mapZones } from '@/mocks'
import type { Genre, Instrument, Intent } from '@/types'

const GENRES: Genre[] = ['jazz', 'neo-soul', 'fusion', 'indie', 'rock', 'funk', 'hip-hop']

/**
 * Edit the parts of a player card you choose — instruments, genres, intent, neighbourhood, travel
 * radius, bio. Reliability, repeats and vouches are earned and never appear here (product rule 3).
 * Persists via the same server-validated updateProfile the onboarding flow uses.
 */
export function ProfileEditView() {
  const me = useCurrentUser()
  const applyOnboarding = useRiffStore((s) => s.applyOnboarding)
  const router = useRouter()

  const [instruments, setInstruments] = useState<Instrument[]>(me?.instruments ?? [])
  const [genres, setGenres] = useState<Genre[]>(me?.genres ?? [])
  const [intent, setIntent] = useState<Intent | undefined>(me?.intent)
  const [neighborhood, setNeighborhood] = useState<string>(me?.neighborhood ?? '')
  const [radius, setRadius] = useState<number>(me?.travelRadiusMi ?? 3)
  const [bio, setBio] = useState<string>(me?.bio ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!me) {
    return (
      <AppShell
        activeTab="me"
        header={<SubScreenHeader title="Edit player card" backHref="/me" />}
        mainClassName="flex items-center px-4 py-6"
      >
        <EmptyState
          className="w-full"
          title="Sign in to edit your card"
          body="Your player card is how people find you. Claim a handle to build it."
          action={
            <Link href="/signup" className={buttonClass({ size: 'sm' })}>
              Create your player card
            </Link>
          }
        />
      </AppShell>
    )
  }

  const toggle = <T,>(list: T[], v: T): T[] =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v]

  const canSave = instruments.length > 0 && Boolean(neighborhood) && Boolean(intent) && !busy

  async function save() {
    if (!canSave) return
    setBusy(true)
    setError(null)
    try {
      await applyOnboarding({
        instruments,
        genres,
        intent,
        neighborhood,
        travelRadiusMi: radius,
        bio,
      })
      router.push('/me')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong — try again')
      setBusy(false)
    }
  }

  return (
    <AppShell
      activeTab="me"
      header={<SubScreenHeader title="Edit player card" backHref="/me" />}
      mainClassName="px-4 py-6"
      footer={
        <StickyActionBar>
          <Button className="flex-1" disabled={!canSave} onClick={save}>
            {busy ? 'Saving…' : 'Save changes'}
          </Button>
        </StickyActionBar>
      }
    >
      <section className="mb-7">
        <SectionHeader>Instruments</SectionHeader>
        <InstrumentPicker
          selected={instruments}
          onToggle={(i) => setInstruments((cur) => toggle(cur, i))}
        />
        <p className="mt-2 px-1 text-[12px] text-foreground-dim">
          Pick at least one — the first is your primary.
        </p>
      </section>

      <section className="mb-7">
        <SectionHeader>Genre lanes</SectionHeader>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((g) => {
            const on = genres.includes(g)
            return (
              <button
                key={g}
                type="button"
                aria-pressed={on}
                onClick={() => setGenres((cur) => toggle(cur, g))}
                className={cn(
                  'rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-transform active:scale-95',
                  on
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border-subtle bg-card text-foreground',
                )}
              >
                {genreLabel(g)}
              </button>
            )
          })}
        </div>
      </section>

      <section className="mb-7">
        <SectionHeader>What you’re after</SectionHeader>
        <IntentPicker value={intent} onChange={setIntent} />
      </section>

      <section className="mb-7">
        <SectionHeader>Home patch</SectionHeader>
        <div className="flex flex-wrap gap-2">
          {mapZones.map((zone) => {
            const on = neighborhood === zone.name
            return (
              <button
                key={zone.id}
                type="button"
                aria-pressed={on}
                onClick={() => setNeighborhood(zone.name)}
                className={cn(
                  'rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-transform active:scale-95',
                  on
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border-subtle bg-card text-foreground',
                )}
              >
                {zone.name}
              </button>
            )
          })}
        </div>
        <p className="mt-2 px-1 text-[12px] text-foreground-dim">
          Riff shows your neighbourhood, never your address.
        </p>
      </section>

      <section className="mb-7">
        <SectionHeader>How far you’ll travel</SectionHeader>
        <Slider
          min={1}
          max={10}
          value={radius}
          onChange={setRadius}
          label="Travel radius in miles"
          formatValue={(v) => `${v} mi`}
        />
      </section>

      <section className="mb-2">
        <SectionHeader>Bio</SectionHeader>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value.slice(0, 200))}
          rows={3}
          placeholder="A line or two about how you play and who you’re looking for."
          aria-label="Bio"
          className="w-full rounded-[12px] border border-border-subtle bg-background px-4 py-3 text-[14px] text-foreground placeholder:text-foreground-dim focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <p className="mt-1 px-1 text-right text-[11px] text-foreground-dim">{bio.length}/200</p>
      </section>

      {error && <p className="px-1 text-[13px] text-destructive">{error}</p>}
    </AppShell>
  )
}
