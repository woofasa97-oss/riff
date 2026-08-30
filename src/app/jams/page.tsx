import type { Metadata } from 'next'
import { JamsView } from '@/components/riff/JamsView'

export const metadata: Metadata = { title: 'Jams · Riff' }

/** `?tab=past` lets the profile's "Past jams" row deep-link straight to that tab. */
export default async function JamsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const initialTab = tab === 'past' || tab === 'requests' ? tab : 'upcoming'
  return <JamsView initialTab={initialTab} />
}
