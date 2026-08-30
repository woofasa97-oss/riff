'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Bell, Eye, Lock, MapPin, Radio } from 'lucide-react'
import { AppShell } from '@/components/riff/AppShell'
import { TopBar } from '@/components/riff/TopBar'
import { ZoneMap } from '@/components/riff/ZoneMap'
import { Avatar, AvatarStack } from '@/components/ui/Avatar'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button, buttonClass, iconButtonClass } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { formatDurationMinutes, minutesSince } from '@/lib/datetime'
import { compactCount, instrumentLabel, shortNeighborhood } from '@/lib/labels'
import { useUnreadNotificationCount } from '@/lib/store'
import {
  NOW,
  getBand,
  getLiveSession,
  getVenue,
  summariseAllZones,
  viewerZone,
  type ZoneFilter,
} from '@/mocks'
import type { Instrument } from '@/types'

/** docs/SPEC.md §4.2: Tonight · All musicians · Bass · Drums · Keys. */
const INSTRUMENT_FILTERS: { id: Instrument | 'all'; label: string }[] = [
  { id: 'all', label: 'All musicians' },
  { id: 'bass', label: 'Bass' },
  { id: 'drums', label: 'Drums' },
  { id: 'keys', label: 'Keys' },
]

export function MapView() {
  const [tonightOnly, setTonightOnly] = useState(false)
  const [instrument, setInstrument] = useState<Instrument | 'all'>('all')
  const [selectedZoneId, setSelectedZoneId] = useState<string>()
  const [selectedLiveId, setSelectedLiveId] = useState<string>()
  const unread = useUnreadNotificationCount()

  const filter: ZoneFilter = useMemo(
    () => ({ tonightOnly, instrument: instrument === 'all' ? undefined : instrument }),
    [tonightOnly, instrument],
  )

  const zones = useMemo(() => summariseAllZones(filter), [filter])
  const me = viewerZone()
  const selected = zones.find((z) => z.zone.id === selectedZoneId)
  const totalNearby = zones.reduce((sum, z) => sum + z.count, 0)

  const session = selectedLiveId ? getLiveSession(selectedLiveId) : undefined
  const sessionBand = session?.bandId ? getBand(session.bandId) : undefined
  const sessionVenue = session ? getVenue(session.venueId) : undefined
  const elapsed = session ? minutesSince(session.startedAt, NOW) : 0

  return (
    <AppShell
      activeTab="map"
      liveIndicator
      header={
        <TopBar
          actions={
            <Link
              href="/notifications"
              aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
              className={cn('relative', iconButtonClass())}
            >
              <Bell size={16} />
              {unread > 0 && (
                <span className="absolute right-0 top-0 h-2 w-2 rounded-full border-2 border-card bg-accent" />
              )}
            </Link>
          }
        />
      }
      mainClassName="relative overflow-hidden"
    >
      <ZoneMap
        zones={zones}
        selectedZoneId={selectedZoneId}
        viewerZone={me}
        onSelectZone={(id) => {
          setSelectedLiveId(undefined)
          setSelectedZoneId(id)
        }}
        onSelectLive={(id) => {
          setSelectedZoneId(undefined)
          setSelectedLiveId(id)
        }}
      />

      {/* FILTERS */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 px-4 pt-3">
        <div className="no-scrollbar pointer-events-auto flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            aria-pressed={tonightOnly}
            onClick={() => setTonightOnly((v) => !v)}
            className={cn(
              'shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-[13px] font-medium shadow-sm transition-transform active:scale-95',
              tonightOnly
                ? 'border border-primary bg-primary text-primary-foreground'
                : 'border border-border-subtle bg-card/95 text-foreground backdrop-blur-sm',
            )}
          >
            Tonight
          </button>
          {INSTRUMENT_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={instrument === f.id}
              onClick={() => setInstrument(f.id)}
              className={cn(
                'shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-[13px] font-medium shadow-sm transition-transform active:scale-95',
                instrument === f.id
                  ? 'border border-primary bg-primary text-primary-foreground'
                  : 'border border-border-subtle bg-card/95 text-foreground backdrop-blur-sm',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <p className="pointer-events-none mt-2 inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-card/90 px-2.5 py-1 text-[11px] font-medium text-foreground-dim shadow-sm backdrop-blur-sm">
          <Lock size={10} />
          Riff shows neighbourhoods, never addresses.
        </p>
      </div>

      {/* Attribution lives in our own chrome so a raised sheet can never bury it. */}
      <p className="pointer-events-none absolute bottom-1 right-2 z-10 text-[9px] text-foreground-dim/80">
        © OpenStreetMap contributors
      </p>

      {/* Summary pill, shown when nothing is selected. */}
      {!selected && !session && (
        <div className="absolute inset-x-0 bottom-4 z-20 flex justify-center px-4">
          <div className="flex items-center gap-2 rounded-full border border-border-subtle bg-card/95 px-4 py-2 shadow-md backdrop-blur-sm">
            <MapPin size={13} className="text-primary" />
            <span className="text-[13px] font-medium text-foreground">
              {totalNearby === 0
                ? 'Nobody matches that filter'
                : `${totalNearby} ${totalNearby === 1 ? 'musician' : 'musicians'} across ${
                    zones.filter((z) => z.count > 0).length
                  } neighbourhoods`}
            </span>
          </div>
        </div>
      )}

      {/* ZONE SHEET */}
      <BottomSheet
        open={Boolean(selected)}
        onClose={() => setSelectedZoneId(undefined)}
        title={selected ? `${selected.zone.name} summary` : 'Zone'}
      >
        {selected && (
          <>
            <h2 className="pr-8 font-serif text-[20px] font-bold text-foreground">
              {selected.zone.name}
            </h2>
            <p className="mt-1 text-[13px] text-foreground-dim">
              {selected.count === 0
                ? 'Nobody here matches that filter'
                : `${selected.count} ${selected.count === 1 ? 'musician' : 'musicians'} nearby`}
              {selected.distanceRange &&
                ` · ${selected.distanceRange.min}–${selected.distanceRange.max} miles away`}
            </p>

            {selected.count > 0 && (
              <>
                <div className="mt-4 flex items-center gap-3">
                  <AvatarStack
                    people={selected.musicians.map((m) => ({
                      id: m.id,
                      name: m.name,
                      avatarUrl: m.avatarUrl,
                    }))}
                    max={4}
                    size="md"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {selected.instrumentCounts.slice(0, 4).map(({ instrument: i, count }) => (
                      <span
                        key={i}
                        className="rounded-full border border-border-subtle bg-background px-2 py-0.5 text-[11px] font-medium text-foreground-dim"
                      >
                        {instrumentLabel(i)} {count}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Names and instruments only. No street, no pin, no coordinates. */}
                <ul className="mt-4 max-h-[132px] space-y-2 overflow-y-auto">
                  {selected.musicians.map((m) => (
                    <li key={m.id}>
                      <Link href={`/musicians/${m.id}`} className="flex items-center gap-3">
                        <Avatar src={m.avatarUrl} name={m.name} size="md" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-serif text-[14px] font-bold text-foreground">
                            {m.name}
                          </div>
                          <div className="truncate text-[12px] text-foreground-dim">
                            {m.instruments.map(instrumentLabel).join(' · ')}
                            {m.availableTonight && ' · free tonight'}
                          </div>
                        </div>
                        <span className="shrink-0 text-[12px] text-foreground-dim">
                          {m.distanceMi} mi
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {selected.liveSessionIds.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSelectedZoneId(undefined)
                  setSelectedLiveId(selected.liveSessionIds[0])
                }}
                className="mt-4 flex w-full items-center gap-2 rounded-[12px] border border-border-subtle bg-background px-3 py-2.5 text-left transition-transform active:scale-95"
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-live" />
                <span className="flex-1 text-[13px] font-medium text-foreground">
                  A jam is live in {selected.zone.name}
                </span>
                <Radio size={14} className="text-live" />
              </button>
            )}

            <Link
              href="/discover"
              className={cn(buttonClass({ size: 'sm', fullWidth: true }), 'mt-4 block')}
            >
              See who is free
            </Link>
          </>
        )}
      </BottomSheet>

      {/* LIVE JAM SHEET — docs/BUILD-PLAN.md P4-02, a state of this screen rather than a route. */}
      <BottomSheet
        open={Boolean(session)}
        onClose={() => setSelectedLiveId(undefined)}
        title="Live jam"
      >
        {session && (
          <>
            <div className="flex items-center gap-2">
              <span className="rounded-[3px] bg-live px-1.5 py-0.5 text-[9px] font-bold uppercase leading-none tracking-wider text-white">
                Live jam
              </span>
              <span className="flex items-center gap-1 text-[12px] text-foreground-dim">
                <Eye size={11} /> Listening in · {compactCount(session.viewerCount)}
              </span>
            </div>

            <h2 className="mt-2 pr-8 font-serif text-[20px] font-bold text-foreground">
              {sessionBand?.name ?? 'Live session'}
            </h2>
            {/* Venue and neighbourhood — the street address stays hidden, as everywhere else. */}
            <p className="mt-1 text-[13px] text-foreground-dim">
              {sessionVenue
                ? `${sessionVenue.name} · ${shortNeighborhood(sessionVenue.neighborhood)}`
                : 'Somewhere nearby'}{' '}
              · started {formatDurationMinutes(elapsed)} ago
            </p>

            {sessionBand && sessionBand.members.length > 0 && (
              <div className="mt-4 flex items-center gap-3">
                <AvatarStack
                  people={sessionBand.members
                    .map((member) => member.musicianId)
                    .map((id) => ({ id, name: id, avatarUrl: `/mock/avatars/${id}.svg` }))}
                  max={4}
                  size="md"
                />
                <span className="text-[12px] text-foreground-dim">
                  {sessionBand.members.length} playing
                </span>
              </div>
            )}

            <div className="mt-5 flex gap-3">
              {sessionVenue && (
                <Link
                  href={`/venues/${sessionVenue.id}`}
                  className={cn(
                    buttonClass({ variant: 'secondary', size: 'sm', fullWidth: true }),
                    'flex-1',
                  )}
                >
                  Venue details
                </Link>
              )}
              <Link
                href={`/live/${session.id}`}
                className={cn(buttonClass({ size: 'sm', fullWidth: true }), 'flex-1')}
              >
                Watch live
              </Link>
            </div>
          </>
        )}
      </BottomSheet>
    </AppShell>
  )
}
