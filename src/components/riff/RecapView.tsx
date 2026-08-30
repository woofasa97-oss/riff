'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowUpRight, Check } from 'lucide-react'
import { AppShell, StickyActionBar } from '@/components/riff/AppShell'
import { AttendanceToggle } from '@/components/riff/AttendanceToggle'
import { SubScreenHeader } from '@/components/riff/TopBar'
import { VouchTagPicker } from '@/components/riff/VouchTagPicker'
import { WaveformPlayer } from '@/components/riff/WaveformPlayer'
import { Avatar } from '@/components/ui/Avatar'
import { Button, buttonClass } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Toggle } from '@/components/ui/Toggle'
import { formatDurationMinutes } from '@/lib/datetime'
import { spellNumber } from '@/lib/labels'
import { canVouch, hasUnanimousConsent } from '@/lib/privacy'
import { statsFor, useReputationContext, useRiffStore } from '@/lib/store'
import { peaksFor } from '@/lib/waveform'
import { getMusician, getRecording, getVenue } from '@/mocks'
import type { MusicianStats, RecapVouch, VouchTag } from '@/types'

type Verdict = 'yes' | 'no'

export function RecapView({ jamId }: { jamId: string }) {
  const router = useRouter()
  const viewerId = useRiffStore((s) => s.viewerId)
  const jams = useRiffStore((s) => s.jams)
  const consents = useRiffStore((s) => s.recordingConsents)
  const postRecap = useRiffStore((s) => s.postRecap)
  const setRecordingConsent = useRiffStore((s) => s.setRecordingConsent)
  const ctx = useReputationContext()

  const jam = jams.find((j) => j.id === jamId)
  const venue = jam ? getVenue(jam.venueId) : undefined

  /** Everyone confirmed on the jam except you. Only they can be marked or vouched for. */
  const coAttendees = useMemo(() => {
    if (!jam) return []
    return jam.attendees
      .filter((a) => a.rsvp === 'confirmed' && canVouch(jam, viewerId, a.musicianId))
      .map((a) => ({ attendee: a, musician: getMusician(a.musicianId) }))
      .filter((x): x is { attendee: typeof x.attendee; musician: NonNullable<typeof x.musician> } =>
        Boolean(x.musician),
      )
  }, [jam, viewerId])

  // Attendance defaults to "showed up" — the common case, and what the reference screen shows.
  const [attendance, setAttendance] = useState<Record<string, Verdict>>({})
  const [tags, setTags] = useState<Record<string, VouchTag[]>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [posted, setPosted] = useState<{ before: Record<string, MusicianStats> } | null>(null)
  const [posting, setPosting] = useState(false)
  const [postError, setPostError] = useState<string | null>(null)

  const verdictFor = (id: string): Verdict => attendance[id] ?? 'yes'

  if (!jam || !venue) {
    return (
      <AppShell
        activeTab={null}
        header={<SubScreenHeader title="Session recap" backHref="/jams" />}
        mainClassName="flex items-center px-4 py-6"
      >
        <EmptyState
          className="w-full"
          title="Nothing to recap"
          body="This session is not on your list, or the link is out of date."
          action={
            <Link href="/jams" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
              Back to your jams
            </Link>
          }
        />
      </AppShell>
    )
  }

  if (jam.status !== 'completed') {
    return (
      <AppShell
        activeTab={null}
        header={<SubScreenHeader title="Session recap" backHref={`/jams/${jam.id}`} />}
        mainClassName="flex items-center px-4 py-6"
      >
        <EmptyState
          className="w-full"
          title="This session has not happened yet"
          body="Recaps open once the jam is over. That is what keeps reliability meaningful."
          action={
            <Link
              href={`/jams/${jam.id}`}
              className={buttonClass({ variant: 'secondary', size: 'sm' })}
            >
              Back to the jam
            </Link>
          }
        />
      </AppShell>
    )
  }

  const recording = jam.recordingId ? getRecording(jam.recordingId) : undefined
  const consentIds = consents[jam.id] ?? []
  const iConsent = consentIds.includes(viewerId)
  const unanimous = hasUnanimousConsent(jam, consentIds)
  const confirmedCount = jam.attendees.filter((a) => a.rsvp === 'confirmed').length
  const durationLabel = jam.actualDurationMin
    ? formatDurationMinutes(jam.actualDurationMin)
    : `${jam.durationHours}h`

  async function handlePost() {
    if (!jam || posting) return
    // Snapshot everyone's stats before the server applies the recap, so the posted screen
    // can show exactly what this session moved.
    const before: Record<string, MusicianStats> = {}
    for (const { musician } of coAttendees) {
      const stats = statsFor(musician.id, ctx)
      if (stats) before[musician.id] = stats
    }

    const attendanceMap: Record<string, boolean> = { [viewerId]: true }
    const vouches: RecapVouch[] = []
    for (const { musician } of coAttendees) {
      attendanceMap[musician.id] = verdictFor(musician.id) === 'yes'
      const note = (notes[musician.id] ?? '').trim()
      const picked = tags[musician.id] ?? []
      // Only a confirmed co-attendee can be vouched for, and only if you actually said something.
      if (attendanceMap[musician.id] && (picked.length > 0 || note.length > 0)) {
        vouches.push({ toId: musician.id, tags: picked, note: note || undefined })
      }
    }

    setPosting(true)
    setPostError(null)
    try {
      await postRecap({
        jamId: jam.id,
        attendance: attendanceMap,
        vouches,
        publishRecording: Boolean(recording) && unanimous,
        durationLabel,
      })
      setPosted({ before })
    } catch (err) {
      setPostError(err instanceof Error ? err.message : 'Something went wrong — try again')
    } finally {
      setPosting(false)
    }
  }

  // ---- Posted state: show exactly what moved. -------------------------------
  if (posted) {
    return (
      <AppShell
        activeTab={null}
        header={<SubScreenHeader title="Session recap" backHref="/jams" />}
        mainClassName="px-4 py-8"
        footer={
          <StickyActionBar>
            <Link
              href="/jams"
              className="flex h-[48px] flex-1 items-center justify-center rounded-[12px] bg-primary text-[15px] font-medium text-primary-foreground transition-transform active:scale-95"
            >
              Done
            </Link>
          </StickyActionBar>
        }
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success-soft text-success">
            <Check size={22} strokeWidth={3} />
          </div>
          <h2 className="mb-2 font-serif text-[28px] font-bold text-foreground">Recap posted</h2>
          <p className="text-[14px] text-foreground-dim">
            {jam.title} at {venue.name} · {durationLabel}
          </p>
        </div>

        <SectionHeader>What that changed</SectionHeader>
        <Card className="overflow-hidden">
          {coAttendees.map(({ musician }, i) => {
            const before = posted.before[musician.id]
            const after = statsFor(musician.id, ctx)
            if (!before || !after) return null
            const vouchDelta = after.vouchCount - before.vouchCount
            const reliabilityDelta = after.reliabilityPct - before.reliabilityPct
            return (
              <div
                key={musician.id}
                className={`flex items-center justify-between gap-3 p-4 ${
                  i < coAttendees.length - 1 ? 'border-b border-border-hairline' : ''
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar src={musician.avatarUrl} name={musician.name} size="lg" />
                  <div className="min-w-0">
                    <div className="truncate font-serif text-[15px] font-bold text-foreground">
                      {musician.name}
                    </div>
                    <div className="text-[13px] text-foreground-dim">
                      {after.vouchCount} vouches · {after.repeatJams} repeats
                    </div>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[14px] font-bold text-foreground">
                    {after.reliabilityPct}%
                  </div>
                  <div className="flex items-center justify-end gap-1 text-[11px] text-foreground-dim">
                    {reliabilityDelta !== 0 && (
                      <span className={reliabilityDelta > 0 ? 'text-success' : 'text-destructive'}>
                        {reliabilityDelta > 0 ? '+' : ''}
                        {reliabilityDelta}
                      </span>
                    )}
                    {vouchDelta > 0 && (
                      <span className="flex items-center text-primary">
                        <ArrowUpRight size={11} />
                        {vouchDelta} vouch
                      </span>
                    )}
                    {reliabilityDelta === 0 && vouchDelta === 0 && 'no change'}
                  </div>
                </div>
              </div>
            )
          })}
        </Card>
        <p className="mt-4 text-center text-[12px] text-foreground-dim">
          Reliability moves slowly on purpose. One session cannot make or break it.
        </p>
      </AppShell>
    )
  }

  // ---- The form. -----------------------------------------------------------
  return (
    <AppShell
      activeTab={null}
      header={<SubScreenHeader title="Session recap" backHref="/jams" />}
      mainClassName="px-4 py-8"
      footer={
        <StickyActionBar
          note={
            postError ? (
              <span className="text-destructive">{postError}</span>
            ) : (
              'This is what builds your reliability, repeats and vouches.'
            )
          }
        >
          <Button
            variant="secondary"
            className="w-[120px] shrink-0"
            disabled={posting}
            onClick={() => router.push('/jams')}
          >
            Skip
          </Button>
          <Button className="flex-1" disabled={posting} onClick={() => void handlePost()}>
            {posting ? 'Posting…' : 'Post recap'}
          </Button>
        </StickyActionBar>
      }
    >
      <div className="mb-10 text-center">
        <h2 className="mb-2 font-serif text-[32px] font-bold text-foreground">How was it?</h2>
        <p className="text-[14px] text-foreground-dim">
          {jam.title} at {venue.name} · {durationLabel}
        </p>
      </div>

      <section className="mb-8">
        <SectionHeader
          action={<span className="text-[11px] text-foreground-dim">Tap to change</span>}
        >
          Did everyone show up
        </SectionHeader>
        <Card className="p-4">
          <div className="flex flex-col gap-4">
            {coAttendees.map(({ musician }, i) => (
              <div
                key={musician.id}
                className={`flex items-center justify-between gap-3 ${
                  i < coAttendees.length - 1 ? 'border-b border-border-hairline pb-4' : ''
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar src={musician.avatarUrl} name={musician.name} size="lg" />
                  <div className="truncate font-serif text-[15px] font-bold text-foreground">
                    {musician.name}
                  </div>
                </div>
                <AttendanceToggle
                  personName={musician.name}
                  showedUp={verdictFor(musician.id) === 'yes'}
                  onChange={(next) =>
                    setAttendance((a) => ({ ...a, [musician.id]: next ? 'yes' : 'no' }))
                  }
                />
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="mb-8">
        <SectionHeader>Vouch for who you played with</SectionHeader>
        <div className="flex flex-col gap-3">
          {coAttendees.map(({ musician }) => {
            const showedUp = verdictFor(musician.id) === 'yes'
            return (
              <Card key={musician.id} className="p-6 text-center">
                <Avatar
                  src={musician.avatarUrl}
                  name={musician.name}
                  size="xl"
                  className="mx-auto mb-3"
                />
                <div className="mb-4 font-serif text-[17px] font-bold text-foreground">
                  {musician.name}
                </div>
                {showedUp ? (
                  <>
                    <VouchTagPicker
                      className="mb-6"
                      selected={tags[musician.id] ?? []}
                      onToggle={(tag) =>
                        setTags((current) => {
                          const picked = current[musician.id] ?? []
                          return {
                            ...current,
                            [musician.id]: picked.includes(tag)
                              ? picked.filter((t) => t !== tag)
                              : [...picked, tag],
                          }
                        })
                      }
                    />
                    <input
                      type="text"
                      value={notes[musician.id] ?? ''}
                      onChange={(e) => setNotes((n) => ({ ...n, [musician.id]: e.target.value }))}
                      placeholder={`Say one true thing about playing with ${musician.name.split(' ')[0]}`}
                      className="w-full rounded-[12px] border border-border-subtle bg-background px-4 py-3 text-[14px] text-foreground placeholder:text-foreground-dim focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </>
                ) : (
                  <p className="text-[13px] text-foreground-dim">
                    You marked {musician.name.split(' ')[0]} as a no-show, so there is nothing to
                    vouch for here.
                  </p>
                )}
              </Card>
            )
          })}
        </div>
      </section>

      {recording && (
        <section className="mb-8">
          <SectionHeader>Save the recording</SectionHeader>
          <Card className="p-5">
            <WaveformPlayer
              className="mb-4"
              peaks={peaksFor(recording.id)}
              durationSec={recording.durationSec}
              label={`${recording.title} recording`}
            />

            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {jam.attendees
                  .filter((a) => a.rsvp === 'confirmed')
                  .map((a) => {
                    const musician = getMusician(a.musicianId)
                    if (!musician) return null
                    const agreed = consentIds.includes(a.musicianId)
                    return (
                      <div key={a.musicianId} className="relative">
                        <Avatar
                          src={musician.avatarUrl}
                          name={musician.name}
                          size="xs"
                          className={agreed ? '' : 'opacity-40'}
                        />
                        {agreed && (
                          <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-card bg-success">
                            <Check size={7} strokeWidth={4} className="text-white" />
                          </span>
                        )}
                      </div>
                    )
                  })}
              </div>
              <span className="text-[13px] text-foreground">
                {unanimous
                  ? `All ${spellNumber(confirmedCount)} players agreed to publish`
                  : `${consentIds.length} of ${confirmedCount} agreed — it stays private until everyone does`}
              </span>
            </div>

            {/* Publishing needs unanimous consent, so your own answer is a real decision. */}
            <div className="mt-4 flex items-center justify-between gap-3 rounded-[12px] border border-border-subtle bg-background p-3">
              <span className="text-[13px] text-foreground">I agree to publish this recording</span>
              <Toggle
                label="Agree to publish this recording"
                checked={iConsent}
                // `checked` mirrors the store, which only moves on a successful round-trip —
                // a failed call leaves the toggle where it was, and polling reconciles.
                onChange={(next) =>
                  void setRecordingConsent(jam.id, viewerId, next).catch(() => {})
                }
              />
            </div>
          </Card>
        </section>
      )}
    </AppShell>
  )
}
