import { TeacherDetailView } from '@/components/riff/TeacherDetailView'
import { getMusician } from '@/mocks'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const musician = getMusician(id)
  return { title: musician ? `${musician.name} — lessons · Riff` : 'Teacher · Riff' }
}

export default async function TeacherDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <TeacherDetailView musicianId={id} />
}
