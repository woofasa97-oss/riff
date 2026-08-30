import { NextResponse } from 'next/server'
import { issueResetToken, throttleLogin } from '@/server/auth'
import { emailConfigured, sendResetEmail } from '@/server/email'

/**
 * Start a password reset. Three protections make this safe:
 *  1. A token is issued ONLY when the submitted email matches the account's recovery email
 *     (issueResetToken) — so a username alone can never trigger a takeover, and accounts with
 *     no email on file simply can't self-recover.
 *  2. When an email provider is configured (RESEND_API_KEY), the code is DELIVERED BY EMAIL and
 *     never returned over HTTP — even in preview. Setting the key is what flips recovery from
 *     preview-grade to launch-grade.
 *  3. Only as a fallback — a throwaway PREVIEW deployment (RIFF_PREVIEW_RESET=1) with no email
 *     provider — is the raw token surfaced in the response, so the demo stays self-serve.
 *
 * The response is byte-identical whether or not the account exists, so this cannot enumerate
 * usernames, and email delivery is out-of-band so its success never changes the response.
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
  // Deliver by email when a provider exists. Awaited but its result never changes the response
  // (enumeration resistance) — a failed send is logged inside sendResetEmail.
  if (token && emailConfigured()) {
    await sendResetEmail(email, token)
  }
  return NextResponse.json({
    ok: true,
    message: emailConfigured()
      ? 'If that username and recovery email match an account, a reset code is on its way by email.'
      : 'If that username and recovery email match an account, a reset code has been issued.',
    // Fallback ONLY: preview deploy with no email provider. Once RESEND_API_KEY is set the code
    // is emailed and never returned here, even in preview.
    ...(PREVIEW && !emailConfigured() ? { devToken: token ?? null } : {}),
  })
}
