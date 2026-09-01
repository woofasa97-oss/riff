'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Loader2, Plus, Store, X } from 'lucide-react'
import { AppShell, StickyActionBar } from '@/components/riff/AppShell'
import { SubScreenHeader } from '@/components/riff/TopBar'
import { Button, buttonClass } from '@/components/ui/Button'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { cn } from '@/lib/cn'
import { AccountRequiredError, useRiffStore } from '@/lib/store'
import { mapZones } from '@/mocks'
import type { MapListing, MusicShop } from '@/types'

const SHOP_KINDS: { id: MusicShop['kind']; label: string }[] = [
  { id: 'instruments', label: 'Instruments' },
  { id: 'vinyl', label: 'Vinyl' },
  { id: 'repair', label: 'Repairs' },
  { id: 'gear', label: 'Gear' },
]

const TAG_SUGGESTIONS = ['Guitars', 'Vintage synths', 'Vinyl', 'Pedals', 'Amps', 'Drums', 'Repairs']

type Phase = 'form' | 'reviewing' | 'done'

/**
 * List a music shop — a public storefront, so it shows its address on the map. Fields and ranges
 * mirror the server gate in createListing/buildShop, so the submit button only unlocks on data the
 * server will accept.
 */
export function ShopListingWizard() {
  const [name, setName] = useState('')
  const [kind, setKind] = useState<MusicShop['kind'] | null>(null)
  const [neighborhood, setNeighborhood] = useState('')
  const [address, setAddress] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [hoursLabel, setHoursLabel] = useState('')
  const [openNow, setOpenNow] = useState(true)
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')

  const [phase, setPhase] = useState<Phase>('form')
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<MapListing | null>(null)

  const create = useRiffStore((s) => s.createListing)

  const canSubmit =
    name.trim().length >= 2 &&
    kind !== null &&
    neighborhood.length > 0 &&
    address.trim().length >= 3 &&
    tags.length > 0

  async function submit() {
    if (!canSubmit || kind === null) return
    setError(null)
    setPhase('reviewing')
    try {
      const listing = await create('shop', {
        name: name.trim(),
        kind,
        neighborhood,
        address: address.trim(),
        tags,
        hoursLabel: hoursLabel.trim(),
        openNow,
        phone: phone.trim() || undefined,
        website: website.trim() || undefined,
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
  if (phase === 'done' && created) return <SuccessScreen viewHref={`/shops/${created.id}`} />

  return (
    <AppShell
      activeTab="me"
      header={<SubScreenHeader title="Open a music shop" backHref="/me/listings/new" />}
      mainClassName="px-4 py-6"
      footer={
        <StickyActionBar note="New listings show as a community listing until they earn their first reviews.">
          <Button className="flex-1" disabled={!canSubmit} onClick={submit}>
            Put it on the map
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
        <SectionHeader>Shop name</SectionHeader>
        <TextField value={name} onChange={setName} maxLength={60} placeholder="e.g. Main Drag Music" ariaLabel="Shop name" />
      </section>

      <section className="mb-7">
        <SectionHeader>What kind of shop</SectionHeader>
        <div className="flex flex-wrap gap-2">
          {SHOP_KINDS.map((k) => (
            <Chip key={k.id} on={kind === k.id} onClick={() => setKind(k.id)}>
              {k.label}
            </Chip>
          ))}
        </div>
      </section>

      <section className="mb-7">
        <SectionHeader>Neighbourhood</SectionHeader>
        <div className="flex flex-wrap gap-2">
          {mapZones.map((zone) => (
            <Chip key={zone.id} on={neighborhood === zone.name} onClick={() => setNeighborhood(zone.name)}>
              {zone.name}
            </Chip>
          ))}
        </div>
      </section>

      <section className="mb-7">
        <SectionHeader>Storefront address</SectionHeader>
        <TextField value={address} onChange={setAddress} maxLength={120} placeholder="123 Bedford Ave" ariaLabel="Storefront address" />
        <p className="mt-2 px-1 text-[12px] text-foreground-dim">
          A shop is public — its address shows on the map so people can visit.
        </p>
      </section>

      <section className="mb-7">
        <SectionHeader>What you sell</SectionHeader>
        <TagInput values={tags} onChange={setTags} placeholder="Add a tag" ariaLabel="Tags" suggestions={TAG_SUGGESTIONS} />
        <p className="mt-2 px-1 text-[12px] text-foreground-dim">Add at least one tag.</p>
      </section>

      <section className="mb-7">
        <SectionHeader>Hours</SectionHeader>
        <TextField value={hoursLabel} onChange={setHoursLabel} maxLength={40} placeholder="e.g. Mon–Sat 11–7" ariaLabel="Hours" />
        <button
          type="button"
          aria-pressed={openNow}
          onClick={() => setOpenNow((v) => !v)}
          className="mt-3 flex w-full items-center gap-3 rounded-[12px] border border-border-subtle bg-card p-4 text-left"
        >
          <span
            className={cn(
              'flex h-6 w-6 shrink-0 items-center justify-center rounded-md border',
              openNow ? 'border-primary bg-primary text-primary-foreground' : 'border-border-subtle',
            )}
          >
            {openNow && <Check size={14} />}
          </span>
          <span className="text-[14px] font-medium text-foreground">Open right now</span>
        </button>
      </section>

      <section className="mb-7">
        <SectionHeader>Phone</SectionHeader>
        <TextField value={phone} onChange={setPhone} maxLength={40} placeholder="Optional" ariaLabel="Phone" />
      </section>

      <section className="mb-2">
        <SectionHeader>Website</SectionHeader>
        <TextField value={website} onChange={setWebsite} maxLength={80} placeholder="Optional" ariaLabel="Website" />
      </section>
    </AppShell>
  )
}

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

function ReviewingScreen() {
  return (
    <AppShell
      activeTab="me"
      header={<SubScreenHeader title="Open a music shop" backHref="/me/listings/new" />}
      mainClassName="flex flex-col items-center justify-center px-6 py-10 text-center"
    >
      <Loader2 size={32} className="mb-4 animate-spin text-primary" />
      <h1 className="font-serif text-[20px] font-bold text-foreground">Reviewing your listing…</h1>
      <p className="mt-2 max-w-[280px] text-[14px] text-foreground-dim">
        We&apos;re running a quick quality check on your shop.
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
        <Store size={30} />
      </div>
      <h1 className="font-serif text-[24px] font-bold text-foreground">You&apos;re on the map!</h1>
      <p className="mt-3 max-w-[300px] text-[14px] text-foreground-dim">
        Your shop is live now. It shows as a new community listing — with a “New” rating until it
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
