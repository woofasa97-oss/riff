# Riff — Data Model

Every field below is justified by something visible in the prototype. v1 ships with mock data,
so these are TypeScript types in `src/types/` backed by fixtures in `src/mocks/`. They are
written to translate 1:1 into Postgres tables later.

## Enums

```ts
export type Instrument = 'drums'|'bass'|'keys'|'guitar'|'vocals'|'sax'|'synth'|'percussion';
export type Genre = 'jazz'|'neo-soul'|'fusion'|'indie'|'rock'|'funk'|'hip-hop';
export type Intent = 'casual'|'serious'|'gigging';        // Casual Jam / Serious Project / Gigging
export type VouchTag = 'GreatPocket'|'ListenFirst'|'EarlyBird'|'ProVibe'|'GoodEnergy'
                     | 'SolidTime'|'EasyToPlayWith';
export type Slot = 'morning'|'afternoon'|'evening';
export type JamStatus = 'draft'|'pending'|'confirmed'|'live'|'completed'|'cancelled';
export type RequestStatus = 'pending'|'accepted'|'declined'|'counter-proposed'|'expired';
```

## Core entities

```ts
interface Musician {
  id: string;
  name: string;                  // "Marcus Chen"
  handle: string;                // "marcus_c" — used in live chat
  avatarUrl: string;
  instruments: Instrument[];     // primary is instruments[0]
  genres: Genre[];
  intent: Intent;
  neighborhood: string;          // "Williamsburg"  — never a street address
  city: string;                  // "Brooklyn, NY"
  distanceMi: number;            // precomputed for the viewer; zone-level accuracy only
  travelRadiusMi: number;        // 1–10, from onboarding step 1
  bio?: string;
  clip?: AudioClip;
  availability: Availability;
  availableTonight: boolean;     // expires at local midnight
  verified: boolean;             // "VERIFIED" badge
  stats: MusicianStats;
}

interface MusicianStats {
  reliabilityPct: number;        // 98  — derived from recap attendance
  repeatJams: number;            // 15
  vouchCount: number;            // 24
  jamsHosted: number;            // 4   — drives "VERIFIED · 4 jams hosted"
  topReliability: boolean;       // drives the "TOP RELIABILITY" badge
}

interface Availability {
  grid: Record<Weekday, Slot[]>; // 7 × 3, from onboarding step 3
  note: string;                  // "Usually free evenings after 7 PM"
}

interface AudioClip {
  id: string;
  url: string;
  durationSec: number;           // 24 for onboarding clips, 45 seen on Sarah
  waveform?: number[];           // normalised 0–1 peaks for the inline player
  recordedAt: string;
}
```

```ts
interface Venue {
  id: string;
  name: string;                  // "Sonic Basement"
  kind: string;                  // "Rehearsal room and live space"
  neighborhood: string;          // "Greenpoint, Brooklyn"
  address: string;               // "114 Franklin St" — only revealed on confirmed jams
  distanceMi: number;
  photoUrl: string;
  rating: number;                // 4.8
  jamsHosted: number;            // 62
  hourlyRateUsd: number;         // 18
  amenities: string[];           // ["Backline provided","Drum kit","PA system","Open till 2am"]
  slots: VenueSlot[];
  liveNow: boolean;
}

interface VenueSlot { id: string; label: string; startsAt: string; available: boolean; }
```

```ts
interface Jam {
  id: string;
  title: string;                 // "Neo-Soul Session"
  intent: Intent;
  status: JamStatus;
  startsAt: string;
  durationHours: number;         // 2
  venueId: string;
  hostId: string;
  attendees: JamAttendee[];
  openSeats: Instrument[];       // roles still wanted
  isOpenCall: boolean;           // open call vs private invite
  message?: string;              // the pitch text on an open call
  threadId: string;
  recordingId?: string;
  recapId?: string;
}

interface JamAttendee {
  musicianId: string;
  instrument: Instrument;
  rsvp: 'confirmed'|'pending'|'declined';
  showedUp?: boolean;            // set in the recap
}
```

```ts
interface JamRequest {              // one musician → one musician
  id: string;
  fromId: string;
  toId: string;
  intent: Intent;
  proposedTimes: string[];         // up to 3 suggested slots
  venueId?: string;
  venueSuggestion?: string;
  message: string;                 // "Heard your clip…"
  status: RequestStatus;
  createdAt: string;
  jamId?: string;                  // set once accepted
}

interface OpenCallApplication {
  id: string; jamId: string; applicantId: string;
  instrument: Instrument; status: 'pending'|'accepted'|'declined'; appliedAt: string;
}
```

```ts
interface SessionRecap {
  id: string;
  jamId: string;
  authorId: string;                // each attendee files their own
  attendance: Record<string, boolean>;      // musicianId → showedUp
  vouches: { toId: string; tags: VouchTag[]; note?: string }[];
  publishRecording: boolean;       // requires unanimous consent
  durationLabel: string;           // "1h 42m"
  createdAt: string;
}

interface Vouch {                  // denormalised from recaps for the vouches screen
  id: string; fromId: string; toId: string;
  tags: VouchTag[]; note: string;
  sessionsTogether: number; jamId: string; createdAt: string;
}
```

```ts
interface Thread { id: string; kind: 'jam'|'direct'|'venue'|'band'; jamId?: string;
  participantIds: string[]; lastMessageAt: string; unreadCount: number; }

interface Message { id: string; threadId: string; authorId: string | 'system';
  body: string; sentAt: string; kind: 'text'|'system'; }

interface Notification {
  id: string; kind: 'request_accepted'|'vouch_received'|'open_call_application'
                   |'rank_change'|'band_live';
  actorId?: string; body: string; meta?: Record<string,string>;
  createdAt: string; read: boolean;
}
```

```ts
interface Band {
  id: string; name: string; genre: string; city: string;
  coverUrl: string; followers: number; rating: number; sessionCount: number;
  members: { musicianId: string; role: string; reliabilityPct: number }[];
  openSeats: Instrument[];
  recordings: Recording[];
  battleHistory: { opponentBandId: string; scoreFor: number; scoreAgainst: number;
                   result: 'won'|'lost' }[];
  seasonBadge?: string;            // "Season 4 · Quarter finalist"
}

interface Recording { id: string; title: string; venueName?: string; recordedAt: string;
  durationSec: number; url: string; }
```

```ts
interface LiveSession {
  id: string; bandId?: string; jamId?: string; venueId: string;
  startedAt: string; viewerCount: number;
  rating: number;                   // 4.9
  reputationLabel: string;          // "Legendary"
  streamUrl: string;                // stub in v1
  chat: LiveComment[];
}
interface LiveComment { id: string; handle: string; body: string; sentAt: string; }
```

```ts
interface Season { id: string; number: number; scene: string; city: string;
  startsAt: string; endsAt: string; }

interface LeaderboardEntry {
  rank: number; musicianId: string; points: number;
  delta: number;                    // +3 / -2 / 0 — rendered as ▲ ▼ –
  instrumentLabel: string;          // "Bass" / "Bassist, Indie"
  isCurrentUser: boolean;
}

interface Battle {
  id: string; seasonId: string;
  round: 'quarter'|'semi'|'final';
  bandAId: string; bandBId: string;
  votesA: number; votesB: number;
  status: 'scheduled'|'live'|'finished';
  winnerBandId?: string;
  stageLabel: string;               // "Stage 04 · Grand Ballroom vs. Warehouse 7"
  viewerCount?: number;
}

interface MapZone {
  id: string; name: string;         // "Williamsburg"
  musicianCount: number; liveJamCount: number;
  centroid: { x: number; y: number };  // stylised map coords, not lat/lng
}
```

## Derived values — compute, do not store

| Value | Formula |
|---|---|
| `reliabilityPct` | showedUp-true recaps ÷ total confirmed attendances × 100 |
| `repeatJams` | count of (musician pairs) appearing in ≥2 completed jams |
| `vouchCount` | vouches received |
| `topReliability` badge | `reliabilityPct >= 95 && repeatJams >= 10` |
| Leaderboard `points` | attendance + vouches + battle results — define the weights in one place |
| `distanceMi` | zone centroid to zone centroid, jittered — never exact |

## Fixture requirements

`src/mocks/` must contain enough seed data that **every canonical screen renders fully populated**:
≥12 musicians, 3 venues, 4 jams (one confirmed / one pending / one past / one open call),
2 pending jam requests, 5 threads with 4+ messages each, 5 notifications, 24 vouches on Marcus,
4 bands, 1 live session with 20 chat lines, 1 season with an 8-band bracket, 14 leaderboard rows.
