import { RecapView } from '@/components/riff/RecapView'

export const metadata = { title: 'Session recap · Riff' }

export default async function RecapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <RecapView jamId={id} />
}
