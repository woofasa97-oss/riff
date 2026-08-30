import type {
  CompetitionEntry,
  Jam,
  JamRequest,
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
}
