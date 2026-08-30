import { VouchesView } from '@/components/riff/VouchesView'
import { getMusician } from '@/mocks'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const musician = getMusician(id)
  return { title: musician ? `Vouches for ${musician.name} · Riff` : 'Vouches · Riff' }
}

export default async function VouchesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <VouchesView musicianId={id} />
}
