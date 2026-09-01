'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Bell, Eye, Lock, MapPin, Plus, Radio, Star } from 'lucide-react'
import { AppShell } from '@/components/riff/AppShell'
import { TopBar } from '@/components/riff/TopBar'
import { ZoneMap, type MapLayers } from '@/components/riff/ZoneMap'
import { Avatar, AvatarStack } from '@/components/ui/Avatar'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { buttonClass, iconButtonClass } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import { formatDurationMinutes, formatTime, liveElapsedMinutes, relativeDayLabel } from '@/lib/datetime'
import { compactCount, genreLabel, instrumentLabel, shortNeighborhood } from '@/lib/labels'
import {
  useMapShops,
  useMapStreetPerformers,
  useMapStudios,
  useRiffStore,
  useUnreadNotificationCount,
} from '@/lib/store'
import {
  getBand,
  getLiveSession,
  getMapEvent,
  getMusicShop,
  getStreetPerformer,
  getStudio,
  getVenue,
  listMapEvents,
  summariseAllZones,
  viewerZone,
  type ZoneFilter,
} from '@/mocks'
import type { Instrument, MapPlaceKind, MusicShop } from '@/types'

/** "0.9 miles away" / "1 mile away" for a single distance, "0.7–0.9 miles away" for a spread. */
function distanceAwayLabel({ min, max }: { min: number; max: number }): string {
  if (min === max) return `${min} ${min === 1 ? 'mile' : 'miles'} away`
  return `${min}–${max} miles away`
}

/** docs/SPEC.md §4.2: Tonight · All musicians · Bass · Drums · Keys. */
const INSTRUMENT_FILTERS: { id: Instrument | 'all'; label: string }[] = [
  { id: 'all', label: 'All musicians' },
  { id: 'bass', label: 'Bass' },
  { id: 'drums', label: 'Drums' },
  { id: 'keys', label: 'Keys' },
]

type LayerKey = keyof MapLayers

/** ROW 1 layer toggles. Each carries the map-* accent it paints its pins in. */
const LAYER_CHIPS: { key: LayerKey; label: string }[] = [
  { key: 'musicians', label: 'Musicians' },
  { key: 'studios', label: 'Studios' },
  { key: 'street', label: 'Buskers' },
  { key: 'shops', label: 'Shops' },
  { key: 'events', label: 'Events' },
]

/** Tailwind classes per layer — active chip is outlined/tinted in its colour, with a colour dot. */
const CHIP_STYLE: Record<LayerKey, { dot: string; active: string }> = {
  musicians: { dot: 'bg-primary', active: 'border-primary bg-primary/10 text-primary' },
  studios: { dot: 'bg-map-studio', active: 'border-map-studio bg-map-studio/10 text-map-studio' },
  street: { dot: 'bg-map-street', active: 'border-map-street bg-map-street/10 text-map-street' },
  shops: { dot: 'bg-map-shop', active: 'border-map-shop bg-map-shop/10 text-map-shop' },
  events: { dot: 'bg-map-event', active: 'border-map-event bg-map-event/10 text-map-event' },
}

const SHOP_KIND_LABEL: Record<MusicShop['kind'], string> = {
  instruments: 'Instruments',
  vinyl: 'Vinyl',
  repair: 'Repairs',
  gear: 'Gear',
}

export function MapView() {
  const [layers, setLayers] = useState<MapLayers>({
    musicians: true,
    studios: true,
    street: true,
    shops: true,
    events: true,
  })
  const [tonightOnly, setTonightOnly] = useState(false)
  const [instrument, setInstrument] = useState<Instrument | 'all'>('all')
  const [selectedZoneId, setSelectedZoneId] = useState<string>()
  const [selectedLiveId, setSelectedLiveId] = useState<string>()
  const [selectedPlace, setSelectedPlace] = useState<{ kind: MapPlaceKind; id: string }>()
  const unread = useUnreadNotificationCount()
  const viewerId = useRiffStore((s) => s.viewerId)
  const musicians = useRiffStore((s) => s.musicians)
  const now = useRiffStore((s) => s.now)

  // Studios, buskers and shops merge the seeded fixtures with published member listings, so a
  // musician who lists their room, act or shop appears on the map beside the seeded ones.
  const studios = useMapStudios()
  const streetPerformers = useMapStreetPerformers()
  const shops = useMapShops()
  // Events stay a static fixture — safe for guests, read once.
  const events = useMemo(() => listMapEvents(), [])

  const filter: ZoneFilter = useMemo(
    () => ({ tonightOnly, instrument: instrument === 'all' ? undefined : instrument }),
    [tonightOnly, instrument],
  )

  const zones = useMemo(
    () => summariseAllZones(filter, viewerId, musicians),
    [filter, viewerId, musicians],
  )
  const me = viewerZone(viewerId)
  const selected = zones.find((z) => z.zone.id === selectedZoneId)
  const totalNearby = zones.reduce((sum, z) => sum + z.count, 0)

  const session = selectedLiveId ? getLiveSession(selectedLiveId) : undefined
  const sessionBand = session?.bandId ? getBand(session.bandId) : undefined
  const sessionVenue = session ? getVenue(session.venueId) : undefined
  // The fixed session.startedAt goes stale; derive a fresh, slowly-climbing elapsed instead.
  const elapsed = liveElapsedMinutes(now)

  // The one selected place, resolved to its fixture (only the matching kind is fetched).
  const studio = selectedPlace?.kind === 'studio' ? getStudio(selectedPlace.id) : undefined
  const performer = selectedPlace?.kind === 'street' ? getStreetPerformer(selectedPlace.id) : undefined
  const shop = selectedPlace?.kind === 'shop' ? getMusicShop(selectedPlace.id) : undefined
  const mapEvent = selectedPlace?.kind === 'event' ? getMapEvent(selectedPlace.id) : undefined

  // Only one sheet is ever open. Selecting anything clears the others.
  const openZone = (id: string) => {
    setSelectedLiveId(undefined)
    setSelectedPlace(undefined)
    setSelectedZoneId(id)
  }
  const openLive = (id: string) => {
    setSelectedZoneId(undefined)
    setSelectedPlace(undefined)
    setSelectedLiveId(id)
  }
  const openPlace = (kind: MapPlaceKind, id: string) => {
    setSelectedZoneId(undefined)
    setSelectedLiveId(undefined)
    setSelectedPlace({ kind, id })
  }

  const nothingSelected = !selected && !session && !selectedPlace

  // Summary pill copy adapts to whichever layers are on: "14 musicians · 6 studios · 5 shops".
  const summarySegments: string[] = []
  if (layers.musicians)
    summarySegments.push(`${totalNearby} ${totalNearby === 1 ? 'musician' : 'musicians'}`)
  if (layers.studios)
    summarySegments.push(`${studios.length} ${studios.length === 1 ? 'studio' : 'studios'}`)
  if (layers.street)
    summarySegments.push(
      `${streetPerformers.length} ${streetPerformers.length === 1 ? 'busker' : 'buskers'}`,
    )
  if (layers.shops) summarySegments.push(`${shops.length} ${shops.length === 1 ? 'shop' : 'shops'}`)
  if (layers.events)
    summarySegments.push(`${events.length} ${events.length === 1 ? 'event' : 'events'}`)
  const summaryText =
    summarySegments.length > 0
      ? `${summarySegments.join(' · ')} nearby`
      : 'No layers shown — pick one above'

  return (
    <AppShell
      activeTab="map"
      liveIndicator
      header={
        <TopBar
          actions={
            <>
              {/* Unobtrusive way onto the map — list your own studio, act or shop. */}
              <Link
                href="/me/listings/new"
                aria-label="List your studio, act or shop"
                className={iconButtonClass()}
              >
                <Plus size={16} />
              </Link>
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
            </>
          }
        />
      }
      mainClassName="relative overflow-hidden"
    >
      {/* The map is a canvas of markers with no visible heading — give the page a real one for
          screen readers and document outline. */}
      <h1 className="sr-only">Map — musicians, studios, buskers, shops and events near you</h1>
      <ZoneMap
        zones={zones}
        selectedZoneId={selectedZoneId}
        viewerZone={me}
        studios={studios}
        streetPerformers={streetPerformers}
        shops={shops}
        events={events}
        layers={layers}
        onSelectZone={openZone}
        onSelectLive={openLive}
        onSelectPlace={openPlace}
      />

      {/* CONTROLS — ROW 1 layer toggles, ROW 2 musician scope, then the privacy pill. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 space-y-2 px-4 pt-3">
        {/* ROW 1 — which layers are on the map. */}
        <div className="no-scrollbar pointer-events-auto flex gap-2 overflow-x-auto pb-1">
          {LAYER_CHIPS.map((chip) => {
            const on = layers[chip.key]
            const style = CHIP_STYLE[chip.key]
            return (
              <button
                key={chip.key}
                type="button"
                aria-pressed={on}
                onClick={() => setLayers((prev) => ({ ...prev, [chip.key]: !prev[chip.key] }))}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-[13px] font-medium shadow-sm transition-transform active:scale-95',
                  on
                    ? style.active
                    : 'border-border-subtle bg-card/95 text-foreground-dim backdrop-blur-sm',
                )}
              >
                <span
                  className={cn('h-2 w-2 shrink-0 rounded-full', on ? style.dot : 'bg-border')}
                />
                {chip.label}
              </button>
            )
          })}
        </div>

        {/* ROW 2 — scopes musicians only; hidden when that layer is off. */}
        {layers.musicians && (
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
        )}

        <p className="pointer-events-none inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-card/90 px-2.5 py-1 text-[11px] font-medium text-foreground-dim shadow-sm backdrop-blur-sm">
          <Lock size={10} />
          Riff shows neighbourhoods, never addresses.
        </p>
      </div>

      {/* Attribution lives in our own chrome so a raised sheet can never bury it. */}
      <p className="pointer-events-none absolute bottom-1 right-2 z-10 text-[9px] text-foreground-dim/80">
        © OpenStreetMap contributors
      </p>

      {/* Summary pill, shown when nothing is selected. */}
      {nothingSelected && (
        <div className="absolute inset-x-0 bottom-4 z-20 flex justify-center px-4">
          <div className="flex items-center gap-2 rounded-full border border-border-subtle bg-card/95 px-4 py-2 shadow-md backdrop-blur-sm">
            <MapPin size={13} className="text-primary" />
            <span className="text-[13px] font-medium text-foreground">{summaryText}</span>
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
              {selected.distanceRange && ` · ${distanceAwayLabel(selected.distanceRange)}`}
            </p>

            {/* The musician-list area: real rows when the zone has people, calm muted
                placeholders otherwise, so an empty zone never leaves the sheet body blank. */}
            {selected.count > 0 ? (
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
            ) : (
              <div className="mt-4 space-y-2" aria-hidden>
                {[0, 1].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selected.liveSessionIds.length > 0 && (
              <button
                type="button"
                onClick={() => openLive(selected.liveSessionIds[0])}
                className="mt-4 flex w-full items-center gap-2 rounded-[12px] border border-border-subtle bg-background px-3 py-2.5 text-left transition-transform active:scale-95"
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-live" />
                <span className="flex-1 text-[13px] font-medium text-foreground">
                  A jam is live in {selected.zone.name}
                </span>
                <Radio size={14} className="text-live" />
              </button>
            )}

            {/* Carry the neighbourhood through so Discover lands scoped to this zone, tonight. */}
            <Link
              href={`/discover?zone=${encodeURIComponent(selected.zone.name)}&tonight=1`}
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

      {/* PLACE SHEET — one sheet, switching on the selected place's kind. */}
      <BottomSheet
        open={Boolean(selectedPlace)}
        onClose={() => setSelectedPlace(undefined)}
        title="Place details"
      >
        {studio && (
          <>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-map-studio bg-map-studio/10 px-2 py-0.5 text-[11px] font-bold text-map-studio">
                <span className="h-1.5 w-1.5 rounded-full bg-map-studio" />
                {studio.kind === 'pro-room' ? 'Pro room' : 'Home rig'}
              </span>
            </div>
            <h2 className="mt-2 pr-8 font-serif text-[20px] font-bold text-foreground">
              {studio.name}
            </h2>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-foreground-dim">
              <span>{shortNeighborhood(studio.neighborhood)}</span>
              <span aria-hidden>·</span>
              <span className="font-semibold text-foreground">${studio.hourlyRateUsd}/hr</span>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1">
                <Star size={11} className="text-[#facc15]" fill="currentColor" />
                {studio.rating}
              </span>
            </p>
            {/* Product rule 2 — a home rig never shows its address. */}
            {studio.kind === 'home-rig' && (
              <p className="mt-3 flex items-start gap-1.5 rounded-[10px] bg-background px-3 py-2 text-[12px] text-foreground-dim">
                <Lock size={12} className="mt-0.5 shrink-0" />
                Address shared once booking is confirmed.
              </p>
            )}
            <Link
              href={`/studios/${studio.id}`}
              className={cn(buttonClass({ size: 'sm', fullWidth: true }), 'mt-4 block')}
            >
              View studio
            </Link>
          </>
        )}

        {performer && (
          <>
            <div className="flex items-center gap-2">
              {performer.live && (
                <span className="inline-flex items-center gap-1.5 rounded-[3px] bg-live px-1.5 py-0.5 text-[9px] font-bold uppercase leading-none tracking-wider text-white">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" /> Live
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full border border-map-street bg-map-street/10 px-2 py-0.5 text-[11px] font-bold text-map-street">
                <span className="h-1.5 w-1.5 rounded-full bg-map-street" /> Busker
              </span>
            </div>
            <h2 className="mt-2 pr-8 font-serif text-[20px] font-bold text-foreground">
              {performer.name}
            </h2>
            <p className="mt-1 text-[13px] text-foreground-dim">
              {performer.instruments.map(instrumentLabel).join(' · ')}
              {performer.genres.length > 0 &&
                ` · ${performer.genres.map(genreLabel).join(' · ')}`}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-[13px] text-foreground-dim">
              <MapPin size={12} className="shrink-0" />
              {performer.spotLabel}
            </p>
            <p className="mt-1 text-[13px] font-medium text-foreground">
              Playing until {formatTime(performer.until)}
            </p>
            <Link
              href={`/street/${performer.id}`}
              className={cn(buttonClass({ size: 'sm', fullWidth: true }), 'mt-4 block')}
            >
              View performer
            </Link>
          </>
        )}

        {shop && (
          <>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-map-shop bg-map-shop/10 px-2 py-0.5 text-[11px] font-bold text-map-shop">
                <span className="h-1.5 w-1.5 rounded-full bg-map-shop" />
                {SHOP_KIND_LABEL[shop.kind]}
              </span>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[11px] font-bold',
                  shop.openNow
                    ? 'bg-map-street/15 text-map-street'
                    : 'border border-border-subtle bg-background text-foreground-dim',
                )}
              >
                {shop.openNow ? 'Open now' : 'Closed'}
              </span>
            </div>
            <h2 className="mt-2 pr-8 font-serif text-[20px] font-bold text-foreground">
              {shop.name}
            </h2>
            <p className="mt-1 text-[13px] text-foreground-dim">
              {shortNeighborhood(shop.neighborhood)} · {shop.hoursLabel}
            </p>
            {shop.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {shop.tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-border-subtle bg-background px-2 py-0.5 text-[11px] font-medium text-foreground-dim"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <Link
              href={`/shops/${shop.id}`}
              className={cn(buttonClass({ size: 'sm', fullWidth: true }), 'mt-4 block')}
            >
              View shop
            </Link>
          </>
        )}

        {mapEvent && (
          <>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-map-event bg-map-event/10 px-2 py-0.5 text-[11px] font-bold text-map-event">
                <span className="h-1.5 w-1.5 rounded-full bg-map-event" />
                {relativeDayLabel(mapEvent.startsAt, now)} {formatTime(mapEvent.startsAt)}
              </span>
            </div>
            <h2 className="mt-2 pr-8 font-serif text-[20px] font-bold text-foreground">
              {mapEvent.title}
            </h2>
            <p className="mt-1 flex items-center gap-1.5 text-[13px] text-foreground-dim">
              <MapPin size={12} className="shrink-0" />
              {mapEvent.venueName} · {shortNeighborhood(mapEvent.neighborhood)}
            </p>
            <p className="mt-1 text-[13px] text-foreground-dim">
              <span className="font-semibold text-foreground">{mapEvent.priceLabel}</span> ·{' '}
              {mapEvent.goingCount} going
            </p>
            <Link
              href={`/events/${mapEvent.id}`}
              className={cn(buttonClass({ size: 'sm', fullWidth: true }), 'mt-4 block')}
            >
              View event
            </Link>
          </>
        )}
      </BottomSheet>
    </AppShell>
  )
}
