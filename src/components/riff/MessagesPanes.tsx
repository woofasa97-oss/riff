'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  CalendarCheck,
  CalendarDays,
  ChevronLeft,
  CircleCheck,
  Info,
  Loader2,
  MessageSquare,
  Mic,
  Music2,
  Plus,
  Search,
  SendHorizontal,
  SquarePen,
} from 'lucide-react'
import { authorName, describeThread } from '@/components/riff/threadDisplay'
import { Avatar } from '@/components/ui/Avatar'
import { Button, buttonClass, iconButtonClass } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ContextLabel } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { ChipTabs } from '@/components/ui/Tabs'
import { cn } from '@/lib/cn'
import {
  formatDayAndTime,
  formatDayHeading,
  formatRelativeShort,
  formatTime,
  groupByDay,
} from '@/lib/datetime'
import { useIsGuest, useRiffStore } from '@/lib/store'
import { getJam, getLastMessage, getMusician, getVenue, listMessages } from '@/mocks'

type Filter = 'all' | 'jams' | 'requests' | 'bands'
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'jams', label: 'Jams' },
  { id: 'requests', label: 'Requests' },
  { id: 'bands', label: 'Bands' },
]

/**
 * The inbox list, as a self-contained pane (no AppShell). On desktop it's the persistent left
 * rail of the split-pane inbox; on mobile it's the whole /messages screen. `selectedId` tints the
 * open conversation's row.
 */
export function ThreadListPane({ selectedId }: { selectedId?: string }) {
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const isGuest = useIsGuest()
  const viewerId = useRiffStore((s) => s.viewerId)
  const now = useRiffStore((s) => s.now)
  const messages = useRiffStore((s) => s.messages)
  const threads = useRiffStore((s) => s.threads)
  const jams = useRiffStore((s) => s.jams)

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return threads
      .filter((t) => t.participantIds.includes(viewerId))
      .map((thread) => ({
        thread,
        display: describeThread(thread, viewerId, jams),
        last: getLastMessage(thread.id, messages),
      }))
      .filter(({ thread }) => {
        if (filter === 'jams') return thread.kind === 'jam'
        if (filter === 'requests') return Boolean(thread.requestId)
        if (filter === 'bands') return thread.kind === 'band'
        return true
      })
      .filter(({ display, last }) => {
        if (!needle) return true
        return (
          display.title.toLowerCase().includes(needle) ||
          (last?.body.toLowerCase().includes(needle) ?? false)
        )
      })
      .sort(
        (a, b) =>
          Date.parse(b.last?.sentAt ?? b.thread.lastMessageAt) -
          Date.parse(a.last?.sentAt ?? a.thread.lastMessageAt),
      )
  }, [filter, query, messages, threads, jams, viewerId])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Pane header: back to Jams on mobile only (desktop keeps the list beside the thread). */}
      <div className="flex h-[56px] shrink-0 items-center gap-2 border-b border-border-subtle px-4">
        <Link
          href="/jams"
          aria-label="Back to jams"
          className="-ml-1 flex h-8 w-8 items-center justify-center text-foreground lg:hidden"
        >
          <ChevronLeft size={20} />
        </Link>
        <h1 className="flex-1 font-serif text-[20px] font-bold text-foreground">Messages</h1>
        <Link
          href="/discover"
          aria-label="New message"
          className="flex h-[36px] w-[36px] items-center justify-center rounded-full border border-border-subtle bg-card text-foreground transition-transform active:scale-90"
        >
          <SquarePen size={15} />
        </Link>
      </div>

      {isGuest ? (
        <div className="px-4 py-6">
          <EmptyState
            icon={<MessageSquare size={22} />}
            title="Sign up to start conversations"
            body="Jam threads and the requests waiting on you land here once you have a player card."
            action={
              <div className="flex gap-2">
                <Link href="/signup" className={buttonClass({ size: 'sm' })}>
                  Create player card
                </Link>
                <Link href="/discover" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
                  Browse musicians
                </Link>
              </div>
            }
          />
        </div>
      ) : (
        <div className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto pb-6">
          <div className="px-4 py-3">
            <label className="flex h-[40px] items-center gap-2 rounded-full border border-border-subtle bg-card px-4">
              <Search size={14} className="shrink-0 text-foreground-dim" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search jams and people"
                aria-label="Search jams and people"
                className="w-full bg-transparent text-[14px] text-foreground placeholder:text-foreground-dim focus:outline-none"
              />
            </label>
          </div>

          <ChipTabs<Filter> items={FILTERS} value={filter} onChange={setFilter} className="px-4 pb-4" />

          <div className="flex flex-col gap-3 px-4">
            {rows.length === 0 ? (
              <EmptyState
                title={query ? 'Nothing matches that' : 'No conversations yet'}
                body={
                  query
                    ? 'Try a different name, or clear the search.'
                    : 'Threads open when a jam is confirmed or someone replies to a request.'
                }
                action={
                  query ? (
                    <Button size="sm" variant="secondary" onClick={() => setQuery('')}>
                      Clear search
                    </Button>
                  ) : (
                    <Link href="/discover" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
                      Find musicians
                    </Link>
                  )
                }
              />
            ) : (
              rows.map(({ thread, display, last }) => {
                const unread = thread.unreadCount > 0
                const isOpen = thread.id === selectedId
                return (
                  <Card
                    key={thread.id}
                    className={cn('relative p-0', isOpen && 'ring-2 ring-primary/40')}
                  >
                    <Link href={`/messages/${thread.id}`} className="flex gap-4 p-4">
                      {display.icon ? (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-foreground text-white">
                          {display.icon === 'venue' ? <Mic size={18} /> : <Music2 size={18} />}
                        </div>
                      ) : display.faces.length > 1 ? (
                        <div className="relative h-12 w-12 shrink-0">
                          <Avatar
                            src={display.faces[0].avatarUrl}
                            name={display.faces[0].name}
                            size="md"
                            className="absolute right-0 top-0 z-10"
                          />
                          <Avatar
                            src={display.faces[1].avatarUrl}
                            name={display.faces[1].name}
                            size="md"
                            className="absolute bottom-0 left-0"
                          />
                        </div>
                      ) : (
                        <Avatar
                          src={display.faces[0]?.avatarUrl ?? '/mock/avatars/marcus-chen.svg'}
                          name={display.faces[0]?.name ?? 'Conversation'}
                          size="lg"
                          ring={false}
                          className="h-12 w-12 border-2 border-border-subtle"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="mb-0.5 flex items-start justify-between gap-2">
                          <h3 className="truncate font-serif text-[15px] font-bold text-foreground">
                            {display.title}
                          </h3>
                          <span
                            className={cn('shrink-0 text-[12px] text-foreground-dim', unread && 'mr-4')}
                          >
                            {last ? formatRelativeShort(last.sentAt, now) : ''}
                          </span>
                        </div>
                        <p
                          className={cn(
                            'mb-2 truncate text-[14px]',
                            unread ? 'font-medium text-foreground' : 'text-foreground-dim',
                          )}
                        >
                          {last
                            ? display.showAuthorInPreview && last.authorId !== 'system'
                              ? `${authorName(last.authorId).split(' ')[0]}: ${last.body}`
                              : last.body
                            : 'No messages yet'}
                        </p>
                        <ContextLabel tone={display.contextTone}>{display.contextLabel}</ContextLabel>
                      </div>
                    </Link>
                    {unread && (
                      <span
                        className="absolute right-4 top-4 h-2.5 w-2.5 rounded-full bg-primary"
                        aria-label={`${thread.unreadCount} unread`}
                      />
                    )}
                  </Card>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/** Shown in the right pane on desktop when no conversation is open. */
export function SelectConversationPlaceholder() {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center px-8">
      <EmptyState
        icon={<MessageSquare size={22} />}
        title="Pick a conversation"
        body="Choose a thread on the left to read it and reply here."
      />
    </div>
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
      <Link href={href} className="shrink-0 text-[12px] font-bold uppercase tracking-[0.08em] text-primary">
        Details
      </Link>
    </div>
  )
}

/**
 * One conversation, as a self-contained pane (no AppShell): header, pinned jam strip, day-grouped
 * bubbles, composer. Right pane of the desktop inbox; the whole /messages/[id] screen on mobile.
 */
export function ConversationPane({ threadId }: { threadId: string }) {
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

  useEffect(() => {
    if (thread && thread.unreadCount > 0) void markThreadRead(thread.id)
  }, [thread, markThreadRead])

  const display = thread ? describeThread(thread, viewerId, jams) : undefined
  const jam = thread?.jamId ? (jams.find((j) => j.id === thread.jamId) ?? getJam(thread.jamId)) : undefined
  const venue = jam ? getVenue(jam.venueId) : undefined
  const days = useMemo(
    () => (thread ? groupByDay(listMessages(thread.id, messages)) : []),
    [thread, messages],
  )

  if (!thread || !display) {
    return (
      <div className="flex min-h-0 flex-1 items-center px-4 py-6">
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
      </div>
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
      setDraft('')
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Could not send — try again')
    } finally {
      setSending(false)
    }
  }

  const isGroup = display.faces.length > 1

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Header: back to the list on mobile (desktop keeps the list beside this pane). */}
      <div className="flex h-[56px] shrink-0 items-center gap-2 px-4">
        <Link
          href="/messages"
          aria-label="Back to messages"
          className="-ml-1 flex h-8 w-8 items-center justify-center text-foreground lg:hidden"
        >
          <ChevronLeft size={20} />
        </Link>
        {isGroup && (
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
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-serif text-[17px] font-bold leading-tight text-foreground">
            {display.title}
          </h1>
          {jam && venue && (
            <p className="truncate text-[12px] text-foreground-dim">
              {formatDayAndTime(jam.startsAt)} · {venue.name}
            </p>
          )}
        </div>
        {jam && (
          <Link href={`/jams/${jam.id}`} aria-label="Jam details" className={iconButtonClass()}>
            <Info size={15} />
          </Link>
        )}
      </div>
      {jam && venue && (
        <ThreadContextStrip
          label={`${formatDayAndTime(jam.startsAt)} · ${venue.name}`}
          href={`/jams/${jam.id}`}
        />
      )}

      <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
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
                        <span className="text-[12px] font-medium text-foreground">{message.body}</span>
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
      </div>

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
            {sending ? <Loader2 size={16} className="animate-spin" /> : <SendHorizontal size={16} />}
          </button>
        </div>
      </form>
    </div>
  )
}
