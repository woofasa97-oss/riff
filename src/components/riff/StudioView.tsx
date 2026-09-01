'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, ChevronLeft, Lock, MapPin, Share2, Sparkles, Star } from 'lucide-react'
import { AppShell, StickyActionBar } from '@/components/riff/AppShell'
import { SubScreenHeader } from '@/components/riff/TopBar'
import { Avatar } from '@/components/ui/Avatar'
import { Button, buttonClass, iconButtonClass } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { StatTile } from '@/components/ui/StatTile'
import { cn } from '@/lib/cn'
import { formatTime, relativeDayLabel } from '@/lib/datetime'
import { directionsHref } from '@/lib/labels'
import { useCurrentUser, useListingById, useRiffStore } from '@/lib/store'
import { getMusician, getStudio } from '@/mocks'

export function StudioView({ studioId }: { studioId: string }) {
  const now = useRiffStore((s) => s.now)
  const requireAccount = useRiffStore((s) => s.requireAccount)
  // Resolve seeded fixtures first, then fall back to a member-published listing (same shape).
  const seeded = getStudio(studioId)
  const listing = useListingById(studioId)
  const me = useCurrentUser()
  const studio = seeded ?? listing?.studio
  const isMember = !seeded && Boolean(listing?.studio)
  const isOwner = isMember && listing?.ownerId === me?.id
  // A brand-new member listing has no rating yet — show "New", not a broken-looking 0.0.
  const isNew = isMember && studio?.reviewCount === 0
  const [selectedSlot, setSelectedSlot] = useState<string | undefined>(
    () => studio?.slots.find((s) => s.available)?.id,
  )
  const [booked, setBooked] = useState(false)

  if (!studio) {
    return (
      <AppShell
        activeTab="map"
        header={<SubScreenHeader title="Studio" backHref="/map" />}
        mainClassName="flex items-center px-4 py-6"
      >
        <EmptyState
          className="w-full"
          title="This studio is gone"
          body="It may have been taken down, or the link is out of date."
          action={
            <Link href="/map" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
              Back to Map
            </Link>
          }
        />
      </AppShell>
    )
  }

  const kindLabel = studio.kind === 'pro-room' ? 'Pro room' : 'Home rig'
  const host = studio.kind === 'home-rig' && studio.hostId ? getMusician(studio.hostId) : undefined
  const slot = studio.slots.find((s) => s.id === selectedSlot)
  const primaryLabel = studio.instantBook ? 'Book this slot' : 'Request to book'

  const handleBook = () => {
    if (!slot) return
    if (!requireAccount('book a studio')) return
    setBooked(true)
  }

  return (
    <AppShell
      activeTab="map"
      mainClassName="pb-2"
      footer={
        booked ? (
          <StickyActionBar>
            <div className="flex flex-1 items-center justify-center gap-2 rounded-[14px] border border-map-studio/40 bg-map-studio/10 px-4 py-3 text-[13px] font-bold text-foreground">
              <CheckCircle2 size={16} className="text-map-studio" />
              {studio.instantBook ? 'Slot booked — preview only' : 'Request sent — preview only'}
            </div>
          </StickyActionBar>
        ) : (
          <StickyActionBar>
            <Button
              variant="secondary"
              className="flex-1"
              disabled
              title="Messaging the host is not built yet — you can book below"
            >
              Message host
            </Button>
            <Button
              className="flex-1"
              disabled={!slot}
              title={slot ? undefined : 'Pick a slot first'}
              onClick={handleBook}
            >
              {slot ? primaryLabel : 'Pick a slot'}
            </Button>
          </StickyActionBar>
        )
      }
    >
      {/* PHOTO HEADER — back and share controls float over it. */}
      <div className="relative h-[320px] shrink-0 overflow-hidden rounded-b-[24px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={studio.photoUrl} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute left-0 top-0 flex h-[56px] w-full items-center justify-between px-4">
          <Link href="/map" aria-label="Back" className={iconButtonClass('dark')}>
            <ChevronLeft size={16} />
          </Link>
          <span className={cn(iconButtonClass('dark'), 'pointer-events-none opacity-60')}>
            <Share2 size={14} />
          </span>
        </div>
        <div className="absolute bottom-4 left-4">
          <span className="flex items-center gap-1.5 rounded-full border border-white/20 bg-map-studio/80 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-sm backdrop-blur-md">
            {kindLabel}
          </span>
        </div>
      </div>

      <div className="px-4 pb-6 pt-5">
        {isMember && (
          <span className="mb-2 inline-flex items-center gap-1 rounded-full border border-border-subtle bg-secondary px-2.5 py-1 text-[11px] font-bold text-foreground-dim">
            <Sparkles size={11} /> New listing
          </span>
        )}
        <h1 className="mb-1 font-serif text-[28px] font-bold leading-tight text-foreground">
          {studio.name}
        </h1>
        {/* Neighbourhood, never the street address here — the location card handles reveal. */}
        <p className="text-[13px] font-medium text-foreground-dim">
          {kindLabel} · {studio.neighborhood} · {studio.distanceMi} mi
        </p>
        {isOwner && (
          <Link
            href="/me/listings"
            className="mt-2 inline-block text-[12px] font-medium text-map-studio underline underline-offset-2"
          >
            This is your listing — manage it
          </Link>
        )}
      </div>

      <div className="mb-6 flex justify-between gap-2.5 px-4">
        <StatTile
          value={isNew ? 'New' : studio.rating}
          label="Rating"
          adornment={
            isNew ? undefined : <Star size={10} className="text-[#facc15]" fill="currentColor" />
          }
          className="[&_span:first-child]:text-[18px]"
        />
        <StatTile
          value={isNew ? 'New' : studio.reviewCount}
          label="Reviews"
          className="[&_span:first-child]:text-[18px]"
        />
        <StatTile
          value={`$${studio.hourlyRateUsd}`}
          label="/ hr"
          className="[&_span:first-child]:text-[18px]"
        />
        <StatTile
          value={studio.capacity}
          label="Cap"
          className="[&_span:first-child]:text-[18px]"
        />
      </div>

      {host && (
        <section className="mb-6 px-4">
          <SectionHeader>Hosted by</SectionHeader>
          <Link
            href={`/musicians/${host.id}`}
            className="flex items-center gap-3 rounded-[16px] border border-border-subtle bg-card p-3 shadow-sm transition-transform active:scale-[0.99]"
          >
            <Avatar src={host.avatarUrl} name={host.name} size="lg" ring={false} className="border border-border-subtle" />
            <div className="min-w-0 flex-1">
              <div className="truncate font-serif text-[15px] font-bold text-foreground">
                {host.name}
              </div>
              <div className="truncate text-[12px] text-foreground-dim">View profile</div>
            </div>
            <ChevronLeft size={16} className="rotate-180 text-foreground-dim" />
          </Link>
        </section>
      )}

      <section className="mb-6 px-4">
        <SectionHeader>Gear</SectionHeader>
        <div className="flex flex-wrap gap-2">
          {studio.gear.map((item) => (
            <span
              key={item}
              className="rounded-full border border-map-studio/30 bg-map-studio/10 px-3 py-1.5 text-[12px] font-medium text-foreground shadow-sm"
            >
              {item}
            </span>
          ))}
        </div>
      </section>

      <section className="mb-6 px-4">
        <SectionHeader>Amenities</SectionHeader>
        <div className="flex flex-wrap gap-2">
          {studio.amenities.map((amenity) => (
            <span
              key={amenity}
              className="rounded-full border border-border-subtle bg-card px-3 py-1.5 text-[12px] font-medium text-foreground shadow-sm"
            >
              {amenity}
            </span>
          ))}
        </div>
      </section>

      <section className="mb-6 px-4">
        <SectionHeader>Location</SectionHeader>
        <Card className="p-4">
          {studio.addressRevealed && studio.address ? (
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[14px] font-bold text-foreground">{studio.neighborhood}</div>
                <div className="text-[13px] text-foreground-dim">{studio.address}</div>
              </div>
              <a
                href={directionsHref(studio.address)}
                target="_blank"
                rel="noreferrer"
                className={cn(buttonClass({ variant: 'secondary', size: 'sm' }), 'shrink-0 gap-1.5')}
              >
                <MapPin size={14} /> Directions
              </a>
            </div>
          ) : (
            <div>
              <div className="mb-1 text-[14px] font-bold text-foreground">{studio.neighborhood}</div>
              <div className="flex items-start gap-2 text-[12px] text-foreground-dim">
                <Lock size={13} className="mt-0.5 shrink-0" />
                <span>Exact address is shared once your booking is confirmed.</span>
              </div>
            </div>
          )}
        </Card>
      </section>

      <section className="mb-6 px-4">
        <SectionHeader>Book a room</SectionHeader>
        {booked && slot && (
          <Card className="mb-3 flex items-center gap-3 border-map-studio/40 bg-map-studio/10 p-3">
            <CheckCircle2 size={18} className="shrink-0 text-map-studio" />
            <div className="min-w-0 text-[13px] text-foreground">
              <span className="font-bold">
                {studio.instantBook ? 'Booked' : 'Requested'}
              </span>{' '}
              for {relativeDayLabel(slot.startsAt, now)} {formatTime(slot.startsAt)}.{' '}
              {studio.instantBook
                ? 'This is a preview — no real charge.'
                : 'The host will confirm — this is a preview, no real charge.'}
            </div>
          </Card>
        )}
        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
          {studio.slots.map((s) => {
            const selected = s.id === selectedSlot
            return (
              <button
                key={s.id}
                type="button"
                disabled={!s.available || booked}
                aria-pressed={selected}
                onClick={() => setSelectedSlot(s.id)}
                className={cn(
                  'flex min-w-[100px] shrink-0 flex-col items-center justify-center rounded-[12px] border p-3 shadow-sm transition-transform active:scale-95',
                  'disabled:cursor-not-allowed disabled:opacity-40',
                  selected
                    ? 'border-map-studio bg-map-studio/10'
                    : 'border-border-subtle bg-card',
                )}
              >
                <span
                  className={cn(
                    'mb-1 text-[11px] uppercase',
                    selected ? 'font-bold text-map-studio' : 'font-medium text-foreground-dim',
                  )}
                >
                  {relativeDayLabel(s.startsAt, now)}
                </span>
                <span
                  className={cn(
                    'font-serif text-[15px] font-bold',
                    selected ? 'text-foreground' : 'text-foreground',
                  )}
                >
                  {formatTime(s.startsAt)}
                </span>
              </button>
            )
          })}
        </div>
        <p className="mt-2 px-1 text-[12px] text-foreground-dim">
          ${studio.hourlyRateUsd}/hr · Preview — no real charge.
        </p>
      </section>
    </AppShell>
  )
}
