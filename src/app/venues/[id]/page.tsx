import { VenueView } from '@/components/riff/VenueView'
import { getVenue } from '@/mocks'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const venue = getVenue(id)
  return { title: venue ? `${venue.name} · Riff` : 'Venue · Riff' }
}

export default async function VenuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <VenueView venueId={id} />
}
