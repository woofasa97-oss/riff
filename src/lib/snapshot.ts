import type {
  Jam,
  JamRequest,
  Message,
  Musician,
  Notification,
  OpenCallApplication,
  SessionRecap,
  Thread,
  Venue,
  Vouch,
} from '@/types'

/**
 * Everything the client needs to render the app for ONE viewer, produced by
 * src/server/world.ts and consumed by the store provider. Per-viewer fields are baked in
 * server-side: musician distances, thread unread counts, revealed addresses, notification
 * ownership. Requests/threads/messages are filtered to what the viewer is a party to.
 */
export interface WorldSnapshot {
  now: string
  viewerId: string
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
}
