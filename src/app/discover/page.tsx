import type { Metadata } from 'next'
import { DiscoverView } from '@/components/riff/DiscoverView'

export const metadata: Metadata = { title: 'Discover · Riff' }

export default function DiscoverPage() {
  return <DiscoverView />
}
