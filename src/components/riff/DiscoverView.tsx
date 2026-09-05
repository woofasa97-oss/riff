'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CalendarDays, Check, ChevronRight, Compass, Eye, MapPin, Search, X } from 'lucide-react'
import { AppShell } from '@/components/riff/AppShell'
import { MusicianCard } from '@/components/riff/MusicianCard'
import { OpenCallCard } from '@/components/riff/OpenCallCard'
import { TopBar } from '@/components/riff/TopBar'
import { Button, buttonClass } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ChipTabs } from '@/components/ui/Tabs'
import { cn } from '@/lib/cn'
import { genreLabel, instrumentLabel, intentLabel, playerLabel } from '@/lib/labels'
import { useIsGuest, useRiffStore } from '@/lib/store'
import { listNearbyMusicians } from '@/mocks'
import type { Genre, Intent, Jam, Musician } from '@/types'

type IntentFilter = Intent | 'all'
type GenreFilter = Genre | 'all'

/** Guest "just looking" strip: once dismissed it stays hidden for the session. */
const GUEST_BANNER_KEY = 'riff_guest_banner_dismissed'

const INTENT_CHIPS: { id: IntentFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'casual', label: intentLabel('casual') },
  { id: 'serious', label: intentLabel('serious') },
  { id: 'gigging', label: intentLabel('gigging') },
]

// The seven canonical genres (docs/DATA-MODEL.md), leading with an "all" escape hatch.
const GENRES: Genre[] = ['jazz', 'neo-soul', 'fusion', 'indie', 'rock', 'funk', 'hip-hop']
const GENRE_CHIPS: { id: GenreFilter; label: string }[] = [
  { id: 'all', label: 'All genres' },
  ...GENRES.map((g) => ({ id: g, label: genreLabel(g) })),
]

const postedTs = (jam: Jam) => (jam.postedAt ? Date.parse(jam.postedAt) : 0)

/** Search hits a musician's name, their instrument (either label form), or their genres. */
function matchesSearch(m: Musician, q: string): boolean {
  if (q === '') return true
  if (m.name.toLowerCase().includes(q)) return true
  if (
    m.instruments.some(
      (i) =>
        instrumentLabel(i).toLowerCase().includes(q) || playerLabel(i).toLowerCase().includes(q),
    )
  ) {
    return true
  }
  return m.genres.some((g) => genreLabel(g).toLowerCase().includes(q))
}

/** The Discover feed (docs/BUILD-PLAN.md P2-02, from 20-discover.html). */
export function DiscoverView() {
  const jams = useRiffStore((s) => s.jams)
  const allMusicians = useRiffStore((s) => s.musicians)
  const viewerId = useRiffStore((s) => s.viewerId)
  const isGuest = useIsGuest()

  // The map deep-links here with a URL scope (docs/BUILD-PLAN cross-ticket contract):
  // ?zone=<Neighbourhood> narrows the feed to one patch, ?tonight=1 pre-arms the tonight filter.
  const searchParams = useSearchParams()
  const zone = searchParams.get('zone')?.trim() || null

  const [intent, setIntent] = useState<IntentFilter>('all')
  const [genre, setGenre] = useState<GenreFilter>('all')
  const [tonightOnly, setTonightOnly] = useState(() => searchParams.get('tonight') === '1')
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')

  // A guest can dismiss the "just looking" strip; the choice is stored client-side so it holds
  // across tab switches. Read after mount (not during render) to stay SSR/hydration-safe.
  const [bannerDismissed, setBannerDismissed] = useState(false)
  useEffect(() => {
    try {
      if (localStorage.getItem(GUEST_BANNER_KEY) === '1') setBannerDismissed(true)
    } catch {
      // localStorage unavailable (SSR, privacy mode): the banner simply shows.
    }
  }, [])

  function dismissBanner() {
    setBannerDismissed(true)
    try {
      localStorage.setItem(GUEST_BANNER_KEY, '1')
    } catch {
      // Non-fatal: the dismissal still holds for this mount even if it cannot persist.
    }
  }

  // Fed from the store snapshot so new sign-ups appear on the next poll, no reload needed.
  const musicians = useMemo(() => {
    const nearby = listNearbyMusicians({ viewerId }, allMusicians)
    return zone ? nearby.filter((m) => m.neighborhood === zone) : nearby
  }, [viewerId, allMusicians, zone])
  const tonightAllCount = useMemo(() => {
    const free = listNearbyMusicians({ tonightOnly: true, viewerId }, allMusicians)
    return (zone ? free.filter((m) => m.neighborhood === zone) : free).length
  }, [viewerId, allMusicians, zone])

  const q = query.trim().toLowerCase()
  const filtered = musicians.filter(
    (m) =>
      (intent === 'all' || m.intent === intent) &&
      (genre === 'all' || m.genres.includes(genre)) &&
      (!tonightOnly || m.availableTonight) &&
      matchesSearch(m, q),
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

  const hasActiveFilters = intent !== 'all' || genre !== 'all' || tonightOnly || q !== ''

  function clearFilters() {
    setIntent('all')
    setGenre('all')
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
                aria-label={searchOpen ? 'Close search' : 'Search musicians'}
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
                  placeholder="Search by name, instrument or genre"
                  aria-label="Search musicians by name, instrument or genre"
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
      <h1 className="sr-only">Discover musicians near you</h1>
      {isGuest && !bannerDismissed && (
        <div className="shrink-0 px-4">
          <div className="flex items-center gap-2.5 rounded-[12px] border border-border-subtle bg-surface-muted px-3 py-1.5 shadow-sm">
            <Eye size={15} className="shrink-0 text-primary" />
            <p className="min-w-0 flex-1 text-[13px] font-medium leading-snug text-foreground">
              You&apos;re just looking — create your player card to jam.
            </p>
            <Link href="/signup" className={cn(buttonClass({ size: 'sm' }), 'shrink-0 px-4')}>
              Sign up
            </Link>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={dismissBanner}
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                'text-foreground-dim transition-transform active:scale-90',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              )}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {zone && (
        <div className="shrink-0 px-4">
          <div className="flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 py-1.5 pl-3 pr-1.5 text-primary">
            <MapPin size={14} className="shrink-0" />
            <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">In {zone}</span>
            <Link
              href="/discover"
              aria-label={`Clear ${zone} filter`}
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                'transition-transform active:scale-90',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              )}
            >
              <X size={14} />
            </Link>
          </div>
        </div>
      )}

      <ChipTabs<IntentFilter>
        items={INTENT_CHIPS}
        value={intent}
        onChange={setIntent}
        className="shrink-0 px-4"
      />

      <ChipTabs<GenreFilter>
        items={GENRE_CHIPS}
        value={genre}
        onChange={setGenre}
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
