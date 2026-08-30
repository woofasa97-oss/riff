import type { Metadata } from 'next'
import { OnboardingAvailabilityView } from '@/components/riff/OnboardingAvailabilityView'

export const metadata: Metadata = { title: 'When are you free · Riff' }

export default function OnboardingAvailabilityPage() {
  return <OnboardingAvailabilityView />
}
