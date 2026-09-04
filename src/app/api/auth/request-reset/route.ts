import { NextResponse } from 'next/server'
import { issueResetToken, throttleLogin } from '@/server/auth'
import { emailConfigured, sendResetEmail } from '@/server/email'

/**
 * Start a password reset. Protections:
 *  1. A token is issued ONLY when the submitted email matches the account's recovery email
 *     (issueResetToken) — so a username alone can never trigger a takeover, and accounts with
 *     no email on file simply can't self-recover.
 *  2. The code is DELIVERED BY EMAIL (RESEND_API_KEY) and never returned over HTTP. With no
 *     provider configured the token is issued but undeliverable — recovery honestly requires
 *     the email pipe, and nothing leaks a code into a response body.
 *
 * The response is byte-identical whether or not the account exists, so this cannot enumerate
 * usernames, and email delivery is out-of-band so its success never changes the response.
 */

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
  // Deliver by email when a provider exists. Awaited but its result never changes the response
  // (enumeration resistance) — a failed send is logged inside sendResetEmail.
  if (token && emailConfigured()) {
    await sendResetEmail(email, token)
  }
  // `token` is deliberately unused beyond delivery — it must never appear in a response body.
  void token
  return NextResponse.json({
    ok: true,
    message:
      'If that username and recovery email match an account, a reset code is on its way by email.',
  })
}
