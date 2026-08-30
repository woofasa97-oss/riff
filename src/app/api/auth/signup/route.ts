import { NextResponse } from 'next/server'
import { createAccount } from '@/server/accounts'
import { createSession, sessionCookieOptions, validateSignup, SESSION_COOKIE } from '@/server/auth'
import { WorldError } from '@/server/world'

export async function POST(req: Request) {
  if (!req.headers.get('content-type')?.includes('application/json')) {
    return NextResponse.json({ error: 'JSON only' }, { status: 415 })
  }
  const body = await req.json().catch(() => ({}))
  const parsed = validateSignup(body)
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })
  try {
    const userId = createAccount(parsed.name, parsed.username, parsed.password)
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
