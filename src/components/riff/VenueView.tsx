'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, Mic, Share2, Star } from 'lucide-react'
import { AppShell, StickyActionBar } from '@/components/riff/AppShell'
import { Avatar } from '@/components/ui/Avatar'
import { Button, buttonClass, iconButtonClass } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { StatTile } from '@/components/ui/StatTile'
import { SubScreenHeader } from '@/components/riff/TopBar'
import { cn } from '@/lib/cn'
import { formatTime, relativeDayLabel } from '@/lib/datetime'
import { useRiffStore } from '@/lib/store'
import { getBand, getVenue, listLiveSessions, listPlayingAtVenue } from '@/mocks'

export function VenueView({ venueId }: { venueId: string }) {
  const jams = useRiffStore((s) => s.jams)
  const now = useRiffStore((s) => s.now)
  const venue = getVenue(venueId)
  const [selectedSlot, setSelectedSlot] = useState<string | undefined>(
    () => venue?.slots.find((s) => s.available)?.id,
  )

  if (!venue) {
    return (
      <AppShell
        activeTab="discover"
        header={<SubScreenHeader title="Venue" backHref="/discover" />}
        mainClassName="flex items-center px-4 py-6"
      >
        <EmptyState
          className="w-full"
          title="This venue is gone"
          body="It may have closed, or the link is out of date."
          action={
            <Link href="/discover" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
              Back to Discover
            </Link>
          }
        />
      </AppShell>
    )
  }

  const { live, upcoming } = listPlayingAtVenue(venue.id, now, jams)
  const liveSession = listLiveSessions().find((s) => s.venueId === venue.id)
  const slot = venue.slots.find((s) => s.id === selectedSlot)

  return (
    <AppShell
      activeTab="discover"
      liveIndicator={venue.liveNow}
      mainClassName="pb-2"
      footer={
        <StickyActionBar>
          <Button
            variant="secondary"
            className="flex-1"
            disabled
            title="Venue messaging is not built yet"
          >
            Message venue
          </Button>
          <Button
            className="flex-1"
            disabled={!slot}
            title={slot ? undefined : 'Pick a slot first'}
          >
            {slot ? 'Book this slot' : 'Pick a slot'}
          </Button>
        </StickyActionBar>
      }
    >
      {/* PHOTO HEADER — the back and share controls float over it. */}
      <div className="relative h-[320px] shrink-0 overflow-hidden rounded-b-[24px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={venue.photoUrl} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute left-0 top-0 flex h-[56px] w-full items-center justify-between px-4">
          <Link href="/discover" aria-label="Back" className={iconButtonClass('dark')}>
            <ChevronLeft size={16} />
          </Link>
          <span className={cn(iconButtonClass('dark'), 'pointer-events-none opacity-60')}>
            <Share2 size={14} />
          </span>
        </div>
        {venue.liveNow && (
          <div className="absolute bottom-4 left-4">
            <span className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-sm backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" /> LIVE JAM ON NOW
            </span>
          </div>
        )}
      </div>

      <div className="px-4 pb-6 pt-5">
        <h1 className="mb-1 font-serif text-[28px] font-bold leading-tight text-foreground">
          {venue.name}
        </h1>
        {/* Neighbourhood, never the street address — that is only for confirmed attendees. */}
        <p className="text-[13px] font-medium text-foreground-dim">
          {venue.kind} · {venue.neighborhood} · {venue.distanceMi} mi
        </p>
      </div>

      <div className="mb-6 flex justify-between gap-3 px-4">
        <StatTile
          value={venue.rating}
          label="Rating"
          adornment={<Star size={10} className="text-[#facc15]" fill="currentColor" />}
          className="[&_span:first-child]:text-[18px]"
        />
        <StatTile
          value={venue.jamsHosted}
          label="Jams hosted"
          className="[&_span:first-child]:text-[18px]"
        />
        <StatTile
          value={`$${venue.hourlyRateUsd}`}
          label="/ hr"
          className="[&_span:first-child]:text-[18px]"
        />
      </div>

      <div className="mb-8 px-4">
        <div className="flex flex-wrap gap-2">
          {venue.amenities.map((amenity) => (
            <span
              key={amenity}
              className="rounded-full border border-border-subtle bg-card px-3 py-1.5 text-[12px] font-medium text-foreground shadow-sm"
            >
              {amenity}
            </span>
          ))}
        </div>
      </div>

      <section className="mb-8 px-4">
        <SectionHeader>Who is playing here</SectionHeader>
        {live.length === 0 && upcoming.length === 0 ? (
          <p className="px-1 text-[13px] text-foreground-dim">Nothing booked in right now.</p>
        ) : (
          <Card className="flex flex-col p-1">
            {live.map(({ session, band }) => (
              <Link
                key={session.id}
                href={`/live/${session.id}`}
                className="flex items-center border-b border-border-hairline p-3 last:border-0"
              >
                {band ? (
                  <Avatar
                    src={band.coverUrl}
                    name={band.name}
                    size="lg"
                    ring={false}
                    className="border border-border-subtle"
                  />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-white">
                    <Mic size={16} />
                  </span>
                )}
                <div className="ml-3 flex-1">
                  <div className="font-serif text-[14px] font-bold text-foreground">
                    {band?.name ?? 'Live session'}
                  </div>
                  <div className="text-[12px] text-foreground-dim">
                    {band?.genre.toLowerCase() ?? 'live now'}
                  </div>
                </div>
                <span className="flex items-center gap-1.5 rounded-full border border-border-subtle bg-background px-2 py-1 text-[10px] font-bold text-foreground shadow-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" /> On now
                </span>
              </Link>
            ))}
            {upcoming.map(({ jam, host }) => (
              <Link
                key={jam.id}
                href={`/jams/${jam.id}`}
                className="flex items-center border-b border-border-hairline p-3 last:border-0"
              >
                {host && (
                  <Avatar
                    src={host.avatarUrl}
                    name={host.name}
                    size="lg"
                    ring={false}
                    className="border border-border-subtle"
                  />
                )}
                <div className="ml-3 min-w-0 flex-1">
                  <div className="truncate font-serif text-[14px] font-bold text-foreground">
                    {host?.name ?? jam.title}
                  </div>
                  <div className="truncate text-[12px] text-foreground-dim">
                    {host ? host.genres.join('/') : jam.title}
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-[color:var(--hero-from)] px-2 py-1 text-[10px] font-bold text-primary">
                  {relativeDayLabel(jam.startsAt, now)} {formatTime(jam.startsAt)}
                </span>
              </Link>
            ))}
          </Card>
        )}
      </section>

      <section className="mb-6 px-4">
        <SectionHeader>Book a room</SectionHeader>
        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
          {venue.slots.map((s) => {
            const selected = s.id === selectedSlot
            return (
              <button
                key={s.id}
                type="button"
                disabled={!s.available}
                aria-pressed={selected}
                onClick={() => setSelectedSlot(s.id)}
                className={cn(
                  'flex min-w-[100px] shrink-0 flex-col items-center justify-center rounded-[12px] border p-3 shadow-sm transition-transform active:scale-95',
                  'disabled:cursor-not-allowed disabled:opacity-40',
                  selected
                    ? 'border-primary bg-[color:var(--hero-from)]'
                    : 'border-border-subtle bg-card',
                )}
              >
                <span
                  className={cn(
                    'mb-1 text-[11px] uppercase',
                    selected ? 'font-bold text-primary' : 'font-medium text-foreground-dim',
                  )}
                >
                  {relativeDayLabel(s.startsAt, now)}
                </span>
                <span
                  className={cn(
                    'font-serif text-[15px] font-bold',
                    selected ? 'text-primary' : 'text-foreground',
                  )}
                >
                  {formatTime(s.startsAt)}
                </span>
              </button>
            )
          })}
        </div>
        {liveSession && (
          <p className="mt-3 px-1 text-[12px] text-foreground-dim">
            {getBand(liveSession.bandId ?? '')?.name ?? 'A band'} is broadcasting from here right
            now.
          </p>
        )}
      </section>
    </AppShell>
  )
}
