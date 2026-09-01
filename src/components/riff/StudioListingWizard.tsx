'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Check, Loader2, MapPin, Plus, Sparkles, X } from 'lucide-react'
import { AppShell, StickyActionBar } from '@/components/riff/AppShell'
import { SubScreenHeader } from '@/components/riff/TopBar'
import { Button, buttonClass } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Slider } from '@/components/ui/Slider'
import { cn } from '@/lib/cn'
import { AccountRequiredError, useListingById, useRiffStore } from '@/lib/store'
import { mapZones } from '@/mocks'
import type { MapListing, Studio } from '@/types'

const STUDIO_KINDS: { id: Studio['kind']; label: string; hint: string }[] = [
  { id: 'pro-room', label: 'Pro room', hint: 'A dedicated space with a public address.' },
  { id: 'home-rig', label: 'Home rig', hint: 'Your setup — address stays hidden until booked.' },
]

const GEAR_SUGGESTIONS = ['Full drum kit', 'Upright piano', 'Guitar amp', 'Bass amp', 'PA system', 'Mics']
const AMENITY_SUGGESTIONS = ['Parking', 'A/C', 'Wi-Fi', 'Backline', 'Green room', 'Coffee']

type Phase = 'form' | 'reviewing' | 'done'

/**
 * List (or edit) a rentable studio. Single-scroll form whose fields and ranges mirror the server
 * gate in createListing/buildStudio, so the submit button only unlocks on data the server will
 * accept. Passing that gate IS the review, so on success the listing is already on the map.
 */
export function StudioListingWizard() {
  // Optional edit mode: ?id=… prefilled after mount (kept out of the first render to avoid a
  // hydration mismatch). Create is the requirement; edit is best-effort on top of the same form.
  const [editId, setEditId] = useState<string | null>(null)
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('id')
    if (id) setEditId(id)
  }, [])
  const editing = useListingById(editId ?? '')

  const [name, setName] = useState('')
  const [kind, setKind] = useState<Studio['kind'] | null>(null)
  const [neighborhood, setNeighborhood] = useState('')
  const [rate, setRate] = useState(40)
  const [capacity, setCapacity] = useState(4)
  const [gear, setGear] = useState<string[]>([])
  const [amenities, setAmenities] = useState<string[]>([])
  const [address, setAddress] = useState('')
  const [instantBook, setInstantBook] = useState(false)

  const [phase, setPhase] = useState<Phase>('form')
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<MapListing | null>(null)

  const create = useRiffStore((s) => s.createListing)
  const update = useRiffStore((s) => s.updateListing)

  const hydrated = useRef(false)
  useEffect(() => {
    if (hydrated.current || !editing?.studio) return
    hydrated.current = true
    const s = editing.studio
    setName(s.name)
    setKind(s.kind)
    setNeighborhood(s.neighborhood)
    setRate(s.hourlyRateUsd)
    setCapacity(s.capacity)
    setGear(s.gear)
    setAmenities(s.amenities)
    setAddress(s.address ?? '')
    setInstantBook(s.instantBook)
  }, [editing])

  const isPro = kind === 'pro-room'
  const canSubmit =
    name.trim().length >= 2 &&
    kind !== null &&
    neighborhood.length > 0 &&
    rate >= 5 &&
    rate <= 300 &&
    capacity >= 1 &&
    capacity <= 20 &&
    gear.length > 0

  async function submit() {
    if (!canSubmit || kind === null) return
    setError(null)
    setPhase('reviewing')
    const data = {
      name: name.trim(),
      kind,
      neighborhood,
      hourlyRateUsd: rate,
      capacity,
      gear,
      amenities,
      ...(isPro ? { address: address.trim(), instantBook } : {}),
    }
    try {
      const listing = editId ? await update(editId, data) : await create('studio', data)
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
  if (phase === 'done' && created)
    return <SuccessScreen viewHref={`/studios/${created.id}`} edited={Boolean(editId)} />

  return (
    <AppShell
      activeTab="me"
      header={
        <SubScreenHeader
          title={editId ? 'Edit studio' : 'Rent out a studio'}
          backHref="/me/listings/new"
        />
      }
      mainClassName="px-4 py-6"
      footer={
        <StickyActionBar
          note="New listings show as a community listing until they earn their first reviews."
        >
          <Button className="flex-1" disabled={!canSubmit} onClick={submit}>
            {editId ? 'Save changes' : 'Put it on the map'}
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
        <SectionHeader>Studio name</SectionHeader>
        <TextField
          value={name}
          onChange={setName}
          maxLength={60}
          placeholder="e.g. The Loft Room"
          ariaLabel="Studio name"
        />
      </section>

      <section className="mb-7">
        <SectionHeader>Type</SectionHeader>
        <div className="grid grid-cols-2 gap-2">
          {STUDIO_KINDS.map((k) => {
            const on = kind === k.id
            return (
              <button
                key={k.id}
                type="button"
                aria-pressed={on}
                onClick={() => setKind(k.id)}
                className={cn(
                  'rounded-[12px] border p-3 text-left transition-transform active:scale-95',
                  on ? 'border-primary bg-[color:var(--hero-from)]' : 'border-border-subtle bg-card',
                )}
              >
                <span className="block text-[14px] font-semibold text-foreground">{k.label}</span>
                <span className="mt-0.5 block text-[11px] text-foreground-dim">{k.hint}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="mb-7">
        <SectionHeader>Neighbourhood</SectionHeader>
        <ChipRow>
          {mapZones.map((zone) => (
            <Chip key={zone.id} on={neighborhood === zone.name} onClick={() => setNeighborhood(zone.name)}>
              {zone.name}
            </Chip>
          ))}
        </ChipRow>
        <p className="mt-2 px-1 text-[12px] text-foreground-dim">
          Riff pins your studio at neighbourhood level, never a home address.
        </p>
      </section>

      {isPro && (
        <section className="mb-7">
          <SectionHeader>Storefront address</SectionHeader>
          <TextField
            value={address}
            onChange={setAddress}
            maxLength={120}
            placeholder="123 Wythe Ave"
            ariaLabel="Storefront address"
          />
          <p className="mt-2 px-1 text-[12px] text-foreground-dim">
            A pro room shows its address publicly. Optional.
          </p>
        </section>
      )}

      <section className="mb-7">
        <SectionHeader>Hourly rate</SectionHeader>
        <Slider
          min={5}
          max={300}
          step={5}
          value={rate}
          onChange={setRate}
          label="Hourly rate in dollars"
          formatValue={(v) => `$${v}`}
        />
      </section>

      <section className="mb-7">
        <SectionHeader>Capacity</SectionHeader>
        <Slider
          min={1}
          max={20}
          value={capacity}
          onChange={setCapacity}
          label="How many people fit"
          formatValue={(v) => `${v} ${v === 1 ? 'person' : 'people'}`}
        />
      </section>

      <section className="mb-7">
        <SectionHeader>Gear</SectionHeader>
        <TagInput
          values={gear}
          onChange={setGear}
          placeholder="Add a piece of gear"
          ariaLabel="Gear"
          suggestions={GEAR_SUGGESTIONS}
        />
        <p className="mt-2 px-1 text-[12px] text-foreground-dim">List at least one thing they can play.</p>
      </section>

      <section className="mb-7">
        <SectionHeader>Amenities</SectionHeader>
        <TagInput
          values={amenities}
          onChange={setAmenities}
          placeholder="Add an amenity"
          ariaLabel="Amenities"
          suggestions={AMENITY_SUGGESTIONS}
        />
      </section>

      {isPro && (
        <section className="mb-2">
          <SectionHeader>Booking</SectionHeader>
          <button
            type="button"
            aria-pressed={instantBook}
            onClick={() => setInstantBook((v) => !v)}
            className="flex w-full items-center gap-3 rounded-[12px] border border-border-subtle bg-card p-4 text-left"
          >
            <span
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-md border',
                instantBook ? 'border-primary bg-primary text-primary-foreground' : 'border-border-subtle',
              )}
            >
              {instantBook && <Check size={14} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-medium text-foreground">Instant book</span>
              <span className="mt-0.5 block text-[12px] text-foreground-dim">
                Confirm bookings automatically instead of approving each one.
              </span>
            </span>
          </button>
        </section>
      )}
    </AppShell>
  )
}

// ---------------------------------------------------------------------------
// Shared field primitives (kept local to the wizard).
// ---------------------------------------------------------------------------

function TextField({
  value,
  onChange,
  placeholder,
  maxLength,
  ariaLabel,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  maxLength?: number
  ariaLabel: string
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(maxLength ? e.target.value.slice(0, maxLength) : e.target.value)}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className="w-full rounded-[12px] border border-border-subtle bg-background px-4 py-3 text-[14px] text-foreground placeholder:text-foreground-dim focus:outline-none focus:ring-1 focus:ring-ring"
    />
  )
}

function ChipRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>
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

/** Free-text list editor: type-and-add plus one-tap suggestions, each item removable. */
function TagInput({
  values,
  onChange,
  placeholder,
  ariaLabel,
  suggestions = [],
}: {
  values: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  ariaLabel: string
  suggestions?: string[]
}) {
  const [draft, setDraft] = useState('')
  const add = (raw: string) => {
    const v = raw.trim()
    if (!v) return
    if (values.some((x) => x.toLowerCase() === v.toLowerCase())) return
    onChange([...values, v.slice(0, 40)])
  }
  const remove = (v: string) => onChange(values.filter((x) => x !== v))
  const open = suggestions.filter((s) => !values.some((v) => v.toLowerCase() === s.toLowerCase()))

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add(draft)
              setDraft('')
            }
          }}
          placeholder={placeholder}
          aria-label={ariaLabel}
          className="min-w-0 flex-1 rounded-[12px] border border-border-subtle bg-background px-4 py-3 text-[14px] text-foreground placeholder:text-foreground-dim focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <button
          type="button"
          aria-label={`Add ${ariaLabel.toLowerCase()}`}
          onClick={() => {
            add(draft)
            setDraft('')
          }}
          className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-[12px] bg-surface-muted text-foreground transition-transform active:scale-95"
        >
          <Plus size={18} />
        </button>
      </div>

      {values.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {values.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary bg-primary px-3 py-1.5 text-[13px] font-medium text-primary-foreground"
            >
              {v}
              <button
                type="button"
                aria-label={`Remove ${v}`}
                onClick={() => remove(v)}
                className="transition-transform active:scale-90"
              >
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
      )}

      {open.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {open.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="rounded-full border border-dashed border-border-subtle bg-card px-3 py-1.5 text-[13px] text-foreground-dim transition-transform active:scale-95"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Terminal states.
// ---------------------------------------------------------------------------

function ReviewingScreen() {
  return (
    <AppShell
      activeTab="me"
      header={<SubScreenHeader title="Rent out a studio" backHref="/me/listings/new" />}
      mainClassName="flex flex-col items-center justify-center px-6 py-10 text-center"
    >
      <Loader2 size={32} className="mb-4 animate-spin text-primary" />
      <h1 className="font-serif text-[20px] font-bold text-foreground">Reviewing your listing…</h1>
      <p className="mt-2 max-w-[280px] text-[14px] text-foreground-dim">
        We&apos;re running a quick quality check on the details you entered.
      </p>
    </AppShell>
  )
}

/** Success screen for the create/edit flow. */
function SuccessScreen({ viewHref, edited }: { viewHref: string; edited?: boolean }) {
  return (
    <AppShell
      activeTab="me"
      header={<SubScreenHeader title="You're on the map" backHref="/me/listings" />}
      mainClassName="flex flex-col items-center justify-center px-6 py-10 text-center"
    >
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--hero-from)] text-primary">
        {edited ? <MapPin size={30} /> : <Sparkles size={30} />}
      </div>
      <h1 className="font-serif text-[24px] font-bold text-foreground">
        {edited ? 'Changes saved' : "You're on the map!"}
      </h1>
      <p className="mt-3 max-w-[300px] text-[14px] text-foreground-dim">
        {edited
          ? 'Your listing has been updated and is live on the map.'
          : 'Your listing is live now. It shows as a new community listing — with a “New” rating until it earns its first reviews — and your Riff reputation is what people will trust.'}
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
