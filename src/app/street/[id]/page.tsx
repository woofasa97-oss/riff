import { StreetPerformerView } from '@/components/riff/StreetPerformerView'
import { getStreetPerformer } from '@/mocks'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const performer = getStreetPerformer(id)
  return { title: performer ? `${performer.name} · Riff` : 'Street performer · Riff' }
}

export default async function StreetPerformerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <StreetPerformerView performerId={id} />
}
