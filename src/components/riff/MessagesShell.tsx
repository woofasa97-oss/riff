'use client'

import { AppShell } from '@/components/riff/AppShell'
import {
  ConversationPane,
  SelectConversationPlaceholder,
  ThreadListPane,
} from '@/components/riff/MessagesPanes'
import { cn } from '@/lib/cn'

/**
 * The inbox. Desktop (lg+): a two-pane layout — the thread list stays on the left while the open
 * conversation fills the right, the classic desktop inbox. Mobile: one pane at a time — the list
 * at /messages, the conversation at /messages/[id] — so it matches the phone flow exactly.
 */
export function MessagesShell({ threadId }: { threadId?: string }) {
  return (
    <AppShell activeTab="jams" mainClassName="flex min-h-0 flex-col lg:flex-row">
      {/* Left: thread list — hidden on mobile while a conversation is open. */}
      <div
        className={cn(
          'min-h-0 flex-col lg:flex lg:w-[360px] lg:shrink-0 lg:border-r lg:border-border-subtle',
          threadId ? 'hidden' : 'flex flex-1',
        )}
      >
        <ThreadListPane selectedId={threadId} />
      </div>

      {/* Right: the open conversation, or a placeholder on desktop when none is chosen. */}
      <div className={cn('min-h-0 flex-1 flex-col', threadId ? 'flex' : 'hidden lg:flex')}>
        {threadId ? <ConversationPane threadId={threadId} /> : <SelectConversationPlaceholder />}
      </div>
    </AppShell>
  )
}
