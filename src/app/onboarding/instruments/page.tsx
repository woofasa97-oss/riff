import type { Metadata } from 'next'
import { OnboardingInstrumentsView } from '@/components/riff/OnboardingInstrumentsView'

export const metadata: Metadata = { title: 'What do you play · Riff' }

export default function OnboardingInstrumentsPage() {
  return <OnboardingInstrumentsView />
}
