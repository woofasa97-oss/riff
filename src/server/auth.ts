/**
 * Username + password accounts. SERVER-ONLY.
 *
 * - Passwords: scrypt (built into node:crypto — no dependency), per-user 16-byte salt,
 *   constant-time comparison.
 * - Sessions: 32 random bytes handed to the browser in an httpOnly cookie; the database
 *   stores only the SHA-256 of the token, so a leaked database cannot mint valid cookies.
 * - CSRF: SameSite=Lax plus a JSON-content-type requirement on every mutating route.
 */
import crypto from 'node:crypto'
import { cookies } from 'next/headers'
import { db } from '@/server/db'

export const SESSION_COOKIE = 'riff_session'
const SESSION_DAYS = 30

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 }

export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto
    .scryptSync(password, salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p })
    .toString('hex')
  return { hash, salt }
}

/**
 * A fixed decoy salt+hash so authenticate() can spend the same scrypt time on an unknown
 * username as on a known one, closing the timing side-channel. The hash is of a random string
 * nobody knows, so it never validates.
 */
export const DECOY_SALT = '00000000000000000000000000000000'
export const DECOY_HASH = crypto
  .scryptSync('riff-decoy-not-a-real-password', DECOY_SALT, SCRYPT.keylen, {
    N: SCRYPT.N,
    r: SCRYPT.r,
    p: SCRYPT.p,
  })
  .toString('hex')

export function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  const actual = crypto.scryptSync(password, salt, SCRYPT.keylen, {
    N: SCRYPT.N,
    r: SCRYPT.r,
    p: SCRYPT.p,
  })
  const expected = Buffer.from(expectedHash, 'hex')
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected)
}

const tokenHash = (token: string) => crypto.createHash('sha256').update(token).digest('hex')

export function createSession(userId: string): { token: string; expiresAt: string } {
  const token = crypto.randomBytes(32).toString('hex')
  const now = new Date()
  const expiresAt = new Date(now.getTime() + SESSION_DAYS * 86_400_000).toISOString()
  db()
    .prepare(`INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?,?,?,?)`)
    .run(tokenHash(token), userId, now.toISOString(), expiresAt)
  return { token, expiresAt }
}

export function destroySession(token: string) {
  db().prepare(`DELETE FROM sessions WHERE token_hash = ?`).run(tokenHash(token))
}

/** The logged-in user id for a raw session token, or undefined. Expired rows are reaped. */
export function sessionUserId(token: string | undefined): string | undefined {
  if (!token) return undefined
  const row = db()
    .prepare(`SELECT user_id, expires_at FROM sessions WHERE token_hash = ?`)
    .get(tokenHash(token)) as { user_id: string; expires_at: string } | undefined
  if (!row) return undefined
  if (Date.parse(row.expires_at) < Date.now()) {
    destroySession(token)
    return undefined
  }
  return row.user_id
}

/** Reads the session cookie in a server component / route handler. */
export async function viewerFromCookies(): Promise<string | undefined> {
  const jar = await cookies()
  return sessionUserId(jar.get(SESSION_COOKIE)?.value)
}

export function sessionCookieOptions(expiresAt: string) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(expiresAt),
  }
}

// --- best-effort login throttle (single instance, in-memory) ---------------
const attempts = new Map<string, { count: number; resetAt: number }>()
const MAX_TRACKED = 10_000

export function throttleLogin(key: string): boolean {
  const now = Date.now()
  const entry = attempts.get(key)
  if (!entry || entry.resetAt < now) {
    // Sweep expired entries before growing, and hard-cap the map so a flood of distinct keys
    // cannot exhaust memory (belt-and-braces alongside the unspoofable key).
    if (attempts.size >= MAX_TRACKED) {
      for (const [k, v] of attempts) if (v.resetAt < now) attempts.delete(k)
      if (attempts.size >= MAX_TRACKED) attempts.clear()
    }
    attempts.set(key, { count: 1, resetAt: now + 10 * 60_000 })
    return true
  }
  entry.count += 1
  return entry.count <= 10
}

export function clearThrottle(key: string) {
  attempts.delete(key)
}

// --- validation -------------------------------------------------------------
export const USERNAME_RE = /^[a-z0-9_]{3,20}$/

export function validateSignup(input: {
  name?: unknown
  username?: unknown
  password?: unknown
}): { name: string; username: string; password: string } | { error: string } {
  const name = typeof input.name === 'string' ? input.name.trim() : ''
  const username = typeof input.username === 'string' ? input.username.trim().toLowerCase() : ''
  const password = typeof input.password === 'string' ? input.password : ''
  if (name.length < 2 || name.length > 40) return { error: 'Name needs 2–40 characters.' }
  if (!USERNAME_RE.test(username))
    return { error: 'Username: 3–20 characters, a–z, 0–9 and _ only.' }
  if (password.length < 8) return { error: 'Password needs at least 8 characters.' }
  if (password.length > 200) return { error: 'Password is too long.' }
  return { name, username, password }
}
