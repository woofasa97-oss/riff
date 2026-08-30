import { RequestJamView } from '@/components/riff/RequestJamView'
import { getMusician } from '@/mocks'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const musician = getMusician(id)
  return { title: musician ? `Request a jam with ${musician.name} · Riff` : 'Request a jam · Riff' }
}

export default async function RequestJamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <RequestJamView musicianId={id} />
}
