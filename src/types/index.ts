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
  /** Only revealed on confirmed jams, and only to attendees. See src/lib/privacy.ts. */
  address: string
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
  /** The pitch text on an open call. */
  message?: string
  threadId: string
  recordingId?: string
  recapId?: string
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
    'request_accepted' | 'vouch_received' | 'open_call_application' | 'rank_change' | 'band_live'
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

export interface Season {
  id: string
  number: number
  /** "Jazz Scene" */
  scene: string
  city: string
  startsAt: string
  endsAt: string
}

export interface LeaderboardEntry {
  rank: number
  musicianId: string
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

export interface MapZone {
  id: string
  name: string
  musicianCount: number
  liveJamCount: number
  /** Stylised map coords, never lat/lng. */
  centroid: { x: number; y: number }
}
