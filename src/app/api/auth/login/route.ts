import { NextResponse } from 'next/server'
import { authenticate } from '@/server/accounts'
import {
  clearThrottle,
  createSession,
  sessionCookieOptions,
  throttleLogin,
  SESSION_COOKIE,
} from '@/server/auth'

export async function POST(req: Request) {
  if (!req.headers.get('content-type')?.includes('application/json')) {
    return NextResponse.json({ error: 'JSON only' }, { status: 415 })
  }
  const { username, password } = await req.json().catch(() => ({}))
  if (typeof username !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ error: 'Username and password required' }, { status: 400 })
  }
  // Render appends the real client IP as the LAST entry of X-Forwarded-For; a client can only
  // forge entries to the left of it. Taking the rightmost hop makes the throttle key
  // unspoofable, so a flood of forged XFF values cannot reset the per-account limit.
  const xff = req.headers.get('x-forwarded-for') ?? 'local'
  const clientIp = xff.split(',').pop()!.trim() || 'local'
  // Global per-IP gate: caps TOTAL attempts from one IP regardless of which usernames it targets,
  // so password-spraying many usernames from a single IP is capped even though no single
  // per-username key trips. Checked alongside the per-username key below.
  if (!throttleLogin(`login-ip:${clientIp}`)) {
    return NextResponse.json({ error: 'Too many tries — wait ten minutes' }, { status: 429 })
  }
  const key = `${clientIp}:${username.toLowerCase()}`
  if (!throttleLogin(key)) {
    return NextResponse.json({ error: 'Too many tries — wait ten minutes' }, { status: 429 })
  }
  const userId = authenticate(username, password)
  if (!userId) {
    return NextResponse.json({ error: 'Wrong username or password' }, { status: 401 })
  }
  clearThrottle(key)
  const { token, expiresAt } = createSession(userId)
  const res = NextResponse.json({ ok: true, userId })
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt))
  return res
}
