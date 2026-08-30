'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { CalendarX2, Check, CircleCheck, Plus, ShieldCheck, Star, UserX } from 'lucide-react'
import { AppShell, StickyActionBar } from '@/components/riff/AppShell'
import { SubScreenHeader } from '@/components/riff/TopBar'
import { Avatar } from '@/components/ui/Avatar'
import { Button, buttonClass } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { EmptyState } from '@/components/ui/EmptyState'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { nextAvailableSlots } from '@/lib/availability'
import { cn } from '@/lib/cn'
import { genreLane, intentLabel, playerLabel, shortNeighborhood } from '@/lib/labels'
import { useMusicianStats, useRiffStore } from '@/lib/store'
import { CURRENT_USER_ID, NOW, getMusician, getVenue, venues } from '@/mocks'
import type { Intent } from '@/types'

const INTENTS: Intent[] = ['casual', 'serious', 'gigging']

/** Up to three suggested slots — mirrors JamRequest.proposedTimes' documented cap. */
const MAX_TIMES = 3

/**
 * Request a jam (docs/BUILD-PLAN.md P2-04, from 21-request-a-jam.html). A request is a
 * proposal, never a booking: sendJamRequest creates a JamRequest and its thread, and no jam
 * exists until the other side accepts (docs/SPEC.md §5.1).
 */
export function RequestJamView({ musicianId }: { musicianId: string }) {
  const target = getMusician(musicianId)
  const stats = useMusicianStats(musicianId)
  const sendJamRequest = useRiffStore((s) => s.sendJamRequest)

  const [intent, setIntent] = useState<Intent>('casual')
  const [times, setTimes] = useState<string[]>([])
  const [venueId, setVenueId] = useState<string | undefined>(undefined)
  const [suggestion, setSuggestion] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  // Honest time chips: drawn from the target's real availability grid, never invented.
  const slots = useMemo(
    () => (target ? nextAvailableSlots(target.availability, NOW, MAX_TIMES) : []),
    [target],
  )

  // You cannot request a jam with yourself, and an unknown id gets an exit, not a 500.
  if (!target || target.id === CURRENT_USER_ID) {
    return (
      <AppShell
        activeTab="discover"
        header={<SubScreenHeader title="Request a jam" backHref="/discover" />}
        mainClassName="flex items-center px-4 py-6"
      >
        <EmptyState
          className="w-full"
          icon={<UserX size={22} />}
          title="No one to ask here"
          body="This profile is not one you can send a request to — it may be your own, or the link is out of date."
          action={
            <Link href="/discover" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
              Back to Discover
            </Link>
          }
        />
      </AppShell>
    )
  }

  const firstName = target.name.split(' ')[0]
  const canSend = times.length > 0

  function toggleTime(startsAt: string) {
    setTimes((current) =>
      current.includes(startsAt)
        ? current.filter((t) => t !== startsAt)
        : current.length < MAX_TIMES
          ? [...current, startsAt]
          : current,
    )
  }

  function handleSend() {
    if (!target || !canSend) return
    sendJamRequest({
      toId: target.id,
      intent,
      proposedTimes: times,
      venueId,
      venueSuggestion: suggestion.trim() || undefined,
      message:
        // The message opens the request's thread, so an empty one still needs a real line.
        message.trim() || `Hey ${firstName} — up for a ${intentLabel(intent).toLowerCase()}?`,
    })
    setSent(true)
  }

  // ---- Sent state: what happens next, and where to watch it. ---------------
  if (sent) {
    const chosenVenue = venueId ? getVenue(venueId) : undefined
    return (
      <AppShell
        activeTab="discover"
        header={<SubScreenHeader title="Request a jam" backHref={`/musicians/${target.id}`} />}
        mainClassName="px-4 py-8"
        footer={
          <StickyActionBar>
            <Link
              href="/discover"
              className="flex h-[48px] w-[130px] shrink-0 items-center justify-center rounded-[12px] bg-surface-muted text-[15px] font-medium text-foreground transition-transform active:scale-95"
            >
              Keep looking
            </Link>
            <Link
              href="/jams?tab=requests"
              className="flex h-[48px] flex-1 items-center justify-center rounded-[12px] bg-primary text-[15px] font-medium text-primary-foreground transition-transform active:scale-95"
            >
              Track it in Requests
            </Link>
          </StickyActionBar>
        }
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success-soft text-success">
            <Check size={22} strokeWidth={3} />
          </div>
          <h2 className="mb-2 font-serif text-[28px] font-bold text-foreground">Request sent</h2>
          <p className="mx-auto max-w-[280px] text-[14px] text-foreground-dim">
            {firstName} gets your suggested {times.length === 1 ? 'time' : 'times'} and can accept,
            suggest another one, or decline. Nothing lands on your calendar until they accept.
          </p>
        </div>

        <SectionHeader>What you proposed</SectionHeader>
        <Card className="p-4">
          <div className="mb-3 flex items-center gap-3">
            <Avatar src={target.avatarUrl} name={target.name} size="lg" />
            <div className="min-w-0">
              <div className="truncate font-serif text-[15px] font-bold text-foreground">
                {target.name}
              </div>
              <div className="text-[12px] text-foreground-dim">{intentLabel(intent)}</div>
            </div>
          </div>
          <ul className="flex flex-col gap-1.5">
            {times.map((t) => {
              const slot = slots.find((s) => s.startsAt === t)
              return (
                <li key={t} className="flex items-center gap-2 text-[13px] text-foreground">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
                  {slot?.label ?? t}
                </li>
              )
            })}
          </ul>
          {(chosenVenue || suggestion.trim()) && (
            <p className="mt-2 text-[13px] text-foreground-dim">
              {chosenVenue
                ? `At ${chosenVenue.name} · ${shortNeighborhood(chosenVenue.neighborhood)}`
                : `Your suggestion: ${suggestion.trim()}`}
            </p>
          )}
        </Card>
        <p className="mt-4 text-center text-[12px] text-foreground-dim">
          You will see their answer in your messages too.
        </p>
      </AppShell>
    )
  }

  // ---- The form. -----------------------------------------------------------
  return (
    <AppShell
      activeTab="discover"
      header={<SubScreenHeader title="Request a jam" backHref={`/musicians/${target.id}`} />}
      mainClassName="px-4 py-6"
      footer={
        <StickyActionBar>
          <div className="min-w-0 flex-1">
            {/* The load-bearing reassurance (docs/SPEC.md §5.1) stays pinned with the button. */}
            <div className="mb-2 flex items-center justify-center gap-2 rounded-[12px] bg-surface-muted p-2.5">
              <ShieldCheck size={14} className="shrink-0 text-primary" />
              <span className="text-[12px] font-medium text-foreground">
                Nothing is confirmed until {firstName} accepts.
              </span>
            </div>
            <Button fullWidth disabled={!canSend} onClick={handleSend}>
              Send jam request
            </Button>
            {slots.length === 0 ? (
              <p className="pt-2 text-center text-[11px] text-foreground-dim">
                A request needs at least one time, and {firstName} has no free slots right now.
              </p>
            ) : (
              !canSend && (
                <p className="pt-2 text-center text-[11px] text-foreground-dim">
                  Pick at least one time first.
                </p>
              )
            )}
          </div>
        </StickyActionBar>
      }
    >
      {/* Who you are asking — identity plus their earned reliability, never an authored one. */}
      <div className="mb-6 flex flex-col items-center gap-1.5 text-center">
        <Avatar
          src={target.avatarUrl}
          name={target.name}
          size="xl"
          className="h-20 w-20 shadow-sm"
        />
        <h2 className="mt-1 font-serif text-[20px] font-bold text-foreground">{target.name}</h2>
        <p className="text-[13px] text-foreground-dim">
          {playerLabel(target.instruments[0])} · {genreLane(target.genres)}
        </p>
        {stats && (
          <span className="mt-1 flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface-muted px-3 py-1">
            <Star size={11} className="fill-warning text-warning" />
            <span className="text-[12px] font-medium text-primary">
              {stats.reliabilityPct}% reliability
            </span>
          </span>
        )}
      </div>

      <div className="mb-6 h-px bg-border-subtle" />

      <section className="mb-6">
        <SectionHeader>Pick a vibe</SectionHeader>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Vibe">
          {INTENTS.map((i) => (
            <Chip
              key={i}
              role="radio"
              aria-checked={intent === i}
              selected={intent === i}
              onClick={() => setIntent(i)}
              className="h-[36px]"
            >
              {intentLabel(i)}
            </Chip>
          ))}
        </div>
        <p className="mt-2 text-[12px] text-foreground-dim">
          Pick something loose. Nobody is auditioning.
        </p>
      </section>

      <section className="mb-6">
        <SectionHeader
          action={<span className="text-[11px] text-foreground-dim">Up to three</span>}
        >
          Suggest a time
        </SectionHeader>
        {slots.length === 0 ? (
          // Honest empty note — no invented slots, and the send button explains itself below.
          <Card className="flex items-center gap-3 border-dashed p-4">
            <CalendarX2 size={18} className="shrink-0 text-foreground-dim" />
            <p className="text-[13px] text-foreground-dim">
              {firstName} has no free slots on their calendar for the next two weeks, so there is no
              honest time to suggest. Check back when their availability opens up.
            </p>
          </Card>
        ) : (
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
            {slots.map((slot) => {
              const on = times.includes(slot.startsAt)
              const [day, time] = slot.label.split(', ')
              return (
                <button
                  key={slot.startsAt}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleTime(slot.startsAt)}
                  className={cn(
                    'relative flex h-[84px] w-[150px] shrink-0 flex-col justify-between rounded-[16px] bg-card p-3 text-left shadow-sm',
                    'transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]',
                    on ? 'border-2 border-primary' : 'border border-border-subtle',
                  )}
                >
                  {on && <CircleCheck size={16} className="absolute right-2 top-2 text-success" />}
                  <span className="pr-5 text-[14px] font-semibold leading-tight text-foreground">
                    {day}
                    <br />
                    {time}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-success" />
                    <span className="text-[11px] text-foreground-dim">They&rsquo;re free</span>
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </section>

      <section className="mb-6">
        <SectionHeader action={<span className="text-[11px] text-foreground-dim">Optional</span>}>
          Where
        </SectionHeader>
        {/* Neighbourhood, never address — the address only exists once a jam is confirmed. */}
        <div className="flex flex-wrap gap-2">
          {venues.map((venue) => (
            <Chip
              key={venue.id}
              selected={venueId === venue.id}
              onClick={() => {
                // One venue OR a free-text suggestion, never both on the request.
                setVenueId((current) => (current === venue.id ? undefined : venue.id))
                setSuggestion('')
              }}
              className="h-[36px]"
            >
              {venue.name} · {shortNeighborhood(venue.neighborhood)}
            </Chip>
          ))}
        </div>
        <div className="relative mt-3">
          <Plus
            size={14}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-foreground-dim"
          />
          <input
            type="text"
            value={suggestion}
            onChange={(e) => {
              setSuggestion(e.target.value)
              if (e.target.value.trim()) setVenueId(undefined)
            }}
            placeholder="Suggest a place"
            aria-label="Suggest a place"
            className="w-full rounded-full border border-dashed border-border bg-card py-2 pl-10 pr-4 text-[13px] text-foreground placeholder:text-foreground-dim focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </section>

      <section className="mb-2">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Heard your clip — ..."
          aria-label="Message"
          className="h-[100px] w-full resize-none rounded-[16px] border border-border-subtle bg-card p-4 text-[14px] text-foreground shadow-sm placeholder:text-foreground-dim focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </section>
    </AppShell>
  )
}
