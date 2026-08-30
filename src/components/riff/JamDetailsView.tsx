'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Check, ChevronRight, Lock, MapPinned } from 'lucide-react'
import { AppShell, StickyActionBar } from '@/components/riff/AppShell'
import { AttendeeRow } from '@/components/riff/AttendeeRow'
import { SubScreenHeader } from '@/components/riff/TopBar'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { formatDayAndTime, formatTime, isSameDay } from '@/lib/datetime'
import { directionsHref, intentLabel, jamStatusLabel, shortNeighborhood } from '@/lib/labels'
import { jamLocationLines } from '@/lib/privacy'
import { statsFor, useReputationContext, useRiffStore } from '@/lib/store'
import {
  CURRENT_USER_ID,
  NOW,
  getMusician,
  getVenue,
  listLiveSessions,
  listMessages,
} from '@/mocks'
import type { Jam } from '@/types'

/** "Go live" only means something while the session is actually happening. */
function isLiveWindow(jam: Jam, now: string): boolean {
  const start = Date.parse(jam.startsAt)
  const nowMs = Date.parse(now)
  return nowMs >= start - 30 * 60_000 && nowMs <= start + jam.durationHours * 3_600_000
}

export function JamDetailsView({ jamId }: { jamId: string }) {
  const jams = useRiffStore((s) => s.jams)
  const messages = useRiffStore((s) => s.messages)
  const withdrawFromJam = useRiffStore((s) => s.withdrawFromJam)
  const ctx = useReputationContext()
  const [confirmingExit, setConfirmingExit] = useState(false)

  const jam = jams.find((j) => j.id === jamId)
  const venue = jam ? getVenue(jam.venueId) : undefined

  const preview = useMemo(
    () => (jam ? listMessages(jam.threadId, messages).slice(-2).reverse() : []),
    [jam, messages],
  )

  if (!jam || !venue) {
    return (
      <AppShell
        activeTab="jams"
        header={<SubScreenHeader title="Jam details" backHref="/jams" />}
        mainClassName="flex items-center px-4 py-6"
      >
        <EmptyState
          className="w-full"
          title="This jam is gone"
          body="It may have been cancelled, or the link is out of date."
          action={
            <Link href="/jams">
              <Button size="sm" variant="secondary">
                Back to your jams
              </Button>
            </Link>
          }
        />
      </AppShell>
    )
  }

  const location = jamLocationLines(jam, venue, CURRENT_USER_ID)
  const me = jam.attendees.find((a) => a.musicianId === CURRENT_USER_ID)
  const attending = me?.rsvp === 'confirmed'
  // "Go live" opens the broadcast only when one actually exists. Starting a stream is out of
  // scope for v1 (docs/SPEC.md §6), so the button stays disabled rather than pointing at nothing.
  const session = listLiveSessions().find((s) => s.jamId === jam.id)
  const liveNow = isLiveWindow(jam, NOW) && Boolean(session)
  const whenLabel = isSameDay(jam.startsAt, NOW)
    ? `Tonight ${formatTime(jam.startsAt)}`
    : formatDayAndTime(jam.startsAt)

  return (
    <AppShell
      activeTab="jams"
      header={<SubScreenHeader title="Jam details" backHref="/jams" />}
      mainClassName="px-4 py-6"
      footer={
        <StickyActionBar>
          <Link
            href={`/messages/${jam.threadId}`}
            className="flex h-[48px] flex-1 items-center justify-center rounded-[12px] bg-surface-muted text-[15px] font-medium text-foreground transition-transform active:scale-95"
          >
            Message group
          </Link>
          {liveNow && session ? (
            <Link
              href={`/live/${session.id}`}
              className="relative flex h-[48px] flex-1 items-center justify-center gap-2 rounded-[12px] bg-primary text-[15px] font-medium text-primary-foreground transition-transform active:scale-95"
            >
              <span className="absolute left-4 h-2 w-2 rounded-full bg-live" />
              Go live
            </Link>
          ) : (
            <Button
              className="flex-1"
              disabled
              title={
                isLiveWindow(jam, NOW)
                  ? 'Broadcasting is not built yet'
                  : 'Available once the session starts'
              }
            >
              Go live
            </Button>
          )}
        </StickyActionBar>
      }
    >
      {/* HERO */}
      <div className="mb-8 overflow-hidden rounded-[16px] border border-border-subtle bg-gradient-to-br from-hero-from to-hero-to shadow-sm">
        <div className="p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-primary">
              {venue.name}
            </span>
            <span className="shrink-0 text-[12px] text-foreground-dim">
              {shortNeighborhood(venue.neighborhood)} · {venue.distanceMi} mi
            </span>
          </div>
          <h2 className="mb-4 font-serif text-[28px] font-bold leading-tight text-foreground">
            {jam.title}
          </h2>
          <div className="flex flex-wrap gap-2">
            <Badge tone="neutral">{intentLabel(jam.intent)}</Badge>
            {jam.status === 'confirmed' ? (
              <Badge tone="success">
                <Check size={11} strokeWidth={3} /> Confirmed
              </Badge>
            ) : (
              <Badge tone="warning">{jamStatusLabel(jam.status)}</Badge>
            )}
            <Badge tone="primary">{whenLabel}</Badge>
          </div>
        </div>
      </div>

      {/* WHO IS COMING */}
      <section className="mb-8">
        <SectionHeader>Who is coming</SectionHeader>
        <Card className="overflow-hidden">
          {jam.attendees
            .filter((a) => a.rsvp !== 'declined')
            .map((attendee, index, list) => {
              const musician = getMusician(attendee.musicianId)
              if (!musician) return null
              return (
                <AttendeeRow
                  key={attendee.musicianId}
                  name={musician.name}
                  avatarUrl={musician.avatarUrl}
                  instrument={attendee.instrument}
                  rsvp={attendee.rsvp}
                  stats={statsFor(attendee.musicianId, ctx)}
                  isYou={attendee.musicianId === CURRENT_USER_ID}
                  className={index < list.length - 1 ? 'border-b border-border-hairline' : ''}
                />
              )
            })}
        </Card>
        {jam.status !== 'confirmed' && (
          <p className="mt-3 px-1 text-[12px] text-foreground-dim">
            Nothing is confirmed until everyone accepts.
          </p>
        )}
      </section>

      {/* LOCATION — exact address only on a confirmed jam, and only to attendees. */}
      <section className="mb-8">
        <SectionHeader>Location</SectionHeader>
        <Card className="flex items-center justify-between gap-3 p-4">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[8px] bg-secondary text-foreground-dim">
              {location.exact ? <MapPinned size={18} /> : <Lock size={16} />}
            </div>
            <div className="min-w-0">
              <div className="truncate font-serif text-[15px] font-bold text-foreground">
                {location.primary}
              </div>
              <div className="text-[13px] text-foreground-dim">{location.secondary}</div>
            </div>
          </div>
          {location.exact && (
            <a
              href={directionsHref(`${venue.address}, ${venue.city}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex shrink-0 items-center gap-1 text-[14px] font-medium text-primary"
            >
              Directions <ChevronRight size={12} />
            </a>
          )}
        </Card>
      </section>

      {/* THREAD */}
      <section className="mb-8">
        <SectionHeader
          action={
            <Link
              href={`/messages/${jam.threadId}`}
              className="text-[13px] font-medium text-primary"
            >
              View all
            </Link>
          }
        >
          Thread
        </SectionHeader>
        {preview.length === 0 ? (
          <p className="text-[13px] text-foreground-dim">No messages yet. Say hello.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {preview.map((message) => {
              const author = getMusician(message.authorId)
              return (
                <div key={message.id} className="flex items-start gap-3">
                  {author ? (
                    <Avatar
                      src={author.avatarUrl}
                      name={author.name}
                      size="md"
                      ring={false}
                      className="mt-1 border border-border-subtle"
                    />
                  ) : (
                    <div className="mt-1 h-8 w-8 shrink-0 rounded-full bg-secondary" />
                  )}
                  <div className="flex-1 rounded-b-[16px] rounded-tr-[16px] border border-border-subtle bg-card p-3">
                    <div className="text-[14px] text-foreground">{message.body}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* The exit. Every jam screen owes the user one — docs/SPEC.md §5.5. */}
      {attending && (
        <section className="pb-2">
          {confirmingExit ? (
            <Card className="p-4">
              <p className="text-[14px] text-foreground">
                Drop out of {jam.title}? The others will see the seat open up.
              </p>
              <div className="mt-4 flex gap-3">
                <Button
                  size="sm"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setConfirmingExit(false)}
                >
                  Stay in
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-destructive"
                  onClick={() => {
                    withdrawFromJam(jam.id)
                    setConfirmingExit(false)
                  }}
                >
                  Yes, drop out
                </Button>
              </div>
            </Card>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingExit(true)}
              className="mx-auto block px-2 py-1 text-[13px] font-medium text-foreground-dim underline underline-offset-4"
            >
              Can&apos;t make it?
            </button>
          )}
        </section>
      )}

      {!attending && me && (
        <p className="pb-2 text-center text-[13px] text-foreground-dim">
          You are no longer on this jam.
        </p>
      )}
    </AppShell>
  )
}
