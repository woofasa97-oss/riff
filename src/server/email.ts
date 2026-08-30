/**
 * Transactional email. SERVER-ONLY.
 *
 * Uses Resend's REST API over plain `fetch` (no SDK dependency). It is OFF until configured: set
 * RESEND_API_KEY (and optionally RIFF_EMAIL_FROM) and delivery turns on with no code change. When
 * unconfigured, emailConfigured() is false and callers fall back to their preview behaviour.
 *
 * Why this shape: password recovery must eventually deliver a code out-of-band rather than
 * returning it over HTTP. Wiring the provider here — behind an env flag — lets the reset route
 * email the code the moment a key exists, and stop exposing it, without touching the flow.
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails'

/** Whether an email provider is configured for this deployment. */
export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY)
}

/** The verified sender. Resend's shared onboarding@resend.dev works for testing without a domain. */
function fromAddress(): string {
  return process.env.RIFF_EMAIL_FROM ?? 'Riff <onboarding@resend.dev>'
}

export interface EmailMessage {
  to: string
  subject: string
  text: string
  html?: string
}

/**
 * Send one email. Returns true on accepted delivery, false if no provider is configured or the
 * provider rejected it. Never throws for a delivery failure — callers that must not leak whether
 * an account exists (e.g. password reset) rely on the result NOT changing their HTTP response.
 */
export async function sendEmail(msg: EmailMessage): Promise<boolean> {
  const key = process.env.RESEND_API_KEY
  if (!key) return false
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress(),
        to: msg.to,
        subject: msg.subject,
        text: msg.text,
        ...(msg.html ? { html: msg.html } : {}),
      }),
    })
    if (!res.ok) {
      console.error(`[riff] email send failed: ${res.status} ${await res.text().catch(() => '')}`)
      return false
    }
    return true
  } catch (err) {
    console.error('[riff] email send error:', (err as Error).message)
    return false
  }
}

/** Deliver a password-reset code. `to` is the recovery email already verified against the account. */
export async function sendResetEmail(to: string, code: string): Promise<boolean> {
  const subject = 'Your Riff password reset code'
  const text = [
    'You asked to reset your Riff password.',
    '',
    `Your reset code is: ${code}`,
    '',
    'Enter it on the reset screen to choose a new password. The code expires in 30 minutes.',
    'If you did not request this, you can ignore this email — nothing has changed.',
  ].join('\n')
  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:440px;margin:0 auto;color:#211d2b">
      <div style="width:44px;height:44px;border-radius:12px;background:#8a79ab;color:#fff;
                  display:flex;align-items:center;justify-content:center;font-size:22px;
                  font-weight:700;font-family:Georgia,serif;margin-bottom:18px">R</div>
      <h1 style="font-family:Georgia,serif;font-size:22px;margin:0 0 8px">Reset your password</h1>
      <p style="font-size:14px;line-height:1.6;color:#6b6880;margin:0 0 20px">
        You asked to reset your Riff password. Enter this code on the reset screen — it expires in 30 minutes.
      </p>
      <div style="font-family:'JetBrains Mono',ui-monospace,monospace;font-size:24px;font-weight:600;
                  letter-spacing:2px;background:#f4f2f7;border:1px solid #e4e0eb;border-radius:12px;
                  padding:16px;text-align:center;color:#211d2b">${code}</div>
      <p style="font-size:12px;line-height:1.6;color:#948ea6;margin:20px 0 0">
        If you didn’t request this, you can ignore this email — nothing has changed.
      </p>
    </div>`
  return sendEmail({ to, subject, text, html })
}
