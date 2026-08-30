import { StudioView } from '@/components/riff/StudioView'
import { getStudio } from '@/mocks'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const studio = getStudio(id)
  return { title: studio ? `${studio.name} · Riff` : 'Studio · Riff' }
}

export default async function StudioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <StudioView studioId={id} />
}
