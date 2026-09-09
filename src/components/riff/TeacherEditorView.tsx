'use client'

import { useState } from 'react'
import Link from 'next/link'
import { GraduationCap, Laptop, MapPin } from 'lucide-react'
import { AppShell, StickyActionBar } from '@/components/riff/AppShell'
import { SubScreenHeader } from '@/components/riff/TopBar'
import { Button, buttonClass } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { cn } from '@/lib/cn'
import { instrumentLabel } from '@/lib/labels'
import { AccountRequiredError, useCurrentUser, useRiffStore, useTeacherProfile } from '@/lib/store'
import type { Instrument } from '@/types'

const ALL_INSTRUMENTS: Instrument[] = [
  'drums',
  'bass',
  'keys',
  'guitar',
  'vocals',
  'sax',
  'synth',
  'percussion',
]

/**
 * Become a teacher, or edit the profile you already have. One form for both — the fields
 * mirror the server gate in saveTeacherProfile, so the submit only unlocks on data the server
 * will take. Students find the result in the /teachers directory.
 */
export function TeacherEditorView() {
  const me = useCurrentUser()
  const existing = useTeacherProfile(me?.id)
  const save = useRiffStore((s) => s.saveTeacherProfile)

  const [headline, setHeadline] = useState(existing?.headline ?? '')
  const [bio, setBio] = useState(existing?.bio ?? '')
  const [instruments, setInstruments] = useState<Instrument[]>(
    existing?.instruments ?? (me?.instruments.slice(0, 1) ?? []),
  )
  const [rate, setRate] = useState(existing ? String(existing.ratePerHourUsd) : '40')
  const [online, setOnline] = useState(existing?.online ?? true)
  const [inPerson, setInPerson] = useState(existing?.inPerson ?? true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const rateNum = Math.round(Number(rate))
  const canSubmit =
    headline.trim().length >= 4 &&
    instruments.length > 0 &&
    Number.isFinite(rateNum) &&
    rateNum >= 5 &&
    rateNum <= 500 &&
    (online || inPerson)

  function toggleInstrument(i: Instrument) {
    setInstruments((cur) =>
      cur.includes(i) ? cur.filter((x) => x !== i) : cur.length >= 4 ? cur : [...cur, i],
    )
  }

  async function submit() {
    if (!canSubmit || busy) return
    setBusy(true)
    setError(null)
    try {
      await save({
        headline: headline.trim(),
        bio: bio.trim(),
        instruments,
        ratePerHourUsd: rateNum,
        online,
        inPerson,
      })
      setSaved(true)
    } catch (err) {
      if (err instanceof AccountRequiredError) return
      setError(err instanceof Error ? err.message : 'Could not save — try again')
    } finally {
      setBusy(false)
    }
  }

  if (saved) {
    return (
      <AppShell
        activeTab="me"
        header={<SubScreenHeader title="Teaching" backHref="/me/business" />}
        mainClassName="flex flex-col items-center justify-center px-6 py-10 text-center"
      >
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--hero-from)] text-primary">
          <GraduationCap size={30} />
        </div>
        <h1 className="font-serif text-[24px] font-bold text-foreground">
          {existing ? 'Profile updated' : "You're in the directory"}
        </h1>
        <p className="mt-3 max-w-[300px] text-[14px] text-foreground-dim">
          Students find you under Find a teacher. Lesson requests land on your owner dashboard
          and in your notifications — nothing is booked until you accept.
        </p>
        <div className="mt-8 flex w-full max-w-[320px] flex-col gap-2">
          {me && (
            <Link href={`/teachers/${me.id}`} className={buttonClass({ fullWidth: true })}>
              See your public teacher page
            </Link>
          )}
          <Link href="/me/business" className={buttonClass({ variant: 'secondary', fullWidth: true })}>
            Back to your dashboard
          </Link>
        </div>
      </AppShell>
    )
  }

  const field =
    'w-full rounded-[12px] border border-border-subtle bg-background px-4 py-3 text-[14px] text-foreground placeholder:text-foreground-dim focus:outline-none focus:ring-1 focus:ring-ring'

  return (
    <AppShell
      activeTab="me"
      header={
        <SubScreenHeader
          title={existing ? 'Edit your teaching' : 'Teach on Riff'}
          backHref="/me/business"
        />
      }
      mainClassName="px-4 py-6"
      footer={
        <StickyActionBar note="Your player card and reputation back your teacher page.">
          <Button className="flex-1" disabled={!canSubmit || busy} onClick={submit}>
            {busy ? 'Saving…' : existing ? 'Save changes' : 'List me as a teacher'}
          </Button>
        </StickyActionBar>
      }
    >
      {error && (
        <p role="alert" className="mb-5 rounded-[12px] border border-destructive/40 bg-destructive/10 px-4 py-3 text-[13px] text-destructive">
          {error}
        </p>
      )}

      <section className="mb-7">
        <SectionHeader>Headline</SectionHeader>
        <input
          value={headline}
          onChange={(e) => setHeadline(e.target.value.slice(0, 80))}
          placeholder="e.g. Jazz piano from the changes up"
          aria-label="Teaching headline"
          className={field}
        />
        <p className="mt-2 px-1 text-[12px] text-foreground-dim">
          One line on the directory card — what you teach and how.
        </p>
      </section>

      <section className="mb-7">
        <SectionHeader>What you teach</SectionHeader>
        <div className="flex flex-wrap gap-2">
          {ALL_INSTRUMENTS.map((i) => (
            <button
              key={i}
              type="button"
              aria-pressed={instruments.includes(i)}
              onClick={() => toggleInstrument(i)}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-transform active:scale-95',
                instruments.includes(i)
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border-subtle bg-card text-foreground',
              )}
            >
              {instrumentLabel(i)}
            </button>
          ))}
        </div>
        <p className="mt-2 px-1 text-[12px] text-foreground-dim">Up to four.</p>
      </section>

      <section className="mb-7">
        <SectionHeader>Hourly rate (USD)</SectionHeader>
        <input
          value={rate}
          onChange={(e) => setRate(e.target.value.replace(/[^\d]/g, '').slice(0, 3))}
          inputMode="numeric"
          placeholder="40"
          aria-label="Hourly rate in dollars"
          className={field}
        />
      </section>

      <section className="mb-7">
        <SectionHeader>Where lessons happen</SectionHeader>
        <div className="flex gap-2">
          <button
            type="button"
            aria-pressed={online}
            onClick={() => setOnline((v) => !v)}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-[12px] border px-3 py-3 text-[13px] font-medium transition-transform active:scale-95',
              online
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border-subtle bg-card text-foreground',
            )}
          >
            <Laptop size={15} /> Online
          </button>
          <button
            type="button"
            aria-pressed={inPerson}
            onClick={() => setInPerson((v) => !v)}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-[12px] border px-3 py-3 text-[13px] font-medium transition-transform active:scale-95',
              inPerson
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border-subtle bg-card text-foreground',
            )}
          >
            <MapPin size={15} /> In person
          </button>
        </div>
        {!online && !inPerson && (
          <p className="mt-2 px-1 text-[12px] text-destructive">Pick at least one.</p>
        )}
      </section>

      <section className="mb-4">
        <SectionHeader>Your approach (optional)</SectionHeader>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value.slice(0, 500))}
          rows={5}
          placeholder="How you teach, who it's for, what a first lesson looks like…"
          aria-label="Teaching approach"
          className={cn(field, 'resize-none')}
        />
      </section>

      <Card className="mb-2 bg-[color:var(--hero-from)] p-4">
        <p className="text-[13px] text-foreground">
          <span className="font-bold">How it works:</span> students send a request, you accept
          or decline from your dashboard, and accepting opens a message thread to plan the
          first lesson. Payment happens between you — Riff doesn&apos;t take a cut.
        </p>
      </Card>
    </AppShell>
  )
}
