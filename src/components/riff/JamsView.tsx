'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { CalendarPlus, Guitar, Inbox, MessageSquare, Plus } from 'lucide-react'
import { AppShell } from '@/components/riff/AppShell'
import { JamCompactCard, JamHeroCard } from '@/components/riff/JamCard'
import { RequestCard } from '@/components/riff/RequestCard'
import { TopBar } from '@/components/riff/TopBar'
import { Badge } from '@/components/ui/Badge'
import { Button, buttonClass } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Tabs } from '@/components/ui/Tabs'
import { formatRelativeShort, formatShortDateTime } from '@/lib/datetime'
import { useIsGuest, useRiffStore } from '@/lib/store'
import { getMusician, listJams } from '@/mocks'

type TabKey = 'upcoming' | 'requests' | 'past'

export function JamsView({ initialTab = 'upcoming' }: { initialTab?: TabKey } = {}) {
  const [tab, setTab] = useState<TabKey>(initialTab)
  const isGuest = useIsGuest()
  const viewerId = useRiffStore((s) => s.viewerId)
  const now = useRiffStore((s) => s.now)
  const jams = useRiffStore((s) => s.jams)
  const recaps = useRiffStore((s) => s.recaps)
  const allRequests = useRiffStore((s) => s.requests)
  const allApplications = useRiffStore((s) => s.applications)
  const threads = useRiffStore((s) => s.threads)

  // Incoming requests still waiting on the viewer — the count on the tab.
  const requests = useMemo(
    () =>
      allRequests
        .filter((r) => r.toId === viewerId && r.status === 'pending')
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    [allRequests, viewerId],
  )
  // Requests the viewer sent that the other side has not settled yet.
  const outgoing = useMemo(
    () =>
      allRequests
        .filter(
          (r) =>
            r.fromId === viewerId && (r.status === 'pending' || r.status === 'counter-proposed'),
        )
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    [allRequests, viewerId],
  )
  const applications = useMemo(
    () => allApplications.filter((a) => a.applicantId === viewerId),
    [allApplications, viewerId],
  )
  // Unsent drafts, so "Save draft" has somewhere to come back to.
  const drafts = useMemo(
    () => jams.filter((jam) => jam.status === 'draft' && jam.hostId === viewerId),
    [jams, viewerId],
  )
  const myOpenCalls = useMemo(
    () =>
      jams
        .filter((jam) => jam.isOpenCall && jam.hostId === viewerId)
        .map((jam) => ({
          jam,
          applicants: allApplications.filter((a) => a.jamId === jam.id),
        })),
    [jams, allApplications, viewerId],
  )
  const unread = useMemo(
    () =>
      threads
        .filter((t) => t.participantIds.includes(viewerId))
        .reduce((sum, t) => sum + t.unreadCount, 0),
    [threads, viewerId],
  )

  const upcoming = useMemo(
    () => listJams('upcoming', { viewerId, now, source: jams }),
    [jams, viewerId, now],
  )
  const past = useMemo(
    () => listJams('past', { viewerId, now, source: jams }),
    [jams, viewerId, now],
  )

  // "This week" is anything inside seven days; everything else falls under "Later".
  const thisWeek = upcoming.filter(
    (j) => Date.parse(j.startsAt) - Date.parse(now) <= 7 * 86_400_000,
  )
  const later = upcoming.filter((j) => Date.parse(j.startsAt) - Date.parse(now) > 7 * 86_400_000)

  const hasRecap = (jamId: string) => recaps.some((r) => r.jamId === jamId)

  return (
    <AppShell
      activeTab="jams"
      liveIndicator
      header={
        <>
          <TopBar
            actions={
              <>
                <Link
                  href="/jams/new"
                  aria-label="Post a jam"
                  className="flex h-[36px] w-[36px] items-center justify-center rounded-full border border-border-subtle bg-card text-foreground transition-transform active:scale-90"
                >
                  <Plus size={17} />
                </Link>
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
              </>
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
      {isGuest ? (
        // A guest owns no jams, requests or open calls — send them to make a card instead of
        // three empty tabs. The tab chrome above stays; its lists are all empty for a guest.
        <EmptyState
          icon={<CalendarPlus size={22} />}
          title="Sign up to line up jams"
          body="Confirmed jams, the requests waiting on you, and your own open calls all live here once you have a player card."
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
      ) : (
        <>
          {tab === 'upcoming' && (
            <>
              {upcoming.length === 0 ? (
                <EmptyState
                  icon={<Guitar size={22} />}
                  title="Nothing on the calendar"
                  body="Find someone free tonight and send a request. Nothing is confirmed until they accept."
                  action={
                    <div className="flex gap-2">
                      <Link href="/discover" className={buttonClass({ size: 'sm' })}>
                        Find musicians
                      </Link>
                      <Link
                        href="/jams/new"
                        className={buttonClass({ variant: 'secondary', size: 'sm' })}
                      >
                        Post a jam
                      </Link>
                    </div>
                  }
                />
              ) : (
                <>
                  {thisWeek.length > 0 && (
                    <section className="mb-6">
                      <SectionHeader>This week</SectionHeader>
                      {thisWeek.map((jam, i) =>
                        i === 0 ? (
                          <JamHeroCard key={jam.id} jam={jam} now={now} viewerId={viewerId} />
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

              {drafts.length > 0 && (
                <section className="mb-6">
                  <SectionHeader>Drafts</SectionHeader>
                  {drafts.map((jam) => (
                    <JamCompactCard
                      key={jam.id}
                      jam={jam}
                      trailing={
                        <Badge tone="neutral" className="px-2.5 py-1 text-[12px]">
                          Draft · only you can see it
                        </Badge>
                      }
                    />
                  ))}
                </section>
              )}

              {applications.length > 0 && (
                <section className="mb-6">
                  <SectionHeader>Open calls you applied to</SectionHeader>
                  {applications.map((application) => {
                    const jam = jams.find((j) => j.id === application.jamId)
                    if (!jam) return null
                    return (
                      <Card key={application.id} className="mb-3 p-4">
                        <h3 className="mb-2 font-serif text-[16px] font-bold leading-tight text-foreground">
                          {jam.title}
                        </h3>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-[13px] text-foreground-dim">
                            {(() => {
                              const when = formatRelativeShort(application.appliedAt, now)
                              return /^\d/.test(when)
                                ? `Applied ${when} ago`
                                : `Applied ${when === 'now' ? 'just now' : when.toLowerCase()}`
                            })()}
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

              {myOpenCalls.length > 0 && (
                <section className="mb-6">
                  <SectionHeader>Open calls you posted</SectionHeader>
                  {myOpenCalls.map(({ jam, applicants }) => (
                    <Card key={jam.id} className="mb-3 p-4">
                      <Link href={`/jams/${jam.id}`} className="block">
                        <h3 className="mb-2 font-serif text-[16px] font-bold leading-tight text-foreground">
                          {jam.title}
                        </h3>
                      </Link>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-[13px] text-foreground-dim">
                          {formatShortDateTime(jam.startsAt)}
                        </span>
                        <Badge tone="primary" className="px-2.5 py-1 text-[12px]">
                          {applicants.length} applied
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </section>
              )}
            </>
          )}

          {tab === 'requests' && (
            <>
              {requests.length === 0 && outgoing.length === 0 ? (
                <EmptyState
                  icon={<Inbox size={22} />}
                  title="No requests waiting"
                  body="When someone asks you to play, it lands here. You always get to say no."
                />
              ) : (
                <>
                  {requests.length > 0 && (
                    <section className="mb-6">
                      <SectionHeader>Waiting on you</SectionHeader>
                      {requests.map((request) => (
                        <Link key={request.id} href={`/requests/${request.id}`} className="block">
                          <RequestCard request={request} now={now} />
                        </Link>
                      ))}
                    </section>
                  )}
                  {outgoing.length > 0 && (
                    <section className="mb-6">
                      <SectionHeader>Waiting on them</SectionHeader>
                      {outgoing.map((request) => {
                        const to = getMusician(request.toId)
                        return (
                          <Card key={request.id} className="mb-3 p-4">
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <h3 className="truncate font-serif text-[15px] font-bold text-foreground">
                                  {to?.name ?? 'Musician'}
                                </h3>
                                <p className="mt-0.5 text-[13px] text-foreground-dim">
                                  {/* "now"/"Yesterday" carry their own tense; only "3h" wants "ago". */}
                                  {(() => {
                                    const when = formatRelativeShort(request.createdAt, now)
                                    return /^\d/.test(when)
                                      ? `Sent ${when} ago`
                                      : `Sent ${when === 'now' ? 'just now' : when}`
                                  })()}{' '}
                                  ·{' '}
                                  {request.status === 'counter-proposed'
                                    ? 'they suggested another time'
                                    : 'no reply yet'}
                                </p>
                              </div>
                              <Badge
                                tone={request.status === 'counter-proposed' ? 'accent' : 'warning'}
                                className="shrink-0 px-2.5 py-1 text-[12px]"
                              >
                                {request.status === 'counter-proposed' ? 'Countered' : 'Pending'}
                              </Badge>
                            </div>
                          </Card>
                        )
                      })}
                      <p className="mt-1 px-1 text-[12px] text-foreground-dim">
                        Nothing is confirmed until they accept.
                      </p>
                    </section>
                  )}
                </>
              )}
            </>
          )}

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
        </>
      )}
    </AppShell>
  )
}
