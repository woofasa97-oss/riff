'use client'

import Link from 'next/link'
import { Bell, ChevronRight, Settings, Zap } from 'lucide-react'
import { AppShell } from '@/components/riff/AppShell'
import { AvailabilityStrip } from '@/components/riff/AvailabilityStrip'
import { TopBar } from '@/components/riff/TopBar'
import { WaveformPlayer } from '@/components/riff/WaveformPlayer'
import { Avatar } from '@/components/ui/Avatar'
import { Card } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { StatTile } from '@/components/ui/StatTile'
import { iconButtonClass } from '@/components/ui/Button'
import { genreLane, instrumentLabel } from '@/lib/labels'
import { useMusicianStats, useUnreadNotificationCount } from '@/lib/store'
import { peaksFor } from '@/lib/waveform'
import {
  CURRENT_USER_ID,
  getCurrentSeason,
  getCurrentUser,
  getLeaderboardEntry,
  listBandsFor,
} from '@/mocks'

/** Destinations that exist as stubs until their own tickets land. */
const SETTINGS_ROWS = [
  { label: 'Your bands', href: '/me/bands' },
  { label: 'Saved musicians', href: '/me/saved' },
  { label: 'Past jams', href: '/jams?tab=past' },
  { label: 'Settings and privacy', href: '/me/settings' },
  { label: 'Safety centre', href: '/me/safety' },
]

export function MeView() {
  const me = getCurrentUser()
  const stats = useMusicianStats(CURRENT_USER_ID)
  const unread = useUnreadNotificationCount()
  const entry = getLeaderboardEntry(CURRENT_USER_ID)
  const season = getCurrentSeason()
  const bands = listBandsFor(CURRENT_USER_ID)

  return (
    <AppShell
      activeTab="me"
      liveIndicator
      header={
        <TopBar
          actions={
            <>
              <Link
                href="/notifications"
                aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
                className={`relative ${iconButtonClass()}`}
              >
                <Bell size={16} />
                {unread > 0 && (
                  <span className="absolute right-0 top-0 h-2 w-2 rounded-full border-2 border-card bg-accent" />
                )}
              </Link>
              <Link href="/me/settings" aria-label="Settings" className={iconButtonClass()}>
                <Settings size={16} />
              </Link>
            </>
          }
        />
      }
      mainClassName="pb-6"
    >
      {/* PLAYER CARD */}
      <div className="flex flex-col items-center px-4 pb-8 pt-6">
        <div className="relative mb-4">
          <Avatar
            src={me.avatarUrl}
            name={me.name}
            size="xl"
            className="h-[120px] w-[120px] shadow-sm"
          />
          {stats?.topReliability && (
            <span
              className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-success text-white shadow-sm"
              title="Top reliability"
            >
              <Zap size={12} fill="currentColor" />
            </span>
          )}
        </div>
        <h1 className="mb-1 font-serif text-[28px] font-bold text-foreground">{me.name}</h1>
        <div className="mb-2 text-[12px] font-bold uppercase tracking-[0.06em] text-primary">
          {instrumentLabel(me.instruments[0]).toUpperCase()} · {genreLane(me.genres)}
        </div>
        <div className="text-[13px] font-medium text-foreground-dim">
          {me.neighborhood} · {me.city.replace(', NY', '')}
        </div>
      </div>

      {/* STATS — all three derived, none of them editable (docs/SPEC.md §5.3). */}
      <div className="mb-6 flex justify-between gap-3 px-4">
        <StatTile value={`${stats?.reliabilityPct ?? 0}%`} label="Reliability" />
        <StatTile value={stats?.repeatJams ?? 0} label="Repeat jams" />
        <StatTile value={stats?.vouchCount ?? 0} label="Vouches" />
      </div>

      <div className="mb-8 px-4">
        <Link
          href="/me/edit"
          className="flex h-[48px] w-full items-center justify-center rounded-[12px] bg-surface-muted text-[14px] font-semibold text-foreground transition-transform active:scale-95"
        >
          Edit your player card
        </Link>
      </div>

      {/* YOUR CLIP */}
      {me.clip && (
        <section className="mb-8 px-4">
          <SectionHeader
            action={
              <Link href="/me/clip" className="text-[12px] font-semibold text-primary">
                Replace clip
              </Link>
            }
          >
            Your clip
          </SectionHeader>
          <Card className="p-4">
            <WaveformPlayer
              peaks={me.clip.waveform ?? peaksFor(me.clip.id)}
              durationSec={me.clip.durationSec}
              label="your clip"
              className="border-0 bg-transparent p-0"
            />
          </Card>
        </section>
      )}

      {/* YOUR AVAILABILITY */}
      <section className="mb-8 px-4">
        <SectionHeader
          action={
            <Link href="/me/availability" className="text-[12px] font-semibold text-primary">
              Edit
            </Link>
          }
        >
          Your availability
        </SectionHeader>
        <AvailabilityStrip availability={me.availability} />
      </section>

      {/* THIS SEASON */}
      {entry && (
        <section className="mb-8 px-4">
          <SectionHeader
            action={
              <Link href="/leaderboard" className="text-[12px] font-semibold text-primary">
                View leaderboard
              </Link>
            }
          >
            This season
          </SectionHeader>
          <Card className="bg-[color:var(--hero-from)] p-4">
            <div className="mb-1 font-serif text-[16px] font-bold text-foreground">
              #{entry.rank} in {season.city} {season.scene}
            </div>
            <div className="text-[13px] font-medium text-primary">
              {entry.delta > 0
                ? `+${entry.delta} spots this week`
                : entry.delta < 0
                  ? `${entry.delta} spots this week`
                  : 'Holding steady this week'}
            </div>
          </Card>
        </section>
      )}

      {/* SETTINGS */}
      <section className="mb-8 px-4">
        <Card className="overflow-hidden">
          {SETTINGS_ROWS.map((row, i) => (
            <Link
              key={row.href}
              href={
                row.label === 'Your bands' && bands.length === 1
                  ? `/bands/${bands[0].id}`
                  : row.href
              }
              className={`flex items-center justify-between p-4 ${
                i < SETTINGS_ROWS.length - 1 ? 'border-b border-border-hairline' : ''
              }`}
            >
              <span className="text-[15px] font-medium text-foreground">{row.label}</span>
              <ChevronRight size={14} className="text-foreground-dim" />
            </Link>
          ))}
        </Card>
      </section>
    </AppShell>
  )
}
