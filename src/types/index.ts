// Types transcribed from docs/DATA-MODEL.md. They are written to translate 1:1 into Postgres
// tables later, so keep them flat and free of UI concerns.

export type Instrument =
  'drums' | 'bass' | 'keys' | 'guitar' | 'vocals' | 'sax' | 'synth' | 'percussion'

export type Genre = 'jazz' | 'neo-soul' | 'fusion' | 'indie' | 'rock' | 'funk' | 'hip-hop'

/** Casual Jam / Serious Project / Gigging. */
export type Intent = 'casual' | 'serious' | 'gigging'

export type VouchTag =
  | 'GreatPocket'
  | 'ListenFirst'
  | 'EarlyBird'
  | 'ProVibe'
  | 'GoodEnergy'
  | 'SolidTime'
  | 'EasyToPlayWith'

export type Slot = 'morning' | 'afternoon' | 'evening'

export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

export type JamStatus = 'draft' | 'pending' | 'confirmed' | 'live' | 'completed' | 'cancelled'

export type RequestStatus = 'pending' | 'accepted' | 'declined' | 'counter-proposed' | 'expired'

export type Rsvp = 'confirmed' | 'pending' | 'declined'

// ---------------------------------------------------------------------------
// Musicians
// ---------------------------------------------------------------------------

export interface AudioClip {
  id: string
  url: string
  durationSec: number
  /** Normalised 0–1 peaks for the inline player. */
  waveform?: number[]
  recordedAt: string
}

export interface Availability {
  grid: Record<Weekday, Slot[]>
  note: string
}

export interface MusicianStats {
  /** No recapped sessions yet — render "New", never "0%": unproven is not unreliable. */
  isNew: boolean
  /** Derived: showedUp ÷ confirmed attendances × 100. */
  reliabilityPct: number
  repeatJams: number
  vouchCount: number
  jamsHosted: number
  /** Derived: reliabilityPct >= 95 && repeatJams >= 10. */
  topReliability: boolean
}

/**
 * Not in the prototype, but required by the derived-value table in docs/DATA-MODEL.md:
 * percentages cannot be recomputed from a percentage. These are the raw counters a real
 * database would hold, and they are what the reputation helpers actually read.
 *
 * The fixtures only carry a handful of recent jams, so the `*Offset` fields stand in for the
 * history that is not represented as rows. Everything the app itself records is computed.
 */
export interface ReputationBaseline {
  /** Confirmed attendances already accounted for outside the fixture jams. */
  attendances: number
  /** Of those, how many were marked "showed up". */
  showedUp: number
  /** Vouches received outside the fixture recaps. */
  vouches: number
  /** Repeat-jam pairs not derivable from the fixture jams. */
  repeatJamsOffset: number
}

export interface Musician {
  id: string
  name: string
  /** Used in live chat. */
  handle: string
  avatarUrl: string
  /** Primary is instruments[0]. */
  instruments: Instrument[]
  genres: Genre[]
  intent: Intent
  /** Never a street address. */
  neighborhood: string
  city: string
  /** Precomputed for the viewer; zone-level accuracy only. */
  distanceMi: number
  travelRadiusMi: number
  bio?: string
  clip?: AudioClip
  availability: Availability
  /** Expires at local midnight. */
  availableTonight: boolean
  verified: boolean
  jamsHosted: number
  baseline: ReputationBaseline
}

// ---------------------------------------------------------------------------
// Venues
// ---------------------------------------------------------------------------

export interface VenueSlot {
  id: string
  label: string
  startsAt: string
  available: boolean
}

export interface Venue {
  id: string
  name: string
  kind: string
  neighborhood: string
  /**
   * Never present client-side. The server strips it from every snapshot and reveals it only
   * as Jam.revealedAddress on confirmed jams, to attendees (src/server/world.ts).
   */
  address?: string
  city: string
  distanceMi: number
  photoUrl: string
  rating: number
  jamsHosted: number
  hourlyRateUsd: number
  amenities: string[]
  slots: VenueSlot[]
  liveNow: boolean
}

// ---------------------------------------------------------------------------
// Jams
// ---------------------------------------------------------------------------

export interface JamAttendee {
  musicianId: string
  instrument: Instrument
  rsvp: Rsvp
  /** Set in the recap. */
  showedUp?: boolean
}

export interface Jam {
  id: string
  title: string
  intent: Intent
  status: JamStatus
  startsAt: string
  /** Planned length. */
  durationHours: number
  /** How long it actually ran, once it has. Drives the recap's "1h 42m" line. */
  actualDurationMin?: number
  venueId: string
  hostId: string
  attendees: JamAttendee[]
  /** Roles still wanted. */
  openSeats: Instrument[]
  isOpenCall: boolean
  /** When an open call went up — drives "Posted 2h ago" on Discover. */
  postedAt?: string
  /** The pitch text on an open call. */
  message?: string
  threadId: string
  recordingId?: string
  recapId?: string
  /**
   * The venue's street address, present ONLY when the server decided this viewer may see it:
   * jam confirmed and viewer a confirmed attendee. Its absence IS the privacy rule.
   */
  revealedAddress?: string
}

export interface JamRequest {
  id: string
  fromId: string
  toId: string
  intent: Intent
  /** Up to 3 suggested slots. */
  proposedTimes: string[]
  venueId?: string
  venueSuggestion?: string
  message: string
  status: RequestStatus
  createdAt: string
  /** Set when the recipient counter-proposes instead of accepting. */
  counterTimes?: string[]
  /** Set once accepted. */
  jamId?: string
}

export interface OpenCallApplication {
  id: string
  jamId: string
  applicantId: string
  instrument: Instrument
  status: 'pending' | 'accepted' | 'declined'
  appliedAt: string
}

// ---------------------------------------------------------------------------
// Reputation
// ---------------------------------------------------------------------------

export interface RecapVouch {
  toId: string
  tags: VouchTag[]
  note?: string
}

export interface SessionRecap {
  id: string
  jamId: string
  /** Each attendee files their own. */
  authorId: string
  /** musicianId → showedUp. */
  attendance: Record<string, boolean>
  vouches: RecapVouch[]
  /** Requires unanimous consent. */
  publishRecording: boolean
  durationLabel: string
  createdAt: string
}

/** Denormalised from recaps for the vouches screen. */
export interface Vouch {
  id: string
  fromId: string
  toId: string
  tags: VouchTag[]
  note: string
  sessionsTogether: number
  jamId: string
  createdAt: string
}

// ---------------------------------------------------------------------------
// Messaging
// ---------------------------------------------------------------------------

export type ThreadKind = 'jam' | 'direct' | 'venue' | 'band'

export interface Thread {
  id: string
  kind: ThreadKind
  jamId?: string
  /** Set when the thread was opened by a jam request — drives the JAM REQUEST context label. */
  requestId?: string
  participantIds: string[]
  /** Set for venue threads, which have no musician participant on the other side. */
  venueId?: string
  bandId?: string
  lastMessageAt: string
  unreadCount: number
}

export interface Message {
  id: string
  threadId: string
  authorId: string | 'system'
  body: string
  sentAt: string
  kind: 'text' | 'system'
}

export interface Notification {
  id: string
  kind:
    | 'request_received'
    | 'request_accepted'
    | 'vouch_received'
    | 'open_call_application'
    | 'rank_change'
    | 'band_live'
  actorId?: string
  body: string
  meta?: Record<string, string>
  createdAt: string
  read: boolean
}

// ---------------------------------------------------------------------------
// Bands, live, seasons — declared now so later phases do not widen the type file.
// ---------------------------------------------------------------------------

export interface Recording {
  id: string
  title: string
  venueName?: string
  recordedAt: string
  durationSec: number
  url: string
}

export interface Band {
  id: string
  name: string
  genre: string
  city: string
  coverUrl: string
  followers: number
  rating: number
  sessionCount: number
  /** Reliability is deliberately absent: it is derived per musician, never stored here. */
  members: { musicianId: string; role: string }[]
  openSeats: Instrument[]
  recordings: Recording[]
  battleHistory: {
    opponentBandId: string
    scoreFor: number
    scoreAgainst: number
    result: 'won' | 'lost'
  }[]
  seasonBadge?: string
}

// ---------------------------------------------------------------------------
// Seasons, battles, live
// ---------------------------------------------------------------------------

/**
 * A season is the paid competition — esports for bands. Casual battles (the live-battle
 * screen) are free and unlimited; entering THIS is what costs a fee and pays out.
 *
 * Money is Riff Credits, a mock currency (docs/DEPLOY-RENDER.md) — no real payment rail. The
 * prize pool is the base pool plus every entry fee; at season end the top places split it
 * (payoutSplit), credited to the winners' wallets.
 */
export type SeasonStatus = 'registration' | 'live' | 'finished'

export interface Season {
  id: string
  number: number
  /** "Jazz Scene" */
  scene: string
  city: string
  startsAt: string
  endsAt: string
  status: SeasonStatus
  /** What it costs to enter, in Riff Credits. */
  entryFeeCredits: number
  /** Seeded prize money before any entry fees are added. */
  basePoolCredits: number
  /** Registration closes here; after endsAt the season settles. */
  registrationClosesAt: string
  /** Fractions of the pool paid to 1st, 2nd, 3rd… — must sum to 1. */
  payoutSplit: number[]
}

/** One competitor's entry into a season's competition. */
export interface CompetitionEntry {
  id: string
  seasonId: string
  /** The competing act — a real user (their handle is the act) for v1. */
  competitorId: string
  /** Display name of the act at entry time. */
  competitorName: string
  feePaidCredits: number
  enteredAt: string
  /** Final placement once the season settles (1 = winner). */
  finalRank?: number
  /** Winnings credited at settlement, in Riff Credits. */
  payoutCredits?: number
}

/** A viewer's Riff Credits balance and its history. Mock money — never real currency. */
export interface Wallet {
  balanceCredits: number
  transactions: WalletTransaction[]
}

export interface WalletTransaction {
  id: string
  /** Negative for spends (entry fee), positive for grants and payouts. */
  amountCredits: number
  kind: 'signup_grant' | 'entry_fee' | 'prize_payout' | 'refund'
  memo: string
  createdAt: string
}

export interface LeaderboardEntry {
  rank: number
  musicianId: string
  // docs/DATA-MODEL.md also lists isCurrentUser — deliberately dropped: it is derivable from
  // CURRENT_USER_ID at render time, and storing it would be one more thing to keep in sync.
  points: number
  /** +3 / -2 / 0 — rendered as an up, down or neutral chip. */
  delta: number
  /** "Bassist, Indie" */
  instrumentLabel: string
}

export type BattleRound = 'quarter' | 'semi' | 'final'

export interface Battle {
  id: string
  seasonId: string
  round: BattleRound
  bandAId: string
  bandBId: string
  votesA: number
  votesB: number
  status: 'scheduled' | 'live' | 'finished'
  winnerBandId?: string
  /** "Stage 04 · Grand Ballroom vs. Warehouse 7" */
  stageLabel: string
  viewerCount?: number
}

export interface LiveComment {
  id: string
  handle: string
  body: string
  sentAt: string
}

export interface LiveSession {
  id: string
  bandId?: string
  jamId?: string
  venueId: string
  startedAt: string
  viewerCount: number
  rating: number
  /** "Legendary" */
  reputationLabel: string
  /** Stubbed in v1 — docs/SPEC.md §6 puts real video out of scope. */
  streamUrl: string
  posterUrl: string
  chat: LiveComment[]
}

/**
 * A neighbourhood, and the only spatial unit the app ever renders.
 *
 * `center` is the neighbourhood's own centre — public geography, not a person's position.
 * Musicians carry no coordinates at all: everyone in a zone is drawn at the zone, so there is
 * no per-person location in the data to leak in the first place (docs/SPEC.md §4.2, §5.2).
 *
 * Counts are deliberately absent. They are derived from the musicians whose `neighborhood`
 * matches `name`, so a zone's badge can never disagree with who is actually in it.
 */
export interface MapZone {
  id: string
  /** Matches Musician.neighborhood — the join key between people and places. */
  name: string
  borough: string
  center: { lat: number; lng: number }
  /** How wide the zone is drawn. Coarse on purpose. */
  radiusMi: number
}

// ---------------------------------------------------------------------------
// Map places — the public layers on the map beyond musicians and their jams.
//
// Privacy line (docs/SPEC.md §5.2, CLAUDE.md rule 2): PEOPLE and HOMES stay at neighbourhood
// level. Musicians never carry a coordinate; a home-rig studio's exact address is withheld
// until a booking is confirmed — the same rule as a confirmed jam. PUBLIC LISTINGS — music
// shops, event venues, and buskers who chose to perform in public right now — legitimately
// show their spot, because being found is the whole point of a shop or a gig.
// ---------------------------------------------------------------------------

export type MapPlaceKind = 'studio' | 'street' | 'shop' | 'event'

/** A public map coordinate. Only ever a place's own point, never a private person's. */
export interface GeoPoint {
  lat: number
  lng: number
}

/**
 * A rentable studio — Airbnb-style, by the hour. Either a dedicated pro room or someone's home
 * rig they let out. A home rig keeps its exact address hidden until a booking is confirmed
 * (product rules 1 & 2), and its map pin sits at neighbourhood level on purpose.
 */
export interface Studio {
  id: string
  name: string
  /** A dedicated room vs. someone's home setup. */
  kind: 'pro-room' | 'home-rig'
  /** Set for a home rig: the musician who owns it, so the card can link to their profile. */
  hostId?: string
  neighborhood: string
  city: string
  /** Where the pin sits. A home rig uses a coarse, neighbourhood-level point. */
  location: GeoPoint
  /** Public storefront address for a pro room; absent for a home rig until it is booked. */
  address?: string
  /** A home rig reveals its address only once a booking is confirmed. */
  addressRevealed: boolean
  distanceMi: number
  hourlyRateUsd: number
  photoUrl: string
  rating: number
  reviewCount: number
  capacity: number
  /** "Full drum kit", "Neumann U87", "Fender Twin"… */
  gear: string[]
  amenities: string[]
  /** A pro room can confirm instantly; a home rig is a request the host accepts. */
  instantBook: boolean
  slots: VenueSlot[]
}

/** A busker performing in public now (or later today). Public by nature — no home is exposed. */
export interface StreetPerformer {
  id: string
  /** The act's display name. */
  name: string
  /** Set if they are a Riff musician — links to their profile. */
  musicianId?: string
  handle?: string
  instruments: Instrument[]
  genres: Genre[]
  neighborhood: string
  /** The public spot: "Bedford Ave & N 7th", "Domino Park". Never a home address. */
  spotLabel: string
  location: GeoPoint
  startedAt: string
  /** Performing until roughly this time. */
  until: string
  /** Whether they are playing right now. */
  live: boolean
  avatarUrl: string
  blurb: string
}

/** A music shop — instruments, vinyl, repairs, gear. A public storefront. */
export interface MusicShop {
  id: string
  name: string
  kind: 'instruments' | 'vinyl' | 'repair' | 'gear'
  neighborhood: string
  city: string
  address: string
  location: GeoPoint
  distanceMi: number
  photoUrl: string
  rating: number
  reviewCount: number
  /** "Guitars", "Vintage synths", "Repairs"… */
  tags: string[]
  openNow: boolean
  hoursLabel: string
  phone?: string
  website?: string
}

/** A public music event on the map — a gig, open mic, session or workshop. */
export interface MapEvent {
  id: string
  title: string
  kind: 'gig' | 'openmic' | 'session' | 'workshop'
  /** Linked venue when it is one on Riff. */
  venueId?: string
  venueName: string
  neighborhood: string
  city: string
  location: GeoPoint
  startsAt: string
  endsAt?: string
  /** "Free", "$10", "$15 door". */
  priceLabel: string
  lineup: string[]
  hostName?: string
  coverUrl: string
  blurb: string
  goingCount: number
  tags: string[]
}

// ---------------------------------------------------------------------------
// User-created map listings — members list their own studio, busker act, or shop, which the
// map merges with the seeded world. Curated Airbnb-style: a listing passes an automated quality
// gate at submit (required fields, sane values, a profile-complete owner), shows briefly as
// "in review", then goes live. The owner's Riff reputation is the trust anchor behind it.
// ---------------------------------------------------------------------------

export type ListingKind = 'studio' | 'street' | 'shop'

/** draft = not submitted · in_review = passed the gate, publishing · published = live · paused = owner hid it */
export type ListingStatus = 'draft' | 'in_review' | 'published' | 'paused'

/**
 * A member-owned map listing: ownership + curation status wrapped around one of the typed place
 * objects. The inner object's `id` equals this listing's `id`, so /studios/[id], /shops/[id] and
 * /street/[id] resolve a community listing exactly like a seeded one.
 */
export interface MapListing {
  id: string
  ownerId: string
  kind: ListingKind
  status: ListingStatus
  createdAt: string
  studio?: Studio
  street?: StreetPerformer
  shop?: MusicShop
}
