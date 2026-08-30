'use client'

import { useRouter } from 'next/navigation'
import { MapPin } from 'lucide-react'
import { OnboardingShell } from '@/components/riff/OnboardingShell'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Slider } from '@/components/ui/Slider'
import { useOnboardingStore } from '@/lib/onboarding-store'
import { mapZones } from '@/mocks'

/**
 * Onboarding offers the launch-market patches only — the Brooklyn five (docs/SPEC.md §4.1).
 * Astoria exists in the zone fixtures for the map but is not a home-patch option yet.
 */
const HOME_ZONES = mapZones.filter((z) => z.borough === 'Brooklyn')

/**
 * Step 1 of 4 — home patch + travel radius. Zone-level by construction: the draft stores a
 * neighbourhood name, never coordinates (docs/SPEC.md §5.2).
 */
export function OnboardingLocationView() {
  const router = useRouter()
  const neighborhood = useOnboardingStore((s) => s.neighborhood)
  const travelRadiusMi = useOnboardingStore((s) => s.travelRadiusMi)
  const setNeighborhood = useOnboardingStore((s) => s.setNeighborhood)
  const setTravelRadius = useOnboardingStore((s) => s.setTravelRadius)

  const borough = HOME_ZONES[0]?.borough

  // Preview circle scales with the radius: 1 mi → 55px, 10 mi → 154px, inside the 170px patch.
  const circlePx = 44 + travelRadiusMi * 11

  return (
    <OnboardingShell
      step={1}
      title="Where do you play?"
      subtitle="Riff only ever shows your neighbourhood, never your address."
      backHref="/welcome"
      continueDisabled={!neighborhood}
      onContinue={() => router.push('/onboarding/instruments')}
    >
      <Card className="mb-6 p-4">
        {/* Stylised patch, not a basemap — there is no exact position in the data to draw. */}
        <div className="relative mb-4 flex h-[170px] items-center justify-center overflow-hidden rounded-[12px] bg-gradient-to-br from-secondary via-background to-accent-soft">
          <div
            aria-hidden
            className="absolute rounded-full border border-primary/40 bg-primary/10 transition-all duration-300"
            style={{ width: circlePx, height: circlePx }}
          />
          <div className="relative z-10 flex flex-col items-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow-md">
              <MapPin size={18} aria-hidden />
            </span>
            <span className="mt-1 rounded-full bg-card/90 px-2 py-0.5 text-[10px] font-medium text-foreground shadow-sm">
              You
            </span>
          </div>
        </div>
        <div className="flex items-baseline justify-between gap-3 px-1">
          <span className="shrink-0 font-serif text-[17px] font-bold text-foreground">
            {borough ? `${borough}, NY` : 'New York'}
          </span>
          <span className="min-w-0 truncate text-[12px] text-foreground-dim">
            {neighborhood ?? 'Pick your home patch below'}
          </span>
        </div>
      </Card>

      <section className="mb-8">
        <SectionHeader>Your home patch</SectionHeader>
        <div className="flex flex-wrap gap-2">
          {HOME_ZONES.map((zone) => (
            <Chip
              key={zone.id}
              selected={neighborhood === zone.name}
              onClick={() => setNeighborhood(zone.name)}
            >
              {zone.name}
            </Chip>
          ))}
        </div>
      </section>

      <section className="mb-4">
        <SectionHeader>How far will you travel</SectionHeader>
        <Slider
          min={1}
          max={10}
          value={travelRadiusMi}
          onChange={setTravelRadius}
          label="Travel radius"
          formatValue={(v) => `${v} mi`}
        />
      </section>
    </OnboardingShell>
  )
}
