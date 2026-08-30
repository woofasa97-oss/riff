import type { Metadata } from 'next'
import { JamsView } from '@/components/riff/JamsView'

export const metadata: Metadata = { title: 'Jams · Riff' }

export default function JamsPage() {
  return <JamsView />
}
