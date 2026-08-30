'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AppShell, StickyActionBar } from '@/components/riff/AppShell'
import { AvailabilityGrid } from '@/components/riff/AvailabilityGrid'
import { SubScreenHeader } from '@/components/riff/TopBar'
import { Button, buttonClass } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { useCurrentUser, useRiffStore } from '@/lib/store'
import type { Slot, Weekday } from '@/types'

const EMPTY_GRID: Record<Weekday, Slot[]> = {
  mon: [],
  tue: [],
  wed: [],
  thu: [],
  fri: [],
  sat: [],
  sun: [],
}

/** Edit the seven-day, three-slot availability grid and the free-text note. */
export function AvailabilityEditView() {
  const me = useCurrentUser()
  const applyOnboarding = useRiffStore((s) => s.applyOnboarding)
  const router = useRouter()

  const [grid, setGrid] = useState<Record<Weekday, Slot[]>>(
    () => me?.availability?.grid ?? { ...EMPTY_GRID },
  )
  const [note, setNote] = useState<string>(me?.availability?.note ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!me) {
    return (
      <AppShell
        activeTab="me"
        header={<SubScreenHeader title="Edit availability" backHref="/me" />}
        mainClassName="flex items-center px-4 py-6"
      >
        <EmptyState
          className="w-full"
          title="Sign in to set your availability"
          body="Let people know when you’re around to play. Claim a handle first."
          action={
            <Link href="/signup" className={buttonClass({ size: 'sm' })}>
              Create your player card
            </Link>
          }
        />
      </AppShell>
    )
  }

  async function save() {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      await applyOnboarding({ availability: { grid, note } })
      router.push('/me')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong — try again')
      setBusy(false)
    }
  }

  return (
    <AppShell
      activeTab="me"
      header={<SubScreenHeader title="Edit availability" backHref="/me" />}
      mainClassName="px-4 py-6"
      footer={
        <StickyActionBar>
          <Button className="flex-1" disabled={busy} onClick={save}>
            {busy ? 'Saving…' : 'Save availability'}
          </Button>
        </StickyActionBar>
      }
    >
      <section className="mb-7">
        <SectionHeader>When you’re around</SectionHeader>
        <p className="mb-3 px-1 text-[13px] text-foreground-dim">
          Tap a slot to toggle it, or drag to paint several at once.
        </p>
        <AvailabilityGrid value={grid} onChange={setGrid} />
      </section>

      <section className="mb-2">
        <SectionHeader>A note (optional)</SectionHeader>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 140))}
          rows={2}
          placeholder="e.g. Weeknights after 7, weekends anytime."
          aria-label="Availability note"
          className="w-full rounded-[12px] border border-border-subtle bg-background px-4 py-3 text-[14px] text-foreground placeholder:text-foreground-dim focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <p className="mt-1 px-1 text-right text-[11px] text-foreground-dim">{note.length}/140</p>
      </section>

      {error && <p className="px-1 text-[13px] text-destructive">{error}</p>}
    </AppShell>
  )
}
