/**
 * SQLite persistence for real accounts. SERVER-ONLY — importing this from a client component
 * would fail the build (better-sqlite3 is a native module) and would be wrong anyway.
 *
 * v1 was mocks-only; real sign-ups changed that. The schema below is the docs/DATA-MODEL.md
 * types made literal, with nested arrays as JSON columns — they translate 1:1 into the
 * Postgres tables the doc promises when this outgrows one instance. One process, one file:
 * SQLite is correct for a single Render service and wrong for more than one. See
 * docs/DEPLOY-RENDER.md.
 *
 * On first boot the fixture world is seeded in, with every timestamp shifted so "tonight's
 * jam" is tonight at seed time — new users land in a living scene, not a museum of
 * August 2026. Seed musicians are flagged `is_seed`; they have no login and never reply.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import Database from 'better-sqlite3'
import {
  bands as seedBands,
  jamRequests as seedRequests,
  jams as seedJams,
  messages as seedMessages,
  musicians as seedMusicians,
  notifications as seedNotifications,
  recordingConsents as seedConsents,
  sessionRecaps as seedRecaps,
  threads as seedThreads,
  venues as seedVenues,
  vouches as seedVouches,
  seasons as seedSeasons,
  CURRENT_USER_ID as SEED_ANCHOR_USER,
  NOW as FIXTURE_NOW,
} from '@/mocks'

const DB_PATH = process.env.RIFF_DB_PATH ?? path.join(process.cwd(), 'data', 'riff.db')

let _db: Database.Database | undefined

/**
 * Open the database at `preferred`, creating its directory. Returns undefined (rather than
 * throwing) if the location is not writable — e.g. RIFF_DB_PATH points at a disk mount that is
 * not attached, which is exactly how this app once white-screened on Render.
 */
function tryOpen(preferred: string): Database.Database | undefined {
  try {
    fs.mkdirSync(path.dirname(preferred), { recursive: true })
    const conn = new Database(preferred)
    conn.pragma('journal_mode = WAL')
    conn.pragma('foreign_keys = ON')
    return conn
  } catch (err) {
    console.error(`[riff] could not open database at ${preferred}:`, (err as Error).message)
    return undefined
  }
}

export function db(): Database.Database {
  if (_db) return _db
  // PROTOTYPE MODE: the app must boot anywhere, disk or no disk. Prefer the configured path;
  // if it is unwritable (e.g. RIFF_DB_PATH points at a disk mount that is not attached), fall
  // back to the OS temp dir and keep serving — ephemeral, and loudly logged, but running.
  // When this graduates to a durable deployment, re-add the boot refusal for an explicit
  // RIFF_DB_PATH that cannot open (see docs/DEPLOY-RENDER.md) so a detached disk fails the
  // deploy instead of silently serving data that vanishes.
  const conn = tryOpen(DB_PATH) ?? tryOpen(path.join(os.tmpdir(), 'riff.db'))
  if (!conn) throw new Error('Riff could not open a database in any writable location')
  if (conn.name !== DB_PATH) {
    console.warn(
      `[riff] using fallback database at ${conn.name} — data resets on restart. ` +
        'Point RIFF_DB_PATH at a writable persistent path for durability.',
    )
  }
  _db = conn
  migrate(_db)
  upgrade(_db)
  seed(_db)
  return _db
}

/**
 * Versioned, one-way schema upgrades for databases that already hold real data.
 *
 * migrate() only creates what is missing (CREATE TABLE IF NOT EXISTS), which covers brand-new
 * tables — but never a column added to an existing table or a data rewrite. Those land here:
 * append a function to MIGRATIONS and it runs exactly once per database, tracked by SQLite's
 * PRAGMA user_version. Never reorder or edit an entry that has shipped.
 */
const MIGRATIONS: Array<(d: Database.Database) => void> = [
  // v1 is the baseline schema created by migrate() — nothing to replay.
]

function upgrade(d: Database.Database) {
  const version = d.pragma('user_version', { simple: true }) as number
  for (let v = version; v < MIGRATIONS.length; v++) {
    d.transaction(() => {
      MIGRATIONS[v](d)
      d.pragma(`user_version = ${v + 1}`)
    })()
  }
  if (version > MIGRATIONS.length) {
    // A newer deploy already upgraded this file — refuse rather than write with stale code.
    throw new Error(
      `Riff refuses to start: database schema v${version} is newer than this build (v${MIGRATIONS.length}).`,
    )
  }
}

function migrate(d: Database.Database) {
  d.exec(`
    CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);

    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,             -- equals the musician id
      username      TEXT NOT NULL UNIQUE COLLATE NOCASE,
      email         TEXT,                         -- optional; for account recovery + notices
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      created_at    TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS password_resets (
      token_hash TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS musicians (
      id                TEXT PRIMARY KEY,
      name              TEXT NOT NULL,
      handle            TEXT NOT NULL,
      avatar_url        TEXT NOT NULL,
      instruments       TEXT NOT NULL,            -- JSON Instrument[]
      genres            TEXT NOT NULL,            -- JSON Genre[]
      intent            TEXT NOT NULL,
      neighborhood      TEXT NOT NULL,
      city              TEXT NOT NULL,
      travel_radius_mi  INTEGER NOT NULL,
      bio               TEXT,
      clip              TEXT,                     -- JSON AudioClip | null
      availability      TEXT NOT NULL,            -- JSON Availability
      available_tonight INTEGER NOT NULL DEFAULT 0,
      tonight_set_on    TEXT,                     -- ET date key; expires at local midnight
      verified          INTEGER NOT NULL DEFAULT 0,
      jams_hosted       INTEGER NOT NULL DEFAULT 0,
      baseline          TEXT NOT NULL,            -- JSON ReputationBaseline
      is_seed           INTEGER NOT NULL DEFAULT 0,
      profile_complete  INTEGER NOT NULL DEFAULT 1,
      created_at        TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS venues (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, kind TEXT NOT NULL,
      neighborhood TEXT NOT NULL, address TEXT NOT NULL, city TEXT NOT NULL,
      distance_mi REAL NOT NULL, photo_url TEXT NOT NULL, rating REAL NOT NULL,
      jams_hosted INTEGER NOT NULL, hourly_rate_usd INTEGER NOT NULL,
      amenities TEXT NOT NULL, slots TEXT NOT NULL, live_now INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS jams (
      id             TEXT PRIMARY KEY,
      title          TEXT NOT NULL,
      intent         TEXT NOT NULL,
      status         TEXT NOT NULL,
      starts_at      TEXT NOT NULL,
      duration_hours REAL NOT NULL,
      actual_duration_min INTEGER,
      venue_id       TEXT NOT NULL,
      host_id        TEXT NOT NULL,
      attendees      TEXT NOT NULL,               -- JSON JamAttendee[]
      open_seats     TEXT NOT NULL,               -- JSON Instrument[]
      is_open_call   INTEGER NOT NULL,
      posted_at      TEXT,
      message        TEXT,
      thread_id      TEXT NOT NULL,
      recording_id   TEXT,
      recap_id       TEXT
    );

    CREATE TABLE IF NOT EXISTS requests (
      id               TEXT PRIMARY KEY,
      from_id          TEXT NOT NULL,
      to_id            TEXT NOT NULL,
      intent           TEXT NOT NULL,
      proposed_times   TEXT NOT NULL,             -- JSON string[]
      venue_id         TEXT,
      venue_suggestion TEXT,
      message          TEXT NOT NULL,
      status           TEXT NOT NULL,
      counter_times    TEXT,                      -- JSON string[] | null
      jam_id           TEXT,
      created_at       TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY, jam_id TEXT NOT NULL, applicant_id TEXT NOT NULL,
      instrument TEXT NOT NULL, status TEXT NOT NULL, applied_at TEXT NOT NULL,
      UNIQUE (jam_id, applicant_id)
    );

    CREATE TABLE IF NOT EXISTS threads (
      id TEXT PRIMARY KEY, kind TEXT NOT NULL, jam_id TEXT, request_id TEXT,
      venue_id TEXT, band_id TEXT,
      participant_ids TEXT NOT NULL,              -- JSON string[]
      last_message_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS thread_reads (
      thread_id TEXT NOT NULL, user_id TEXT NOT NULL, last_read_at TEXT NOT NULL,
      PRIMARY KEY (thread_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY, thread_id TEXT NOT NULL, author_id TEXT NOT NULL,
      body TEXT NOT NULL, sent_at TEXT NOT NULL, kind TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id, sent_at);

    CREATE TABLE IF NOT EXISTS recaps (
      id TEXT PRIMARY KEY, jam_id TEXT NOT NULL, author_id TEXT NOT NULL,
      attendance TEXT NOT NULL, vouches TEXT NOT NULL,
      publish_recording INTEGER NOT NULL, duration_label TEXT NOT NULL, created_at TEXT NOT NULL,
      UNIQUE (jam_id, author_id)
    );

    CREATE TABLE IF NOT EXISTS consents (
      jam_id TEXT NOT NULL, musician_id TEXT NOT NULL,
      PRIMARY KEY (jam_id, musician_id)
    );

    CREATE TABLE IF NOT EXISTS vouches (
      id TEXT PRIMARY KEY, from_id TEXT NOT NULL, to_id TEXT NOT NULL,
      tags TEXT NOT NULL, note TEXT NOT NULL, sessions_together INTEGER NOT NULL,
      jam_id TEXT NOT NULL, created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS seasons (
      id TEXT PRIMARY KEY, number INTEGER NOT NULL, scene TEXT NOT NULL, city TEXT NOT NULL,
      starts_at TEXT NOT NULL, registration_closes_at TEXT NOT NULL, ends_at TEXT NOT NULL,
      status TEXT NOT NULL, entry_fee_credits INTEGER NOT NULL, base_pool_credits INTEGER NOT NULL,
      payout_split TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS competition_entries (
      id TEXT PRIMARY KEY, season_id TEXT NOT NULL, competitor_id TEXT NOT NULL,
      competitor_name TEXT NOT NULL, fee_paid_credits INTEGER NOT NULL, entered_at TEXT NOT NULL,
      final_rank INTEGER, payout_credits INTEGER,
      UNIQUE (season_id, competitor_id)
    );

    -- One wallet row per real user. Mock currency (Riff Credits) — never real money.
    CREATE TABLE IF NOT EXISTS wallets (
      user_id TEXT PRIMARY KEY, balance_credits INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS wallet_txns (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, amount_credits INTEGER NOT NULL,
      kind TEXT NOT NULL, memo TEXT NOT NULL, created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_wallet_txns_user ON wallet_txns(user_id, created_at);

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, kind TEXT NOT NULL, actor_id TEXT,
      body TEXT NOT NULL, meta TEXT, created_at TEXT NOT NULL, read INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at);

    -- Safety reports. Write-only from the app; reviewed out of band. Never leaves the server.
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY, reporter_id TEXT NOT NULL, target_musician_id TEXT, jam_id TEXT,
      reason TEXT NOT NULL, detail TEXT, created_at TEXT NOT NULL
    );

    -- Member-created map listings (studio / street act / shop). The data column is the JSON of
    -- the type-specific fields; the rendered id equals this row's id. Curation status lives here.
    CREATE TABLE IF NOT EXISTS listings (
      id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, kind TEXT NOT NULL, status TEXT NOT NULL,
      data TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_listings_owner ON listings(owner_id);
    CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);

    -- Truth engine: every number a user sees on the live/battle/social surfaces is counted from
    -- these rows, never authored. One vote per account per battle; ratings upsert per pair.
    CREATE TABLE IF NOT EXISTS battle_votes (
      battle_id TEXT NOT NULL, user_id TEXT NOT NULL, side TEXT NOT NULL CHECK (side IN ('A','B')),
      created_at TEXT NOT NULL, PRIMARY KEY (battle_id, user_id)
    );
    CREATE TABLE IF NOT EXISTS live_comments (
      id TEXT PRIMARY KEY, stream_id TEXT NOT NULL, author_id TEXT NOT NULL,
      body TEXT NOT NULL, sent_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_live_comments_stream ON live_comments(stream_id, sent_at);
    CREATE TABLE IF NOT EXISTS session_ratings (
      session_id TEXT NOT NULL, user_id TEXT NOT NULL,
      stars INTEGER NOT NULL CHECK (stars BETWEEN 1 AND 5),
      created_at TEXT NOT NULL, PRIMARY KEY (session_id, user_id)
    );
    CREATE TABLE IF NOT EXISTS band_follows (
      user_id TEXT NOT NULL, band_id TEXT NOT NULL, created_at TEXT NOT NULL,
      PRIMARY KEY (user_id, band_id)
    );
    CREATE TABLE IF NOT EXISTS clips (
      user_id TEXT PRIMARY KEY,
      mime TEXT NOT NULL,
      data BLOB NOT NULL,
      duration_sec REAL NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS event_rsvps (
      event_id TEXT NOT NULL, musician_id TEXT NOT NULL, created_at TEXT NOT NULL,
      PRIMARY KEY (event_id, musician_id)
    );
  `)
}

/** ET date key for an instant — the unit "available tonight" expires on. */
export function etDateKey(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso))
}

function seed(d: Database.Database) {
  const seeded = d.prepare(`SELECT value FROM meta WHERE key = 'seeded_at'`).get() as
    { value: string } | undefined
  if (seeded) return

  // Shift every fixture instant by whole days so the anchor "tonight" jam lands today.
  const now = new Date().toISOString()
  const dayMs = 86_400_000
  const shiftDays = Math.round(
    (Date.parse(`${etDateKey(now)}T12:00:00Z`) -
      Date.parse(`${etDateKey(FIXTURE_NOW)}T12:00:00Z`)) /
      dayMs,
  )
  const shift = (iso: string) => new Date(Date.parse(iso) + shiftDays * dayMs).toISOString()

  const tx = d.transaction(() => {
    const mIns = d.prepare(`INSERT INTO musicians
      (id,name,handle,avatar_url,instruments,genres,intent,neighborhood,city,travel_radius_mi,
       bio,clip,availability,available_tonight,tonight_set_on,verified,jams_hosted,baseline,
       is_seed,profile_complete,created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,1,?)`)
    for (const m of seedMusicians) {
      const clip = m.clip ? { ...m.clip, recordedAt: shift(m.clip.recordedAt) } : null
      mIns.run(
        m.id,
        m.name,
        m.handle,
        m.avatarUrl,
        JSON.stringify(m.instruments),
        JSON.stringify(m.genres),
        m.intent,
        m.neighborhood,
        m.city,
        m.travelRadiusMi,
        m.bio ?? null,
        clip ? JSON.stringify(clip) : null,
        JSON.stringify(m.availability),
        m.availableTonight ? 1 : 0,
        m.availableTonight ? etDateKey(now) : null,
        m.verified ? 1 : 0,
        m.jamsHosted,
        JSON.stringify(m.baseline),
        now,
      )
    }

    const vIns = d.prepare(`INSERT INTO venues VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    for (const v of seedVenues) {
      vIns.run(
        v.id,
        v.name,
        v.kind,
        v.neighborhood,
        v.address,
        v.city,
        v.distanceMi,
        v.photoUrl,
        v.rating,
        v.jamsHosted,
        v.hourlyRateUsd,
        JSON.stringify(v.amenities),
        JSON.stringify(v.slots.map((s) => ({ ...s, startsAt: shift(s.startsAt) }))),
        v.liveNow ? 1 : 0,
      )
    }

    const jIns = d.prepare(`INSERT INTO jams VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    for (const j of seedJams) {
      jIns.run(
        j.id,
        j.title,
        j.intent,
        j.status,
        shift(j.startsAt),
        j.durationHours,
        j.actualDurationMin ?? null,
        j.venueId,
        j.hostId,
        JSON.stringify(j.attendees),
        JSON.stringify(j.openSeats),
        j.isOpenCall ? 1 : 0,
        j.postedAt ? shift(j.postedAt) : null,
        j.message ?? null,
        j.threadId,
        j.recordingId ?? null,
        j.recapId ?? null,
      )
    }

    const rIns = d.prepare(`INSERT INTO requests VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
    for (const r of seedRequests) {
      rIns.run(
        r.id,
        r.fromId,
        r.toId,
        r.intent,
        JSON.stringify(r.proposedTimes.map(shift)),
        r.venueId ?? null,
        r.venueSuggestion ?? null,
        r.message,
        r.status,
        r.counterTimes ? JSON.stringify(r.counterTimes.map(shift)) : null,
        r.jamId ?? null,
        shift(r.createdAt),
      )
    }

    const tIns = d.prepare(`INSERT INTO threads VALUES (?,?,?,?,?,?,?,?)`)
    for (const t of seedThreads) {
      tIns.run(
        t.id,
        t.kind,
        t.jamId ?? null,
        t.requestId ?? null,
        t.venueId ?? null,
        t.bandId ?? null,
        JSON.stringify(t.participantIds),
        shift(t.lastMessageAt),
      )
    }
    // Fixture unreadCounts model Marcus's unread state: seed thread_reads for the anchor user
    // so his dots match, and later real readers get their own rows.
    const trIns = d.prepare(`INSERT INTO thread_reads VALUES (?,?,?)`)
    for (const t of seedThreads) {
      if (!t.participantIds.includes(SEED_ANCHOR_USER)) continue
      if (t.unreadCount === 0) trIns.run(t.id, SEED_ANCHOR_USER, shift(t.lastMessageAt))
    }

    const msgIns = d.prepare(`INSERT INTO messages VALUES (?,?,?,?,?,?)`)
    for (const m of seedMessages) {
      msgIns.run(m.id, m.threadId, m.authorId, m.body, shift(m.sentAt), m.kind)
    }

    const recIns = d.prepare(`INSERT INTO recaps VALUES (?,?,?,?,?,?,?,?)`)
    for (const r of seedRecaps) {
      recIns.run(
        r.id,
        r.jamId,
        r.authorId,
        JSON.stringify(r.attendance),
        JSON.stringify(r.vouches),
        r.publishRecording ? 1 : 0,
        r.durationLabel,
        shift(r.createdAt),
      )
    }

    const cIns = d.prepare(`INSERT INTO consents VALUES (?,?)`)
    for (const [jamId, ids] of Object.entries(seedConsents)) {
      for (const id of ids) cIns.run(jamId, id)
    }

    const vouchIns = d.prepare(`INSERT INTO vouches VALUES (?,?,?,?,?,?,?,?)`)
    for (const v of seedVouches) {
      vouchIns.run(
        v.id,
        v.fromId,
        v.toId,
        JSON.stringify(v.tags),
        v.note,
        v.sessionsTogether,
        v.jamId,
        shift(v.createdAt),
      )
    }

    const nIns = d.prepare(`INSERT INTO notifications VALUES (?,?,?,?,?,?,?,?)`)
    for (const n of seedNotifications) {
      nIns.run(
        n.id,
        SEED_ANCHOR_USER,
        n.kind,
        n.actorId ?? null,
        n.body,
        n.meta ? JSON.stringify(n.meta) : null,
        shift(n.createdAt),
        n.read ? 1 : 0,
      )
    }

    const sIns = d.prepare(`INSERT INTO seasons VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
    for (const se of seedSeasons) {
      sIns.run(
        se.id,
        se.number,
        se.scene,
        se.city,
        shift(se.startsAt),
        shift(se.registrationClosesAt),
        shift(se.endsAt),
        se.status,
        se.entryFeeCredits,
        se.basePoolCredits,
        JSON.stringify(se.payoutSplit),
      )
    }
    // A few seed acts already paid in, so the prize pool reads as a live competition rather
    // than an empty shell. They are competitors only — no wallet, no login.
    const ceIns = d.prepare(`INSERT INTO competition_entries VALUES (?,?,?,?,?,?,?,?)`)
    // Enough entrants that the competition's field matches the populated leaderboard for the
    // same season (previously only 3, which read as a contradiction next to 14 ranked players).
    const seedEntrants: [string, string][] = [
      ['nina-alvarez', 'Nina Alvarez'],
      ['theo-park', 'Theo Park'],
      ['ruby-sims', 'Ruby Sims'],
      ['david-chen', 'David Chen'],
      ['sarah-jenkins', 'Sarah Jenkins'],
      ['leo-rossi', 'Leo Rossi'],
      ['camille-okafor', 'Camille Okafor'],
      ['miles-whitfield', 'Miles Whitfield'],
      ['fay-ansari', 'Fay Ansari'],
      ['jonah-wills', 'Jonah Wills'],
    ]
    seedEntrants.forEach(([id, name], i) => {
      ceIns.run(
        `ce-seed-${id}`,
        seedSeasons[0].id,
        id,
        name,
        seedSeasons[0].entryFeeCredits,
        shift(new Date(Date.parse(FIXTURE_NOW) - (i + 1) * 86_400_000).toISOString()),
        null,
        null,
      )
    })

    d.prepare(`INSERT INTO meta VALUES ('seeded_at', ?)`).run(now)
    d.prepare(`INSERT INTO meta VALUES ('seed_shift_days', ?)`).run(String(shiftDays))
    // Bands stay fixture-served (Phase 6 flavor, no per-user state) — recorded for reference.
    d.prepare(`INSERT INTO meta VALUES ('seed_bands', ?)`).run(String(seedBands.length))
  })
  tx()
}
