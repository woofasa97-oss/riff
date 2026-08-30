import type { Metadata } from 'next'
import { ResetView } from '@/components/riff/ResetView'

export const metadata: Metadata = { title: 'Reset your password · Riff' }

export default function ResetPage() {
  return <ResetView />
}
