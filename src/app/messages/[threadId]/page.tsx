import { ThreadView } from '@/components/riff/ThreadView'

export const metadata = { title: 'Messages · Riff' }

export default async function ThreadPage({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params
  return <ThreadView threadId={threadId} />
}
