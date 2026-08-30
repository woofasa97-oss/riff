'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Check, ChevronRight, Flag, Lock, MapPinned, ShieldCheck } from 'lucide-react'
import { AppShell, StickyActionBar } from '@/components/riff/AppShell'
import { AttendeeRow } from '@/components/riff/AttendeeRow'
import { ReportSheet } from '@/components/riff/ReportSheet'
import { SubScreenHeader } from '@/components/riff/TopBar'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button, buttonClass } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { cn } from '@/lib/cn'
import { formatDayAndTime, formatTime, isSameDay } from '@/lib/datetime'
import {
  directionsHref,
  intentLabel,
  jamStatusLabel,
  playerLabel,
  shortNeighborhood,
} from '@/lib/labels'
import { jamLocationLines } from '@/lib/privacy'
import { statsFor, useReputationContext, useRiffStore } from '@/lib/store'
import { getMusician, getVenue, listLiveSessions, listMessages } from '@/mocks'
import type { Jam } from '@/types'

/** "Go live" only means something while the session is actually happening. */
function isLiveWindow(jam: Jam, now: string): boolean {
  const start = Date.parse(jam.startsAt)
  const nowMs = Date.parse(now)
  return nowMs >= start - 30 * 60_000 && nowMs <= start + jam.durationHours * 3_600_000
}

export function JamDetailsView({ jamId }: { jamId: string }) {
  const viewerId = useRiffStore((s) => s.viewerId)
  const now = useRiffStore((s) => s.now)
  const jams = useRiffStore((s) => s.jams)
  const threads = useRiffStore((s) => s.threads)
  const messages = useRiffStore((s) => s.messages)
  const withdrawFromJam = useRiffStore((s) => s.withdrawFromJam)
  const applications = useRiffStore((s) => s.applications)
  const acceptApplicant = useRiffStore((s) => s.acceptApplicant)
  const respondToInvite = useRiffStore((s) => s.respondToInvite)
  const ctx = useReputationContext()
  const [confirmingExit, setConfirmingExit] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)
  const [withdrawError, setWithdrawError] = useState<string | null>(null)
  const [busyApplicant, setBusyApplicant] = useState<string | null>(null)
  const [applicantError, setApplicantError] = useState<string | null>(null)
  const [inviteBusy, setInviteBusy] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [reportOpen, setReportOpen] = useState(false)

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
            <Link href="/jams" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
              Back to your jams
            </Link>
          }
        />
      </AppShell>
    )
  }

  const location = jamLocationLines(jam, venue, viewerId)
  // The group conversation belongs to the people on the jam. A viewer browsing someone
  // else's open call is not in it, and a draft has no thread yet.
  const threadExists = threads.some((t) => t.id === jam.threadId)
  const inConversation =
    threadExists && jam.attendees.some((a) => a.musicianId === viewerId && a.rsvp !== 'declined')
  const me = jam.attendees.find((a) => a.musicianId === viewerId)
  const attending = me?.rsvp === 'confirmed'
  const isHost = jam.hostId === viewerId
  // The host's snapshot carries applications to their own jams — surface the pending ones so the
  // open call can actually be answered.
  const pendingApplicants = applications.filter(
    (a) => a.jamId === jam.id && a.status === 'pending',
  )
  // A pending seat means the viewer was invited and hasn't answered yet.
  const invited = me?.rsvp === 'pending'
  // "Go live" opens the broadcast only when one actually exists. Starting a stream is out of
  // scope for v1 (docs/SPEC.md §6), so the button stays disabled rather than pointing at nothing.
  const session = listLiveSessions().find((s) => s.jamId === jam.id)
  const liveNow = isLiveWindow(jam, now) && Boolean(session)
  const whenLabel = isSameDay(jam.startsAt, now)
    ? `Tonight ${formatTime(jam.startsAt)}`
    : formatDayAndTime(jam.startsAt)

  async function respondInvite(action: 'accept' | 'decline') {
    if (!jam || inviteBusy) return
    setInviteBusy(true)
    setInviteError(null)
    try {
      await respondToInvite(jam.id, action)
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Something went wrong — try again')
    } finally {
      setInviteBusy(false)
    }
  }

  async function acceptOne(applicantId: string) {
    if (!jam || busyApplicant) return
    setBusyApplicant(applicantId)
    setApplicantError(null)
    try {
      await acceptApplicant(jam.id, applicantId)
    } catch (err) {
      setApplicantError(err instanceof Error ? err.message : 'Something went wrong — try again')
    } finally {
      setBusyApplicant(null)
    }
  }

  return (
    <AppShell
      activeTab="jams"
      header={<SubScreenHeader title="Jam details" backHref="/jams" />}
      mainClassName="px-4 py-6"
      footer={
        <StickyActionBar>
          {inConversation ? (
            <Link
              href={`/messages/${jam.threadId}`}
              className="flex h-[48px] flex-1 items-center justify-center rounded-[12px] bg-surface-muted text-[15px] font-medium text-foreground transition-transform active:scale-95"
            >
              Message group
            </Link>
          ) : (
            <Button
              variant="secondary"
              className="flex-1"
              disabled
              title="You are not on this jam yet"
            >
              Message group
            </Button>
          )}
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
                isLiveWindow(jam, now)
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

      {/* INVITE RESPONSE — an invited player answers. Accepting can confirm the jam. */}
      {invited && (
        <section className="mb-8">
          <Card className="p-4">
            <h2 className="font-serif text-[16px] font-bold text-foreground">
              You’re invited to this jam
            </h2>
            <p className="mt-1 text-[13px] text-foreground-dim">
              {getMusician(jam.hostId)?.name ?? 'The host'} asked you to play. Let them know if
              you’re in — nothing’s locked until you say yes.
            </p>
            {inviteError && <p className="mt-2 text-[13px] text-destructive">{inviteError}</p>}
            <div className="mt-4 flex gap-3">
              <Button
                size="sm"
                variant="secondary"
                className="flex-1"
                disabled={inviteBusy}
                onClick={() => respondInvite('decline')}
              >
                Can’t make it
              </Button>
              <Button
                size="sm"
                className="flex-1"
                disabled={inviteBusy}
                onClick={() => respondInvite('accept')}
              >
                {inviteBusy ? 'Saving…' : 'I’m in'}
              </Button>
            </div>
          </Card>
        </section>
      )}

      {/* WHO IS COMING */}
      <section className="mb-8">
        <SectionHeader>Who is coming</SectionHeader>
        <Card className="overflow-hidden">
          {jam.attendees
            .filter((a) => a.rsvp !== 'declined')
            .map((attendee, index, list) => {
              const musician = getMusician(attendee.musicianId)
              if (!musician) return null
              const isYou = attendee.musicianId === viewerId
              return (
                <Link
                  key={attendee.musicianId}
                  href={isYou ? '/me' : `/musicians/${attendee.musicianId}`}
                  className="block"
                >
                  <AttendeeRow
                    name={musician.name}
                    avatarUrl={musician.avatarUrl}
                    instrument={attendee.instrument}
                    rsvp={attendee.rsvp}
                    stats={statsFor(attendee.musicianId, ctx)}
                    isYou={isYou}
                    className={index < list.length - 1 ? 'border-b border-border-hairline' : ''}
                  />
                </Link>
              )
            })}
        </Card>
        {jam.status !== 'confirmed' && (
          <p className="mt-3 px-1 text-[12px] text-foreground-dim">
            Nothing is confirmed until everyone accepts.
          </p>
        )}
      </section>

      {/* APPLICATIONS — only the host sees these; accepting seats the player in an open role. */}
      {isHost && jam.isOpenCall && (
        <section className="mb-8">
          <SectionHeader>
            {pendingApplicants.length > 0
              ? `Applicants (${pendingApplicants.length})`
              : 'Applicants'}
          </SectionHeader>
          {pendingApplicants.length === 0 ? (
            <p className="px-1 text-[13px] text-foreground-dim">
              No one’s applied yet. Open calls show up in Discover for players nearby.
            </p>
          ) : (
            <Card className="overflow-hidden">
              {pendingApplicants.map((app, index) => {
                const applicant = getMusician(app.applicantId)
                if (!applicant) return null
                const seatOpen = jam.openSeats.includes(app.instrument)
                return (
                  <div
                    key={app.id}
                    className={cn(
                      'flex items-center gap-3 p-3',
                      index < pendingApplicants.length - 1 && 'border-b border-border-hairline',
                    )}
                  >
                    <Link href={`/musicians/${applicant.id}`} className="shrink-0">
                      <Avatar src={applicant.avatarUrl} name={applicant.name} size="md" />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/musicians/${applicant.id}`}
                        className="block truncate font-serif text-[14px] font-bold text-foreground"
                      >
                        {applicant.name}
                      </Link>
                      <div className="truncate text-[12px] text-foreground-dim">
                        for {playerLabel(app.instrument)}
                        {!seatOpen && ' · role filled'}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="shrink-0"
                      disabled={!seatOpen || busyApplicant !== null}
                      onClick={() => acceptOne(app.applicantId)}
                    >
                      {busyApplicant === app.applicantId ? 'Adding…' : seatOpen ? 'Accept' : 'Filled'}
                    </Button>
                  </div>
                )
              })}
            </Card>
          )}
          {applicantError && (
            <p className="mt-2 px-1 text-[13px] text-destructive">{applicantError}</p>
          )}
        </section>
      )}

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
          {location.exact && jam.revealedAddress && (
            <a
              href={directionsHref(`${jam.revealedAddress}, ${venue.city}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex shrink-0 items-center gap-1 text-[14px] font-medium text-primary"
            >
              Directions <ChevronRight size={12} />
            </a>
          )}
        </Card>
        {/* Guidance lands exactly where people arrange to meet — only once the jam is real. */}
        {jam.status === 'confirmed' && (
          <Link
            href="/me/safety"
            className="mt-3 flex items-center gap-3 rounded-[12px] border border-border-subtle bg-surface-muted px-4 py-3"
          >
            <ShieldCheck size={18} className="shrink-0 text-primary" />
            <span className="min-w-0 flex-1 text-[13px] text-foreground">
              Meeting someone new? A few safety tips
            </span>
            <ChevronRight size={14} className="shrink-0 text-foreground-dim" />
          </Link>
        )}
      </section>

      {/* THREAD */}
      <section className="mb-8">
        <SectionHeader
          action={
            inConversation ? (
              <Link
                href={`/messages/${jam.threadId}`}
                className="text-[13px] font-medium text-primary"
              >
                View all
              </Link>
            ) : undefined
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
              {withdrawError && (
                <p className="mt-2 text-[13px] text-destructive">{withdrawError}</p>
              )}
              <div className="mt-4 flex gap-3">
                <Button
                  size="sm"
                  variant="secondary"
                  className="flex-1"
                  disabled={withdrawing}
                  onClick={() => setConfirmingExit(false)}
                >
                  Stay in
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-destructive"
                  disabled={withdrawing}
                  onClick={async () => {
                    setWithdrawing(true)
                    setWithdrawError(null)
                    try {
                      await withdrawFromJam(jam.id)
                      setConfirmingExit(false)
                    } catch (err) {
                      setWithdrawError(
                        err instanceof Error ? err.message : 'Something went wrong — try again',
                      )
                    } finally {
                      setWithdrawing(false)
                    }
                  }}
                >
                  {withdrawing ? 'Dropping out…' : 'Yes, drop out'}
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

      {/* Every meeting point needs a way to flag trouble — routes to out-of-band review. */}
      <div className="pb-1 pt-4">
        <button
          type="button"
          onClick={() => setReportOpen(true)}
          className="mx-auto flex items-center gap-1.5 px-2 py-1 text-[13px] font-medium text-foreground-dim"
        >
          <Flag size={13} />
          Report a problem
        </button>
      </div>

      <ReportSheet
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        jamId={jam.id}
        subjectLabel={jam.title}
      />
    </AppShell>
  )
}
