import type { MapEvent, MusicShop, StreetPerformer, Studio } from '@/types'
import { NOW } from './clock'

/**
 * The public map layers beyond musicians and their jams: studios you can rent by the hour,
 * buskers playing in public right now, music shops, and events.
 *
 * These are public, static fixtures — read directly (like venues, bands and battles), not
 * per-viewer snapshot data. Nothing here is a private person's position: studios and events
 * sit at their own public point, buskers at the public spot they chose to play, and a home-rig
 * studio's exact address is withheld until a booking is confirmed (see `addressRevealed`).
 *
 * Coordinates cluster around the six map zones (src/mocks/zones.ts) so the pins land on the
 * real basemap. Times are anchored to the fixed scene clock (src/mocks/clock.ts, NOW =
 * Fri 2026-08-28 15:00 ET): "tonight" is that Friday evening, the weekend is the 29th–30th.
 */

// ---------------------------------------------------------------------------
// Studios for rent — Airbnb-style, by the hour. Pro rooms confirm instantly; home rigs are a
// request the host accepts, and only then is the exact address revealed.
// ---------------------------------------------------------------------------

export const studios: Studio[] = [
  {
    id: 'studio-north-room',
    name: 'North Room Studios',
    kind: 'pro-room',
    neighborhood: 'Greenpoint',
    city: 'Brooklyn, NY',
    location: { lat: 40.7318, lng: -73.9557 },
    address: '61 Greenpoint Ave, Studio B',
    addressRevealed: true,
    distanceMi: 0.8,
    hourlyRateUsd: 32,
    photoUrl: '/mock/studios/studio-north-room.svg',
    rating: 4.9,
    reviewCount: 74,
    capacity: 6,
    gear: ['Full drum kit', 'PA system', 'Fender Twin', 'Nord Stage 3'],
    amenities: ['Backline included', 'Air conditioning', 'Open till 2am', 'Parking'],
    instantBook: true,
    slots: [
      { id: 'nr-1', label: 'Tonight 8:00 PM', startsAt: '2026-08-28T20:00:00-04:00', available: true },
      { id: 'nr-2', label: 'Sat 2:00 PM', startsAt: '2026-08-29T14:00:00-04:00', available: true },
      { id: 'nr-3', label: 'Sun 6:00 PM', startsAt: '2026-08-30T18:00:00-04:00', available: false },
    ],
  },
  {
    id: 'studio-marcus-rig',
    name: "Marcus's Home Rig",
    kind: 'home-rig',
    hostId: 'marcus-chen',
    neighborhood: 'Bushwick',
    city: 'Brooklyn, NY',
    // A home rig — the pin sits at the neighbourhood, not the doorstep.
    location: { lat: 40.6949, lng: -73.922 },
    addressRevealed: false,
    distanceMi: 1.6,
    hourlyRateUsd: 15,
    photoUrl: '/mock/studios/studio-marcus-rig.svg',
    rating: 4.7,
    reviewCount: 19,
    capacity: 3,
    gear: ['Fender Rhodes', 'Moog Sub 37', 'Ableton rig', 'Condenser mics'],
    amenities: ['Coffee', 'Cat on premises', 'Quiet building'],
    instantBook: false,
    slots: [
      { id: 'mr-1', label: 'Sat 11:00 AM', startsAt: '2026-08-29T11:00:00-04:00', available: true },
      { id: 'mr-2', label: 'Sun 3:00 PM', startsAt: '2026-08-30T15:00:00-04:00', available: true },
    ],
  },
  {
    id: 'studio-leo-bass-room',
    name: "Leo's Bass Room",
    kind: 'home-rig',
    hostId: 'leo-rossi',
    neighborhood: 'Bed-Stuy',
    city: 'Brooklyn, NY',
    location: { lat: 40.6878, lng: -73.9405 },
    addressRevealed: false,
    distanceMi: 2.1,
    hourlyRateUsd: 12,
    photoUrl: '/mock/studios/studio-leo-bass-room.svg',
    rating: 4.6,
    reviewCount: 11,
    capacity: 2,
    gear: ['Ampeg SVT stack', 'Upright bass', 'Two-mic setup'],
    amenities: ['Basement soundproofing', 'Late nights OK'],
    instantBook: false,
    slots: [
      { id: 'lb-1', label: 'Tonight 9:30 PM', startsAt: '2026-08-28T21:30:00-04:00', available: true },
      { id: 'lb-2', label: 'Mon 7:00 PM', startsAt: '2026-08-31T19:00:00-04:00', available: true },
    ],
  },
  {
    id: 'studio-analog-attic',
    name: 'Analog Attic',
    kind: 'pro-room',
    neighborhood: 'Fort Greene',
    city: 'Brooklyn, NY',
    location: { lat: 40.6899, lng: -73.9726 },
    address: '212 DeKalb Ave, 4th Fl',
    addressRevealed: true,
    distanceMi: 1.2,
    hourlyRateUsd: 28,
    photoUrl: '/mock/studios/studio-analog-attic.svg',
    rating: 4.8,
    reviewCount: 53,
    capacity: 5,
    gear: ['Tape machine', 'Neumann U87', 'Hammond organ', 'Full drum kit'],
    amenities: ['Engineer on request', 'Vinyl-warm room', 'Green room'],
    instantBook: true,
    slots: [
      { id: 'aa-1', label: 'Sat 4:00 PM', startsAt: '2026-08-29T16:00:00-04:00', available: true },
      { id: 'aa-2', label: 'Sat 8:00 PM', startsAt: '2026-08-29T20:00:00-04:00', available: true },
    ],
  },
  {
    id: 'studio-nina-keys-corner',
    name: "Nina's Keys Corner",
    kind: 'home-rig',
    hostId: 'nina-alvarez',
    neighborhood: 'Williamsburg',
    city: 'Brooklyn, NY',
    location: { lat: 40.7149, lng: -73.9578 },
    addressRevealed: false,
    distanceMi: 0.6,
    hourlyRateUsd: 18,
    photoUrl: '/mock/studios/studio-nina-keys-corner.svg',
    rating: 4.9,
    reviewCount: 27,
    capacity: 3,
    gear: ['Yamaha grand', 'Prophet-6', 'Isolation booth'],
    amenities: ['Natural light', 'Tea and coffee', 'Elevator'],
    instantBook: false,
    slots: [
      { id: 'nk-1', label: 'Sun 1:00 PM', startsAt: '2026-08-30T13:00:00-04:00', available: true },
    ],
  },
  {
    id: 'studio-ditmars-sound',
    name: 'Ditmars Sound',
    kind: 'pro-room',
    neighborhood: 'Astoria',
    city: 'Queens, NY',
    location: { lat: 40.7651, lng: -73.9221 },
    address: '31-05 Ditmars Blvd',
    addressRevealed: true,
    distanceMi: 3.4,
    hourlyRateUsd: 24,
    photoUrl: '/mock/studios/studio-ditmars-sound.svg',
    rating: 4.5,
    reviewCount: 40,
    capacity: 6,
    gear: ['PA system', 'Drum kit', 'Bass and guitar amps'],
    amenities: ['24/7 access', 'Lockers', 'Vending'],
    instantBook: true,
    slots: [
      { id: 'ds-1', label: 'Tonight 7:00 PM', startsAt: '2026-08-28T19:00:00-04:00', available: true },
      { id: 'ds-2', label: 'Sun 5:00 PM', startsAt: '2026-08-30T17:00:00-04:00', available: true },
    ],
  },
]

// ---------------------------------------------------------------------------
// Street performers — buskers playing in public. Public by nature: the spot is the point.
// ---------------------------------------------------------------------------

export const streetPerformers: StreetPerformer[] = [
  {
    id: 'street-bedford-trio',
    name: 'The Bedford Trio',
    instruments: ['sax', 'guitar', 'percussion'],
    genres: ['jazz', 'funk'],
    neighborhood: 'Williamsburg',
    spotLabel: 'Bedford Ave & N 7th St',
    location: { lat: 40.7172, lng: -73.9568 },
    startedAt: '2026-08-28T14:15:00-04:00',
    until: '2026-08-28T17:00:00-04:00',
    live: true,
    avatarUrl: '/mock/avatars/camille-okafor.svg',
    blurb: 'Standards and street-funk. Requests welcome — drop a tip in the case.',
  },
  {
    // A Riff musician busking — identity matches her profile so "View Riff profile" is consistent.
    id: 'street-ana-duarte',
    name: 'Ana Duarte',
    musicianId: 'ana-duarte',
    handle: '@ana_d',
    instruments: ['guitar', 'vocals'],
    genres: ['indie', 'neo-soul'],
    neighborhood: 'Greenpoint',
    spotLabel: 'McCarren Park, north entrance',
    location: { lat: 40.7223, lng: -73.9505 },
    startedAt: '2026-08-28T13:30:00-04:00',
    until: '2026-08-28T16:30:00-04:00',
    live: true,
    avatarUrl: '/mock/avatars/ana-duarte.svg',
    blurb: 'Looping guitar and voice. Come sit on the grass for a bit.',
  },
  {
    // A street act that isn't on Riff — no profile link, so nothing to contradict.
    id: 'street-l-platform',
    name: 'Subway Sessions',
    instruments: ['keys', 'vocals'],
    genres: ['neo-soul', 'hip-hop'],
    neighborhood: 'Williamsburg',
    spotLabel: 'Bedford Av L, mezzanine',
    location: { lat: 40.7171, lng: -73.9569 },
    startedAt: '2026-08-28T14:45:00-04:00',
    until: '2026-08-28T16:15:00-04:00',
    live: true,
    avatarUrl: '/mock/avatars/miles-whitfield.svg',
    blurb: 'Keys-and-verse commuter sets. Catch me before rush hour clears.',
  },
  {
    id: 'street-fort-greene-duo',
    name: 'Fort Greene Park Duo',
    instruments: ['guitar', 'drums'],
    genres: ['rock', 'indie'],
    neighborhood: 'Fort Greene',
    spotLabel: 'Fort Greene Park, Myrtle side',
    location: { lat: 40.6905, lng: -73.9738 },
    startedAt: '2026-08-28T18:00:00-04:00',
    until: '2026-08-28T20:30:00-04:00',
    live: false,
    avatarUrl: '/mock/avatars/jonah-wills.svg',
    blurb: 'Golden-hour set later today. Acoustic, loud when it counts.',
  },
]

// ---------------------------------------------------------------------------
// Music shops — instruments, vinyl, repairs, gear. Public storefronts.
// ---------------------------------------------------------------------------

export const musicShops: MusicShop[] = [
  {
    id: 'shop-brooklyn-guitar-works',
    name: 'Brooklyn Guitar Works',
    kind: 'instruments',
    neighborhood: 'Williamsburg',
    city: 'Brooklyn, NY',
    address: '167 N 9th St',
    location: { lat: 40.7188, lng: -73.9552 },
    distanceMi: 0.5,
    photoUrl: '/mock/shops/shop-brooklyn-guitar-works.svg',
    rating: 4.7,
    reviewCount: 212,
    tags: ['Guitars', 'Amps', 'Pedals', 'Repairs'],
    hours: { opensAt: 11, closesAt: 20 },
    openNow: false, // derived in the selector
    hoursLabel: '', // derived in the selector
    phone: '+1 718-555-0132',
    website: 'brooklynguitarworks.example',
  },
  {
    id: 'shop-greenpoint-vinyl',
    name: 'Greenpoint Vinyl',
    kind: 'vinyl',
    neighborhood: 'Greenpoint',
    city: 'Brooklyn, NY',
    address: '94 Franklin St',
    location: { lat: 40.7296, lng: -73.9581 },
    distanceMi: 0.9,
    photoUrl: '/mock/shops/shop-greenpoint-vinyl.svg',
    rating: 4.8,
    reviewCount: 168,
    tags: ['Vinyl', 'Jazz', 'Soul', 'Turntables'],
    hours: { opensAt: 11, closesAt: 21 },
    openNow: false, // derived in the selector
    hoursLabel: '', // derived in the selector
    website: 'greenpointvinyl.example',
  },
  {
    id: 'shop-bushwick-synth-lab',
    name: 'Bushwick Synth Lab',
    kind: 'gear',
    neighborhood: 'Bushwick',
    city: 'Brooklyn, NY',
    address: '19 Wyckoff Ave',
    location: { lat: 40.7051, lng: -73.9226 },
    distanceMi: 1.9,
    photoUrl: '/mock/shops/shop-bushwick-synth-lab.svg',
    rating: 4.6,
    reviewCount: 97,
    tags: ['Synths', 'Eurorack', 'Drum machines', 'Trade-ins'],
    hours: { opensAt: 10, closesAt: 19 },
    openNow: false, // derived in the selector
    hoursLabel: '', // derived in the selector
    phone: '+1 718-555-0177',
  },
  {
    id: 'shop-bed-stuy-drum-shop',
    name: 'Bed-Stuy Drum Shop',
    kind: 'instruments',
    neighborhood: 'Bed-Stuy',
    city: 'Brooklyn, NY',
    address: '388 Tompkins Ave',
    location: { lat: 40.6867, lng: -73.9443 },
    distanceMi: 2.3,
    photoUrl: '/mock/shops/shop-bed-stuy-drum-shop.svg',
    rating: 4.5,
    reviewCount: 61,
    tags: ['Drums', 'Cymbals', 'Percussion', 'Skins'],
    hours: { opensAt: 10, closesAt: 19 },
    openNow: false, // derived in the selector
    hoursLabel: '', // derived in the selector
  },
  {
    id: 'shop-astoria-music-repair',
    name: 'Astoria Music Repair',
    kind: 'repair',
    neighborhood: 'Astoria',
    city: 'Queens, NY',
    address: '30-14 Steinway St',
    location: { lat: 40.7622, lng: -73.9203 },
    distanceMi: 3.6,
    photoUrl: '/mock/shops/shop-astoria-music-repair.svg',
    rating: 4.9,
    reviewCount: 134,
    tags: ['Repairs', 'Setups', 'Restringing', 'Electronics'],
    hours: { opensAt: 10, closesAt: 18 },
    openNow: false, // derived in the selector
    hoursLabel: '', // derived in the selector
    phone: '+1 718-555-0043',
  },
]

// ---------------------------------------------------------------------------
// Events — gigs, open mics, sessions, workshops. Public happenings.
// ---------------------------------------------------------------------------

export const mapEvents: MapEvent[] = [
  {
    id: 'event-neo-soul-session',
    title: 'Neo-Soul Session',
    kind: 'session',
    venueId: 'sonic-basement',
    venueName: 'Sonic Basement',
    neighborhood: 'Greenpoint',
    city: 'Brooklyn, NY',
    location: { lat: 40.7309, lng: -73.9534 },
    startsAt: '2026-08-28T20:00:00-04:00',
    endsAt: '2026-08-28T23:30:00-04:00',
    priceLabel: '$10 door',
    lineup: ['Nina Alvarez', 'Theo Park', 'guests'],
    hostName: 'Sonic Basement',
    coverUrl: '/mock/events/event-neo-soul-session.svg',
    blurb: 'Open backline, deep grooves. Bring your horn and sit in.',
    goingCount: 84,
    tags: ['Neo-soul', 'Open backline', 'All levels'],
  },
  {
    id: 'event-open-mic-friday',
    title: 'Open Mic Friday',
    kind: 'openmic',
    venueName: 'The Turnaround',
    neighborhood: 'Bushwick',
    city: 'Brooklyn, NY',
    location: { lat: 40.6961, lng: -73.9199 },
    startsAt: '2026-08-28T19:00:00-04:00',
    endsAt: '2026-08-28T22:00:00-04:00',
    priceLabel: 'Free',
    lineup: ['Sign-up at the door'],
    hostName: 'DJ Marisol',
    coverUrl: '/mock/events/event-open-mic-friday.svg',
    blurb: 'Two songs each, house drummer on hand. Sign-up opens 6:30.',
    goingCount: 46,
    tags: ['Open mic', 'Free', 'House band'],
  },
  {
    id: 'event-warehouse-velvet-static',
    title: 'Velvet Static — Warehouse Set',
    kind: 'gig',
    venueName: 'Warehouse 7',
    neighborhood: 'Bushwick',
    city: 'Brooklyn, NY',
    location: { lat: 40.6928, lng: -73.9241 },
    startsAt: '2026-08-28T21:00:00-04:00',
    endsAt: '2026-08-29T00:00:00-04:00',
    priceLabel: '$15 adv',
    lineup: ['Velvet Static', 'Dust Radio'],
    hostName: 'Warehouse 7',
    coverUrl: '/mock/events/event-warehouse-velvet-static.svg',
    blurb: 'Two bands, one long room. Doors 9, loud by 10.',
    goingCount: 213,
    tags: ['Live gig', 'Indie', 'Rock'],
  },
  {
    id: 'event-sunday-jazz-brunch',
    title: 'Sunday Jazz Brunch',
    kind: 'session',
    venueName: 'The Greene Room',
    neighborhood: 'Fort Greene',
    city: 'Brooklyn, NY',
    location: { lat: 40.6885, lng: -73.9749 },
    startsAt: '2026-08-30T12:00:00-04:00',
    endsAt: '2026-08-30T15:00:00-04:00',
    priceLabel: 'Free (tip the band)',
    lineup: ['The Fort Greene Quartet'],
    hostName: 'The Greene Room',
    coverUrl: '/mock/events/event-sunday-jazz-brunch.svg',
    blurb: 'Standards over coffee. Family-friendly, wander in any time.',
    goingCount: 58,
    tags: ['Jazz', 'Brunch', 'Free'],
  },
  {
    id: 'event-modular-synth-workshop',
    title: 'Modular Synth Workshop',
    kind: 'workshop',
    venueName: 'North Room Studios',
    neighborhood: 'Williamsburg',
    city: 'Brooklyn, NY',
    location: { lat: 40.7135, lng: -73.9583 },
    startsAt: '2026-08-29T15:00:00-04:00',
    endsAt: '2026-08-29T17:30:00-04:00',
    priceLabel: '$25',
    lineup: ['Hosted by Bushwick Synth Lab'],
    hostName: 'Bushwick Synth Lab',
    coverUrl: '/mock/events/event-modular-synth-workshop.svg',
    blurb: 'Patch from scratch. Gear provided; bring headphones if you have them.',
    goingCount: 32,
    tags: ['Workshop', 'Synths', 'Beginner-friendly'],
  },
]

// ---------------------------------------------------------------------------
// Read-time freshness — these fixtures are static (never seeded), so their timestamps would sit
// frozen on the authoring day (NOW = 2026-08-28) while the app renders relative labels against the
// real clock, showing past "tonight" slots and buskers "live" days after they finished. We apply
// the SAME whole-day shift the DB seed uses (src/server/db.ts), so "tonight" is tonight and a
// busker's live window lands on today. `live` is then derived from the shifted window, not trusted
// as a static flag. Whole-day granularity means SSR and client agree within a calendar day.
// ---------------------------------------------------------------------------

const DAY_MS = 86_400_000

function etDateKey(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso))
}

/** Whole-day offset (ms) from the fixture scene to `now`'s calendar day. */
function sceneShiftMs(now: string): number {
  const days = Math.round(
    (Date.parse(`${etDateKey(now)}T12:00:00Z`) - Date.parse(`${etDateKey(NOW)}T12:00:00Z`)) / DAY_MS,
  )
  return days * DAY_MS
}

const shiftIso = (iso: string, ms: number): string => new Date(Date.parse(iso) + ms).toISOString()

function freshStudio(s: Studio, ms: number): Studio {
  return { ...s, slots: s.slots.map((slot) => ({ ...slot, startsAt: shiftIso(slot.startsAt, ms) })) }
}

function freshPerformer(p: StreetPerformer, ms: number, now: string): StreetPerformer {
  const startedAt = shiftIso(p.startedAt, ms)
  const until = shiftIso(p.until, ms)
  const nowMs = Date.parse(now)
  return { ...p, startedAt, until, live: nowMs >= Date.parse(startedAt) && nowMs <= Date.parse(until) }
}

function freshEvent(e: MapEvent, ms: number): MapEvent {
  return {
    ...e,
    startsAt: shiftIso(e.startsAt, ms),
    ...(e.endsAt ? { endsAt: shiftIso(e.endsAt, ms) } : {}),
  }
}

// ---------------------------------------------------------------------------
// Selectors — public reads, mirroring the getX/listX pattern in src/mocks/index.ts. Each accepts
// an optional `now` (defaults to the real clock) so callers can pin it to the store's clock.
// ---------------------------------------------------------------------------

export const listStudios = (now = new Date().toISOString()): Studio[] => {
  const ms = sceneShiftMs(now)
  return studios.map((s) => freshStudio(s, ms))
}
export const getStudio = (id: string, now = new Date().toISOString()): Studio | undefined => {
  const s = studios.find((x) => x.id === id)
  return s ? freshStudio(s, sceneShiftMs(now)) : undefined
}

export const listStreetPerformers = (now = new Date().toISOString()): StreetPerformer[] => {
  const ms = sceneShiftMs(now)
  return streetPerformers.map((p) => freshPerformer(p, ms, now))
}
export const getStreetPerformer = (
  id: string,
  now = new Date().toISOString(),
): StreetPerformer | undefined => {
  const p = streetPerformers.find((x) => x.id === id)
  return p ? freshPerformer(p, sceneShiftMs(now), now) : undefined
}

/**
 * openNow and hoursLabel are computed from the shop's structured hours against the local
 * clock, never authored — "Open now" is only ever a statement about right now.
 */
export function withOpenState<T extends Pick<MusicShop, 'hours' | 'openNow' | 'hoursLabel'>>(
  shop: T,
  now = new Date(),
): T {
  if (!shop.hours) return { ...shop, openNow: false, hoursLabel: 'Hours vary' }
  const hour = Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric',
      hour12: false,
    }).format(now),
  )
  const { opensAt, closesAt } = shop.hours
  const open = hour >= opensAt && hour < closesAt
  const fmt = (h: number) =>
    h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`
  return {
    ...shop,
    openNow: open,
    hoursLabel: open ? `Open till ${fmt(closesAt)}` : `Opens at ${fmt(opensAt)}`,
  }
}

export const listMusicShops = (): MusicShop[] => musicShops.map((s) => withOpenState(s))
export const getMusicShop = (id: string): MusicShop | undefined => {
  const s = musicShops.find((x) => x.id === id)
  return s && withOpenState(s)
}

export const listMapEvents = (now = new Date().toISOString()): MapEvent[] => {
  const ms = sceneShiftMs(now)
  return mapEvents.map((e) => freshEvent(e, ms))
}
export const getMapEvent = (id: string, now = new Date().toISOString()): MapEvent | undefined => {
  const e = mapEvents.find((x) => x.id === id)
  return e ? freshEvent(e, sceneShiftMs(now)) : undefined
}
