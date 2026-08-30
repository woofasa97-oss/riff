import type { Metadata } from 'next'
import { IncomingRequestView } from '@/components/riff/IncomingRequestView'

export const metadata: Metadata = { title: 'Jam request · Riff' }

export default async function IncomingRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <IncomingRequestView requestId={id} />
}
