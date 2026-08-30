import type { MapZone } from '@/types'

/**
 * Real neighbourhood centres, so the map can sit on a real basemap. These are the centres of
 * the *places*, not of anybody in them — every musician in a zone renders at the zone centre,
 * which is what keeps the map zone-level by construction rather than by convention.
 *
 * `name` matches Musician.neighborhood exactly; that string is the join.
 */
export const mapZones: MapZone[] = [
  {
    id: 'williamsburg',
    name: 'Williamsburg',
    borough: 'Brooklyn',
    center: { lat: 40.7143, lng: -73.9566 },
    radiusMi: 0.62,
  },
  {
    id: 'greenpoint',
    name: 'Greenpoint',
    borough: 'Brooklyn',
    center: { lat: 40.7304, lng: -73.954 },
    radiusMi: 0.55,
  },
  {
    id: 'bushwick',
    name: 'Bushwick',
    borough: 'Brooklyn',
    center: { lat: 40.6944, lng: -73.9213 },
    radiusMi: 0.7,
  },
  {
    id: 'bed-stuy',
    name: 'Bed-Stuy',
    borough: 'Brooklyn',
    center: { lat: 40.6872, lng: -73.9418 },
    radiusMi: 0.68,
  },
  {
    id: 'fort-greene',
    name: 'Fort Greene',
    borough: 'Brooklyn',
    center: { lat: 40.6892, lng: -73.974 },
    radiusMi: 0.45,
  },
  {
    id: 'astoria',
    name: 'Astoria',
    borough: 'Queens',
    center: { lat: 40.7644, lng: -73.9235 },
    radiusMi: 0.75,
  },
]

/** Where the map opens: the middle of the scene, wide enough to hold every zone. */
export const MAP_DEFAULT_CENTER = { lat: 40.7135, lng: -73.9475 }
export const MAP_DEFAULT_ZOOM = 12.4
