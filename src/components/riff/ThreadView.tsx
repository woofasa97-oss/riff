'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { SendHorizontal } from 'lucide-react'
import { AppShell } from '@/components/riff/AppShell'
import { SubScreenHeader } from '@/components/riff/TopBar'
import { authorName, describeThread } from '@/components/riff/threadDisplay'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/cn'
import { formatDayHeading, formatTime, groupByDay } from '@/lib/datetime'
import { formatShortDateTime } from '@/lib/datetime'
import { useRiffStore } from '@/lib/store'
import {
  CURRENT_USER_ID,
  NOW,
  getJam,
  getMusician,
  getThread,
  getVenue,
  listMessages,
} from '@/mocks'

/**
 * The conversation behind a thread row. Kept deliberately close to the essentials — pinned jam
 * header, day-grouped bubbles, inline system events, composer — because the Jams and Messages
 * screens both link here and neither may dead-end (docs/SPEC.md §5.5).
 */
export function ThreadView({ threadId }: { threadId: string }) {
  const [draft, setDraft] = useState('')
  const messages = useRiffStore((s) => s.messages)
  const jams = useRiffStore((s) => s.jams)
  const sendMessage = useRiffStore((s) => s.sendMessage)

  const thread = getThread(threadId)
  const display = thread ? describeThread(thread, CURRENT_USER_ID) : undefined
  const jam = thread?.jamId
    ? (jams.find((j) => j.id === thread.jamId) ?? getJam(thread.jamId))
    : undefined
  const venue = jam ? getVenue(jam.venueId) : undefined

  const days = useMemo(
    () => (thread ? groupByDay(listMessages(thread.id, messages)) : []),
    [thread, messages],
  )

  if (!thread || !display) {
    return (
      <AppShell
        activeTab="jams"
        header={<SubScreenHeader title="Conversation" backHref="/messages" />}
        mainClassName="flex items-center px-4 py-6"
      >
        <EmptyState
          className="w-full"
          title="This conversation is gone"
          body="The thread may have been removed, or the link is out of date."
          action={
            <Link href="/messages">
              <Button size="sm" variant="secondary">
                Back to messages
              </Button>
            </Link>
          }
        />
      </AppShell>
    )
  }

  function handleSend(event: React.FormEvent) {
    event.preventDefault()
    const body = draft.trim()
    if (!body || !thread) return
    sendMessage(thread.id, body)
    setDraft('')
  }

  return (
    <AppShell
      activeTab="jams"
      header={<SubScreenHeader title={display.title} backHref="/messages" />}
      mainClassName="px-4 py-4"
      footer={
        <form
          onSubmit={handleSend}
          className="pb-safe bg-card/95 z-20 flex shrink-0 items-center gap-2 border-t border-border-subtle px-4 py-3 backdrop-blur-md"
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Message"
            aria-label="Write a message"
            className="h-[44px] flex-1 rounded-full border border-border-subtle bg-background px-4 text-[14px] text-foreground placeholder:text-foreground-dim focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={draft.trim().length === 0}
            aria-label="Send"
            className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform active:scale-90 disabled:opacity-40"
          >
            <SendHorizontal size={17} />
          </button>
        </form>
      }
    >
      {/* Pinned jam header — the reason this conversation exists. */}
      {jam && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-[12px] border border-border-subtle bg-gradient-to-br from-hero-from to-hero-to p-3">
          <div className="min-w-0">
            <div className="truncate font-serif text-[14px] font-bold text-foreground">
              {jam.title}
            </div>
            <div className="truncate text-[12px] text-foreground-dim">
              {formatShortDateTime(jam.startsAt)}
              {venue ? ` · ${venue.name}` : ''}
            </div>
          </div>
          <Link href={`/jams/${jam.id}`} className="shrink-0 text-[13px] font-medium text-primary">
            Details
          </Link>
        </div>
      )}

      {days.length === 0 ? (
        <p className="py-8 text-center text-[13px] text-foreground-dim">
          No messages yet. Say hello.
        </p>
      ) : (
        days.map((day) => (
          <section key={day.key} className="mb-4">
            <h2 className="mb-3 text-center text-[11px] font-medium uppercase tracking-[0.08em] text-foreground-dim">
              {formatDayHeading(day.items[0].sentAt, NOW)}
            </h2>
            <div className="flex flex-col gap-3">
              {day.items.map((message) => {
                if (message.kind === 'system') {
                  return (
                    <p
                      key={message.id}
                      className="mx-auto max-w-[80%] text-center text-[12px] text-foreground-dim"
                    >
                      {message.body}
                    </p>
                  )
                }
                const mine = message.authorId === CURRENT_USER_ID
                const author = getMusician(message.authorId)
                return (
                  <div
                    key={message.id}
                    className={cn('flex items-end gap-2', mine && 'flex-row-reverse')}
                  >
                    {!mine &&
                      (author ? (
                        <Avatar
                          src={author.avatarUrl}
                          name={author.name}
                          size="md"
                          ring={false}
                          className="border border-border-subtle"
                        />
                      ) : (
                        <div className="h-8 w-8 shrink-0 rounded-full bg-secondary" />
                      ))}
                    <div
                      className={cn(
                        'max-w-[78%] rounded-[16px] px-3 py-2',
                        mine
                          ? 'rounded-br-[4px] bg-primary text-primary-foreground'
                          : 'rounded-bl-[4px] border border-border-subtle bg-card text-foreground',
                      )}
                    >
                      {!mine && display.showAuthorInPreview && (
                        <div className="mb-0.5 text-[11px] font-medium text-primary">
                          {authorName(message.authorId)}
                        </div>
                      )}
                      <div className="text-[14px]">{message.body}</div>
                      <div
                        className={cn(
                          'mt-0.5 text-right text-[10px]',
                          mine ? 'text-primary-foreground/70' : 'text-foreground-dim',
                        )}
                      >
                        {formatTime(message.sentAt)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        ))
      )}
    </AppShell>
  )
}
