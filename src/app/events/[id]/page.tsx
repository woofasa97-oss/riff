import { EventView } from '@/components/riff/EventView'
import { getMapEvent } from '@/mocks'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const event = getMapEvent(id)
  return { title: event ? `${event.title} · Riff` : 'Event · Riff' }
}

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <EventView eventId={id} />
}
