'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { CalendarDays, Check, ChevronRight, Compass, Search, X } from 'lucide-react'
import { AppShell } from '@/components/riff/AppShell'
import { MusicianCard } from '@/components/riff/MusicianCard'
import { OpenCallCard } from '@/components/riff/OpenCallCard'
import { TopBar } from '@/components/riff/TopBar'
import { Button, buttonClass } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ChipTabs } from '@/components/ui/Tabs'
import { cn } from '@/lib/cn'
import { intentLabel } from '@/lib/labels'
import { useRiffStore } from '@/lib/store'
import { listNearbyMusicians } from '@/mocks'
import type { Intent, Jam } from '@/types'

type IntentFilter = Intent | 'all'

const INTENT_CHIPS: { id: IntentFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'casual', label: intentLabel('casual') },
  { id: 'serious', label: intentLabel('serious') },
  { id: 'gigging', label: intentLabel('gigging') },
]

const postedTs = (jam: Jam) => (jam.postedAt ? Date.parse(jam.postedAt) : 0)

/** The Discover feed (docs/BUILD-PLAN.md P2-02, from 20-discover.html). */
export function DiscoverView() {
  const jams = useRiffStore((s) => s.jams)

  const [intent, setIntent] = useState<IntentFilter>('all')
  const [tonightOnly, setTonightOnly] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')

  const musicians = useMemo(() => listNearbyMusicians(), [])
  const tonightAllCount = useMemo(() => listNearbyMusicians({ tonightOnly: true }).length, [])

  const q = query.trim().toLowerCase()
  const filtered = musicians.filter(
    (m) =>
      (intent === 'all' || m.intent === intent) &&
      (!tonightOnly || m.availableTonight) &&
      (q === '' || m.name.toLowerCase().includes(q)),
  )

  // Only pending open calls belong in the feed — once the host accepts someone the jam is
  // confirmed and stops recruiting (docs/SPEC.md, product rule 1).
  const openCalls = useMemo(
    () =>
      jams
        .filter((jam) => jam.isOpenCall && jam.status === 'pending')
        .sort((a, b) => postedTs(b) - postedTs(a)),
    [jams],
  )

  const hasActiveFilters = intent !== 'all' || tonightOnly || q !== ''

  function clearFilters() {
    setIntent('all')
    setTonightOnly(false)
    setQuery('')
    setSearchOpen(false)
  }

  // Closing search also drops the query so no invisible filter keeps trimming the feed.
  function toggleSearch() {
    if (searchOpen) setQuery('')
    setSearchOpen((open) => !open)
  }

  // One open call after every two musician cards; whatever is left trails the feed.
  const feed: React.ReactNode[] = []
  filtered.forEach((musician, i) => {
    feed.push(<MusicianCard key={musician.id} musician={musician} />)
    if (i % 2 === 1) {
      const call = openCalls[(i - 1) / 2]
      if (call) feed.push(<OpenCallCard key={call.id} jam={call} />)
    }
  })
  for (const call of openCalls.slice(Math.floor(filtered.length / 2))) {
    feed.push(<OpenCallCard key={call.id} jam={call} />)
  }

  return (
    <AppShell
      activeTab="discover"
      liveIndicator
      header={
        <>
          <TopBar
            actions={
              <button
                type="button"
                aria-label={searchOpen ? 'Close search' : 'Search musicians by name'}
                aria-expanded={searchOpen}
                onClick={toggleSearch}
                className={cn(
                  'flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-full',
                  'transition-transform active:scale-90',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  searchOpen
                    ? 'border border-primary bg-primary text-primary-foreground'
                    : 'border border-border-subtle bg-card text-foreground',
                )}
              >
                {searchOpen ? <X size={15} /> : <Search size={15} />}
              </button>
            }
          />
          {searchOpen && (
            <div className="shrink-0 bg-background px-4 pb-2">
              <div className="flex h-[44px] items-center gap-2 rounded-[12px] border border-border-subtle bg-card px-3">
                <Search size={15} className="shrink-0 text-foreground-dim" />
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name"
                  aria-label="Search musicians by name"
                  className="h-full w-full bg-transparent text-[14px] text-foreground placeholder:text-foreground-dim focus:outline-none"
                />
                {query !== '' && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setQuery('')}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-foreground-dim transition-transform active:scale-90"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      }
      mainClassName="flex flex-col gap-5 pb-6 pt-2"
    >
      <ChipTabs<IntentFilter>
        items={INTENT_CHIPS}
        value={intent}
        onChange={setIntent}
        className="shrink-0 px-4"
      />

      <div className="px-4">
        <button
          type="button"
          aria-pressed={tonightOnly}
          onClick={() => setTonightOnly((v) => !v)}
          className={cn(
            'flex w-full items-center justify-between gap-3 rounded-[16px] bg-surface-muted p-4',
            'text-left shadow-sm transition-transform active:scale-[0.98]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            tonightOnly
              ? 'border border-primary ring-1 ring-primary'
              : 'border border-border-subtle/50',
          )}
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-card text-primary shadow-sm">
              <CalendarDays size={18} />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-[15px] font-bold text-foreground">
                Who&apos;s free tonight?
              </span>
              <span className="truncate text-[13px] text-muted-foreground">
                {tonightOnly
                  ? `Showing ${filtered.length} free tonight · tap to clear`
                  : `${tonightAllCount} musician${tonightAllCount === 1 ? '' : 's'} nearby ready to jam`}
              </span>
            </span>
          </div>
          {tonightOnly ? (
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Check size={13} strokeWidth={3} />
            </span>
          ) : (
            <ChevronRight size={16} className="shrink-0 text-foreground-dim" />
          )}
        </button>
      </div>

      <div className="flex w-full flex-col gap-4 px-4">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Compass size={22} />}
            title="No one matches those filters"
            body={
              hasActiveFilters
                ? 'Loosen the filters, or post an open call and let players come to you.'
                : 'No musicians nearby right now. Post an open call and let players come to you.'
            }
            action={
              <div className="flex gap-2">
                {hasActiveFilters && (
                  <Button size="sm" onClick={clearFilters}>
                    Clear filters
                  </Button>
                )}
                <Link
                  href="/jams/new"
                  className={buttonClass({
                    size: 'sm',
                    variant: hasActiveFilters ? 'secondary' : 'primary',
                  })}
                >
                  Post an open call
                </Link>
              </div>
            }
          />
        ) : (
          feed
        )}
      </div>
    </AppShell>
  )
}
