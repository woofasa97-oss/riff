'use client'

import { useRouter } from 'next/navigation'
import { InstrumentPicker } from '@/components/riff/InstrumentPicker'
import { IntentPicker } from '@/components/riff/IntentPicker'
import { OnboardingShell } from '@/components/riff/OnboardingShell'
import { Chip } from '@/components/ui/Chip'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { genreLabel } from '@/lib/labels'
import { useOnboardingStore } from '@/lib/onboarding-store'
import type { Genre } from '@/types'

/** All seven Genre values, in the order the reference screen lists them. */
const GENRES: Genre[] = ['jazz', 'neo-soul', 'fusion', 'indie', 'rock', 'funk', 'hip-hop']

/**
 * Onboarding step 2 — instruments, genre lanes, intent (docs/SPEC.md §4.1). Everything lands
 * in the onboarding draft store; nothing commits until the final step applies it.
 */
export function OnboardingInstrumentsView() {
  const router = useRouter()
  const instruments = useOnboardingStore((s) => s.instruments)
  const genres = useOnboardingStore((s) => s.genres)
  const intent = useOnboardingStore((s) => s.intent)
  const toggleInstrument = useOnboardingStore((s) => s.toggleInstrument)
  const toggleGenre = useOnboardingStore((s) => s.toggleGenre)
  const setIntent = useOnboardingStore((s) => s.setIntent)

  // Instruments and intent drive matching, so both are required. Genres only narrow it.
  const canContinue = instruments.length > 0 && intent !== undefined

  return (
    <OnboardingShell
      step={2}
      title="What do you play?"
      subtitle="This is how people find you."
      backHref="/onboarding/location"
      continueDisabled={!canContinue}
      onContinue={() => router.push('/onboarding/availability')}
    >
      <section className="mb-8">
        <SectionHeader>Instruments</SectionHeader>
        <InstrumentPicker selected={instruments} onToggle={toggleInstrument} />
      </section>

      <section className="mb-8">
        <SectionHeader>Genre lanes</SectionHeader>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((genre) => (
            <Chip key={genre} selected={genres.includes(genre)} onClick={() => toggleGenre(genre)}>
              {genreLabel(genre)}
            </Chip>
          ))}
        </div>
      </section>

      <section>
        <SectionHeader>What are you looking for</SectionHeader>
        <IntentPicker value={intent} onChange={setIntent} />
      </section>
    </OnboardingShell>
  )
}
