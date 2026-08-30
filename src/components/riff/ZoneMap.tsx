'use client'

import { useEffect, useRef, useState } from 'react'
import type { Circle, LayerGroup, Map as LeafletMap, Marker } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM, type ZoneSummary } from '@/mocks'
import type { MapZone } from '@/types'

const MILES_TO_METRES = 1609.344

/** Read a design token at runtime so Leaflet's canvas uses the same palette as the DOM. */
function token(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

export interface ZoneMapProps {
  zones: ZoneSummary[]
  selectedZoneId?: string
  /** The zone the viewer is in — drawn as "you", still only at zone level. */
  viewerZone?: MapZone
  onSelectZone: (zoneId: string) => void
  onSelectLive: (sessionId: string) => void
}

/**
 * A real basemap with zone-level overlays.
 *
 * Nothing here ever receives a per-person coordinate: the only geography in play is
 * `MapZone.center`, the centre of a neighbourhood. Every musician in a zone is represented by
 * that zone's circle and count, which is what makes "neighbourhood, never address"
 * (docs/SPEC.md §5.2) a property of the data rather than a rule the UI has to remember.
 */
export function ZoneMap({
  zones,
  selectedZoneId,
  viewerZone,
  onSelectZone,
  onSelectLive,
}: ZoneMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const layersRef = useRef<LayerGroup | null>(null)
  const [ready, setReady] = useState(false)

  // Handlers are read through refs so redrawing layers does not depend on their identity.
  const selectZoneRef = useRef(onSelectZone)
  const selectLiveRef = useRef(onSelectLive)
  selectZoneRef.current = onSelectZone
  selectLiveRef.current = onSelectLive

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

  // --- Redraw the overlays whenever the zones or the selection change. ---
  useEffect(() => {
    if (!ready) return
    const map = mapRef.current
    const layers = layersRef.current
    if (!map || !layers) return

    let cancelled = false

    void (async () => {
      const L = (await import('leaflet')).default
      if (cancelled) return
      layers.clearLayers()

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
        circle.addTo(layers)

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
          // Above the circles, below the "you" marker.
          zIndexOffset: 100,
        })
        pill.on('click', () => {
          if (hasLive) selectLiveRef.current(liveSessionIds[0])
          else selectZoneRef.current(zone.id)
        })
        pill.addTo(layers)
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
        }).addTo(layers)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [ready, zones, selectedZoneId, viewerZone])

  return (
    <div
      ref={containerRef}
      // `riff-map` carries the tinted background, so an unreachable tile CDN degrades to the
      // app's own colour instead of Leaflet's default grey.
      className="riff-map absolute inset-0 z-0"
      role="application"
      aria-label="Map of musicians by neighbourhood"
    />
  )
}
