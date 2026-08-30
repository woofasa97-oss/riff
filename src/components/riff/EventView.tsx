'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Calendar, ChevronLeft, MapPin, Share2, Ticket, Users } from 'lucide-react'
import { AppShell, StickyActionBar } from '@/components/riff/AppShell'
import { Button, buttonClass, iconButtonClass } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { cn } from '@/lib/cn'
import { formatTime, relativeDayLabel } from '@/lib/datetime'
import { compactCount } from '@/lib/labels'
import { useRiffStore } from '@/lib/store'
import { getMapEvent, getVenue } from '@/mocks'
import type { MapEvent } from '@/types'

const KIND_LABEL: Record<MapEvent['kind'], string> = {
  gig: 'Live gig',
  openmic: 'Open mic',
  session: 'Session',
  workshop: 'Workshop',
}

export function EventView({ eventId }: { eventId: string }) {
  const now = useRiffStore((s) => s.now)
  const requireAccount = useRiffStore((s) => s.requireAccount)
  const [going, setGoing] = useState(false)
  const event = getMapEvent(eventId)

  if (!event) {
    return (
      <AppShell activeTab="map" mainClassName="flex items-center px-4 py-6">
        <EmptyState
          className="w-full"
          title="This event is gone"
          body="It may have wrapped up, or the link is out of date."
          action={
            <Link href="/map" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
              Back to Map
            </Link>
          }
        />
      </AppShell>
    )
  }

  // WHEN: "Tonight 8:00 PM–11:30 PM" — end time only when the fixture carries one.
  const whenLine = `${relativeDayLabel(event.startsAt, now)} ${formatTime(event.startsAt)}${
    event.endsAt ? `–${formatTime(event.endsAt)}` : ''
  }`

  // WHERE: a linked venue name only when the venue exists on Riff; neighbourhood, never address.
  const linkedVenue = event.venueId ? getVenue(event.venueId) : undefined

  return (
    <AppShell
      activeTab="map"
      mainClassName="pb-2"
      footer={
        <StickyActionBar note="Preview — RSVPs are not live yet.">
          <Button
            variant="secondary"
            className="flex-1"
            disabled
            title="Sharing is not built yet"
          >
            Share
          </Button>
          <Button
            className="flex-1"
            aria-pressed={going}
            onClick={() => {
              if (!requireAccount('RSVP to an event')) return
              setGoing((g) => !g)
            }}
          >
            {going ? 'You’re going ✓' : "I'm going"}
          </Button>
        </StickyActionBar>
      }
    >
      {/* COVER HEADER — the back and share controls float over it. */}
      <div className="relative h-[320px] shrink-0 overflow-hidden rounded-b-[24px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={event.coverUrl} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-black/20" />
        <div className="absolute left-0 top-0 flex h-[56px] w-full items-center justify-between px-4">
          <Link href="/map" aria-label="Back" className={iconButtonClass('dark')}>
            <ChevronLeft size={16} />
          </Link>
          <span className={cn(iconButtonClass('dark'), 'pointer-events-none opacity-60')}>
            <Share2 size={14} />
          </span>
        </div>
        <div className="absolute bottom-4 left-4">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-map-event/40 bg-map-event/90 px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.06em] text-white shadow-sm backdrop-blur-md">
            {KIND_LABEL[event.kind]}
          </span>
        </div>
      </div>

      <div className="px-4 pb-5 pt-5">
        <h1 className="mb-3 font-serif text-[28px] font-bold leading-tight text-foreground">
          {event.title}
        </h1>

        {/* WHEN */}
        <div className="flex items-start gap-2 text-[13px] font-medium text-foreground">
          <Calendar size={15} className="mt-0.5 shrink-0 text-map-event" />
          <span>{whenLine}</span>
        </div>

        {/* WHERE — neighbourhood, never a street address. */}
        <div className="mt-1.5 flex items-start gap-2 text-[13px] font-medium text-foreground-dim">
          <MapPin size={15} className="mt-0.5 shrink-0 text-map-event" />
          <span>
            {linkedVenue ? (
              <Link
                href={`/venues/${event.venueId}`}
                className="font-semibold text-foreground underline decoration-border-subtle underline-offset-2"
              >
                {event.venueName}
              </Link>
            ) : (
              <span className="font-semibold text-foreground">{event.venueName}</span>
            )}
            {' · '}
            {event.neighborhood}
            {' · '}
            {event.city}
          </span>
        </div>
      </div>

      {/* PRICE + GOING */}
      <div className="mb-6 flex gap-3 px-4">
        <div className="flex flex-1 items-center gap-2 rounded-[14px] border border-map-event/25 bg-map-event/10 px-4 py-3">
          <Ticket size={16} className="shrink-0 text-map-event" />
          <span className="font-serif text-[18px] font-bold text-foreground">
            {event.priceLabel}
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-[14px] border border-border-subtle bg-card px-4 py-3">
          <Users size={16} className="shrink-0 text-foreground-dim" />
          <span className="text-[14px] font-semibold text-foreground">
            {compactCount(event.goingCount)} going
          </span>
        </div>
      </div>

      {/* TAGS */}
      {event.tags.length > 0 && (
        <div className="mb-8 px-4">
          <div className="flex flex-wrap gap-2">
            {event.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border-subtle bg-card px-3 py-1.5 text-[12px] font-medium text-foreground shadow-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* LINEUP */}
      <section className="mb-8 px-4">
        <SectionHeader>Lineup</SectionHeader>
        {event.lineup.length === 0 ? (
          <p className="px-1 text-[13px] text-foreground-dim">Lineup to be announced.</p>
        ) : (
          <Card className="flex flex-col p-1">
            {event.lineup.map((act) => (
              <div
                key={act}
                className="flex items-center gap-3 border-b border-border-hairline p-3 last:border-0"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-map-event/10 text-map-event">
                  <Users size={15} />
                </span>
                <span className="font-serif text-[14px] font-bold text-foreground">{act}</span>
              </div>
            ))}
          </Card>
        )}
      </section>

      {/* ABOUT */}
      <section className="mb-6 px-4">
        <SectionHeader>About</SectionHeader>
        <p className="text-[14px] leading-relaxed text-foreground-dim">{event.blurb}</p>
        {event.hostName && (
          <p className="mt-3 text-[12px] font-medium text-foreground-dim">
            Hosted by <span className="text-foreground">{event.hostName}</span>
          </p>
        )}
      </section>
    </AppShell>
  )
}
