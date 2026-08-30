import type { Metadata } from 'next'
import { SignupView } from '@/components/riff/SignupView'

export const metadata: Metadata = { title: 'Claim your handle · Riff' }

export default function SignupPage() {
  return <SignupView />
}
