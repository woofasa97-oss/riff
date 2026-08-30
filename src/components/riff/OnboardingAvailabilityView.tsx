'use client'

import { useRouter } from 'next/navigation'
import { AvailabilityGrid } from '@/components/riff/AvailabilityGrid'
import { OnboardingShell } from '@/components/riff/OnboardingShell'
import { Card } from '@/components/ui/Card'
import { Toggle } from '@/components/ui/Toggle'
import { freeDaysLabel } from '@/lib/availability'
import { useOnboardingStore } from '@/lib/onboarding-store'

/**
 * Onboarding step 3 — weekly availability grid, free-text note, and the "available tonight"
 * toggle (docs/SPEC.md §4.1). Skippable: skip and Continue both go to the clip step and the
 * draft grid is left exactly as it stands. Everything here lives in the onboarding draft
 * store until the final step commits it via applyOnboarding.
 */
export function OnboardingAvailabilityView() {
  const router = useRouter()
  const grid = useOnboardingStore((s) => s.grid)
  const note = useOnboardingStore((s) => s.note)
  const availableTonight = useOnboardingStore((s) => s.availableTonight)
  const setGrid = useOnboardingStore((s) => s.setGrid)
  const setNote = useOnboardingStore((s) => s.setNote)
  const setAvailableTonight = useOnboardingStore((s) => s.setAvailableTonight)

  const goNext = () => router.push('/onboarding/clip')

  return (
    <OnboardingShell
      step={3}
      title="When are you free?"
      subtitle="People send fewer pointless requests when they can see this."
      backHref="/onboarding/instruments"
      onContinue={goNext}
      skip={{ label: 'Skip for now', onSkip: goNext }}
    >
      <Card className="mb-4 p-4">
        <AvailabilityGrid value={grid} onChange={setGrid} />
        <p className="mt-3 text-[12px] text-foreground-dim">
          Tap a slot to toggle it, or drag to paint a few at once.
        </p>
        <div className="mt-4 border-t border-border-subtle pt-4">
          {/* Live summary — the same derived line musician cards show, so what you pick here
              is exactly what others will read. */}
          <p className="mb-2 text-[13px] font-medium text-foreground">
            {freeDaysLabel({ grid, note })}
          </p>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Usually free evenings after 7 PM"
            aria-label="Availability note"
            className="w-full rounded-[12px] border border-border-subtle bg-background px-4 py-3 text-[14px] text-foreground placeholder:text-foreground-dim focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </Card>

      <Card className="flex items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-[15px] font-medium text-foreground">Show me as available tonight</p>
          <p className="mt-0.5 text-[13px] text-foreground-dim">
            Turns itself off at midnight, so it never goes stale.
          </p>
        </div>
        <Toggle
          checked={availableTonight}
          onChange={setAvailableTonight}
          label="Show me as available tonight"
        />
      </Card>
    </OnboardingShell>
  )
}
