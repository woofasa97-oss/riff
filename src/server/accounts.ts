/** Account creation — the bridge between a users row and its musician profile. SERVER-ONLY. */
import crypto from 'node:crypto'
import { db } from '@/server/db'
import { SIGNUP_GRANT_CREDITS } from '@/mocks'
import { hashPassword, verifyPassword, DECOY_HASH, DECOY_SALT } from '@/server/auth'
import { WorldError } from '@/server/world'

export function createAccount(
  name: string,
  username: string,
  password: string,
  email: string | null = null,
): string {
  const d = db()
  const id = `u-${username}`
  const exists =
    d.prepare(`SELECT 1 FROM users WHERE username = ?`).get(username) ||
    d.prepare(`SELECT 1 FROM musicians WHERE id = ? OR handle = ?`).get(id, username)
  if (exists) throw new WorldError('That username is taken', 409)

  const { hash, salt } = hashPassword(password)
  const now = new Date().toISOString()
  const tx = d.transaction(() => {
    d.prepare(`INSERT INTO users VALUES (?,?,?,?,?,?)`).run(id, username, email, hash, salt, now)
    // A fresh profile is intentionally empty: onboarding fills it, and profile_complete stays
    // 0 (undiscoverable, redirected into onboarding) until it does.
    d.prepare(
      `INSERT INTO musicians
       (id,name,handle,avatar_url,instruments,genres,intent,neighborhood,city,travel_radius_mi,
        bio,clip,availability,available_tonight,tonight_set_on,verified,jams_hosted,baseline,
        is_seed,profile_complete,created_at)
       VALUES (?,?,?,?, '[]','[]','casual','','', 3, NULL,NULL,?,0,NULL,0,0,?,0,0,?)`,
    ).run(
      id,
      name,
      username,
      `/api/avatar/${id}`,
      JSON.stringify({
        grid: { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] },
        note: '',
      }),
      JSON.stringify({ attendances: 0, showedUp: 0, vouches: 0, repeatJamsOffset: 0 }),
      now,
    )
    // Every new account starts with a stake of Riff Credits (mock money) so they can try
    // entering the competition without a payment step. Recorded as a ledger grant.
    d.prepare(`INSERT INTO wallets VALUES (?,?)`).run(id, SIGNUP_GRANT_CREDITS)
    d.prepare(`INSERT INTO wallet_txns VALUES (?,?,?,?,?,?)`).run(
      `wtx-${crypto.randomUUID().slice(0, 12)}`,
      id,
      SIGNUP_GRANT_CREDITS,
      'signup_grant',
      'Welcome to Riff — starting credits',
      now,
    )
  })
  tx()
  return id
}

export function authenticate(username: string, password: string): string | undefined {
  const row = db()
    .prepare(`SELECT id, password_hash, password_salt FROM users WHERE username = ?`)
    .get(username.trim().toLowerCase()) as
    { id: string; password_hash: string; password_salt: string } | undefined
  if (!row) {
    // Equalise timing with the found path: an unknown username must cost the same scrypt as a
    // known one, or response latency enumerates valid accounts.
    verifyPassword(password, DECOY_SALT, DECOY_HASH)
    return undefined
  }
  return verifyPassword(password, row.password_salt, row.password_hash) ? row.id : undefined
}
