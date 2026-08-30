import { NextResponse } from 'next/server'
import { createAccount } from '@/server/accounts'
import { createSession, sessionCookieOptions, throttleLogin, validateSignup, SESSION_COOKIE } from '@/server/auth'
import { WorldError } from '@/server/world'

export async function POST(req: Request) {
  if (!req.headers.get('content-type')?.includes('application/json')) {
    return NextResponse.json({ error: 'JSON only' }, { status: 415 })
  }
  const body = await req.json().catch(() => ({}))
  const parsed = validateSignup(body)
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })
  // Render appends the real client IP as the LAST entry of X-Forwarded-For; a client can only
  // forge entries to the left of it. Taking the rightmost hop makes the throttle key unspoofable,
  // so a flood of forged XFF values cannot get around the per-IP signup cap.
  const xff = req.headers.get('x-forwarded-for') ?? 'local'
  const clientIp = xff.split(',').pop()!.trim() || 'local'
  if (!throttleLogin(`signup:${clientIp}`)) {
    return NextResponse.json({ error: 'Too many attempts — wait a bit' }, { status: 429 })
  }
  try {
    const userId = createAccount(parsed.name, parsed.username, parsed.password, parsed.email)
    const { token, expiresAt } = createSession(userId)
    const res = NextResponse.json({ ok: true, userId })
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt))
    return res
  } catch (e) {
    if (e instanceof WorldError)
      return NextResponse.json({ error: e.message }, { status: e.status })
    throw e
  }
}
