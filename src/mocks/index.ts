/**
 * The only place screens read fixture data from. Selectors are typed and total — a missing id
 * returns undefined rather than throwing, so screens render their empty state instead of a 500.
 *
 * Mutable state (recaps filed in-session, messages sent) lives in src/lib/store.ts. This module
 * is the immutable seed it starts from.
 */
import { bands } from './bands'
import { CURRENT_USER_ID, musicians } from './musicians'
import { jamRequests, jams, openCallApplications } from './jams'
import { notifications } from './notifications'
import { recordingConsents, recordings, sessionRecaps, vouches } from './reputation'
import { messages, threads } from './threads'
import { venues } from './venues'
import { NOW } from './clock'
import type { Band, Jam, JamRequest, Message, Musician, Thread, Venue } from '@/types'

export { NOW } from './clock'
export { CURRENT_USER_ID } from './musicians'
export {
  bands,
  jamRequests,
  jams,
  messages,
  musicians,
  notifications,
  openCallApplications,
  recordingConsents,
  recordings,
  sessionRecaps,
  threads,
  venues,
  vouches,
}

// --- Musicians -------------------------------------------------------------

export const getMusician = (id: string): Musician | undefined => musicians.find((m) => m.id === id)

export const getCurrentUser = (): Musician =>
  musicians.find((m) => m.id === CURRENT_USER_ID) as Musician

/** Everyone except the viewer, nearest first. Zone-level distances only. */
export function listNearbyMusicians(
  options: { withinMi?: number; tonightOnly?: boolean; viewerId?: string } = {},
): Musician[] {
  const { withinMi = Infinity, tonightOnly = false, viewerId = CURRENT_USER_ID } = options
  return musicians
    .filter((m) => m.id !== viewerId)
    .filter((m) => m.distanceMi <= withinMi)
    .filter((m) => !tonightOnly || m.availableTonight)
    .sort((a, b) => a.distanceMi - b.distanceMi)
}

// --- Venues ----------------------------------------------------------------

export const getVenue = (id: string): Venue | undefined => venues.find((v) => v.id === id)

// --- Jams ------------------------------------------------------------------

export const getJam = (id: string): Jam | undefined => jams.find((j) => j.id === id)

export type JamFilter = 'upcoming' | 'past' | 'open-calls'

/** Jams the viewer is on, bucketed the way the Jams tabs bucket them. */
export function listJams(
  filter: JamFilter,
  options: { viewerId?: string; now?: string; source?: Jam[] } = {},
): Jam[] {
  const { viewerId = CURRENT_USER_ID, now = NOW, source = jams } = options
  const mine = source.filter(
    (jam) => !jam.isOpenCall && jam.attendees.some((a) => a.musicianId === viewerId),
  )
  if (filter === 'open-calls') {
    return source.filter((jam) => jam.isOpenCall)
  }
  if (filter === 'past') {
    return mine
      .filter((jam) => jam.status === 'completed' || jam.status === 'cancelled')
      .sort((a, b) => Date.parse(b.startsAt) - Date.parse(a.startsAt))
  }
  return mine
    .filter(
      (jam) =>
        (jam.status === 'confirmed' || jam.status === 'pending' || jam.status === 'live') &&
        Date.parse(jam.startsAt) >= Date.parse(now) - jam.durationHours * 3_600_000,
    )
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
}

/** Incoming requests still awaiting the viewer's answer — the count on the Requests tab. */
export const listIncomingRequests = (viewerId = CURRENT_USER_ID): JamRequest[] =>
  jamRequests
    .filter((r) => r.toId === viewerId && r.status === 'pending')
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))

export const listMyApplications = (viewerId = CURRENT_USER_ID) =>
  openCallApplications.filter((a) => a.applicantId === viewerId)

// --- Messaging -------------------------------------------------------------

export const getThread = (id: string): Thread | undefined => threads.find((t) => t.id === id)

export const listThreads = (viewerId = CURRENT_USER_ID): Thread[] =>
  threads
    .filter((t) => t.participantIds.includes(viewerId))
    .sort((a, b) => Date.parse(b.lastMessageAt) - Date.parse(a.lastMessageAt))

/** Oldest first — the order a conversation reads in. */
export const listMessages = (threadId: string, source: Message[] = messages): Message[] =>
  source
    .filter((m) => m.threadId === threadId)
    .sort((a, b) => Date.parse(a.sentAt) - Date.parse(b.sentAt))

export const getLastMessage = (threadId: string, source: Message[] = messages) => {
  const all = listMessages(threadId, source)
  return all[all.length - 1]
}

// --- Bands & recordings ----------------------------------------------------

export const getBand = (id: string): Band | undefined => bands.find((b) => b.id === id)

export const getRecording = (id: string) => recordings.find((r) => r.id === id)

// NOTE: getLeaderboard() is specified in docs/BUILD-PLAN.md P0-02 but the leaderboard fixtures
// belong to P6-05, which builds the screen that renders them. Deliberately not stubbed here.
