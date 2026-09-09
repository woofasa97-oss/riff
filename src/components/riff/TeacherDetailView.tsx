'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Check, Clock, GraduationCap, Laptop, MapPin, MessageCircle } from 'lucide-react'
import { AppShell, StickyActionBar } from '@/components/riff/AppShell'
import { SubScreenHeader } from '@/components/riff/TopBar'
import { Avatar } from '@/components/ui/Avatar'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Badge } from '@/components/ui/Badge'
import { Button, buttonClass } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { cn } from '@/lib/cn'
import { instrumentLabel } from '@/lib/labels'
import { AccountRequiredError, useRiffStore } from '@/lib/store'
import { getMusician } from '@/mocks'
import type { Instrument } from '@/types'

/**
 * One teacher's page: their pitch, rate, and the lesson-request flow. The viewer sees their
 * own request's state right here — asked, accepted (with a path to messages), or declined —
 * so no step of the flow happens invisibly.
 */
export function TeacherDetailView({ musicianId }: { musicianId: string }) {
  const teachers = useRiffStore((s) => s.teachers)
  const lessons = useRiffStore((s) => s.lessonRequests)
  const viewerId = useRiffStore((s) => s.viewerId)
  const requireAccount = useRiffStore((s) => s.requireAccount)
  const [sheetOpen, setSheetOpen] = useState(false)

  const teacher = teachers.find((t) => t.musicianId === musicianId)
  const musician = getMusician(musicianId)
  const isSelf = viewerId === musicianId
  const mine = useMemo(
    () =>
      lessons
        .filter((l) => l.teacherId === musicianId && l.studentId === viewerId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0],
    [lessons, musicianId, viewerId],
  )

  if (!teacher || !musician || (!teacher.active && !isSelf)) {
    return (
      <AppShell
        activeTab="discover"
        header={<SubScreenHeader title="Teacher" backHref="/teachers" />}
        mainClassName="flex items-center px-4 py-6"
      >
        <EmptyState
          className="w-full"
          title="Not taking students right now"
          body="This teacher has paused their listing."
          action={
            <Link href="/teachers" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
              See other teachers
            </Link>
          }
        />
      </AppShell>
    )
  }

  const openSheet = () => {
    if (!requireAccount('request a lesson')) return
    setSheetOpen(true)
  }

  return (
    <AppShell
      activeTab="discover"
      header={<SubScreenHeader title="Teacher" backHref="/teachers" />}
      mainClassName="pb-2"
      footer={
        isSelf ? (
          <StickyActionBar>
            <Link href="/me/business/teacher" className={cn(buttonClass({ variant: 'secondary' }), 'flex-1')}>
              Edit your teacher profile
            </Link>
          </StickyActionBar>
        ) : mine?.status === 'pending' ? (
          <StickyActionBar note="They'll answer soon — you'll get a notification.">
            <Button className="flex-1" variant="secondary" disabled>
              <Clock size={15} /> Request sent
            </Button>
          </StickyActionBar>
        ) : mine?.status === 'accepted' ? (
          <StickyActionBar>
            <Link href="/messages" className={cn(buttonClass(), 'flex-1')}>
              <MessageCircle size={15} /> Plan your first lesson
            </Link>
          </StickyActionBar>
        ) : (
          <StickyActionBar note="Nothing is booked until they accept — then you plan it together in messages.">
            <Button className="flex-1" onClick={openSheet}>
              <GraduationCap size={16} /> Request a lesson
            </Button>
          </StickyActionBar>
        )
      }
    >
      {/* IDENTITY */}
      <div className="flex flex-col items-center px-4 pb-4 pt-8 text-center">
        <Avatar src={musician.avatarUrl} name={musician.name} size="xl" />
        <h1 className="mt-4 font-serif text-[24px] font-bold leading-tight text-foreground">
          {musician.name}
        </h1>
        <p className="mt-1 max-w-[300px] text-[14px] font-medium text-foreground-dim">
          {teacher.headline}
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <span className="rounded-full border border-primary/30 bg-[color:var(--hero-from)] px-3 py-1 text-[12px] font-bold text-primary">
            ${teacher.ratePerHourUsd}/hr
          </span>
          {teacher.online && (
            <span className="flex items-center gap-1 rounded-full border border-border-subtle bg-card px-3 py-1 text-[12px] font-medium text-foreground-dim">
              <Laptop size={12} /> Online
            </span>
          )}
          {teacher.inPerson && (
            <span className="flex items-center gap-1 rounded-full border border-border-subtle bg-card px-3 py-1 text-[12px] font-medium text-foreground-dim">
              <MapPin size={12} /> {musician.neighborhood}
            </span>
          )}
        </div>
      </div>

      {/* MY REQUEST STATE — the flow's status lives on the page, not in memory. */}
      {mine && (
        <div className="mb-5 px-4">
          <Card
            className={cn(
              'flex items-center gap-3 p-4',
              mine.status === 'accepted' && 'border-success-border bg-success-soft',
            )}
          >
            <span
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                mine.status === 'accepted'
                  ? 'bg-success text-white'
                  : 'bg-secondary text-foreground-dim',
              )}
            >
              {mine.status === 'accepted' ? <Check size={16} /> : <Clock size={16} />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-bold text-foreground">
                {mine.status === 'pending' && `You asked about ${instrumentLabel(mine.instrument).toLowerCase()} lessons`}
                {mine.status === 'accepted' && `${musician.name.split(' ')[0]} accepted — plan it in messages`}
                {mine.status === 'declined' && `${musician.name.split(' ')[0]} can't take new students right now`}
              </p>
              <p className="mt-0.5 text-[12px] text-foreground-dim">
                {mine.status === 'pending' && 'Waiting on their answer.'}
                {mine.status === 'accepted' && 'Work out timing and place together.'}
                {mine.status === 'declined' && 'You can ask again another time.'}
              </p>
            </div>
            {mine.status === 'declined' && (
              <Badge tone="neutral" className="shrink-0 px-2.5 py-1 text-[11px]">
                Declined
              </Badge>
            )}
          </Card>
        </div>
      )}

      {/* WHAT THEY TEACH */}
      <section className="mb-6 px-4">
        <SectionHeader>Teaches</SectionHeader>
        <div className="flex flex-wrap gap-2">
          {teacher.instruments.map((i) => (
            <span
              key={i}
              className="rounded-full border border-border-subtle bg-card px-3 py-1.5 text-[13px] font-medium text-foreground shadow-sm"
            >
              {instrumentLabel(i)}
            </span>
          ))}
        </div>
      </section>

      {teacher.bio && (
        <section className="mb-6 px-4">
          <SectionHeader>Their approach</SectionHeader>
          <Card className="p-4">
            <p className="text-[14px] leading-relaxed text-foreground">{teacher.bio}</p>
          </Card>
        </section>
      )}

      <div className="mb-6 px-4">
        <Link
          href={`/musicians/${musician.id}`}
          className={buttonClass({ variant: 'outline', fullWidth: true })}
        >
          View their player card
        </Link>
      </div>

      <RequestLessonSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        teacherId={musicianId}
        teacherName={musician.name.split(' ')[0]}
        instruments={teacher.instruments}
      />
    </AppShell>
  )
}

function RequestLessonSheet({
  open,
  onClose,
  teacherId,
  teacherName,
  instruments,
}: {
  open: boolean
  onClose: () => void
  teacherId: string
  teacherName: string
  instruments: Instrument[]
}) {
  const requestLesson = useRiffStore((s) => s.requestLesson)
  const [instrument, setInstrument] = useState<Instrument>(instruments[0])
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      await requestLesson(teacherId, instrument, note.trim())
      onClose()
    } catch (err) {
      if (err instanceof AccountRequiredError) {
        onClose()
        return
      }
      setError(err instanceof Error ? err.message : 'Could not send — try again')
    } finally {
      setBusy(false)
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={`Request a lesson with ${teacherName}`}>
      <div className="px-1 pb-1 pt-2">
        <h2 className="mb-4 text-center font-serif text-[18px] font-bold text-foreground">
          Request a lesson
        </h2>

        {instruments.length > 1 && (
          <div className="mb-3">
            <span className="mb-1 block px-1 text-[12px] font-medium text-foreground-dim">
              Which instrument
            </span>
            <div className="flex flex-wrap gap-1.5">
              {instruments.map((i) => (
                <button
                  key={i}
                  type="button"
                  aria-pressed={instrument === i}
                  onClick={() => setInstrument(i)}
                  className={cn(
                    'rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-transform active:scale-95',
                    instrument === i
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border-subtle bg-card text-foreground',
                  )}
                >
                  {instrumentLabel(i)}
                </button>
              ))}
            </div>
          </div>
        )}

        <label className="mb-4 block">
          <span className="mb-1 block px-1 text-[12px] font-medium text-foreground-dim">
            Where you&apos;re at (optional)
          </span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 300))}
            rows={3}
            placeholder="Beginner? Coming back after years? Working towards something?"
            aria-label="A note for the teacher"
            className="w-full resize-none rounded-[12px] border border-border-subtle bg-background px-4 py-3 text-[14px] text-foreground placeholder:text-foreground-dim focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </label>

        {error && (
          <p role="alert" className="mb-3 text-center text-[12px] text-destructive">
            {error}
          </p>
        )}

        <Button fullWidth disabled={busy} onClick={submit}>
          {busy ? 'Sending…' : `Ask ${teacherName}`}
        </Button>
        <p className="mt-3 text-center text-[11px] text-foreground-dim">
          If they accept, a message thread opens to plan timing — nothing is booked before that.
        </p>
      </div>
    </BottomSheet>
  )
}
