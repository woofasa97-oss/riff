import { JamDetailsView } from '@/components/riff/JamDetailsView'
import { getJam } from '@/mocks'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const jam = getJam(id)
  return { title: jam ? `${jam.title} · Riff` : 'Jam details · Riff' }
}

export default async function JamDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <JamDetailsView jamId={id} />
}
