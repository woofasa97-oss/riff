import type { Metadata } from 'next'
import { WelcomeView } from '@/components/riff/WelcomeView'

export const metadata: Metadata = { title: 'Welcome · Riff' }

export default function WelcomePage() {
  return <WelcomeView />
}
