'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, Check } from 'lucide-react'
import { Button, buttonClass } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/cn'
import { isValidEmail, isValidPassword, isValidUsername } from '@/lib/validation'

const FIELD =
  'w-full rounded-[12px] border border-border-subtle bg-background px-4 py-3 text-[14px] text-foreground placeholder:text-foreground-dim focus:outline-none focus:ring-1 focus:ring-ring'

type Step = 'request' | 'reset' | 'done'

/**
 * Password recovery, a two-step flow on one screen. Lives OUTSIDE the store — there is no viewer
 * to reset for — so it talks straight to the auth routes and never touches useRiffStore.
 *
 * Step 1 asks for a username and requests a code. In production the code would be emailed; in
 * preview the route returns it as `devToken`, so we surface it plainly and jump to step 2 with
 * it prefilled. Step 2 takes the code plus a new password and sets it.
 */
export function ResetView() {
  const [step, setStep] = useState<Step>('request')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [devToken, setDevToken] = useState<string | null>(null)
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [touched, setTouched] = useState({ username: false, email: false, password: false })
  const touch = (field: keyof typeof touched) =>
    setTouched((t) => (t[field] ? t : { ...t, [field]: true }))

  // Mirror the server's rules so the button reflects real validity, not just non-emptiness.
  const usernameOk = isValidUsername(username)
  const emailOk = isValidEmail(email)
  const passwordOk = isValidPassword(password)
  const requestValid = usernameOk && emailOk
  const resetValid = token.trim().length > 0 && passwordOk

  const requestCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!requestValid) {
      setTouched((t) => ({ ...t, username: true, email: true }))
      return
    }
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      const res = await fetch('/api/auth/request-reset', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username, email }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Something went wrong — try again')
        setBusy(false)
        return
      }
      setMessage(typeof data.message === 'string' ? data.message : null)
      // A real account gets a devToken back (preview only) — prefill it and move on.
      if (typeof data.devToken === 'string' && data.devToken) {
        setDevToken(data.devToken)
        setToken(data.devToken)
        setStep('reset')
      }
    } catch {
      setError('Something went wrong — try again')
    }
    setBusy(false)
  }

  const setNewPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetValid) {
      setTouched((t) => ({ ...t, password: true }))
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      if (res.ok) {
        setStep('done')
        setBusy(false)
        return
      }
      const data = await res.json().catch(() => ({}))
      setError(typeof data.error === 'string' ? data.error : 'Something went wrong — try again')
    } catch {
      setError('Something went wrong — try again')
    }
    setBusy(false)
  }

  return (
    <>
      <header className="flex h-[56px] shrink-0 items-center bg-background px-4">
        <Link
          href="/login"
          aria-label="Back"
          className="-ml-1 flex h-8 w-8 items-center justify-start text-foreground transition-transform active:scale-90"
        >
          <ChevronLeft size={20} />
        </Link>
      </header>

      <main className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-6 pb-8 pt-4">
        {step === 'done' ? (
          <div className="text-center">
            <div className="mx-auto mb-4 mt-8 flex h-12 w-12 items-center justify-center rounded-full bg-success-soft text-success">
              <Check size={22} strokeWidth={3} />
            </div>
            <h1 className="mb-2 font-serif text-[28px] font-bold leading-tight text-foreground">
              Password updated
            </h1>
            <p className="mx-auto mb-8 max-w-[280px] text-[14px] text-foreground-dim">
              You&rsquo;re all set. Sign in with your new password and pick up where you left off.
            </p>
            <Link href="/login" className={buttonClass({ fullWidth: true })}>
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <h1 className="mb-2 font-serif text-[28px] font-bold leading-tight text-foreground">
              Reset your password
            </h1>
            <p className="mb-6 text-[14px] text-foreground-dim">
              {step === 'request'
                ? 'Enter your username and recovery email and we’ll issue a reset code.'
                : 'Enter the reset code and choose a new password.'}
            </p>

            {step === 'request' ? (
              <form onSubmit={requestCode} noValidate>
                <Card className="p-4">
                  <label
                    htmlFor="reset-username"
                    className="mb-1.5 block text-[12px] font-medium text-foreground-dim"
                  >
                    Username
                  </label>
                  <div className="relative">
                    <span
                      aria-hidden
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[14px] text-foreground-dim"
                    >
                      @
                    </span>
                    <input
                      id="reset-username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onBlur={() => touch('username')}
                      placeholder="marcusdrums"
                      autoComplete="username"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      aria-invalid={touched.username && !usernameOk}
                      className={`${FIELD} pl-9`}
                    />
                  </div>
                  {touched.username && !usernameOk && (
                    <p className="mt-1.5 text-[12px] text-destructive">
                      Enter your username (3–20 characters, a–z, 0–9 and _).
                    </p>
                  )}

                  <label
                    htmlFor="reset-email"
                    className="mb-1.5 mt-4 block text-[12px] font-medium text-foreground-dim"
                  >
                    Recovery email
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => touch('email')}
                    placeholder="you@example.com"
                    autoComplete="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    aria-invalid={touched.email && !emailOk}
                    className={FIELD}
                  />
                  <p
                    className={cn(
                      'mt-1.5 text-[12px]',
                      touched.email && !emailOk ? 'text-destructive' : 'text-foreground-dim',
                    )}
                  >
                    {touched.email && !emailOk
                      ? 'That email does not look right.'
                      : 'The email you signed up with — that’s how we know it’s you.'}
                  </p>
                </Card>

                {message && <p className="mt-4 text-[13px] text-foreground-dim">{message}</p>}
                {error && (
                  <p role="alert" className="mt-4 text-[13px] text-destructive">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  fullWidth
                  className="mt-6 font-semibold"
                  disabled={busy || !requestValid}
                >
                  {busy ? 'Sending…' : 'Send reset code'}
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setError(null)
                    setStep('reset')
                  }}
                  className="mt-4 block w-full py-2 text-center text-[14px] font-medium text-primary"
                >
                  I already have a code
                </button>
              </form>
            ) : (
              <form onSubmit={setNewPassword} noValidate>
                {devToken && (
                  <div className="mb-4 rounded-[12px] border border-primary/30 bg-primary/10 p-4">
                    <p className="text-[13px] leading-snug text-foreground">
                      <span className="font-semibold">Preview mode:</span> in production this code
                      is emailed. Your code:{' '}
                      <span className="font-mono font-semibold text-primary">{devToken}</span>
                    </p>
                  </div>
                )}

                <Card className="p-4">
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="reset-token"
                        className="mb-1.5 block text-[12px] font-medium text-foreground-dim"
                      >
                        Reset code
                      </label>
                      <input
                        id="reset-token"
                        type="text"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder="Paste your code"
                        autoComplete="one-time-code"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        className={FIELD}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="reset-password"
                        className="mb-1.5 block text-[12px] font-medium text-foreground-dim"
                      >
                        New password
                      </label>
                      <input
                        id="reset-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onBlur={() => touch('password')}
                        autoComplete="new-password"
                        aria-invalid={touched.password && !passwordOk}
                        className={FIELD}
                      />
                      <p
                        className={cn(
                          'mt-1.5 text-[12px]',
                          touched.password && !passwordOk
                            ? 'text-destructive'
                            : 'text-foreground-dim',
                        )}
                      >
                        At least 8 characters
                      </p>
                    </div>
                  </div>
                </Card>

                {error && (
                  <p role="alert" className="mt-4 text-[13px] text-destructive">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  fullWidth
                  className="mt-6 font-semibold"
                  disabled={busy || !resetValid}
                >
                  {busy ? 'Saving…' : 'Set new password'}
                </Button>
              </form>
            )}
          </>
        )}
      </main>
    </>
  )
}
