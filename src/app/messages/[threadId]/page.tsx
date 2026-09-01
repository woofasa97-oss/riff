import { MessagesShell } from '@/components/riff/MessagesShell'

export const metadata = { title: 'Messages · Riff' }

export default async function ThreadPage({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params
  return <MessagesShell threadId={threadId} />
}
