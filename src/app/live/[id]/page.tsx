import { LiveView } from '@/components/riff/LiveView'

export const metadata = { title: 'Live · Riff' }

export default async function LiveSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <LiveView sessionId={id} />
}
