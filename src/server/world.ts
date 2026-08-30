/**
 * The server-authoritative world. SERVER-ONLY.
 *
 * Every product rule the client used to enforce for a single mock user is enforced here for
 * real ones — because with real accounts the client is just somebody's browser:
 *  1. The only code path that creates a status:'confirmed' jam is respondToRequest('accept'),
 *     and only the request's recipient can run it.
 *  2. Street addresses never leave the server except as Jam.revealedAddress, computed per
 *     viewer, per jam, at snapshot time.
 *  3. Reputation inputs (recaps, vouches) are validated against confirmed co-attendance.
 *  4. Every mutation authenticates the actor and authorizes the object.
 */
import crypto from 'node:crypto'
import { db, etDateKey } from '@/server/db'
import { canRevealAddress, canVouch } from '@/lib/privacy'
import { getLeaderboardEntry, mapZones } from '@/mocks'
import { SLOTS, WEEKDAYS } from '@/lib/availability'
import type {
  Availability,
  Genre,
  Instrument,
  Intent,
  CompetitionEntry,
  Season,
  Slot,
  Wallet,
  WalletTransaction,
  Weekday,
  Jam,
  JamRequest,
  Message,
  Musician,
  Notification,
  OpenCallApplication,
  RecapVouch,
  SessionRecap,
  Thread,
  Venue,
  Vouch,
} from '@/types'
import type { WorldSnapshot } from '@/lib/snapshot'

/** A rule violation — surfaced to the client as a 4xx, never a crash. */
export class WorldError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 402 | 403 | 404 | 409 = 400,
  ) {
    super(message)
  }
}

const uid = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 12)}`
const nowIso = () => new Date().toISOString()

// --- row mappers ------------------------------------------------------------
function rowToMusician(r: any, nowKey: string): Musician {
  return {
    id: r.id,
    name: r.name,
    handle: r.handle,
    avatarUrl: r.avatar_url,
    instruments: JSON.parse(r.instruments),
    genres: JSON.parse(r.genres),
    intent: r.intent,
    neighborhood: r.neighborhood,
    city: r.city,
    distanceMi: 0, // filled per viewer below
    travelRadiusMi: r.travel_radius_mi,
    bio: r.bio ?? undefined,
    clip: r.clip ? JSON.parse(r.clip) : undefined,
    availability: JSON.parse(r.availability),
    // "Available tonight" expires at local midnight for real users (they must re-toggle daily).
    // Seed musicians are the demo crew that keeps the scene populated — their flag is sticky, so
    // "who's free tonight" never empties out the day after a deploy.
    availableTonight:
      Boolean(r.available_tonight) && (Boolean(r.is_seed) || r.tonight_set_on === nowKey),
    verified: Boolean(r.verified),
    jamsHosted: r.jams_hosted,
    baseline: JSON.parse(r.baseline),
  }
}

function rowToVenue(r: any, withAddress: boolean): Venue {
  return {
    id: r.id,
    name: r.name,
    kind: r.kind,
    neighborhood: r.neighborhood,
    ...(withAddress ? { address: r.address } : {}),
    city: r.city,
    distanceMi: r.distance_mi,
    photoUrl: r.photo_url,
    rating: r.rating,
    jamsHosted: r.jams_hosted,
    hourlyRateUsd: r.hourly_rate_usd,
    amenities: JSON.parse(r.amenities),
    slots: JSON.parse(r.slots),
    liveNow: Boolean(r.live_now),
  }
}

function rowToJam(r: any): Jam {
  return {
    id: r.id,
    title: r.title,
    intent: r.intent,
    status: r.status,
    startsAt: r.starts_at,
    durationHours: r.duration_hours,
    actualDurationMin: r.actual_duration_min ?? undefined,
    venueId: r.venue_id,
    hostId: r.host_id,
    attendees: JSON.parse(r.attendees),
    openSeats: JSON.parse(r.open_seats),
    isOpenCall: Boolean(r.is_open_call),
    postedAt: r.posted_at ?? undefined,
    message: r.message ?? undefined,
    threadId: r.thread_id,
    recordingId: r.recording_id ?? undefined,
    recapId: r.recap_id ?? undefined,
  }
}

function rowToRequest(r: any): JamRequest {
  return {
    id: r.id,
    fromId: r.from_id,
    toId: r.to_id,
    intent: r.intent,
    proposedTimes: JSON.parse(r.proposed_times),
    venueId: r.venue_id ?? undefined,
    venueSuggestion: r.venue_suggestion ?? undefined,
    message: r.message,
    status: r.status,
    counterTimes: r.counter_times ? JSON.parse(r.counter_times) : undefined,
    jamId: r.jam_id ?? undefined,
    createdAt: r.created_at,
  }
}

function rowToThread(r: any): Thread {
  return {
    id: r.id,
    kind: r.kind,
    jamId: r.jam_id ?? undefined,
    requestId: r.request_id ?? undefined,
    venueId: r.venue_id ?? undefined,
    bandId: r.band_id ?? undefined,
    participantIds: JSON.parse(r.participant_ids),
    lastMessageAt: r.last_message_at,
    unreadCount: 0, // filled per viewer
  }
}

// --- geography --------------------------------------------------------------
/**
 * Zone-centroid distance with a deterministic jitter — docs/DATA-MODEL.md's formula, now
 * computed per viewer pair. Nobody has coordinates; neighbourhoods do.
 */
function zoneDistanceMi(fromNeighborhood: string, toNeighborhood: string, pairKey: string): number {
  const a = mapZones.find((z) => z.name === fromNeighborhood)
  const b = mapZones.find((z) => z.name === toNeighborhood)
  const jitterSeed = crypto.createHash('sha1').update(pairKey).digest()[0] / 255
  if (!a || !b) return Math.round((3 + jitterSeed * 4) * 10) / 10
  if (a.id === b.id) return Math.round((0.3 + jitterSeed * 0.6) * 10) / 10
  const R = 3958.8
  const dLat = ((b.center.lat - a.center.lat) * Math.PI) / 180
  const dLng = ((b.center.lng - a.center.lng) * Math.PI) / 180
  const la = (a.center.lat * Math.PI) / 180
  const lb = (b.center.lat * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la) * Math.cos(lb) * Math.sin(dLng / 2) ** 2
  const miles = 2 * R * Math.asin(Math.sqrt(h))
  return Math.round((miles + (jitterSeed - 0.5) * 0.3) * 10) / 10
}

// --- lazy time passage ------------------------------------------------------
/** Confirmed jams whose window has passed become completed, which is what opens the recap. */
function settleFinishedJams(now: string) {
  const d = db()
  const rows = d
    .prepare(`SELECT id, starts_at, duration_hours FROM jams WHERE status IN ('confirmed','live')`)
    .all() as { id: string; starts_at: string; duration_hours: number }[]
  const done = rows.filter(
    (r) => Date.parse(r.starts_at) + r.duration_hours * 3_600_000 < Date.parse(now),
  )
  if (done.length === 0) return
  const upd = d.prepare(
    `UPDATE jams SET status = 'completed', actual_duration_min = COALESCE(actual_duration_min, ?) WHERE id = ?`,
  )
  for (const r of done) upd.run(Math.round(r.duration_hours * 60), r.id)
}

// --- snapshot ---------------------------------------------------------------
export function buildSnapshot(viewerId: string): WorldSnapshot {
  const d = db()
  const now = nowIso()
  const nowKey = etDateKey(now)
  settleFinishedJams(now)

  const viewerRow = d.prepare(`SELECT * FROM musicians WHERE id = ?`).get(viewerId) as
    Record<string, unknown> | undefined
  if (!viewerRow) throw new WorldError('Account not found', 404)
  const viewer = rowToMusician(viewerRow, nowKey)

  const musicians = (d.prepare(`SELECT * FROM musicians`).all() as Record<string, unknown>[])
    .map((r) => rowToMusician(r, nowKey))
    .map((m) => ({
      ...m,
      distanceMi:
        m.id === viewerId
          ? 0
          : zoneDistanceMi(viewer.neighborhood, m.neighborhood, [viewerId, m.id].sort().join('|')),
    }))

  const venues = (d.prepare(`SELECT * FROM venues`).all() as Record<string, unknown>[]).map((r) =>
    rowToVenue(r, false),
  )
  const addressByVenue = new Map(
    (d.prepare(`SELECT id, address FROM venues`).all() as { id: string; address: string }[]).map(
      (r) => [r.id, r.address],
    ),
  )

  // Jams the viewer may know about: their own, anything public (open calls), and completed
  // history (it backs everyone's public reputation and profile). Strangers' private upcoming
  // jams never leave the server.
  const jams = (d.prepare(`SELECT * FROM jams`).all() as Record<string, unknown>[])
    .map(rowToJam)
    .filter(
      (j) =>
        j.isOpenCall ||
        j.status === 'completed' ||
        j.hostId === viewerId ||
        j.attendees.some((a) => a.musicianId === viewerId),
    )
    .map((j) =>
      canRevealAddress(j, viewerId) ? { ...j, revealedAddress: addressByVenue.get(j.venueId) } : j,
    )

  const requests = (
    d
      .prepare(`SELECT * FROM requests WHERE from_id = ? OR to_id = ?`)
      .all(viewerId, viewerId) as Record<string, unknown>[]
  ).map(rowToRequest)

  const applications = (
    d
      .prepare(
        `SELECT * FROM applications WHERE applicant_id = ?
         OR jam_id IN (SELECT id FROM jams WHERE host_id = ?)`,
      )
      .all(viewerId, viewerId) as Record<string, unknown>[]
  ).map((r: any): OpenCallApplication => ({
    id: r.id,
    jamId: r.jam_id,
    applicantId: r.applicant_id,
    instrument: r.instrument,
    status: r.status,
    appliedAt: r.applied_at,
  }))

  const threadRows = (d.prepare(`SELECT * FROM threads`).all() as Record<string, unknown>[])
    .map(rowToThread)
    .filter((t) => t.participantIds.includes(viewerId))
  const reads = new Map(
    (
      d
        .prepare(`SELECT thread_id, last_read_at FROM thread_reads WHERE user_id = ?`)
        .all(viewerId) as { thread_id: string; last_read_at: string }[]
    ).map((r) => [r.thread_id, r.last_read_at]),
  )
  const unreadStmt = d.prepare(
    `SELECT COUNT(*) AS n FROM messages WHERE thread_id = ? AND sent_at > ? AND author_id != ?`,
  )
  const threads = threadRows.map((t) => ({
    ...t,
    unreadCount: (
      unreadStmt.get(t.id, reads.get(t.id) ?? '1970-01-01T00:00:00Z', viewerId) as { n: number }
    ).n,
  }))

  const threadIds = new Set(threads.map((t) => t.id))
  const messages = (d.prepare(`SELECT * FROM messages ORDER BY sent_at`).all() as any[])
    .filter((m) => threadIds.has(m.thread_id))
    .map((m): Message => ({
      id: m.id,
      threadId: m.thread_id,
      authorId: m.author_id,
      body: m.body,
      sentAt: m.sent_at,
      kind: m.kind,
    }))

  const recaps = (d.prepare(`SELECT * FROM recaps`).all() as any[]).map((r): SessionRecap => ({
    id: r.id,
    jamId: r.jam_id,
    authorId: r.author_id,
    attendance: JSON.parse(r.attendance),
    vouches: JSON.parse(r.vouches),
    publishRecording: Boolean(r.publish_recording),
    durationLabel: r.duration_label,
    createdAt: r.created_at,
  }))

  // Consent rows carry a private jam's id and its confirmed attendees, so scope them to jams
  // this viewer can already see — otherwise they disclose the existence and membership of
  // confirmed private jams the viewer has no part in.
  const visibleJamIds = new Set(jams.map((j) => j.id))
  const consents: Record<string, string[]> = {}
  for (const r of d.prepare(`SELECT jam_id, musician_id FROM consents`).all() as {
    jam_id: string
    musician_id: string
  }[]) {
    if (!visibleJamIds.has(r.jam_id)) continue
    ;(consents[r.jam_id] ??= []).push(r.musician_id)
  }

  const vouches = (d.prepare(`SELECT * FROM vouches`).all() as any[]).map((v): Vouch => ({
    id: v.id,
    fromId: v.from_id,
    toId: v.to_id,
    tags: JSON.parse(v.tags),
    note: v.note,
    sessionsTogether: v.sessions_together,
    jamId: v.jam_id,
    createdAt: v.created_at,
  }))

  const notifications = (
    d
      .prepare(`SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 100`)
      .all(viewerId) as any[]
  ).map((n): Notification => ({
    id: n.id,
    kind: n.kind,
    actorId: n.actor_id ?? undefined,
    body: n.body,
    meta: n.meta ? JSON.parse(n.meta) : undefined,
    createdAt: n.created_at,
    read: Boolean(n.read),
  }))

  const profileComplete = Boolean((viewerRow as { profile_complete?: number }).profile_complete)

  const season = currentSeason(now)
  const competitionEntries = (
    d
      .prepare(`SELECT * FROM competition_entries WHERE season_id = ? ORDER BY entered_at`)
      .all(season.id) as Record<string, unknown>[]
  ).map(rowToEntry)

  return {
    now,
    viewerId,
    isGuest: false,
    profileComplete,
    musicians,
    venues,
    jams,
    requests,
    applications,
    threads,
    messages,
    recaps,
    consents,
    vouches,
    notifications,
    season,
    competitionEntries,
    wallet: walletFor(viewerId),
  }
}

/**
 * The public world for a viewer with no account. Everything browsable — musicians, open
 * calls, completed history, the competition, the map — with zero personal data and no
 * revealed addresses. Distances are measured from the scene centre, since a guest has no
 * home neighbourhood. Every mutation is refused server-side (guests never reach a mutation:
 * the API requires a session for POST), so this is read-only by construction.
 */
export function buildGuestSnapshot(): WorldSnapshot {
  const d = db()
  const now = nowIso()
  const nowKey = etDateKey(now)
  settleFinishedJams(now)

  const anchor = mapZones.find((z) => z.name === 'Williamsburg') ?? mapZones[0]
  const musicians = (d.prepare(`SELECT * FROM musicians`).all() as Record<string, unknown>[])
    .map((r) => rowToMusician(r, nowKey))
    .filter((m) => m.instruments.length > 0)
    .map((m) => ({
      ...m,
      distanceMi: zoneDistanceMi(anchor.name, m.neighborhood, `guest|${m.id}`),
    }))

  const venues = (d.prepare(`SELECT * FROM venues`).all() as Record<string, unknown>[]).map((r) =>
    rowToVenue(r, false),
  )

  // Only public jams: open calls and completed history. No private upcoming jams, ever.
  const jams = (d.prepare(`SELECT * FROM jams`).all() as Record<string, unknown>[])
    .map(rowToJam)
    .filter((j) => j.isOpenCall || j.status === 'completed')

  const recaps = (d.prepare(`SELECT * FROM recaps`).all() as Record<string, unknown>[]).map(
    (r) => ({
      id: r.id as string,
      jamId: r.jam_id as string,
      authorId: r.author_id as string,
      attendance: JSON.parse(r.attendance as string),
      vouches: JSON.parse(r.vouches as string),
      publishRecording: Boolean(r.publish_recording),
      durationLabel: r.duration_label as string,
      createdAt: r.created_at as string,
    }),
  )
  const visibleJamIds = new Set(jams.map((j) => j.id))
  const consents: Record<string, string[]> = {}
  for (const r of d.prepare(`SELECT jam_id, musician_id FROM consents`).all() as {
    jam_id: string
    musician_id: string
  }[]) {
    if (!visibleJamIds.has(r.jam_id)) continue
    ;(consents[r.jam_id] ??= []).push(r.musician_id)
  }
  const vouches = (d.prepare(`SELECT * FROM vouches`).all() as Record<string, unknown>[]).map(
    (v) => ({
      id: v.id as string,
      fromId: v.from_id as string,
      toId: v.to_id as string,
      tags: JSON.parse(v.tags as string),
      note: v.note as string,
      sessionsTogether: v.sessions_together as number,
      jamId: v.jam_id as string,
      createdAt: v.created_at as string,
    }),
  )

  const season = currentSeason(now)
  const competitionEntries = (
    d
      .prepare(`SELECT * FROM competition_entries WHERE season_id = ? ORDER BY entered_at`)
      .all(season.id) as Record<string, unknown>[]
  ).map(rowToEntry)

  return {
    now,
    viewerId: '',
    isGuest: true,
    profileComplete: false,
    musicians,
    venues,
    jams,
    requests: [],
    applications: [],
    threads: [],
    messages: [],
    recaps,
    consents,
    vouches,
    notifications: [],
    season,
    competitionEntries,
    wallet: null,
  }
}

// ---------------------------------------------------------------------------
// Competition & wallet — reads
// ---------------------------------------------------------------------------

function rowToSeason(r: Record<string, unknown>): Season {
  return {
    id: r.id as string,
    number: r.number as number,
    scene: r.scene as string,
    city: r.city as string,
    startsAt: r.starts_at as string,
    registrationClosesAt: r.registration_closes_at as string,
    endsAt: r.ends_at as string,
    status: r.status as Season['status'],
    entryFeeCredits: r.entry_fee_credits as number,
    basePoolCredits: r.base_pool_credits as number,
    payoutSplit: JSON.parse(r.payout_split as string),
  }
}

function rowToEntry(r: Record<string, unknown>): CompetitionEntry {
  return {
    id: r.id as string,
    seasonId: r.season_id as string,
    competitorId: r.competitor_id as string,
    competitorName: r.competitor_name as string,
    feePaidCredits: r.fee_paid_credits as number,
    enteredAt: r.entered_at as string,
    finalRank: (r.final_rank as number) ?? undefined,
    payoutCredits: (r.payout_credits as number) ?? undefined,
  }
}

/** The one active season. Its status advances lazily as its deadlines pass. */
function currentSeason(now: string): Season {
  const d = db()
  const row = d.prepare(`SELECT * FROM seasons ORDER BY number DESC LIMIT 1`).get() as
    Record<string, unknown> | undefined
  if (!row) throw new WorldError('No season configured', 404)
  let season = rowToSeason(row)

  // Registration → live when it closes; live → finished (and settle) when it ends.
  if (
    season.status === 'registration' &&
    Date.parse(now) >= Date.parse(season.registrationClosesAt)
  ) {
    d.prepare(`UPDATE seasons SET status = 'live' WHERE id = ?`).run(season.id)
    season = { ...season, status: 'live' }
  }
  if (season.status !== 'finished' && Date.parse(now) >= Date.parse(season.endsAt)) {
    settleSeason(season)
    season = {
      ...rowToSeason(
        d.prepare(`SELECT * FROM seasons WHERE id = ?`).get(season.id) as Record<string, unknown>,
      ),
    }
  }
  return season
}

export function prizePoolCredits(season: Season): number {
  const d = db()
  const fees = (
    d
      .prepare(
        `SELECT COALESCE(SUM(fee_paid_credits), 0) AS s FROM competition_entries WHERE season_id = ?`,
      )
      .get(season.id) as { s: number }
  ).s
  return season.basePoolCredits + fees
}

function walletFor(userId: string): Wallet {
  const d = db()
  const row = d.prepare(`SELECT balance_credits FROM wallets WHERE user_id = ?`).get(userId) as
    { balance_credits: number } | undefined
  const transactions = (
    d
      .prepare(`SELECT * FROM wallet_txns WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`)
      .all(userId) as Record<string, unknown>[]
  ).map((t): WalletTransaction => ({
    id: t.id as string,
    amountCredits: t.amount_credits as number,
    kind: t.kind as WalletTransaction['kind'],
    memo: t.memo as string,
    createdAt: t.created_at as string,
  }))
  return { balanceCredits: row?.balance_credits ?? 0, transactions }
}

/**
 * End of season: rank entrants and split the pool by payoutSplit, crediting the winners'
 * wallets. Idempotent — guarded by the season already being 'finished'. Real competitors
 * (seed acts) have no wallet, so their winnings are recorded on the entry but not paid out.
 */
function settleSeason(season: Season) {
  const d = db()
  const fresh = d.prepare(`SELECT status FROM seasons WHERE id = ?`).get(season.id) as {
    status: string
  }
  if (fresh.status === 'finished') return

  const entries = (
    d
      .prepare(`SELECT * FROM competition_entries WHERE season_id = ? ORDER BY entered_at`)
      .all(season.id) as Record<string, unknown>[]
  ).map(rowToEntry)
  const pool = prizePoolCredits(season)

  // Rank by the SAME leaderboard players can see, so the settlement can't contradict it — highest
  // points win, ties broken by who entered first (entries is already ordered by entered_at). An
  // entrant with no leaderboard standing (a brand-new real account) scores 0 and places last.
  const ranked = entries
    .map((entry, i) => ({
      entry,
      points: getLeaderboardEntry(entry.competitorId)?.points ?? 0,
      order: i,
    }))
    .sort((a, b) => b.points - a.points || a.order - b.order)
    .map((x) => x.entry)

  const tx = d.transaction(() => {
    ranked.forEach((entry, i) => {
      const rank = i + 1
      const share = season.payoutSplit[i] ?? 0
      const payout = Math.round(pool * share)
      d.prepare(
        `UPDATE competition_entries SET final_rank = ?, payout_credits = ? WHERE id = ?`,
      ).run(rank, payout, entry.id)
      // Only real accounts have wallets to pay into.
      if (
        payout > 0 &&
        d.prepare(`SELECT 1 FROM wallets WHERE user_id = ?`).get(entry.competitorId)
      ) {
        adjustWallet(
          entry.competitorId,
          payout,
          'prize_payout',
          `Season ${season.number} — placed #${rank}`,
        )
      }
    })
    d.prepare(`UPDATE seasons SET status = 'finished' WHERE id = ?`).run(season.id)
  })
  tx()
}

function adjustWallet(
  userId: string,
  delta: number,
  kind: WalletTransaction['kind'],
  memo: string,
) {
  const d = db()
  d.prepare(`UPDATE wallets SET balance_credits = balance_credits + ? WHERE user_id = ?`).run(
    delta,
    userId,
  )
  d.prepare(`INSERT INTO wallet_txns VALUES (?,?,?,?,?,?)`).run(
    uid('wtx'),
    userId,
    delta,
    kind,
    memo,
    nowIso(),
  )
}

// ---------------------------------------------------------------------------
// Mutations — every one authenticates the actor and authorizes the object.
// ---------------------------------------------------------------------------

function musicianExists(id: string): boolean {
  return Boolean(db().prepare(`SELECT 1 FROM musicians WHERE id = ?`).get(id))
}

function getJamRow(id: string): Jam | undefined {
  const r = db().prepare(`SELECT * FROM jams WHERE id = ?`).get(id) as
    Record<string, unknown> | undefined
  return r ? rowToJam(r) : undefined
}

function getThreadRow(id: string): Thread | undefined {
  const r = db().prepare(`SELECT * FROM threads WHERE id = ?`).get(id) as
    Record<string, unknown> | undefined
  return r ? rowToThread(r) : undefined
}

function insertThread(t: Omit<Thread, 'unreadCount'>) {
  db()
    .prepare(`INSERT INTO threads VALUES (?,?,?,?,?,?,?,?)`)
    .run(
      t.id,
      t.kind,
      t.jamId ?? null,
      t.requestId ?? null,
      t.venueId ?? null,
      t.bandId ?? null,
      JSON.stringify(t.participantIds),
      t.lastMessageAt,
    )
}

function insertMessage(m: Message) {
  db()
    .prepare(`INSERT INTO messages VALUES (?,?,?,?,?,?)`)
    .run(m.id, m.threadId, m.authorId, m.body, m.sentAt, m.kind)
  db().prepare(`UPDATE threads SET last_message_at = ? WHERE id = ?`).run(m.sentAt, m.threadId)
}

function touchRead(threadId: string, userId: string, at: string) {
  db()
    .prepare(
      `INSERT INTO thread_reads VALUES (?,?,?)
       ON CONFLICT(thread_id, user_id) DO UPDATE SET last_read_at = excluded.last_read_at`,
    )
    .run(threadId, userId, at)
}

function notify(
  userId: string,
  kind: Notification['kind'],
  body: string,
  actorId?: string,
  meta?: Record<string, string>,
) {
  // Seed musicians have no inbox to read — writing rows for them is just noise.
  const isReal = db().prepare(`SELECT 1 FROM users WHERE id = ?`).get(userId)
  if (!isReal) return
  db()
    .prepare(`INSERT INTO notifications VALUES (?,?,?,?,?,?,?,0)`)
    .run(
      uid('ntf'),
      userId,
      kind,
      actorId ?? null,
      body,
      meta ? JSON.stringify(meta) : null,
      nowIso(),
    )
}

function firstName(id: string): string {
  const r = db().prepare(`SELECT name FROM musicians WHERE id = ?`).get(id) as
    { name: string } | undefined
  return r ? r.name.split(' ')[0] : 'Someone'
}

const INSTRUMENTS: Instrument[] = [
  'drums',
  'bass',
  'keys',
  'guitar',
  'vocals',
  'sax',
  'synth',
  'percussion',
]
const GENRES: Genre[] = ['jazz', 'neo-soul', 'fusion', 'indie', 'rock', 'funk', 'hip-hop']
const INTENTS: Intent[] = ['casual', 'serious', 'gigging']

function assertEnum<T extends string>(value: unknown, allowed: readonly T[], label: string): T {
  if (typeof value !== 'string' || !allowed.includes(value as T))
    throw new WorldError(`Invalid ${label}`)
  return value as T
}

// --- profile ---------------------------------------------------------------
export interface ProfileInput {
  neighborhood?: string
  travelRadiusMi?: number
  instruments?: Instrument[]
  genres?: Genre[]
  intent?: Intent
  availability?: Availability
  availableTonight?: boolean
  clip?: { durationSec: number; waveform: number[] } | null
  bio?: string
}

export function updateProfile(viewerId: string, input: ProfileInput) {
  const d = db()
  const row = d.prepare(`SELECT * FROM musicians WHERE id = ? AND is_seed = 0`).get(viewerId) as
    Record<string, unknown> | undefined
  if (!row) throw new WorldError('Only your own profile can change', 403)

  const sets: string[] = []
  const args: unknown[] = []
  const push = (col: string, val: unknown) => {
    sets.push(`${col} = ?`)
    args.push(val)
  }

  if (input.neighborhood !== undefined) {
    if (!mapZones.some((z) => z.name === input.neighborhood))
      throw new WorldError('Pick a neighbourhood from the list')
    push('neighborhood', input.neighborhood)
    const zone = mapZones.find((z) => z.name === input.neighborhood)
    push('city', `${zone?.borough ?? 'Brooklyn'}, NY`)
  }
  if (input.travelRadiusMi !== undefined) {
    const mi = Number(input.travelRadiusMi)
    if (!Number.isFinite(mi) || mi < 1 || mi > 10) throw new WorldError('Radius is 1–10 miles')
    push('travel_radius_mi', Math.round(mi))
  }
  if (input.instruments !== undefined) {
    if (!Array.isArray(input.instruments) || input.instruments.length === 0)
      throw new WorldError('Pick at least one instrument')
    push(
      'instruments',
      JSON.stringify(
        [...new Set(input.instruments)]
          .slice(0, INSTRUMENTS.length)
          .map((i) => assertEnum(i, INSTRUMENTS, 'instrument')),
      ),
    )
  }
  if (input.genres !== undefined) {
    if (!Array.isArray(input.genres)) throw new WorldError('Bad genres')
    push(
      'genres',
      JSON.stringify(
        [...new Set(input.genres)]
          .slice(0, GENRES.length)
          .map((g) => assertEnum(g, GENRES, 'genre')),
      ),
    )
  }
  if (input.intent !== undefined) push('intent', assertEnum(input.intent, INTENTS, 'intent'))
  if (input.availability !== undefined) {
    const raw = input.availability?.grid
    if (!raw || typeof raw !== 'object') throw new WorldError('Bad availability')
    // Rebuild the grid from the fixed 7×3 shape rather than trusting the payload — otherwise
    // an arbitrary multi-MB object is stored verbatim and re-serialised into every viewer's
    // snapshot. Only the known weekdays survive, each with at most the three real slots.
    const grid: Record<Weekday, Slot[]> = {
      mon: [],
      tue: [],
      wed: [],
      thu: [],
      fri: [],
      sat: [],
      sun: [],
    }
    for (const day of WEEKDAYS) {
      const cell = (raw as Record<string, unknown>)[day]
      if (!Array.isArray(cell)) continue
      grid[day] = SLOTS.filter((slot) => cell.includes(slot))
    }
    push(
      'availability',
      JSON.stringify({ grid, note: String(input.availability.note ?? '').slice(0, 140) }),
    )
  }
  if (input.availableTonight !== undefined) {
    push('available_tonight', input.availableTonight ? 1 : 0)
    push('tonight_set_on', input.availableTonight ? etDateKey(nowIso()) : null)
  }
  if (input.clip !== undefined) {
    if (input.clip === null) push('clip', null)
    else {
      const durationSec = Math.min(24, Math.max(1, Number(input.clip.durationSec) || 0))
      const waveform = Array.isArray(input.clip.waveform)
        ? input.clip.waveform.slice(0, 64).map((n) => Math.min(1, Math.max(0, Number(n) || 0)))
        : []
      push(
        'clip',
        JSON.stringify({
          id: `clip-${viewerId}`,
          url: `/mock/clips/clip-${viewerId}.m4a`,
          durationSec,
          waveform,
          recordedAt: nowIso(),
        }),
      )
    }
  }
  if (input.bio !== undefined) push('bio', String(input.bio).slice(0, 200))

  if (sets.length === 0) return
  d.prepare(`UPDATE musicians SET ${sets.join(', ')} WHERE id = ?`).run(...args, viewerId)

  // Complete = enough profile to be discoverable: a patch and at least one instrument.
  const fresh = d
    .prepare(`SELECT neighborhood, instruments FROM musicians WHERE id = ?`)
    .get(viewerId) as { neighborhood: string; instruments: string }
  const complete = fresh.neighborhood.length > 0 && JSON.parse(fresh.instruments).length > 0
  d.prepare(`UPDATE musicians SET profile_complete = ? WHERE id = ?`).run(
    complete ? 1 : 0,
    viewerId,
  )
}

// --- requests ---------------------------------------------------------------
export function sendJamRequest(
  viewerId: string,
  input: {
    toId: string
    intent: Intent
    proposedTimes: string[]
    venueId?: string
    venueSuggestion?: string
    message: string
  },
): JamRequest {
  const d = db()
  if (input.toId === viewerId) throw new WorldError('You cannot request yourself')
  if (!musicianExists(input.toId)) throw new WorldError('Musician not found', 404)
  const intent = assertEnum(input.intent, INTENTS, 'intent')
  const times = (Array.isArray(input.proposedTimes) ? input.proposedTimes : [])
    .slice(0, 3)
    .filter((t) => typeof t === 'string' && Number.isFinite(Date.parse(t)))
  if (times.length === 0) throw new WorldError('Suggest at least one time')
  if (input.venueId && !d.prepare(`SELECT 1 FROM venues WHERE id = ?`).get(input.venueId))
    throw new WorldError('Venue not found', 404)
  const message = String(input.message ?? '')
    .trim()
    .slice(0, 500)
  if (!message) throw new WorldError('Say something — a request is a conversation opener')

  const at = nowIso()
  const request: JamRequest = {
    id: uid('req'),
    fromId: viewerId,
    toId: input.toId,
    intent,
    proposedTimes: times,
    venueId: input.venueId,
    venueSuggestion: input.venueSuggestion?.slice(0, 120) || undefined,
    message,
    status: 'pending',
    createdAt: at,
  }

  const existing = (d.prepare(`SELECT * FROM threads WHERE kind = 'direct'`).all() as any[])
    .map(rowToThread)
    .find((t) => t.participantIds.includes(viewerId) && t.participantIds.includes(input.toId))
  const threadId = existing?.id ?? uid('thr')

  const tx = d.transaction(() => {
    d.prepare(`INSERT INTO requests VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      request.id,
      request.fromId,
      request.toId,
      request.intent,
      JSON.stringify(request.proposedTimes),
      request.venueId ?? null,
      request.venueSuggestion ?? null,
      request.message,
      request.status,
      null,
      null,
      at,
    )
    if (existing) {
      d.prepare(`UPDATE threads SET request_id = ?, last_message_at = ? WHERE id = ?`).run(
        request.id,
        at,
        threadId,
      )
    } else {
      insertThread({
        id: threadId,
        kind: 'direct',
        requestId: request.id,
        participantIds: [viewerId, input.toId],
        lastMessageAt: at,
      })
    }
    insertMessage({
      id: uid('msg'),
      threadId,
      authorId: viewerId,
      body: message,
      sentAt: at,
      kind: 'text',
    })
    touchRead(threadId, viewerId, at)
    notify(input.toId, 'request_received', 'sent you a jam request', viewerId, {
      requestId: request.id,
    })
  })
  tx()

  // A request to a seed (demo) musician would otherwise sit pending forever — nobody's home to
  // answer. So the demo crew accepts, turning it into a real confirmed jam the requester can carry
  // all the way through to a recap. This is scripted demo behaviour, consistent with those
  // accounts being labelled the "Riff crew"; it never fires for a request to a real user.
  if (isSeedMusician(input.toId)) autoAcceptBySeed(request)
  return request
}

/** Seed musicians have no login (no users row) — that is exactly what makes them the demo crew. */
function isSeedMusician(id: string): boolean {
  const r = db().prepare(`SELECT is_seed FROM musicians WHERE id = ?`).get(id) as
    | { is_seed: number }
    | undefined
  return Boolean(r?.is_seed)
}

/**
 * The demo-crew accept. Mirrors the confirmed-jam creation in respondToRequest, but run on behalf
 * of a seed recipient so a solo real user can experience the full loop. Uses the first FUTURE
 * proposed time (so the jam does not instantly settle to completed) and the suggested venue, or a
 * default. If no proposed time is still in the future, it leaves the request pending.
 */
function autoAcceptBySeed(request: JamRequest) {
  const d = db()
  const now = nowIso()
  const startsAt = request.proposedTimes.find((t) => Date.parse(t) > Date.parse(now))
  if (!startsAt) return
  const venueId =
    request.venueId ??
    (d.prepare(`SELECT id FROM venues ORDER BY rowid LIMIT 1`).get() as { id: string } | undefined)
      ?.id
  if (!venueId) return

  const fromRow = d.prepare(`SELECT instruments FROM musicians WHERE id = ?`).get(request.fromId) as
    | { instruments: string }
    | undefined
  const toRow = d.prepare(`SELECT instruments FROM musicians WHERE id = ?`).get(request.toId) as
    | { instruments: string }
    | undefined
  const at = nowIso()
  const jamId = uid('jam')
  const threadId = uid('thr')
  const attendees = [
    {
      musicianId: request.fromId,
      instrument: (JSON.parse(fromRow?.instruments ?? '["guitar"]')[0] ?? 'guitar') as Instrument,
      rsvp: 'confirmed' as const,
    },
    {
      musicianId: request.toId,
      instrument: (JSON.parse(toRow?.instruments ?? '["drums"]')[0] ?? 'drums') as Instrument,
      rsvp: 'confirmed' as const,
    },
  ]
  const tx = d.transaction(() => {
    d.prepare(`INSERT INTO jams VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      jamId,
      `${firstName(request.fromId)} & ${firstName(request.toId)}`,
      request.intent,
      'confirmed',
      startsAt,
      2,
      null,
      venueId,
      request.fromId,
      JSON.stringify(attendees),
      '[]',
      0,
      null,
      null,
      threadId,
      null,
      null,
    )
    insertThread({
      id: threadId,
      kind: 'jam',
      jamId,
      participantIds: [request.fromId, request.toId],
      lastMessageAt: at,
    })
    insertMessage({
      id: uid('msg'),
      threadId,
      authorId: 'system',
      body: `${firstName(request.toId)} accepted. The jam is on — say hi and sort the details.`,
      sentAt: at,
      kind: 'system',
    })
    touchRead(threadId, request.fromId, at)
    d.prepare(`UPDATE requests SET status = 'accepted', jam_id = ? WHERE id = ?`).run(
      jamId,
      request.id,
    )
    notify(request.fromId, 'request_accepted', 'accepted your jam request', request.toId, { jamId })
  })
  tx()
}

export function respondToRequest(
  viewerId: string,
  input:
    | { requestId: string; action: 'accept'; startsAt: string; venueId: string }
    | { requestId: string; action: 'decline' }
    | { requestId: string; action: 'counter'; counterTimes: string[]; note?: string },
): { jamId?: string } {
  const d = db()
  const row = d.prepare(`SELECT * FROM requests WHERE id = ?`).get(input.requestId) as
    Record<string, unknown> | undefined
  if (!row) throw new WorldError('Request not found', 404)
  const request = rowToRequest(row)
  // Rule 1's sharp edge: only the person the request was sent TO can settle it.
  if (request.toId !== viewerId) throw new WorldError('This request is not yours to answer', 403)
  if (request.status !== 'pending') throw new WorldError('Already answered', 409)

  const at = nowIso()

  function directThread(): string {
    const existing = (d.prepare(`SELECT * FROM threads WHERE kind = 'direct'`).all() as any[])
      .map(rowToThread)
      .find(
        (t) => t.participantIds.includes(request.fromId) && t.participantIds.includes(request.toId),
      )
    if (existing) return existing.id
    const id = uid('thr')
    insertThread({
      id,
      kind: 'direct',
      requestId: request.id,
      participantIds: [request.fromId, request.toId],
      lastMessageAt: at,
    })
    return id
  }

  if (input.action === 'accept') {
    if (!Number.isFinite(Date.parse(input.startsAt))) throw new WorldError('Pick a time')
    // A confirmed jam must be scheduled in the future, and for one of the times actually
    // proposed. Without this, a backdated startsAt is auto-completed on the next snapshot
    // (settleFinishedJams), letting two accounts fabricate completed sessions — and with them
    // reliability, vouches and repeat-jam pairs — for jams that never happened.
    if (Date.parse(input.startsAt) <= Date.now()) throw new WorldError('Pick a time in the future')
    const offered = [...request.proposedTimes, ...(request.counterTimes ?? [])]
    if (!offered.includes(input.startsAt)) throw new WorldError('Pick one of the proposed times')
    if (!d.prepare(`SELECT 1 FROM venues WHERE id = ?`).get(input.venueId))
      throw new WorldError('Pick a real place — a jam cannot confirm without one')

    const fromRow = d
      .prepare(`SELECT instruments FROM musicians WHERE id = ?`)
      .get(request.fromId) as { instruments: string } | undefined
    const meRow = d.prepare(`SELECT instruments FROM musicians WHERE id = ?`).get(viewerId) as {
      instruments: string
    }

    // The ONLY place in the entire system a confirmed jam comes into being.
    const jamId = uid('jam')
    const threadId = uid('thr')
    const jam: Jam = {
      id: jamId,
      // Both people read this title — it must not take sides.
      title: `${firstName(request.fromId)} & ${firstName(viewerId)}`,
      intent: request.intent,
      status: 'confirmed',
      startsAt: input.startsAt,
      durationHours: 2,
      venueId: input.venueId,
      hostId: request.fromId,
      attendees: [
        {
          musicianId: request.fromId,
          instrument: (JSON.parse(fromRow?.instruments ?? '["guitar"]')[0] ??
            'guitar') as Instrument,
          rsvp: 'confirmed',
        },
        {
          musicianId: viewerId,
          instrument: (JSON.parse(meRow.instruments)[0] ?? 'drums') as Instrument,
          rsvp: 'confirmed',
        },
      ],
      openSeats: [],
      isOpenCall: false,
      threadId,
    }
    const tx = d.transaction(() => {
      d.prepare(`INSERT INTO jams VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
        jam.id,
        jam.title,
        jam.intent,
        jam.status,
        jam.startsAt,
        jam.durationHours,
        null,
        jam.venueId,
        jam.hostId,
        JSON.stringify(jam.attendees),
        '[]',
        0,
        null,
        null,
        threadId,
        null,
        null,
      )
      insertThread({
        id: threadId,
        kind: 'jam',
        jamId,
        participantIds: [request.fromId, viewerId],
        lastMessageAt: at,
      })
      insertMessage({
        id: uid('msg'),
        threadId,
        authorId: 'system',
        body: `${firstName(viewerId)} accepted. ${jam.title} is on.`,
        sentAt: at,
        kind: 'system',
      })
      touchRead(threadId, viewerId, at)
      d.prepare(`UPDATE requests SET status = 'accepted', jam_id = ? WHERE id = ?`).run(
        jamId,
        request.id,
      )
      notify(request.fromId, 'request_accepted', 'accepted your jam request', viewerId, { jamId })
    })
    tx()
    return { jamId }
  }

  if (input.action === 'decline') {
    const threadId = directThread()
    const tx = d.transaction(() => {
      insertMessage({
        id: uid('msg'),
        threadId,
        authorId: viewerId,
        body: "Thanks for thinking of me — I can't make this one work. Ask me again soon.",
        sentAt: at,
        kind: 'text',
      })
      touchRead(threadId, viewerId, at)
      d.prepare(`UPDATE requests SET status = 'declined' WHERE id = ?`).run(request.id)
    })
    tx()
    return {}
  }

  const counterTimes = (Array.isArray(input.counterTimes) ? input.counterTimes : [])
    .slice(0, 3)
    .filter((t) => typeof t === 'string' && Number.isFinite(Date.parse(t)))
  if (counterTimes.length === 0) throw new WorldError('Suggest at least one other time')
  const threadId = directThread()
  const tx = d.transaction(() => {
    insertMessage({
      id: uid('msg'),
      threadId,
      authorId: viewerId,
      body:
        input.note?.trim().slice(0, 300) ||
        'That time is tricky for me — I suggested another one. Does it work for you?',
      sentAt: at,
      kind: 'text',
    })
    touchRead(threadId, viewerId, at)
    d.prepare(
      `UPDATE requests SET status = 'counter-proposed', counter_times = ? WHERE id = ?`,
    ).run(JSON.stringify(counterTimes), request.id)
  })
  tx()
  return {}
}

// --- jams -------------------------------------------------------------------
export function postJam(
  viewerId: string,
  draft: {
    title: string
    intent: Intent
    isOpenCall: boolean
    openSeats: Instrument[]
    startsAt: string
    durationHours: number
    venueId: string
    message?: string
    invitedIds?: string[]
    asDraft?: boolean
  },
): Jam {
  const d = db()
  const title = String(draft.title ?? '')
    .trim()
    .slice(0, 80)
  if (!title) throw new WorldError('Name the jam')
  const intent = assertEnum(draft.intent, INTENTS, 'intent')
  if (!Number.isFinite(Date.parse(draft.startsAt))) throw new WorldError('Pick a date and time')
  if (!d.prepare(`SELECT 1 FROM venues WHERE id = ?`).get(draft.venueId))
    throw new WorldError('Pick a place')
  const openSeats = [...new Set(Array.isArray(draft.openSeats) ? draft.openSeats : [])]
    .slice(0, INSTRUMENTS.length)
    .map((i) => assertEnum(i, INSTRUMENTS, 'instrument'))
  if (draft.isOpenCall && openSeats.length === 0)
    throw new WorldError('An open call needs at least one role')
  const invited = (Array.isArray(draft.invitedIds) ? draft.invitedIds : [])
    .filter((id) => id !== viewerId && musicianExists(id))
    .slice(0, 8)

  const meRow = d.prepare(`SELECT instruments FROM musicians WHERE id = ?`).get(viewerId) as {
    instruments: string
  }
  const at = nowIso()
  const jamId = uid('jam')
  const threadId = uid('thr')
  const jam: Jam = {
    id: jamId,
    title,
    intent,
    status: draft.asDraft ? 'draft' : 'pending',
    startsAt: draft.startsAt,
    durationHours: Math.min(6, Math.max(1, Number(draft.durationHours) || 2)),
    venueId: draft.venueId,
    hostId: viewerId,
    attendees: [
      {
        musicianId: viewerId,
        instrument: (JSON.parse(meRow.instruments)[0] ?? 'drums') as Instrument,
        rsvp: 'confirmed',
      },
      ...invited.map((id) => {
        const r = d.prepare(`SELECT instruments FROM musicians WHERE id = ?`).get(id) as {
          instruments: string
        }
        return {
          musicianId: id,
          instrument: (JSON.parse(r.instruments)[0] ?? 'guitar') as Instrument,
          rsvp: 'pending' as const,
        }
      }),
    ],
    openSeats,
    isOpenCall: Boolean(draft.isOpenCall),
    postedAt: draft.asDraft ? undefined : at,
    message: draft.message?.trim().slice(0, 400) || undefined,
    threadId,
  }
  const tx = d.transaction(() => {
    d.prepare(`INSERT INTO jams VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      jam.id,
      jam.title,
      jam.intent,
      jam.status,
      jam.startsAt,
      jam.durationHours,
      null,
      jam.venueId,
      jam.hostId,
      JSON.stringify(jam.attendees),
      JSON.stringify(jam.openSeats),
      jam.isOpenCall ? 1 : 0,
      jam.postedAt ?? null,
      jam.message ?? null,
      threadId,
      null,
      null,
    )
    // A draft is nobody's business but the author's: no thread until it is actually sent.
    if (!draft.asDraft) {
      insertThread({
        id: threadId,
        kind: 'jam',
        jamId,
        participantIds: [viewerId, ...invited],
        lastMessageAt: at,
      })
      touchRead(threadId, viewerId, at)
    }
  })
  tx()
  return jam
}

export function applyToOpenCall(viewerId: string, jamId: string, instrument: Instrument) {
  const d = db()
  const jam = getJamRow(jamId)
  if (!jam || !jam.isOpenCall || jam.status !== 'pending')
    throw new WorldError('This call is not open', 404)
  if (jam.hostId === viewerId) throw new WorldError('It is your own call', 400)
  const inst = assertEnum(instrument, INSTRUMENTS, 'instrument')
  const at = nowIso()
  try {
    d.prepare(`INSERT INTO applications VALUES (?,?,?,?,?,?)`).run(
      uid('app'),
      jamId,
      viewerId,
      inst,
      'pending',
      at,
    )
  } catch {
    throw new WorldError('Already applied', 409)
  }
  notify(jam.hostId, 'open_call_application', `applied to your open call`, viewerId, { jamId })
}

export function withdrawFromJam(viewerId: string, jamId: string) {
  const d = db()
  const jam = getJamRow(jamId)
  if (!jam) throw new WorldError('Jam not found', 404)
  if (!jam.attendees.some((a) => a.musicianId === viewerId))
    throw new WorldError('You are not on this jam', 403)
  const attendees = jam.attendees.map((a) =>
    a.musicianId === viewerId ? { ...a, rsvp: 'declined' as const } : a,
  )
  const confirmed = attendees.filter((a) => a.rsvp === 'confirmed').length
  const status = jam.status === 'confirmed' && confirmed < 2 ? 'pending' : jam.status
  d.prepare(`UPDATE jams SET attendees = ?, status = ? WHERE id = ?`).run(
    JSON.stringify(attendees),
    status,
    jamId,
  )
}

/**
 * The host seats a pending open-call applicant. This is the missing other half of applyToOpenCall
 * — without it, applications could be filed but never acted on. Only the host may accept, the role
 * they applied for must still be open, and the call becomes a confirmed jam once every advertised
 * seat is filled (which is what reveals the address to the now-confirmed attendees).
 */
export function acceptApplicant(viewerId: string, jamId: string, applicantId: string) {
  const d = db()
  const jam = getJamRow(jamId)
  if (!jam) throw new WorldError('Jam not found', 404)
  if (jam.hostId !== viewerId) throw new WorldError('Only the host can accept applicants', 403)
  const appRow = d
    .prepare(
      `SELECT id, instrument FROM applications WHERE jam_id = ? AND applicant_id = ? AND status = 'pending'`,
    )
    .get(jamId, applicantId) as { id: string; instrument: string } | undefined
  if (!appRow) throw new WorldError('No pending application from this player', 404)
  if (jam.attendees.some((a) => a.musicianId === applicantId && a.rsvp !== 'declined'))
    throw new WorldError('They are already on this jam', 409)
  const instrument = appRow.instrument as Instrument
  if (!jam.openSeats.includes(instrument))
    throw new WorldError('That role has already been filled', 409)

  const at = nowIso()
  const attendees = [
    ...jam.attendees,
    { musicianId: applicantId, instrument, rsvp: 'confirmed' as const },
  ]
  const openSeats = [...jam.openSeats]
  openSeats.splice(openSeats.indexOf(instrument), 1)
  // An open call becomes a confirmed jam once every advertised role is filled.
  const status = openSeats.length === 0 ? 'confirmed' : jam.status

  const tx = d.transaction(() => {
    d.prepare(`UPDATE jams SET attendees = ?, open_seats = ?, status = ? WHERE id = ?`).run(
      JSON.stringify(attendees),
      JSON.stringify(openSeats),
      status,
      jamId,
    )
    d.prepare(`UPDATE applications SET status = 'accepted' WHERE id = ?`).run(appRow.id)
    // Bring the applicant into the jam's group thread so the plan can be made together.
    const thread = getThreadRow(jam.threadId)
    if (thread) {
      if (!thread.participantIds.includes(applicantId)) {
        d.prepare(`UPDATE threads SET participant_ids = ? WHERE id = ?`).run(
          JSON.stringify([...thread.participantIds, applicantId]),
          jam.threadId,
        )
      }
      insertMessage({
        id: uid('msg'),
        threadId: jam.threadId,
        authorId: 'system',
        body: `${firstName(applicantId)} is in — welcome to the jam.`,
        sentAt: at,
        kind: 'system',
      })
      touchRead(jam.threadId, applicantId, at)
    }
    notify(applicantId, 'request_accepted', `added you to ${jam.title}`, viewerId, { jamId })
  })
  tx()
}

/**
 * An invited attendee answers their invite. postJam seeds invited people as rsvp 'pending' and,
 * until now, the only thing they could do was withdraw — so invited jams could never actually come
 * together. Accepting flips the caller's own seat to confirmed (and a posted jam, which already has
 * a real venue and time, becomes confirmed once two people are in); declining reuses the withdraw
 * path. The caller can only change their own rsvp.
 */
export function respondToInvite(viewerId: string, jamId: string, action: 'accept' | 'decline') {
  if (action !== 'accept' && action !== 'decline') throw new WorldError('Bad response')
  const d = db()
  const jam = getJamRow(jamId)
  if (!jam) throw new WorldError('Jam not found', 404)
  const me = jam.attendees.find((a) => a.musicianId === viewerId)
  if (!me || me.rsvp !== 'pending')
    throw new WorldError('You have no pending invite to this jam', 403)

  const at = nowIso()
  const rsvp = action === 'accept' ? ('confirmed' as const) : ('declined' as const)
  const attendees = jam.attendees.map((a) => (a.musicianId === viewerId ? { ...a, rsvp } : a))
  const confirmed = attendees.filter((a) => a.rsvp === 'confirmed').length
  let status = jam.status
  if (action === 'accept' && jam.status === 'pending' && confirmed >= 2) status = 'confirmed'
  if (action === 'decline' && jam.status === 'confirmed' && confirmed < 2) status = 'pending'

  const tx = d.transaction(() => {
    d.prepare(`UPDATE jams SET attendees = ?, status = ? WHERE id = ?`).run(
      JSON.stringify(attendees),
      status,
      jamId,
    )
    if (action === 'accept' && getThreadRow(jam.threadId)) {
      insertMessage({
        id: uid('msg'),
        threadId: jam.threadId,
        authorId: 'system',
        body: `${firstName(viewerId)} is in.`,
        sentAt: at,
        kind: 'system',
      })
      touchRead(jam.threadId, viewerId, at)
      notify(jam.hostId, 'request_accepted', `is coming to ${jam.title}`, viewerId, { jamId })
    }
  })
  tx()
}

// --- messaging --------------------------------------------------------------
export function sendMessage(viewerId: string, threadId: string, body: string): Message {
  const thread = getThreadRow(threadId)
  if (!thread) throw new WorldError('Thread not found', 404)
  if (!thread.participantIds.includes(viewerId)) throw new WorldError('Not your conversation', 403)
  const text = String(body ?? '')
    .trim()
    .slice(0, 1000)
  if (!text) throw new WorldError('Empty message')
  const message: Message = {
    id: uid('msg'),
    threadId,
    authorId: viewerId,
    body: text,
    sentAt: nowIso(),
    kind: 'text',
  }
  insertMessage(message)
  touchRead(threadId, viewerId, message.sentAt)
  return message
}

export function markThreadRead(viewerId: string, threadId: string) {
  const thread = getThreadRow(threadId)
  if (!thread || !thread.participantIds.includes(viewerId)) return
  touchRead(threadId, viewerId, nowIso())
}

export function openDirectThread(viewerId: string, otherId: string): Thread {
  const d = db()
  if (otherId === viewerId) throw new WorldError('That is you')
  if (!musicianExists(otherId)) throw new WorldError('Musician not found', 404)
  const existing = (d.prepare(`SELECT * FROM threads WHERE kind = 'direct'`).all() as any[])
    .map(rowToThread)
    .find((t) => t.participantIds.includes(viewerId) && t.participantIds.includes(otherId))
  if (existing) return existing
  const at = nowIso()
  const thread: Thread = {
    id: uid('thr'),
    kind: 'direct',
    participantIds: [viewerId, otherId],
    lastMessageAt: at,
    unreadCount: 0,
  }
  insertThread(thread)
  return thread
}

// --- recaps & consent -------------------------------------------------------
export function postRecap(
  viewerId: string,
  input: {
    jamId: string
    attendance: Record<string, boolean>
    vouches: RecapVouch[]
    publishRecording: boolean
    durationLabel: string
  },
): SessionRecap {
  const d = db()
  const jam = getJamRow(input.jamId)
  if (!jam) throw new WorldError('Jam not found', 404)
  if (jam.status !== 'completed') throw new WorldError('Recaps open once the session is over', 409)
  const confirmedIds = jam.attendees.filter((a) => a.rsvp === 'confirmed').map((a) => a.musicianId)
  if (!confirmedIds.includes(viewerId))
    throw new WorldError('Only confirmed attendees file recaps', 403)

  // Attendance verdicts only about people who were actually confirmed on this jam.
  const attendance: Record<string, boolean> = {}
  for (const [id, showed] of Object.entries(input.attendance ?? {})) {
    if (confirmedIds.includes(id)) attendance[id] = Boolean(showed)
  }
  // Rule 4 server-side: a vouch stands only between confirmed co-attendees. One vouch per
  // target per recap — deduping by toId also bounds the notification fan-out and the stored
  // recap size to the number of people actually on the jam.
  const vouchedFor = new Set<string>()
  const vouches = (Array.isArray(input.vouches) ? input.vouches : [])
    .filter((v) => canVouch(jam, viewerId, v.toId))
    .filter((v) => {
      if (vouchedFor.has(v.toId)) return false
      vouchedFor.add(v.toId)
      return true
    })
    .slice(0, confirmedIds.length)
    .map((v) => ({
      toId: v.toId,
      tags: (Array.isArray(v.tags) ? [...new Set(v.tags)] : []).slice(0, 7),
      note: v.note ? String(v.note).slice(0, 240) : undefined,
    }))
    .filter((v) => v.tags.length > 0 || v.note)

  const at = nowIso()
  const recap: SessionRecap = {
    id: `recap-${input.jamId}-${viewerId}`,
    jamId: input.jamId,
    authorId: viewerId,
    attendance,
    vouches,
    publishRecording: Boolean(input.publishRecording),
    durationLabel: String(input.durationLabel ?? '').slice(0, 20),
    createdAt: at,
  }
  const tx = d.transaction(() => {
    d.prepare(
      `INSERT INTO recaps VALUES (?,?,?,?,?,?,?,?)
       ON CONFLICT(jam_id, author_id) DO UPDATE SET
         attendance = excluded.attendance, vouches = excluded.vouches,
         publish_recording = excluded.publish_recording,
         duration_label = excluded.duration_label, created_at = excluded.created_at`,
    ).run(
      recap.id,
      recap.jamId,
      recap.authorId,
      JSON.stringify(recap.attendance),
      JSON.stringify(recap.vouches),
      recap.publishRecording ? 1 : 0,
      recap.durationLabel,
      at,
    )
    d.prepare(`UPDATE jams SET recap_id = ? WHERE id = ?`).run(recap.id, recap.jamId)
    for (const v of recap.vouches) {
      notify(v.toId, 'vouch_received', 'vouched for you', viewerId, {
        tags: v.tags.map((t) => `#${t}`).join(' '),
      })
    }
  })
  tx()
  return recap
}

export function setRecordingConsent(viewerId: string, jamId: string, consents: boolean) {
  const d = db()
  const jam = getJamRow(jamId)
  if (!jam) throw new WorldError('Jam not found', 404)
  if (!jam.attendees.some((a) => a.musicianId === viewerId && a.rsvp === 'confirmed'))
    throw new WorldError('Only confirmed attendees decide about the recording', 403)
  if (consents) {
    d.prepare(`INSERT OR IGNORE INTO consents VALUES (?,?)`).run(jamId, viewerId)
  } else {
    d.prepare(`DELETE FROM consents WHERE jam_id = ? AND musician_id = ?`).run(jamId, viewerId)
  }
}

// --- notifications ----------------------------------------------------------
export function markNotificationRead(viewerId: string, id: string) {
  db().prepare(`UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?`).run(id, viewerId)
}

export function markAllNotificationsRead(viewerId: string) {
  db().prepare(`UPDATE notifications SET read = 1 WHERE user_id = ?`).run(viewerId)
}

// ---------------------------------------------------------------------------
// Competition — mutations (money moves here; guard every credit)
// ---------------------------------------------------------------------------

/**
 * Enter the current season's paid competition. Charges the entry fee from the viewer's wallet
 * atomically: the balance check, the debit, and the entry insert all happen inside one
 * transaction, so a fee can never be charged without an entry (or vice versa) and the balance
 * can never go negative even under concurrent requests. Idempotent per (season, competitor) via
 * the UNIQUE constraint.
 */
export function enterCompetition(viewerId: string): CompetitionEntry {
  const d = db()
  const now = nowIso()
  const season = currentSeason(now)
  if (season.status !== 'registration')
    throw new WorldError('Registration for this season has closed', 409)

  const competitor = d
    .prepare(`SELECT name, profile_complete FROM musicians WHERE id = ?`)
    .get(viewerId) as { name: string; profile_complete: number } | undefined
  if (!competitor) throw new WorldError('Account not found', 404)
  if (!competitor.profile_complete)
    throw new WorldError('Finish your player card before entering', 403)

  const already = d
    .prepare(`SELECT 1 FROM competition_entries WHERE season_id = ? AND competitor_id = ?`)
    .get(season.id, viewerId)
  if (already) throw new WorldError('You are already entered', 409)

  const wallet = d
    .prepare(`SELECT balance_credits FROM wallets WHERE user_id = ?`)
    .get(viewerId) as { balance_credits: number } | undefined
  if (!wallet || wallet.balance_credits < season.entryFeeCredits)
    throw new WorldError('Not enough Riff Credits for the entry fee', 402)

  const entry: CompetitionEntry = {
    id: uid('ce'),
    seasonId: season.id,
    competitorId: viewerId,
    competitorName: competitor.name,
    feePaidCredits: season.entryFeeCredits,
    enteredAt: now,
  }
  const tx = d.transaction(() => {
    // Re-check the balance inside the transaction under the write lock, then debit.
    const bal = (
      d.prepare(`SELECT balance_credits FROM wallets WHERE user_id = ?`).get(viewerId) as {
        balance_credits: number
      }
    ).balance_credits
    if (bal < season.entryFeeCredits) throw new WorldError('Not enough Riff Credits', 402)
    adjustWallet(viewerId, -season.entryFeeCredits, 'entry_fee', `Season ${season.number} entry`)
    try {
      d.prepare(`INSERT INTO competition_entries VALUES (?,?,?,?,?,?,?,?)`).run(
        entry.id,
        entry.seasonId,
        entry.competitorId,
        entry.competitorName,
        entry.feePaidCredits,
        entry.enteredAt,
        null,
        null,
      )
    } catch {
      // UNIQUE violation: another request entered us first. Abort so the debit rolls back too.
      throw new WorldError('You are already entered', 409)
    }
  })
  tx()
  return entry
}
