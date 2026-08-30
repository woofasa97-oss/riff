'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, Plus } from 'lucide-react'
import { AppShell, StickyActionBar } from '@/components/riff/AppShell'
import { InstrumentPicker } from '@/components/riff/InstrumentPicker'
import { SubScreenHeader } from '@/components/riff/TopBar'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { cn } from '@/lib/cn'
import { formatShortDateTime, formatTime, relativeDayLabel } from '@/lib/datetime'
import { instrumentLabel, intentLabel, shortNeighborhood } from '@/lib/labels'
import { useCurrentUser, useRiffStore } from '@/lib/store'
import { getVenue, listNearbyMusicians, venues } from '@/mocks'
import type { Instrument, Intent, Jam } from '@/types'

type Mode = 'open' | 'invite'

const INTENTS: Intent[] = ['casual', 'serious', 'gigging']

/** Evening starts plus the one afternoon slot the reference offers. Hours, not strings — the
 * chip labels come from formatTime so they render in the app's fixed zone. */
const TIME_HOURS = [19, 20, 21, 14]

const DURATIONS = [1, 2, 3]

/**
 * "2026-09-02" + 19 → "2026-09-02T19:00:00-04:00". The fixture world lives in
 * America/New_York daylight time, so the offset is fixed — same composition as
 * nextAvailableSlots in src/lib/availability.ts.
 */
const startsAtFor = (dateKey: string, hour: number) =>
  `${dateKey}T${String(hour).padStart(2, '0')}:00:00-04:00`

export function PostJamView() {
  const router = useRouter()
  const me = useCurrentUser()
  const postJam = useRiffStore((s) => s.postJam)
  const now = useRiffStore((s) => s.now)
  const allMusicians = useRiffStore((s) => s.musicians)

  const [mode, setMode] = useState<Mode>('open')
  const [title, setTitle] = useState('')
  const [roles, setRoles] = useState<Instrument[]>([])
  const [intent, setIntent] = useState<Intent>('casual')
  const [dateKey, setDateKey] = useState<string | null>(null)
  const [hour, setHour] = useState<number | null>(null)
  const [duration, setDuration] = useState(2)
  const [venueId, setVenueId] = useState<string | null>(null)
  const [choosingVenue, setChoosingVenue] = useState(false)
  const [invitedIds, setInvitedIds] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [posted, setPosted] = useState<Jam | null>(null)
  const [busy, setBusy] = useState<'draft' | 'post' | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Store-fed so freshly signed-up players are invitable without a reload.
  const nearby = useMemo(
    () => listNearbyMusicians({ viewerId: me.id }, allMusicians),
    [me.id, allMusicians],
  )
  const invited = useMemo(
    () => nearby.filter((m) => invitedIds.includes(m.id)),
    [nearby, invitedIds],
  )

  // The next 7 days off the server clock, keyed by their zoned calendar date.
  const days = useMemo(() => {
    const nowMs = Date.parse(now)
    const dateFmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    const weekdayFmt = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      weekday: 'short',
    })
    const dayNumFmt = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      day: 'numeric',
    })
    return Array.from({ length: 7 }, (_, offset) => {
      const d = new Date(nowMs + offset * 86_400_000)
      const key = dateFmt.format(d)
      const label =
        offset <= 1 ? relativeDayLabel(`${key}T12:00:00-04:00`, now) : weekdayFmt.format(d)
      return { key, label, dayNum: dayNumFmt.format(d) }
    })
  }, [now])

  // Validation in the order the form reads; the first missing thing is named under the button.
  const missing =
    title.trim().length === 0
      ? 'Add a title first'
      : mode === 'open' && roles.length === 0
        ? 'Pick at least one role you need'
        : !venueId
          ? 'Choose a venue'
          : !dateKey || hour === null
            ? 'Pick a date and a time'
            : mode === 'invite' && invitedIds.length === 0
              ? 'Pick at least one person to invite'
              : null

  function pickDay(key: string) {
    setDateKey(key)
    // A time already chosen can be in the past once "Today" is picked — clear it, never lie.
    if (hour !== null && Date.parse(startsAtFor(key, hour)) <= Date.parse(now)) setHour(null)
  }

  async function submit(asDraft: boolean) {
    if (busy || missing || !dateKey || hour === null || !venueId) return
    setBusy(asDraft ? 'draft' : 'post')
    setError(null)
    try {
      // Posting never confirms anything: the server files this as pending (or draft), and only
      // acceptances move it forward — product rule 1.
      const jam = await postJam({
        title: title.trim(),
        intent,
        isOpenCall: mode === 'open',
        openSeats: roles,
        startsAt: startsAtFor(dateKey, hour),
        durationHours: duration,
        venueId,
        message: message.trim() || undefined,
        invitedIds: mode === 'invite' ? invitedIds : [],
        asDraft,
      })
      // Stay busy on success — a re-enabled button during navigation invites a double post.
      if (asDraft) router.push('/jams')
      else setPosted(jam)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong — try again')
      setBusy(null)
    }
  }

  // ---- Posted: say where it went and what is (not) confirmed. ---------------
  if (posted) {
    const postedVenue = getVenue(posted.venueId)
    const invitedCount = posted.attendees.filter((a) => a.rsvp === 'pending').length
    const linkClass =
      'flex h-[48px] flex-1 items-center justify-center rounded-[12px] text-[15px] font-medium transition-transform active:scale-95'
    return (
      <AppShell
        activeTab="jams"
        header={<SubScreenHeader title="Post a jam" backHref="/jams" />}
        mainClassName="flex flex-col justify-center px-4 py-8"
        footer={
          <StickyActionBar>
            {posted.isOpenCall ? (
              <>
                <Link href="/jams" className={cn(linkClass, 'bg-surface-muted text-foreground')}>
                  Your jams
                </Link>
                <Link
                  href="/discover"
                  className={cn(linkClass, 'bg-primary text-primary-foreground')}
                >
                  See it on Discover
                </Link>
              </>
            ) : (
              <Link href="/jams" className={cn(linkClass, 'bg-primary text-primary-foreground')}>
                Back to your jams
              </Link>
            )}
          </StickyActionBar>
        }
      >
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success-soft text-success">
            <Check size={22} strokeWidth={3} />
          </div>
          <h2 className="mb-2 font-serif text-[28px] font-bold text-foreground">
            {posted.isOpenCall ? 'Open call posted' : 'Invites sent'}
          </h2>
          <p className="text-[14px] text-foreground-dim">
            {posted.title}
            {postedVenue ? ` · ${postedVenue.name}` : ''} · {formatShortDateTime(posted.startsAt)}
          </p>
          <p className="mx-auto mt-4 max-w-[280px] text-[13px] text-foreground-dim">
            {posted.isOpenCall
              ? 'It is on Discover now. People nearby can apply for the seats you listed, and nothing is confirmed until you accept someone.'
              : `Sent to ${invitedCount} ${invitedCount === 1 ? 'person' : 'people'}. Nothing is confirmed until they accept — replies land on your jams.`}
          </p>
        </div>
      </AppShell>
    )
  }

  // ---- The form. ------------------------------------------------------------
  const venue = venueId ? getVenue(venueId) : undefined
  const showVenueList = !venue || choosingVenue

  return (
    <AppShell
      activeTab="jams"
      header={<SubScreenHeader title="Post a jam" backHref="/jams" />}
      mainClassName="px-4 py-6"
      footer={
        <StickyActionBar
          note={
            error ? (
              <span className="text-destructive">{error}</span>
            ) : (
              (missing ??
              (mode === 'invite'
                ? 'Nothing is confirmed until they accept.'
                : 'Your open call shows on Discover until the seats fill.'))
            )
          }
        >
          <Button
            variant="secondary"
            className="flex-1"
            disabled={!!missing || busy !== null}
            onClick={() => void submit(true)}
          >
            {busy === 'draft' ? 'Saving…' : 'Save draft'}
          </Button>
          <Button
            className="flex-1"
            disabled={!!missing || busy !== null}
            onClick={() => void submit(false)}
          >
            {busy === 'post' ? 'Posting…' : mode === 'open' ? 'Post open call' : 'Send invites'}
          </Button>
        </StickyActionBar>
      }
    >
      <div
        role="group"
        aria-label="Open call or private invite"
        className="mb-6 flex rounded-full border border-border-subtle bg-card p-1 shadow-sm"
      >
        {(
          [
            ['open', 'Open call'],
            ['invite', 'Private invite'],
          ] as const
        ).map(([m, label]) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={mode === m}
            onClick={() => setMode(m)}
            className={cn(
              'h-[40px] flex-1 rounded-full text-[14px] font-semibold transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              mode === m ? 'bg-primary text-primary-foreground' : 'bg-transparent text-foreground',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <section className="mb-6">
        <SectionHeader>What are you looking for</SectionHeader>
        <Card className="p-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="Title"
            placeholder="Looking for Keys for a Neo-Soul Session"
            className="w-full rounded-[12px] border border-border-subtle bg-background px-4 py-3 text-[14px] text-foreground placeholder:text-foreground-dim focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <InstrumentPicker
            className="mt-4"
            selected={roles}
            onToggle={(instrument) =>
              setRoles((current) =>
                current.includes(instrument)
                  ? current.filter((i) => i !== instrument)
                  : [...current, instrument],
              )
            }
          />
          {mode === 'invite' && (
            <p className="mt-3 text-[12px] text-foreground-dim">
              These become the open seats alongside the people you invite.
            </p>
          )}
        </Card>
      </section>

      <section className="mb-6">
        <SectionHeader>Vibe</SectionHeader>
        <Card className="p-4">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Vibe">
            {INTENTS.map((i) => (
              <Chip key={i} selected={intent === i} onClick={() => setIntent(i)}>
                {intentLabel(i)}
              </Chip>
            ))}
          </div>
        </Card>
      </section>

      <section className="mb-6">
        <SectionHeader>When</SectionHeader>
        <Card className="flex flex-col gap-4 p-4">
          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {days.map((d) => {
              const on = dateKey === d.key
              return (
                <button
                  key={d.key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => pickDay(d.key)}
                  className={cn(
                    'flex h-[56px] min-w-[64px] shrink-0 flex-col items-center justify-center rounded-[12px] border px-2 transition-transform active:scale-95',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    on
                      ? 'border-primary bg-[color:var(--hero-from)] text-primary'
                      : 'border-border-subtle bg-card text-foreground',
                  )}
                >
                  <span className="text-[13px] font-bold">{d.label}</span>
                  <span className={cn('text-[11px]', on ? 'text-primary' : 'text-foreground-dim')}>
                    {d.dayNum}
                  </span>
                </button>
              )
            })}
          </div>
          <div>
            <p className="mb-2 text-[12px] font-medium text-foreground-dim">Start time</p>
            <div className="flex flex-wrap gap-2">
              {TIME_HOURS.map((h) => {
                // On "Today" an afternoon slot can already be behind the clock — offer no past.
                const past =
                  dateKey !== null && Date.parse(startsAtFor(dateKey, h)) <= Date.parse(now)
                return (
                  <Chip
                    key={h}
                    selected={hour === h}
                    disabled={past}
                    onClick={() => setHour(h)}
                    className="disabled:pointer-events-none disabled:opacity-40"
                  >
                    {formatTime(startsAtFor(days[0].key, h))}
                  </Chip>
                )
              })}
            </div>
          </div>
          <div>
            <p className="mb-2 text-[12px] font-medium text-foreground-dim">How long</p>
            <div className="flex flex-wrap gap-2">
              {DURATIONS.map((d) => (
                <Chip key={d} selected={duration === d} onClick={() => setDuration(d)}>
                  {d}h
                </Chip>
              ))}
            </div>
          </div>
        </Card>
      </section>

      <section className="mb-6">
        <SectionHeader>Where</SectionHeader>
        {/* Neighbourhood, never address — the exact address only ever shows on a confirmed jam. */}
        {showVenueList ? (
          <Card className="overflow-hidden">
            {venues.map((v, i) => (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  setVenueId(v.id)
                  setChoosingVenue(false)
                }}
                className={cn(
                  'flex w-full items-center justify-between gap-3 p-4 text-left transition-colors active:bg-surface-muted',
                  i < venues.length - 1 && 'border-b border-border-hairline',
                )}
              >
                <div className="min-w-0">
                  <div className="truncate font-serif text-[15px] font-bold text-foreground">
                    {v.name}
                  </div>
                  <div className="mt-0.5 text-[12px] text-foreground-dim">
                    {shortNeighborhood(v.neighborhood)} · {v.distanceMi} mi
                  </div>
                </div>
                {venueId === v.id ? (
                  <Check size={16} className="shrink-0 text-primary" />
                ) : (
                  <span className="shrink-0 text-[13px] font-semibold text-primary">Pick</span>
                )}
              </button>
            ))}
          </Card>
        ) : (
          <Card className="p-4">
            <div className="flex items-center gap-3 rounded-[12px] bg-[color:var(--hero-from)] p-3">
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-serif text-[15px] font-bold text-foreground">
                  {venue.name}
                </span>
                <span className="mt-0.5 truncate text-[12px] text-foreground-dim">
                  {shortNeighborhood(venue.neighborhood)} · {venue.distanceMi} mi
                </span>
              </div>
              <button
                type="button"
                onClick={() => setChoosingVenue(true)}
                className="shrink-0 px-2 text-[14px] font-semibold text-primary transition-transform active:scale-95"
              >
                Change
              </button>
            </div>
          </Card>
        )}
      </section>

      {mode === 'invite' && (
        <section className="mb-6">
          <SectionHeader>Who is already in</SectionHeader>
          <Card className="p-4">
            <div className="no-scrollbar flex gap-5 overflow-x-auto pb-3">
              {/* The host is always in — you cannot invite yourself out. */}
              <div className="flex w-[64px] shrink-0 flex-col items-center gap-2">
                <Avatar src={me.avatarUrl} name={me.name} size="xl" />
                <span className="text-center text-[11px] leading-tight text-foreground">
                  You
                  {me.instruments[0] && (
                    <>
                      <br />
                      <span className="text-foreground-dim">
                        {instrumentLabel(me.instruments[0]).toLowerCase()}
                      </span>
                    </>
                  )}
                </span>
              </div>
              {invited.map((m) => (
                <div key={m.id} className="flex w-[64px] shrink-0 flex-col items-center gap-2">
                  <Avatar src={m.avatarUrl} name={m.name} size="xl" />
                  <span className="text-center text-[11px] leading-tight text-foreground">
                    {m.name.split(' ')[0]}
                    {m.instruments[0] && (
                      <>
                        <br />
                        <span className="text-foreground-dim">
                          {instrumentLabel(m.instruments[0]).toLowerCase()}
                        </span>
                      </>
                    )}
                  </span>
                </div>
              ))}
              {/* Open seats mirror the roles wanted above. */}
              {roles.map((role) => (
                <div key={role} className="flex w-[64px] shrink-0 flex-col items-center gap-2">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-primary bg-[color:var(--hero-from)] text-primary">
                    <Plus size={16} />
                  </div>
                  <span className="text-center text-[11px] font-medium leading-tight text-primary">
                    {instrumentLabel(role)}
                    <br />
                    <span className="font-normal text-foreground-dim">open seat</span>
                  </span>
                </div>
              ))}
            </div>
            <p className="mb-2 text-[12px] font-medium text-foreground-dim">Invite people nearby</p>
            <div className="flex flex-wrap gap-2">
              {nearby.map((m) => {
                const on = invitedIds.includes(m.id)
                return (
                  <button
                    key={m.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      setInvitedIds((ids) =>
                        on ? ids.filter((id) => id !== m.id) : [...ids, m.id],
                      )
                    }
                    className={cn(
                      'flex shrink-0 items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-[13px] font-medium transition-transform active:scale-95',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      on
                        ? 'border-primary bg-[color:var(--hero-from)] text-primary'
                        : 'border-border-subtle bg-card text-foreground',
                    )}
                  >
                    <Avatar src={m.avatarUrl} name={m.name} size="sm" ring={false} />
                    <span className="max-w-[96px] truncate">{m.name.split(' ')[0]}</span>
                    {on && <Check size={12} strokeWidth={3} />}
                  </button>
                )
              })}
            </div>
          </Card>
        </section>
      )}

      <section className="mb-2">
        <SectionHeader>Message</SectionHeader>
        <Card className="p-4">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            aria-label="Message"
            placeholder="We have a drummer and bassist. Just looking for some tasty Rhodes/Synth textures to fill out the sound. Very casual."
            className="w-full resize-none rounded-[12px] border border-border-subtle bg-background px-4 py-3 text-[14px] leading-relaxed text-foreground placeholder:text-foreground-dim focus:outline-none focus:ring-1 focus:ring-ring"
          />
          {mode === 'open' && (
            <p className="mt-2 text-[12px] text-foreground-dim">
              This is the quote people see on your open call.
            </p>
          )}
        </Card>
      </section>
    </AppShell>
  )
}
