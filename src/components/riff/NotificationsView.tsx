'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Bell,
  Check,
  CheckCheck,
  Handshake,
  Mail,
  Music,
  Play,
  TrendingUp,
  Trophy,
  User,
} from 'lucide-react'
import { AppShell } from '@/components/riff/AppShell'
import { SubScreenHeader } from '@/components/riff/TopBar'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { buttonClass, IconButton } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { dayDelta, formatRelativeShort, formatShortDateTime } from '@/lib/datetime'
import { useIsGuest, useRiffStore } from '@/lib/store'
import { getBand, getJam, getMusician } from '@/mocks'
import type { Notification } from '@/types'

type Filter = 'all' | 'requests'

/** Kinds that belong to the Requests tab — the ones that are about someone asking to play. */
const REQUEST_KINDS: Notification['kind'][] = [
  'request_received',
  'request_accepted',
  'open_call_application',
]

/** One badge per kind, so a row is identifiable before it is read. */
function KindBadge({ kind }: { kind: Notification['kind'] }) {
  const map = {
    request_received: { icon: <Mail size={8} />, tone: 'bg-primary' },
    request_accepted: { icon: <Check size={8} strokeWidth={4} />, tone: 'bg-success' },
    vouch_received: { icon: <Handshake size={8} />, tone: 'bg-primary' },
    open_call_application: { icon: <Mail size={8} />, tone: 'bg-accent' },
    rank_change: { icon: <Trophy size={8} />, tone: 'bg-[#facc15]' },
    band_live: { icon: <Play size={8} fill="currentColor" />, tone: 'bg-live' },
  } as const
  const { icon, tone } = map[kind]
  return (
    <span
      className={cn(
        'absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full',
        'border-[1.5px] border-card text-white',
        tone,
      )}
    >
      {icon}
    </span>
  )
}

/** Where a row goes when tapped. Every notification deep-links to its subject. */
function targetHref(n: Notification): string {
  if (n.meta?.requestId) return `/requests/${n.meta.requestId}`
  if (n.meta?.liveId) return `/live/${n.meta.liveId}`
  if (n.meta?.jamId) return `/jams/${n.meta.jamId}`
  if (n.kind === 'rank_change') return '/leaderboard'
  if (n.kind === 'vouch_received') return '/me'
  return '/jams'
}

/** The second line, which differs by kind. */
function subtitleFor(n: Notification): React.ReactNode {
  switch (n.kind) {
    case 'request_accepted':
    case 'open_call_application': {
      const jam = n.meta?.jamId ? getJam(n.meta.jamId) : undefined
      if (!jam) return null
      return (
        <p className="mt-1 text-[12px] text-muted-foreground">
          {n.kind === 'request_accepted' ? formatShortDateTime(jam.startsAt) : jam.title}
        </p>
      )
    }
    case 'vouch_received':
      return <p className="mt-1 text-[12px] font-medium text-primary">{n.meta?.tags}</p>
    default:
      return null
  }
}

function NotificationRow({ n }: { n: Notification }) {
  const actor = n.actorId ? getMusician(n.actorId) : undefined
  const band = n.meta?.bandId ? getBand(n.meta.bandId) : undefined
  const now = useRiffStore((s) => s.now)
  const markRead = useRiffStore((s) => s.markNotificationRead)

  return (
    <Link
      href={targetHref(n)}
      // Optimistic in the store — navigation should not wait on the round-trip.
      onClick={() => void markRead(n.id)}
      className={cn(
        'relative flex gap-3 rounded-[16px] border border-border-subtle p-4 shadow-sm',
        !n.read ? 'bg-[color:var(--hero-from)]' : 'bg-card',
      )}
    >
      <div className="relative shrink-0">
        {actor ? (
          <Avatar src={actor.avatarUrl} name={actor.name} size="lg" />
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-border-subtle bg-background text-primary">
            {n.kind === 'rank_change' ? (
              <TrendingUp size={16} />
            ) : n.kind === 'band_live' ? (
              <Music size={16} />
            ) : (
              <User size={16} />
            )}
          </span>
        )}
        <KindBadge kind={n.kind} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[14px] leading-snug text-foreground">
          {actor && <span className="font-serif font-bold">{actor.name} </span>}
          {band && <span className="font-serif font-bold">{band.name} </span>}
          {n.body}
          {n.meta?.scene && <span className="font-serif font-bold"> {n.meta.scene}</span>}
        </p>
        {subtitleFor(n)}
      </div>

      <span className="mt-0.5 flex shrink-0 items-center gap-1.5">
        {!n.read && <span className="h-2 w-2 rounded-full bg-primary" aria-label="Unread" />}
        <span className="text-[12px] text-foreground-dim">
          {formatRelativeShort(n.createdAt, now)}
        </span>
      </span>
    </Link>
  )
}

export function NotificationsView() {
  const [filter, setFilter] = useState<Filter>('all')
  const isGuest = useIsGuest()
  const notifications = useRiffStore((s) => s.notifications)
  const now = useRiffStore((s) => s.now)
  const markAll = useRiffStore((s) => s.markAllNotificationsRead)

  const { today, earlier } = useMemo(() => {
    // The server hands the list newest-first; re-sort defensively after optimistic updates.
    const rows = notifications
      .filter((n) => (filter === 'requests' ? REQUEST_KINDS.includes(n.kind) : true))
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    return {
      today: rows.filter((n) => dayDelta(n.createdAt, now) === 0),
      earlier: rows.filter((n) => dayDelta(n.createdAt, now) !== 0),
    }
  }, [filter, notifications, now])

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <AppShell
      activeTab={undefined}
      header={
        <>
          <SubScreenHeader
            title="Notifications"
            backHref="/me"
            bordered={false}
            action={
              <IconButton
                label="Mark all as read"
                // Optimistic in the store, so fire-and-forget.
                onClick={() => void markAll()}
                disabled={unreadCount === 0}
                className="border-transparent bg-transparent disabled:opacity-30"
              >
                <CheckCheck size={16} />
              </IconButton>
            }
          />
          <div role="tablist" className="flex shrink-0 border-b border-border-subtle px-4">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'requests', label: 'Requests' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={filter === tab.id}
                onClick={() => setFilter(tab.id)}
                className={cn(
                  'flex-1 border-b-2 py-3 text-[14px] transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  filter === tab.id
                    ? 'border-primary font-semibold text-primary'
                    : 'border-transparent font-medium text-foreground-dim',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </>
      }
      mainClassName="pb-6"
    >
      {isGuest ? (
        // Notifications only exist once people can reach you — requests, accepts and vouches all
        // depend on a player card, so guests get the same sign-up nudge every private surface shows.
        <div className="px-4 py-6">
          <EmptyState
            icon={<Bell size={22} />}
            title="Sign up to get notified"
            body="Requests to play, accepted jams and vouches from the people you play with all land here."
            action={
              <div className="flex gap-2">
                <Link href="/signup" className={buttonClass({ size: 'sm' })}>
                  Create player card
                </Link>
                <Link
                  href="/discover"
                  className={buttonClass({ variant: 'secondary', size: 'sm' })}
                >
                  Browse musicians
                </Link>
              </div>
            }
          />
        </div>
      ) : today.length === 0 && earlier.length === 0 ? (
        <div className="px-4 py-6">
          <EmptyState
            icon={<Bell size={22} />}
            title="Nothing new"
            body={
              filter === 'requests'
                ? 'Replies to your requests and applications show up here.'
                : 'Accepted requests, vouches and season movement land here.'
            }
          />
        </div>
      ) : (
        <>
          {today.length > 0 && (
            <section className="px-4 py-3">
              <SectionHeader>Today</SectionHeader>
              <div className="flex flex-col gap-2">
                {today.map((n) => (
                  <NotificationRow key={n.id} n={n} />
                ))}
              </div>
            </section>
          )}
          {earlier.length > 0 && (
            <section className="px-4 py-3">
              <SectionHeader>Earlier</SectionHeader>
              <div className="flex flex-col gap-2">
                {earlier.map((n) => (
                  <NotificationRow key={n.id} n={n} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </AppShell>
  )
}
