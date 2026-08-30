import { BandView } from '@/components/riff/BandView'
import { getBand } from '@/mocks'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const band = getBand(id)
  return { title: band ? `${band.name} · Riff` : 'Band · Riff' }
}

export default async function BandPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <BandView bandId={id} />
}
