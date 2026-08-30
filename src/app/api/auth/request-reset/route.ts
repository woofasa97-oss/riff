import { NextResponse } from 'next/server'
import { issueResetToken, throttleLogin } from '@/server/auth'

/**
 * Start a password reset. Two protections make this safe:
 *  1. A token is issued ONLY when the submitted email matches the account's recovery email
 *     (issueResetToken) — so a username alone can never trigger a takeover, and accounts with
 *     no email on file simply can't self-recover.
 *  2. The raw token is NEVER returned to the caller in production. In a throwaway PREVIEW
 *     deployment (RIFF_PREVIEW_RESET=1) it is surfaced in the response so the flow is
 *     self-serve without a mail provider; otherwise it would be delivered by email.
 *
 * The response is byte-identical whether or not the account exists (outside preview), so this
 * cannot be used to enumerate usernames.
 */
const PREVIEW = process.env.RIFF_PREVIEW_RESET === '1'

export async function POST(req: Request) {
  if (!req.headers.get('content-type')?.includes('application/json')) {
    return NextResponse.json({ error: 'JSON only' }, { status: 415 })
  }
  const { username, email } = await req.json().catch(() => ({}))
  if (
    typeof username !== 'string' ||
    !username.trim() ||
    typeof email !== 'string' ||
    !email.trim()
  ) {
    return NextResponse.json({ error: 'Enter your username and recovery email' }, { status: 400 })
  }
  // Trusted-hop IP (rightmost XFF entry), as with login, so a forged header can't rotate the key.
  const ip = (req.headers.get('x-forwarded-for') ?? 'local').split(',').pop()!.trim()
  if (!throttleLogin(`reset:${ip}`)) {
    return NextResponse.json({ error: 'Too many attempts — wait a bit' }, { status: 429 })
  }
  const token = issueResetToken(username, email)
  return NextResponse.json({
    ok: true,
    message: 'If that username and recovery email match an account, a reset code has been issued.',
    // Preview-only: lets the demo complete a reset without email. Never present in production.
    ...(PREVIEW ? { devToken: token ?? null } : {}),
  })
}
