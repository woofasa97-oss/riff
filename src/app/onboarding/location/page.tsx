import type { Metadata } from 'next'
import { OnboardingLocationView } from '@/components/riff/OnboardingLocationView'

export const metadata: Metadata = { title: 'Where do you play · Riff' }

export default function OnboardingLocationPage() {
  return <OnboardingLocationView />
}
