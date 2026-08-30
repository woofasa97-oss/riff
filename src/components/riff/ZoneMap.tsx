'use client'

import { useEffect, useRef, useState } from 'react'
import type { Circle, LayerGroup, Map as LeafletMap, Marker } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM, type ZoneSummary } from '@/mocks'
import type { MapEvent, MapPlaceKind, MapZone, MusicShop, StreetPerformer, Studio } from '@/types'

const MILES_TO_METRES = 1609.344

/** Read a design token at runtime so Leaflet's canvas uses the same palette as the DOM. */
function token(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

/** Which musician-vs-public overlays are currently drawn. */
export interface MapLayers {
  musicians: boolean
  studios: boolean
  street: boolean
  shops: boolean
  events: boolean
}

/**
 * Simple white line-glyphs, one per public layer, so the four pins read differently at a glance.
 * Kept as raw SVG because the pin is a Leaflet `divIcon` (HTML string), not a React node.
 */
const PLACE_GLYPH: Record<MapPlaceKind, string> = {
  // studio → a building / room
  studio:
    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="3" width="12" height="18" rx="1.5"/><path d="M10 8h4M10 12h4M10 16h4"/></svg>',
  // street → a music note
  street:
    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l10-2v13"/><circle cx="6" cy="18" r="2.6" fill="white" stroke="none"/><circle cx="19" cy="16" r="2.6" fill="white" stroke="none"/></svg>',
  // shop → a storefront
  shop: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h16l-1-4H5L4 9z"/><path d="M5 9v10h14V9"/><path d="M10 19v-5h4v5"/></svg>',
  // event → a star
  event:
    '<svg width="13" height="13" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="1.5" stroke-linejoin="round"><polygon points="12 3 14.6 9 21 9.3 16 13.4 17.7 20 12 16.3 6.3 20 8 13.4 3 9.3 9.4 9"/></svg>',
}

const KIND_NOUN: Record<MapPlaceKind, string> = {
  studio: 'studio',
  street: 'street performer',
  shop: 'music shop',
  event: 'event',
}

export interface ZoneMapProps {
  zones: ZoneSummary[]
  selectedZoneId?: string
  /** The zone the viewer is in — drawn as "you", still only at zone level. */
  viewerZone?: MapZone
  studios: Studio[]
  streetPerformers: StreetPerformer[]
  shops: MusicShop[]
  events: MapEvent[]
  layers: MapLayers
  onSelectZone: (zoneId: string) => void
  onSelectLive: (sessionId: string) => void
  onSelectPlace: (kind: MapPlaceKind, id: string) => void
}

/**
 * A real basemap with zone-level overlays and four public place layers.
 *
 * The musician overlays never receive a per-person coordinate: the only geography in play is
 * `MapZone.center`, the centre of a neighbourhood. That is what makes "neighbourhood, never
 * address" (docs/SPEC.md §5.2) a property of the data rather than a rule the UI must remember.
 * The public layers (studios, buskers, shops, events) are places, not people, so they carry a
 * real `.location` and drop a coloured pin there.
 */
export function ZoneMap({
  zones,
  selectedZoneId,
  viewerZone,
  studios,
  streetPerformers,
  shops,
  events,
  layers,
  onSelectZone,
  onSelectLive,
  onSelectPlace,
}: ZoneMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const layersRef = useRef<LayerGroup | null>(null)
  const [ready, setReady] = useState(false)

  // Handlers are read through refs so redrawing layers does not depend on their identity.
  const selectZoneRef = useRef(onSelectZone)
  const selectLiveRef = useRef(onSelectLive)
  const selectPlaceRef = useRef(onSelectPlace)
  selectZoneRef.current = onSelectZone
  selectLiveRef.current = onSelectLive
  selectPlaceRef.current = onSelectPlace

  // --- Create the map once. Leaflet needs `window`, hence the dynamic import. ---
  useEffect(() => {
    let cancelled = false
    let observer: ResizeObserver | undefined

    void (async () => {
      const L = (await import('leaflet')).default
      if (cancelled || !containerRef.current || mapRef.current) return

      const map = L.map(containerRef.current, {
        center: [MAP_DEFAULT_CENTER.lat, MAP_DEFAULT_CENTER.lng],
        zoom: MAP_DEFAULT_ZOOM,
        zoomSnap: 0.25,
        zoomControl: false,
        // Attribution is rendered in the app's own chrome so the sheet cannot cover it.
        attributionControl: false,
      })

      // OpenStreetMap's own tiles: real geography, no API key. CARTO's Positron would suit the
      // palette better but now watermarks every tile unless you hold a key — see the note in
      // docs/DEPLOY-RENDER.md about swapping in a keyed provider before this sees real traffic.
      // The muted look is recovered with a CSS filter on the tile pane instead.
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        minZoom: 11,
        maxZoom: 18,
      }).addTo(map)

      layersRef.current = L.layerGroup().addTo(map)
      mapRef.current = map

      // Leaflet measures the container once at init. If it is laid out afterwards — a rotation,
      // a sheet opening, the shell settling — it renders blank strips until told to re-measure.
      map.invalidateSize()
      observer = new ResizeObserver(() => map.invalidateSize())
      observer.observe(containerRef.current)

      setReady(true)
    })()

    return () => {
      cancelled = true
      observer?.disconnect()
      mapRef.current?.remove()
      mapRef.current = null
      layersRef.current = null
    }
  }, [])

  // --- Redraw the overlays whenever the data, layers or the selection change. ---
  useEffect(() => {
    if (!ready) return
    const map = mapRef.current
    const layerGroup = layersRef.current
    if (!map || !layerGroup) return

    let cancelled = false

    void (async () => {
      const L = (await import('leaflet')).default
      if (cancelled) return
      layerGroup.clearLayers()

      // --- Musician zone overlays (circles + count pills + "you"), gated behind their layer. ---
      if (layers.musicians) {
        const primary = token('--primary', '#8a79ab')
        const live = token('--live', '#e5262f')

        for (const summary of zones) {
          const { zone, count, liveSessionIds } = summary
          const selected = zone.id === selectedZoneId
          const hasLive = liveSessionIds.length > 0
          const centre: [number, number] = [zone.center.lat, zone.center.lng]

          const circle: Circle = L.circle(centre, {
            radius: zone.radiusMi * MILES_TO_METRES,
            color: hasLive ? live : primary,
            weight: selected ? 2.5 : 1.5,
            opacity: selected ? 0.9 : 0.45,
            fillColor: hasLive ? live : primary,
            fillOpacity: count === 0 ? 0.04 : selected ? 0.22 : 0.12,
          })
          circle.on('click', () => selectZoneRef.current(zone.id))
          circle.addTo(layerGroup)

          const label = count === 1 ? '1 musician' : `${count} musicians`
          const pill: Marker = L.marker(centre, {
            icon: L.divIcon({
              className: 'riff-zone-label',
              iconSize: [0, 0],
              html: `
                <button type="button" aria-label="${zone.name}, ${label}${hasLive ? ', live jam on now' : ''}"
                  class="flex w-max -translate-x-1/2 -translate-y-[calc(50%+11px)] items-center gap-1.5 rounded-full border px-2.5 py-1 shadow-sm backdrop-blur-sm ${
                    selected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border-subtle bg-card/95 text-foreground'
                  }">
                  ${hasLive ? '<span class="riff-live-dot h-1.5 w-1.5 shrink-0 rounded-full bg-live"></span>' : ''}
                  <span class="font-serif text-[11px] font-bold leading-none">${zone.name}</span>
                  <span class="text-[10px] font-bold uppercase tracking-[0.06em] leading-none ${
                    selected ? 'text-primary-foreground/80' : 'text-foreground-dim'
                  }">${count}</span>
                </button>`,
            }),
            keyboard: false,
            // Above the circles, below the place pins and the "you" marker.
            zIndexOffset: 100,
          })
          pill.on('click', () => {
            if (hasLive) selectLiveRef.current(liveSessionIds[0])
            else selectZoneRef.current(zone.id)
          })
          pill.addTo(layerGroup)
        }

        // "You are here" — placed at the centre of the viewer's own zone, like everyone else.
        if (viewerZone) {
          L.marker([viewerZone.center.lat, viewerZone.center.lng], {
            icon: L.divIcon({
              className: 'riff-zone-label',
              iconSize: [0, 0],
              html: `
                <div class="relative -translate-x-1/2 -translate-y-1/2" aria-label="You, in ${viewerZone.name}">
                  <span class="absolute inset-0 m-auto h-4 w-4 rounded-full bg-primary/40 animate-pulse-ring"></span>
                  <span class="relative block h-4 w-4 rounded-full border-2 border-card bg-primary shadow"></span>
                </div>`,
            }),
            keyboard: false,
            zIndexOffset: 200,
            interactive: false,
          }).addTo(layerGroup)
        }
      }

      // --- Public place layers: a coloured pin per item at its own `.location`. ---
      const placeLayers: {
        on: boolean
        kind: MapPlaceKind
        colour: string
        items: { id: string; name: string; location: { lat: number; lng: number }; pulse: boolean }[]
      }[] = [
        {
          on: layers.studios,
          kind: 'studio',
          colour: token('--map-studio', '#d98e4b'),
          items: studios.map((s) => ({ id: s.id, name: s.name, location: s.location, pulse: false })),
        },
        {
          on: layers.street,
          kind: 'street',
          colour: token('--map-street', '#3fa688'),
          items: streetPerformers.map((p) => ({
            id: p.id,
            name: p.name,
            location: p.location,
            // A busker playing right now gets a subtle pulse.
            pulse: p.live,
          })),
        },
        {
          on: layers.shops,
          kind: 'shop',
          colour: token('--map-shop', '#5b8fd4'),
          items: shops.map((s) => ({ id: s.id, name: s.name, location: s.location, pulse: false })),
        },
        {
          on: layers.events,
          kind: 'event',
          colour: token('--map-event', '#d1568a'),
          items: events.map((e) => ({ id: e.id, name: e.title, location: e.location, pulse: false })),
        },
      ]

      for (const layer of placeLayers) {
        if (!layer.on) continue
        const glyph = PLACE_GLYPH[layer.kind]
        const noun = KIND_NOUN[layer.kind]

        for (const item of layer.items) {
          const pin: Marker = L.marker([item.location.lat, item.location.lng], {
            icon: L.divIcon({
              className: 'riff-place-pin',
              iconSize: [0, 0],
              html: `
                <div class="relative -translate-x-1/2 -translate-y-1/2">
                  <button type="button" aria-label="${item.name}, ${noun}"
                    class="flex h-[26px] w-[26px] items-center justify-center rounded-full border-2 border-white shadow-md"
                    style="background:${layer.colour}">
                    ${glyph}
                  </button>
                  ${
                    item.pulse
                      ? `<span class="absolute -right-0.5 -top-0.5 block h-2.5 w-2.5 rounded-full border border-white" style="background:${layer.colour}">
                          <span class="absolute inset-0 rounded-full animate-pulse-ring" style="background:${layer.colour}"></span>
                        </span>`
                      : ''
                  }
                </div>`,
            }),
            keyboard: false,
            // Above the zone circles and pills; the "you" marker still wins at 200.
            zIndexOffset: 150,
          })
          const kind = layer.kind
          const id = item.id
          pin.on('click', () => selectPlaceRef.current(kind, id))
          pin.addTo(layerGroup)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [ready, zones, selectedZoneId, viewerZone, studios, streetPerformers, shops, events, layers])

  return (
    <div
      ref={containerRef}
      // `riff-map` carries the tinted background, so an unreachable tile CDN degrades to the
      // app's own colour instead of Leaflet's default grey.
      className="riff-map absolute inset-0 z-0"
      role="application"
      aria-label="Map of musicians and places by neighbourhood"
    />
  )
}
