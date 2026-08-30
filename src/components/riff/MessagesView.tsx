'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Mic, Music2, Search, SquarePen } from 'lucide-react'
import { AppShell } from '@/components/riff/AppShell'
import { SubScreenHeader } from '@/components/riff/TopBar'
import { authorName, describeThread } from '@/components/riff/threadDisplay'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ContextLabel } from '@/components/ui/Badge'
import { ChipTabs } from '@/components/ui/Tabs'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/cn'
import { formatRelativeShort } from '@/lib/datetime'
import { useRiffStore } from '@/lib/store'
import { CURRENT_USER_ID, NOW, getLastMessage, listThreads } from '@/mocks'

type Filter = 'all' | 'jams' | 'requests' | 'bands'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'jams', label: 'Jams' },
  { id: 'requests', label: 'Requests' },
  { id: 'bands', label: 'Bands' },
]

export function MessagesView() {
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const messages = useRiffStore((s) => s.messages)

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return (
      listThreads(CURRENT_USER_ID)
        .map((thread) => {
          const display = describeThread(thread, CURRENT_USER_ID)
          const last = getLastMessage(thread.id, messages)
          return { thread, display, last }
        })
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
        // Re-sort on the live message list so a reply sent this session jumps to the top.
        .sort(
          (a, b) =>
            Date.parse(b.last?.sentAt ?? b.thread.lastMessageAt) -
            Date.parse(a.last?.sentAt ?? a.thread.lastMessageAt),
        )
    )
  }, [filter, query, messages])

  return (
    <AppShell
      activeTab="jams"
      header={
        <SubScreenHeader
          title="Messages"
          backHref="/jams"
          action={
            // Starting a new conversation means picking someone first, so compose goes to Discover.
            <Link
              href="/discover"
              aria-label="New message"
              className="flex h-[36px] w-[36px] items-center justify-center rounded-full border border-border-subtle bg-card text-foreground transition-transform active:scale-90"
            >
              <SquarePen size={15} />
            </Link>
          }
        />
      }
      mainClassName="pb-6"
    >
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
                <Link href="/discover">
                  <Button size="sm" variant="secondary">
                    Find musicians
                  </Button>
                </Link>
              )
            }
          />
        ) : (
          rows.map(({ thread, display, last }) => {
            const unread = thread.unreadCount > 0
            return (
              <Card key={thread.id} className="relative p-0">
                <Link href={`/messages/${thread.id}`} className="flex gap-4 p-4">
                  {/* Group threads draw two overlapping faces; venue and band threads use an icon. */}
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
                        {last ? formatRelativeShort(last.sentAt, NOW) : ''}
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
    </AppShell>
  )
}
