'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Calendar, Check, CircleCheck, Inbox, MapPin, Zap } from 'lucide-react'
import { GuestGate } from '@/components/riff/GuestGate'
import { AppShell } from '@/components/riff/AppShell'
import { AudioClipPlayer } from '@/components/riff/AudioClipPlayer'
import { SubScreenHeader } from '@/components/riff/TopBar'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button, buttonClass } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { EmptyState } from '@/components/ui/EmptyState'
import { nextAvailableSlots } from '@/lib/availability'
import { cn } from '@/lib/cn'
import { formatShortDateTime } from '@/lib/datetime'
import { instrumentLabel, intentLabel, shortNeighborhood, vouchTagLabel } from '@/lib/labels'
import { vouchesFor } from '@/lib/reputation'
import {
  useCurrentUser,
  useIsGuest,
  useMusicianStats,
  useReputationContext,
  useRiffStore,
} from '@/lib/store'
import { getMusician, getVenue, venues } from '@/mocks'
import type { VouchTag } from '@/types'

/**
 * The incoming-request screen (docs/BUILD-PLAN.md P2-05, from 22-incoming-jam-request.html).
 *
 * This is the one screen where a confirmed jam can come into being: nothing is confirmed
 * until the recipient accepts (docs/SPEC.md §5.1), which is why Accept stays disabled until
 * a real time AND a real venue are chosen — a jam cannot be confirmed "somewhere".
 * All three exits from docs/SPEC.md §4.4 are here: accept, counter, decline politely.
 */
export function IncomingRequestView({ requestId }: { requestId: string }) {
  const guest = useIsGuest()
  const router = useRouter()
  // Read from the store, not the fixtures, so answering updates the Requests tab live.
  const requests = useRiffStore((s) => s.requests)
  const respondToRequest = useRiffStore((s) => s.respondToRequest)
  const viewerId = useRiffStore((s) => s.viewerId)
  const now = useRiffStore((s) => s.now)
  const ctx = useReputationContext()
  const currentUser = useCurrentUser()

  const request = requests.find((r) => r.id === requestId)
  const from = request ? getMusician(request.fromId) : undefined
  const stats = useMusicianStats(request?.fromId ?? '')
  const venue = request?.venueId ? getVenue(request.venueId) : undefined

  const [selectedTime, setSelectedTime] = useState(() => request?.proposedTimes[0] ?? '')
  const [selectedVenueId, setSelectedVenueId] = useState(() => request?.venueId)
  const [counterOpen, setCounterOpen] = useState(false)
  const [counterTimes, setCounterTimes] = useState<string[]>([])
  // Local terminal states — after answering, the store status flips, and these keep the
  // confirmation on screen instead of dropping straight into the "already settled" guard.
  const [outcome, setOutcome] = useState<'countered' | 'declined' | null>(null)
  // One answer in flight at a time; remembering WHICH button is busy keeps the others honest.
  const [busy, setBusy] = useState<'accept' | 'counter' | 'decline' | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Counter-proposals come from the viewer's OWN grid — they are saying when THEY are free.
  const mySlots = useMemo(
    () => (currentUser ? nextAvailableSlots(currentUser.availability, now, 3) : []),
    [currentUser, now],
  )

  // What co-attendees have actually said about the requester, most-said first.
  const topTags = useMemo(() => {
    if (!request) return []
    const counts = new Map<VouchTag, number>()
    for (const vouch of vouchesFor(request.fromId, ctx)) {
      for (const tag of vouch.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4)
  }, [request, ctx])

  // A guest reached an account-only screen — gate after all hooks, before any request UI.
  if (guest) return <GuestGate feature="reply to jam requests" backHref="/jams" />

  const header = <SubScreenHeader title="Jam request" backHref="/jams?tab=requests" />

  // Only the recipient answers a request. The sender opening their own by URL sees its state,
  // not the accept controls — product rule 1 also holds in the store, this is the honest UI.
  if (request && request.toId !== viewerId) {
    return (
      <AppShell activeTab="jams" header={header} mainClassName="flex items-center px-4 py-6">
        <EmptyState
          className="w-full"
          icon={<Inbox size={22} />}
          title="This one is waiting on them"
          body={`You sent this request${from ? ` to ${from.name}` : ''}. Nothing is confirmed until they accept.`}
          action={
            <Link
              href="/jams?tab=requests"
              className={buttonClass({ size: 'sm', variant: 'secondary' })}
            >
              Back to requests
            </Link>
          }
        />
      </AppShell>
    )
  }

  if (!request || !from) {
    return (
      <AppShell activeTab="jams" header={header} mainClassName="flex items-center px-4 py-6">
        <EmptyState
          className="w-full"
          icon={<Inbox size={22} />}
          title="Request not found"
          body="This request is not waiting on you, or the link is out of date."
          action={
            <Link
              href="/jams?tab=requests"
              className={buttonClass({ variant: 'secondary', size: 'sm' })}
            >
              Back to requests
            </Link>
          }
        />
      </AppShell>
    )
  }

  if (outcome === 'countered') {
    return (
      <AppShell activeTab="jams" header={header} mainClassName="px-4 py-8">
        <SentState
          title="Suggestion sent"
          body={`${from.name.split(' ')[0]} will see the times you're free. Nothing is confirmed until you both land on one.`}
        />
      </AppShell>
    )
  }

  if (outcome === 'declined') {
    return (
      <AppShell activeTab="jams" header={header} mainClassName="px-4 py-8">
        <SentState
          title="Declined politely"
          body="You said no politely — a templated note was sent. A good no keeps the door open."
        />
      </AppShell>
    )
  }

  // Already settled in an earlier visit (or seeded that way): say how, and offer the exits.
  if (request.status !== 'pending') {
    const settled =
      request.status === 'accepted'
        ? {
            title: 'You accepted this one',
            body: `You said yes to ${from.name.split(' ')[0]} and it became a confirmed jam.`,
          }
        : request.status === 'declined'
          ? {
              title: 'You already declined',
              body: 'You said no politely — a templated note was sent.',
            }
          : request.status === 'counter-proposed'
            ? {
                title: 'You suggested another time',
                body: `Waiting to hear back from ${from.name.split(' ')[0]}. Nothing is confirmed until you both agree on a time.`,
              }
            : {
                title: 'This request expired',
                body: 'It went unanswered for too long. You can always start a new one from their profile.',
              }
    return (
      <AppShell activeTab="jams" header={header} mainClassName="flex items-center px-4 py-6">
        <EmptyState
          className="w-full"
          icon={<Inbox size={22} />}
          title={settled.title}
          body={settled.body}
          action={
            <div className="flex gap-2">
              {request.status === 'accepted' && request.jamId && (
                <Link href={`/jams/${request.jamId}`} className={buttonClass({ size: 'sm' })}>
                  See the jam
                </Link>
              )}
              <Link href="/jams" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
                Back to your jams
              </Link>
            </div>
          }
        />
      </AppShell>
    )
  }

  const canAccept = Boolean(selectedTime) && Boolean(selectedVenueId)

  async function handleAccept() {
    if (!request || !selectedTime || !selectedVenueId || busy) return
    setBusy('accept')
    setError(null)
    try {
      const { jamId } = await respondToRequest({
        requestId: request.id,
        action: 'accept',
        startsAt: selectedTime,
        venueId: selectedVenueId,
      })
      // Stay busy through the navigation — the confirmed jam screen is the confirmation.
      if (jamId) router.push(`/jams/${jamId}`)
      else setBusy(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong — try again')
      setBusy(null)
    }
  }

  async function handleCounter() {
    if (!request || counterTimes.length === 0 || busy) return
    setBusy('counter')
    setError(null)
    try {
      await respondToRequest({ requestId: request.id, action: 'counter', counterTimes })
      setOutcome('countered')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong — try again')
    } finally {
      setBusy(null)
    }
  }

  async function handleDecline() {
    if (!request || busy) return
    setBusy('decline')
    setError(null)
    try {
      await respondToRequest({ requestId: request.id, action: 'decline' })
      setOutcome('declined')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong — try again')
    } finally {
      setBusy(null)
    }
  }

  return (
    <AppShell activeTab="jams" header={header} mainClassName="px-4 py-6">
      {/* Requester card */}
      <Card className="flex flex-col gap-5 p-5">
        <div className="flex items-center gap-4">
          <Avatar src={from.avatarUrl} name={from.name} size="xl" className="h-16 w-16 shadow-sm" />
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-serif text-[18px] font-bold text-foreground">
              {from.name}
            </h2>
            <p className="text-[14px] text-foreground-dim">
              {instrumentLabel(from.instruments[0])}
              {stats && (stats.isNew ? ' · new here' : ` · ${stats.reliabilityPct}% reliability`)}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {from.verified && (
                <span className="flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                  <CircleCheck size={10} strokeWidth={3} /> Verified
                </span>
              )}
              {stats && (
                <span className="text-[12px] text-foreground-dim">
                  {stats.vouchCount} vouches · {stats.repeatJams} repeats
                </span>
              )}
            </div>
          </div>
        </div>

        <blockquote className="rounded-[12px] bg-surface-muted p-4 text-center">
          <p className="text-[14.5px] italic leading-relaxed text-muted-foreground">
            “{request.message}”
          </p>
        </blockquote>

        <div className="h-px w-full bg-border-hairline" />

        <div className="flex flex-col gap-4">
          {/* WHEN — their proposed slots; picking one is part of accepting. */}
          <div className="flex items-start gap-3">
            <DetailIcon>
              <Calendar size={14} />
            </DetailIcon>
            <div className="min-w-0 flex-1">
              <DetailLabel>When</DetailLabel>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {request.proposedTimes.map((time) => (
                  <Chip
                    key={time}
                    selected={selectedTime === time}
                    onClick={() => setSelectedTime(time)}
                  >
                    {formatShortDateTime(time)}
                  </Chip>
                ))}
              </div>
            </div>
          </div>

          {/* WHERE — neighbourhood only. The jam is not confirmed yet, so no address exists
              to show (docs/SPEC.md §5.2). */}
          <div className="flex items-start gap-3">
            <DetailIcon>
              <MapPin size={14} />
            </DetailIcon>
            <div className="min-w-0 flex-1">
              <DetailLabel>Where</DetailLabel>
              {venue ? (
                <p className="mt-0.5 text-[15px] font-medium text-foreground">
                  {venue.name}, {shortNeighborhood(venue.neighborhood)} · {venue.distanceMi} mi
                </p>
              ) : (
                <>
                  {request.venueSuggestion && (
                    <p className="mt-0.5 text-[14px] italic text-muted-foreground">
                      “{request.venueSuggestion}”
                    </p>
                  )}
                  {/* No venue on the request — a confirmed jam needs a real one, so the
                      chips gate Accept. */}
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {venues.map((v) => (
                      <Chip
                        key={v.id}
                        selected={selectedVenueId === v.id}
                        onClick={() => setSelectedVenueId(v.id)}
                      >
                        {v.name} · {shortNeighborhood(v.neighborhood)}
                      </Chip>
                    ))}
                  </div>
                  <p className="mt-1.5 text-[12px] text-foreground-dim">
                    Pick a spot to accept — a confirmed jam needs a real venue.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* VIBE */}
          <div className="flex items-start gap-3">
            <DetailIcon>
              <Zap size={14} />
            </DetailIcon>
            <div className="min-w-0 flex-1">
              <DetailLabel>Vibe</DetailLabel>
              <div className="mt-1.5">
                <Badge tone="primary">{intentLabel(request.intent)}</Badge>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Their clip + what people they played with actually said about them. */}
      {(from.clip || topTags.length > 0) && (
        <Card className="mt-4 flex flex-col gap-3 bg-surface-muted p-4">
          {from.clip && <AudioClipPlayer clip={from.clip} label={`${from.name}'s clip`} />}
          {topTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {topTags.map(([tag, count]) => (
                <span
                  key={tag}
                  className="rounded-full bg-card px-3 py-1 text-[12px] font-medium text-primary"
                >
                  {vouchTagLabel(tag)} ×{count}
                </span>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* The three answers — every one of them works, and two of them are ways out
          (docs/SPEC.md §4.4). */}
      <div className="mt-6 flex flex-col gap-3">
        {error && (
          <p role="alert" className="text-center text-[12.5px] text-destructive">
            {error}
          </p>
        )}
        <Button fullWidth disabled={!canAccept || busy !== null} onClick={handleAccept}>
          {busy === 'accept' ? 'Confirming…' : 'Accept and confirm'}
        </Button>

        <Button fullWidth variant="secondary" onClick={() => setCounterOpen((o) => !o)}>
          Suggest another time
        </Button>

        {counterOpen && (
          <Card className="p-4">
            <p className="mb-3 text-[13px] text-foreground">
              When are you free? They&apos;ll get to pick.
            </p>
            {mySlots.length === 0 ? (
              <p className="text-[13px] text-foreground-dim">
                Your availability grid is empty — fill it in on your profile to suggest times.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {mySlots.map((slot) => (
                  <Chip
                    key={slot.startsAt}
                    selected={counterTimes.includes(slot.startsAt)}
                    onClick={() =>
                      setCounterTimes((times) =>
                        times.includes(slot.startsAt)
                          ? times.filter((t) => t !== slot.startsAt)
                          : [...times, slot.startsAt],
                      )
                    }
                  >
                    {slot.label}
                  </Chip>
                ))}
              </div>
            )}
            <Button
              fullWidth
              size="sm"
              className="mt-4"
              disabled={counterTimes.length === 0 || busy !== null}
              onClick={handleCounter}
            >
              {busy === 'counter' ? 'Sending…' : 'Send suggestion'}
            </Button>
          </Card>
        )}

        <button
          type="button"
          disabled={busy !== null}
          onClick={handleDecline}
          className="w-full py-3 text-[14px] font-medium text-foreground-dim transition-transform active:scale-95 disabled:opacity-50"
        >
          {busy === 'decline' ? 'Declining…' : 'Decline politely'}
        </button>
      </div>
    </AppShell>
  )
}

/** The gentle full-screen confirmation after countering or declining. */
function SentState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center pt-10 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success-soft text-success">
        <Check size={22} strokeWidth={3} />
      </div>
      <h2 className="mb-2 font-serif text-[28px] font-bold text-foreground">{title}</h2>
      <p className="mb-8 max-w-[280px] text-[14px] text-foreground-dim">{body}</p>
      <Link
        href="/jams"
        className={cn(
          buttonClass({ variant: 'secondary', fullWidth: true }),
          'w-full max-w-[280px]',
        )}
      >
        Back to your jams
      </Link>
    </div>
  )
}

function DetailIcon({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-primary">
      {children}
    </div>
  )
}

function DetailLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-primary">
      {children}
    </span>
  )
}
