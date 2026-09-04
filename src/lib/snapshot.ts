import type {
  CompetitionEntry,
  Jam,
  JamRequest,
  LeaderboardEntry,
  LiveComment,
  MapListing,
  Message,
  Musician,
  Notification,
  OpenCallApplication,
  Season,
  SessionRecap,
  Thread,
  Venue,
  Vouch,
  Wallet,
} from '@/types'

/**
 * Everything the client needs to render the app for ONE viewer, produced by
 * src/server/world.ts and consumed by the store provider. Per-viewer fields are baked in
 * server-side: musician distances, thread unread counts, revealed addresses, notification
 * ownership. Requests/threads/messages are filtered to what the viewer is a party to.
 */
export interface WorldSnapshot {
  now: string
  /** Empty string for a guest (no account). Use `isGuest` to branch. */
  viewerId: string
  /** No account: the public world only, and every mutation is gated behind sign-up. */
  isGuest: boolean
  profileComplete: boolean
  musicians: Musician[]
  /** Address-stripped — see Venue.address. */
  venues: Venue[]
  jams: Jam[]
  requests: JamRequest[]
  applications: OpenCallApplication[]
  threads: Thread[]
  messages: Message[]
  recaps: SessionRecap[]
  /** jamId → musicianIds who agreed to publish the recording. */
  consents: Record<string, string[]>
  vouches: Vouch[]
  notifications: Notification[]
  /** The current paid competition and its standings. */
  season: Season
  competitionEntries: CompetitionEntry[]
  /** The viewer's Riff Credits — null for a guest. */
  wallet: Wallet | null
  /** Member-created map listings: all published ones, plus the viewer's own (any status). */
  listings: MapListing[]

  // --- truth engine: every one of these is COUNTED from recorded rows, never authored ---
  /** Per-battle real tallies (seed demo base + real votes) and the viewer's own recorded vote. */
  battleTallies: Record<string, { a: number; b: number; mine?: 'A' | 'B' }>
  /** Real chat rows per live stream/battle id (latest ~50, ascending). Seed lines stay client-side, labelled demo. */
  streamChat: Record<string, LiveComment[]>
  /** Per-session rating aggregate from real ratings, plus the viewer's own. */
  sessionRatings: Record<string, { avg: number; count: number; mine?: number }>
  /** Bands the viewer follows — persisted, not session-local. */
  followedBandIds: string[]
  /** Real RSVP counts per map event, and whether the viewer is going. */
  eventGoing: Record<string, { count: number; mine: boolean }>
  /** Season standings computed from recorded events (show-ups, vouches, hosting, battle votes). */
  leaderboard: LeaderboardEntry[]
}
