'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { CalendarPlus, Guitar, Inbox, MessageSquare } from 'lucide-react'
import { AppShell } from '@/components/riff/AppShell'
import { JamCompactCard, JamHeroCard } from '@/components/riff/JamCard'
import { RequestCard } from '@/components/riff/RequestCard'
import { TopBar } from '@/components/riff/TopBar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Tabs } from '@/components/ui/Tabs'
import { formatRelativeShort } from '@/lib/datetime'
import { useRiffStore } from '@/lib/store'
import {
  CURRENT_USER_ID,
  NOW,
  getJam,
  listIncomingRequests,
  listJams,
  listMyApplications,
  listThreads,
} from '@/mocks'

type TabKey = 'upcoming' | 'requests' | 'past'

export function JamsView() {
  const [tab, setTab] = useState<TabKey>('upcoming')
  const jams = useRiffStore((s) => s.jams)
  const recaps = useRiffStore((s) => s.recaps)

  const requests = useMemo(() => listIncomingRequests(CURRENT_USER_ID), [])
  const applications = useMemo(() => listMyApplications(CURRENT_USER_ID), [])
  const unread = useMemo(
    () => listThreads(CURRENT_USER_ID).reduce((sum, t) => sum + t.unreadCount, 0),
    [],
  )

  const upcoming = useMemo(
    () => listJams('upcoming', { viewerId: CURRENT_USER_ID, now: NOW, source: jams }),
    [jams],
  )
  const past = useMemo(
    () => listJams('past', { viewerId: CURRENT_USER_ID, now: NOW, source: jams }),
    [jams],
  )

  // "This week" is anything inside seven days; everything else falls under "Later".
  const thisWeek = upcoming.filter(
    (j) => Date.parse(j.startsAt) - Date.parse(NOW) <= 7 * 86_400_000,
  )
  const later = upcoming.filter((j) => Date.parse(j.startsAt) - Date.parse(NOW) > 7 * 86_400_000)

  const hasRecap = (jamId: string) => recaps.some((r) => r.jamId === jamId)

  return (
    <AppShell
      activeTab="jams"
      liveIndicator
      header={
        <>
          <TopBar
            actions={
              // The reference header carries a filter control; filtering needs the BottomSheet
              // primitive, which this pass did not build. Messages is a real destination.
              <Link
                href="/messages"
                aria-label={unread > 0 ? `Messages, ${unread} unread` : 'Messages'}
                className="relative flex h-[36px] w-[36px] items-center justify-center rounded-full border border-border-subtle bg-card text-foreground transition-transform active:scale-90"
              >
                <MessageSquare size={16} />
                {unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                    {unread}
                  </span>
                )}
              </Link>
            }
          />
          <Tabs<TabKey>
            items={[
              { id: 'upcoming', label: 'Upcoming' },
              { id: 'requests', label: 'Requests', count: requests.length },
              { id: 'past', label: 'Past' },
            ]}
            value={tab}
            onChange={setTab}
            className="shrink-0 bg-background"
          />
        </>
      }
      mainClassName="px-4 py-6"
    >
      {tab === 'upcoming' && (
        <>
          {upcoming.length === 0 ? (
            <EmptyState
              icon={<Guitar size={22} />}
              title="Nothing on the calendar"
              body="Find someone free tonight and send a request. Nothing is confirmed until they accept."
              action={
                <Link href="/discover">
                  <Button size="sm">Find musicians</Button>
                </Link>
              }
            />
          ) : (
            <>
              {thisWeek.length > 0 && (
                <section className="mb-6">
                  <SectionHeader>This week</SectionHeader>
                  {thisWeek.map((jam, i) =>
                    i === 0 ? (
                      <JamHeroCard key={jam.id} jam={jam} now={NOW} viewerId={CURRENT_USER_ID} />
                    ) : (
                      <JamCompactCard key={jam.id} jam={jam} />
                    ),
                  )}
                </section>
              )}
              {later.length > 0 && (
                <section className="mb-6">
                  <SectionHeader>Later</SectionHeader>
                  {later.map((jam) => (
                    <JamCompactCard key={jam.id} jam={jam} />
                  ))}
                </section>
              )}
            </>
          )}

          {applications.length > 0 && (
            <section className="mb-6">
              <SectionHeader>Open calls you applied to</SectionHeader>
              {applications.map((application) => {
                const jam = getJam(application.jamId)
                if (!jam) return null
                return (
                  <Card key={application.id} className="mb-3 p-4">
                    <h3 className="mb-2 font-serif text-[16px] font-bold leading-tight text-foreground">
                      {jam.title}
                    </h3>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[13px] text-foreground-dim">
                        Applied {formatRelativeShort(application.appliedAt, NOW)} ago
                      </span>
                      <Badge tone="warning" className="px-2.5 py-1 text-[12px]">
                        Pending
                      </Badge>
                    </div>
                  </Card>
                )
              })}
            </section>
          )}
        </>
      )}

      {tab === 'requests' &&
        (requests.length === 0 ? (
          <EmptyState
            icon={<Inbox size={22} />}
            title="No requests waiting"
            body="When someone asks you to play, it lands here. You always get to say no."
          />
        ) : (
          <>
            <SectionHeader>Waiting on you</SectionHeader>
            {requests.map((request) => (
              <RequestCard key={request.id} request={request} now={NOW} />
            ))}
          </>
        ))}

      {tab === 'past' &&
        (past.length === 0 ? (
          <EmptyState
            icon={<CalendarPlus size={22} />}
            title="No sessions yet"
            body="Played sessions show up here, and each one is a chance to build your reputation."
          />
        ) : (
          <>
            <SectionHeader>Played</SectionHeader>
            {past.map((jam) => (
              <JamCompactCard
                key={jam.id}
                jam={jam}
                trailing={
                  hasRecap(jam.id) ? (
                    <Badge tone="success" className="px-2.5 py-1 text-[12px]">
                      Recap posted
                    </Badge>
                  ) : (
                    <Link
                      href={`/jams/${jam.id}/recap`}
                      className="rounded-full bg-primary px-3 py-1 text-[12px] font-medium text-primary-foreground transition-transform active:scale-95"
                    >
                      Post recap
                    </Link>
                  )
                }
              />
            ))}
            <p className="mt-4 px-1 text-center text-[12px] text-foreground-dim">
              Recaps are what build your reliability, repeats and vouches.
            </p>
          </>
        ))}
    </AppShell>
  )
}
