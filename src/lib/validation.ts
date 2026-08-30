/**
 * Client-side field validators for the auth forms. These MIRROR the server's rules in
 * src/server/auth.ts (USERNAME_RE, EMAIL_RE, the length checks in validateSignup) — the server
 * stays the single source of truth and rejects anything invalid regardless, but the forms use
 * these to keep the submit button honest: disabled until each field actually satisfies its rule,
 * rather than merely being non-empty. Kept free of any server import so a client component can
 * use them (src/server/* pulls in node:crypto and better-sqlite3).
 */

/** 3–20 chars, lowercase letters, numbers and underscore. Matches server USERNAME_RE. */
export const USERNAME_RE = /^[a-z0-9_]{3,20}$/
/** Light sanity check — a@b.c shape. Matches server EMAIL_RE. */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const isValidName = (v: string): boolean => {
  const n = v.trim()
  return n.length >= 2 && n.length <= 40
}

export const isValidUsername = (v: string): boolean => USERNAME_RE.test(v.trim().toLowerCase())

export const isValidPassword = (v: string): boolean => v.length >= 8 && v.length <= 200

/** Optional field: an empty value is allowed; a non-empty one must look like an email. */
export const isValidOptionalEmail = (v: string): boolean => {
  const e = v.trim()
  return e === '' || (EMAIL_RE.test(e) && e.length <= 120)
}

/** Required email (reset flow): must be present and well-formed. */
export const isValidEmail = (v: string): boolean => {
  const e = v.trim()
  return EMAIL_RE.test(e) && e.length <= 120
}
