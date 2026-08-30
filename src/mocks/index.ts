/**
 * The only place screens read fixture data from. Selectors are typed and total — a missing id
 * returns undefined rather than throwing, so screens render their empty state instead of a 500.
 *
 * Mutable state (recaps filed in-session, messages sent) lives in src/lib/store.ts. This module
 * is the immutable seed it starts from.
 */
import { bands } from './bands'
import { battles } from './battles'
import { liveSessions } from './live'
import { currentSeasonId, leaderboard, seasons } from './seasons'
import { mapZones } from './zones'
import { CURRENT_USER_ID, musicians } from './musicians'
import { jamRequests, jams, openCallApplications } from './jams'
import { notifications } from './notifications'
import { recordingConsents, recordings, sessionRecaps, vouches } from './reputation'
import { messages, threads } from './threads'
import { venues } from './venues'
import { NOW } from './clock'
import type {
  Band,
  Battle,
  Instrument,
  Jam,
  JamRequest,
  LeaderboardEntry,
  LiveSession,
  MapZone,
  Message,
  Musician,
  Season,
  Thread,
  Venue,
} from '@/types'

export { NOW } from './clock'
export { CURRENT_USER_ID } from './musicians'
export {
  bands,
  battles,
  jamRequests,
  leaderboard,
  liveSessions,
  jams,
  messages,
  musicians,
  notifications,
  openCallApplications,
  recordingConsents,
  recordings,
  sessionRecaps,
  mapZones,
  seasons,
  threads,
  venues,
  vouches,
}
export { pointsFromTopTen } from './seasons'
export { MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM } from './zones'
export { ROUND_LABEL, ROUND_ORDER, seasonBadgeFor, voteShare } from './battles'

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

/** Open calls the viewer posted, plus how many people have applied to each. */
export function listMyOpenCalls(viewerId = CURRENT_USER_ID, source: Jam[] = jams) {
  return source
    .filter((jam) => jam.isOpenCall && jam.hostId === viewerId)
    .map((jam) => ({
      jam,
      applicants: openCallApplications.filter((a) => a.jamId === jam.id),
    }))
}

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

// --- Seasons, leaderboard, battles, live ------------------------------------

export const getSeason = (id: string): Season | undefined => seasons.find((s) => s.id === id)

export const getCurrentSeason = (): Season => getSeason(currentSeasonId) as Season

export const getLeaderboard = (): LeaderboardEntry[] =>
  [...leaderboard].sort((a, b) => a.rank - b.rank)

export const getLeaderboardEntry = (musicianId: string): LeaderboardEntry | undefined =>
  leaderboard.find((e) => e.musicianId === musicianId)

export const getBattle = (id: string): Battle | undefined => battles.find((b) => b.id === id)

export type BattleScope = 'local' | 'global' | 'mine'

/** Scope filter behind the bracket's Brooklyn / Global / My matches tabs. */
export function listBattles(scope: BattleScope, viewerId = CURRENT_USER_ID): Battle[] {
  if (scope === 'global') return battles
  if (scope === 'mine') {
    const myBandIds = listBandsFor(viewerId).map((b) => b.id)
    return battles.filter((b) => myBandIds.includes(b.bandAId) || myBandIds.includes(b.bandBId))
  }
  const localIds = bands.filter((b) => b.city.startsWith('Brooklyn')).map((b) => b.id)
  return battles.filter((b) => localIds.includes(b.bandAId) || localIds.includes(b.bandBId))
}

/** The battle currently broadcasting, if any. */
export const getLiveBattle = (): Battle | undefined => battles.find((b) => b.status === 'live')

export const getLiveSession = (id: string): LiveSession | undefined =>
  liveSessions.find((s) => s.id === id)

export const listLiveSessions = (): LiveSession[] => liveSessions

export const listBandsFor = (musicianId: string): Band[] =>
  bands.filter((b) => b.members.some((m) => m.musicianId === musicianId))

/**
 * Who is playing at a venue: whoever is broadcasting from it right now, then the upcoming jams
 * booked into it. Never an exact address — this is a schedule, not a location.
 */
export function listPlayingAtVenue(venueId: string, now = NOW, source: Jam[] = jams) {
  const live = liveSessions
    .filter((s) => s.venueId === venueId)
    .map((s) => ({
      kind: 'live' as const,
      session: s,
      band: s.bandId ? getBand(s.bandId) : undefined,
    }))
  const upcoming = source
    .filter(
      (jam) =>
        jam.venueId === venueId &&
        Date.parse(jam.startsAt) >= Date.parse(now) &&
        (jam.status === 'confirmed' || jam.status === 'pending'),
    )
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
    .map((jam) => ({ kind: 'upcoming' as const, jam, host: getMusician(jam.hostId) }))
  return { live, upcoming }
}

// --- Map zones --------------------------------------------------------------

export const getZone = (id: string): MapZone | undefined => mapZones.find((z) => z.id === id)

/** The zone a musician lives in, joined on the neighbourhood name. */
export const zoneForMusician = (musician: Musician): MapZone | undefined =>
  mapZones.find((z) => z.name === musician.neighborhood)

export interface ZoneFilter {
  /** Only people flagged as free tonight. */
  tonightOnly?: boolean
  /** Only people who play this. Undefined means every instrument. */
  instrument?: Instrument
}

/**
 * Everyone in a zone, minus the viewer. This returns musicians, never positions — the map
 * draws all of them at the zone centre.
 */
export function listMusiciansInZone(
  zoneId: string,
  filter: ZoneFilter = {},
  viewerId = CURRENT_USER_ID,
): Musician[] {
  const zone = getZone(zoneId)
  if (!zone) return []
  return musicians.filter((m) => {
    if (m.id === viewerId) return false
    if (m.neighborhood !== zone.name) return false
    if (filter.tonightOnly && !m.availableTonight) return false
    if (filter.instrument && !m.instruments.includes(filter.instrument)) return false
    return true
  })
}

export interface ZoneSummary {
  zone: MapZone
  musicians: Musician[]
  count: number
  /** Nearest and furthest of the people in this zone, for the "0.7–0.9 miles away" line. */
  distanceRange?: { min: number; max: number }
  /** Live sessions broadcasting from a venue in this zone. */
  liveSessionIds: string[]
  /** How many of each instrument, biggest first. */
  instrumentCounts: { instrument: Instrument; count: number }[]
}

/** Everything the map and its bottom sheet need about one zone. */
export function summariseZone(
  zoneId: string,
  filter: ZoneFilter = {},
  viewerId = CURRENT_USER_ID,
): ZoneSummary | undefined {
  const zone = getZone(zoneId)
  if (!zone) return undefined
  const inZone = listMusiciansInZone(zoneId, filter, viewerId)

  const distances = inZone.map((m) => m.distanceMi).sort((a, b) => a - b)
  const tally = new Map<Instrument, number>()
  for (const m of inZone) {
    for (const instrument of m.instruments) {
      tally.set(instrument, (tally.get(instrument) ?? 0) + 1)
    }
  }

  return {
    zone,
    musicians: inZone,
    count: inZone.length,
    distanceRange:
      distances.length > 0
        ? { min: distances[0], max: distances[distances.length - 1] }
        : undefined,
    liveSessionIds: liveSessions
      .filter((session) => {
        const venue = getVenue(session.venueId)
        return venue ? venue.neighborhood.startsWith(zone.name) : false
      })
      .map((session) => session.id),
    instrumentCounts: [...tally.entries()]
      .map(([instrument, count]) => ({ instrument, count }))
      .sort((a, b) => b.count - a.count),
  }
}

export function summariseAllZones(filter: ZoneFilter = {}, viewerId = CURRENT_USER_ID) {
  return mapZones
    .map((z) => summariseZone(z.id, filter, viewerId))
    .filter((s): s is ZoneSummary => Boolean(s))
}

/** The zone the viewer is in — where the "you" marker goes. */
export function viewerZone(viewerId = CURRENT_USER_ID): MapZone | undefined {
  const me = getMusician(viewerId)
  return me ? zoneForMusician(me) : undefined
}
