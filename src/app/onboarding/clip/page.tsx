import type { Metadata } from 'next'
import { OnboardingClipView } from '@/components/riff/OnboardingClipView'

export const metadata: Metadata = { title: 'Record your first clip · Riff' }

export default function OnboardingClipPage() {
  return <OnboardingClipView />
}
