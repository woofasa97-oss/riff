'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  CalendarCheck,
  CalendarDays,
  CircleCheck,
  Info,
  Loader2,
  Plus,
  SendHorizontal,
} from 'lucide-react'
import { AppShell } from '@/components/riff/AppShell'
import { SubScreenHeader } from '@/components/riff/TopBar'
import { authorName, describeThread } from '@/components/riff/threadDisplay'
import { Avatar } from '@/components/ui/Avatar'
import { buttonClass } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { iconButtonClass } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { formatDayAndTime, formatDayHeading, formatTime, groupByDay } from '@/lib/datetime'
import { useRiffStore } from '@/lib/store'
import { getJam, getMusician, getVenue, listMessages } from '@/mocks'

/**
 * The conversation behind a thread row: pinned jam strip, day-grouped bubbles, inline system
 * events, composer. The Jams and Messages screens both link here and neither may dead-end
 * (docs/SPEC.md §5.5).
 */
export function ThreadView({ threadId }: { threadId: string }) {
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const viewerId = useRiffStore((s) => s.viewerId)
  const now = useRiffStore((s) => s.now)
  const messages = useRiffStore((s) => s.messages)
  const jams = useRiffStore((s) => s.jams)
  const threads = useRiffStore((s) => s.threads)
  const sendMessage = useRiffStore((s) => s.sendMessage)

  const markThreadRead = useRiffStore((s) => s.markThreadRead)
  const thread = threads.find((t) => t.id === threadId)

  // Reading the conversation clears its unread dot on the Messages list. The store applies it
  // optimistically, so fire-and-forget is enough here.
  useEffect(() => {
    if (thread && thread.unreadCount > 0) void markThreadRead(thread.id)
  }, [thread, markThreadRead])
  const display = thread ? describeThread(thread, viewerId, jams) : undefined
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
            <Link href="/messages" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
              Back to messages
            </Link>
          }
        />
      </AppShell>
    )
  }

  async function handleSend(event: React.FormEvent) {
    event.preventDefault()
    const body = draft.trim()
    if (!body || !thread || sending) return
    setSending(true)
    setSendError(null)
    try {
      await sendMessage(thread.id, body)
      // Only a delivered message clears the box — a failed one stays editable.
      setDraft('')
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Could not send — try again')
    } finally {
      setSending(false)
    }
  }

  const isGroup = display.faces.length > 1

  return (
    <AppShell
      activeTab="jams"
      header={
        <>
          <SubScreenHeader
            bordered={false}
            backHref="/messages"
            title={display.title}
            subtitle={
              jam && venue ? `${formatDayAndTime(jam.startsAt)} · ${venue.name}` : undefined
            }
            lead={
              isGroup ? (
                <span className="flex -space-x-2">
                  {display.faces.slice(0, 3).map((face) => (
                    <Avatar
                      key={face.id}
                      src={face.avatarUrl}
                      name={face.name}
                      size="xs"
                      ring={false}
                      className="border border-background"
                    />
                  ))}
                </span>
              ) : undefined
            }
            action={
              jam ? (
                <Link
                  href={`/jams/${jam.id}`}
                  aria-label="Jam details"
                  className={iconButtonClass()}
                >
                  <Info size={15} />
                </Link>
              ) : undefined
            }
          />
          {jam && venue && (
            <ThreadContextStrip
              label={`${formatDayAndTime(jam.startsAt)} · ${venue.name}`}
              href={`/jams/${jam.id}`}
            />
          )}
        </>
      }
      mainClassName="flex flex-col gap-4 px-4 py-4"
      footer={
        <form
          onSubmit={handleSend}
          className="pb-safe z-20 shrink-0 border-t border-border-subtle bg-background/95 px-4 py-3 backdrop-blur-md"
        >
          {sendError && (
            <p role="alert" className="mb-2 text-[12px] text-destructive">
              {sendError}
            </p>
          )}
          <div className="flex items-center gap-2">
            {/* Attachments are out of scope for v1, so this opens the jam rather than a picker. */}
            <Link
              href={jam ? `/jams/${jam.id}` : '/jams'}
              aria-label="Jam details"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-card text-foreground transition-transform active:scale-90"
            >
              <Plus size={17} />
            </Link>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={isGroup ? 'Message the group' : 'Message'}
              aria-label="Write a message"
              className="h-10 flex-1 rounded-full border border-border-subtle bg-card px-4 text-[14px] text-foreground placeholder:text-foreground-dim focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={sending || draft.trim().length === 0}
              aria-label="Send"
              aria-busy={sending}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform active:scale-90 disabled:opacity-40"
            >
              {sending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <SendHorizontal size={16} />
              )}
            </button>
          </div>
        </form>
      }
    >
      {days.length === 0 ? (
        <p className="py-8 text-center text-[13px] text-foreground-dim">
          No messages yet. Say hello.
        </p>
      ) : (
        days.map((day) => (
          <section key={day.key} className="flex flex-col gap-4">
            <div className="text-center">
              <span className="inline-block rounded-full border border-border-subtle bg-card px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-foreground-dim">
                {formatDayHeading(day.items[0].sentAt, now)}
              </span>
            </div>

            {day.items.map((message) => {
              if (message.kind === 'system') {
                return (
                  <div key={message.id} className="flex justify-center">
                    <div className="flex items-center gap-2 rounded-[12px] border border-border-subtle bg-card px-3 py-2 shadow-sm">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-background text-primary">
                        <CalendarCheck size={12} />
                      </span>
                      <span className="text-[12px] font-medium text-foreground">
                        {message.body}
                      </span>
                      <CircleCheck size={14} className="text-success" />
                    </div>
                  </div>
                )
              }

              const mine = message.authorId === viewerId
              const author = getMusician(message.authorId)

              if (mine) {
                return (
                  <div key={message.id} className="flex justify-end">
                    <div className="max-w-[75%] rounded-[16px] rounded-br-sm bg-primary px-4 py-2.5 text-[14px] text-primary-foreground shadow-sm">
                      {message.body}
                      <div className="mt-0.5 text-right text-[10px] text-primary-foreground/70">
                        {formatTime(message.sentAt)}
                      </div>
                    </div>
                  </div>
                )
              }

              return (
                <div key={message.id} className="flex items-end gap-2">
                  {author ? (
                    <Avatar src={author.avatarUrl} name={author.name} size="md" className="mb-1" />
                  ) : (
                    <div className="mb-1 h-8 w-8 shrink-0 rounded-full bg-secondary" />
                  )}
                  <div className="flex max-w-[75%] flex-col gap-1">
                    <span className="ml-1 text-[10px] font-bold uppercase tracking-[0.04em] text-primary">
                      {authorName(message.authorId)}
                    </span>
                    <div className="rounded-[16px] rounded-bl-sm border border-border-subtle bg-card px-4 py-2.5 text-[14px] text-foreground shadow-sm">
                      {message.body}
                      <div className="mt-0.5 text-[10px] text-foreground-dim">
                        {formatTime(message.sentAt)}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </section>
        ))
      )}
    </AppShell>
  )
}

/** The lilac strip under the header: when and where, plus a jump to the jam. */
export function ThreadContextStrip({
  label,
  href,
  className,
}: {
  label: string
  href: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-between gap-3 border-y border-border-subtle bg-surface-muted px-4 py-2',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2 text-primary">
        <CalendarDays size={14} className="shrink-0" />
        <span className="truncate text-[12px] font-medium">{label}</span>
      </div>
      <Link
        href={href}
        className="shrink-0 text-[12px] font-bold uppercase tracking-[0.08em] text-primary"
      >
        Details
      </Link>
    </div>
  )
}
