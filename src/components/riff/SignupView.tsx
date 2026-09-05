'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/cn'
import {
  isValidName,
  isValidOptionalEmail,
  isValidPassword,
  isValidUsername,
} from '@/lib/validation'

const FIELD =
  'w-full rounded-[12px] border border-border-subtle bg-background px-4 py-3 text-[14px] text-foreground placeholder:text-foreground-dim focus:outline-none focus:ring-1 focus:ring-ring'

/** A field hint that turns into an error once the field has been touched and is still invalid. */
function Hint({ ok, touched, children }: { ok: boolean; touched: boolean; children: React.ReactNode }) {
  const invalid = touched && !ok
  return (
    <p className={cn('mt-1.5 text-[12px]', invalid ? 'text-destructive' : 'text-foreground-dim')}>
      {children}
    </p>
  )
}

/**
 * Account creation. This screen lives OUTSIDE the store provider — there is no viewer yet —
 * so success navigates with a full page load and the server layout builds the session store.
 * The server owns validation; its message renders inline and the form re-enables.
 */
export function SignupView() {
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // A field only shows its rule as an *error* once the user has left it (or tried to submit).
  const [touched, setTouched] = useState({
    name: false,
    username: false,
    password: false,
    email: false,
  })
  const touch = (field: keyof typeof touched) =>
    setTouched((t) => (t[field] ? t : { ...t, [field]: true }))

  // Live validity, mirroring the server (src/lib/validation.ts). Email is optional.
  const nameOk = isValidName(name)
  const usernameOk = isValidUsername(username)
  const passwordOk = isValidPassword(password)
  const emailOk = isValidOptionalEmail(email)
  const allValid = nameOk && usernameOk && passwordOk && emailOk && acceptedTerms

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Enter can submit even with the button disabled — reveal every unmet rule instead.
    if (!allValid) {
      setTouched({ name: true, username: true, password: true, email: true })
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        // Email is optional (recovery only); the server refuses any signup without acceptedTerms.
        body: JSON.stringify({
          name,
          username,
          password,
          acceptedTerms: true,
          ...(email.trim() ? { email: email.trim() } : {}),
        }),
      })
      if (res.ok) {
        window.location.href = '/onboarding/location'
        return // stay disabled while the browser navigates
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
          href="/welcome"
          aria-label="Back"
          className="-ml-1 flex h-8 w-8 items-center justify-start text-foreground transition-transform active:scale-90"
        >
          <ChevronLeft size={20} />
        </Link>
      </header>

      <main className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-6 pb-8 pt-4">
        <h1 className="mb-2 font-serif text-[28px] font-bold leading-tight text-foreground">
          Claim your handle
        </h1>
        <p className="mb-6 text-[14px] text-foreground-dim">
          Your handle is how players find you. The rest of your card comes next.
        </p>

        <form onSubmit={submit} noValidate>
          <Card className="p-4">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="signup-name"
                  className="mb-1.5 block text-[12px] font-medium text-foreground-dim"
                >
                  Display name
                </label>
                <input
                  id="signup-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => touch('name')}
                  placeholder="Marcus Chen"
                  autoComplete="name"
                  aria-invalid={touched.name && !nameOk}
                  className={FIELD}
                />
                <Hint ok={nameOk} touched={touched.name}>
                  {touched.name && !nameOk ? 'Enter your name (2–40 characters).' : '2–40 characters'}
                </Hint>
              </div>
              <div>
                <label
                  htmlFor="signup-username"
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
                    id="signup-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
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
                <Hint ok={usernameOk} touched={touched.username}>
                  3–20 characters · lowercase letters, numbers and _
                </Hint>
              </div>
              <div>
                <label
                  htmlFor="signup-password"
                  className="mb-1.5 block text-[12px] font-medium text-foreground-dim"
                >
                  Password
                </label>
                <input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => touch('password')}
                  autoComplete="new-password"
                  aria-invalid={touched.password && !passwordOk}
                  className={FIELD}
                />
                <Hint ok={passwordOk} touched={touched.password}>
                  At least 8 characters
                </Hint>
              </div>
              <div>
                <label
                  htmlFor="signup-email"
                  className="mb-1.5 block text-[12px] font-medium text-foreground-dim"
                >
                  Email (optional) — for account recovery
                </label>
                <input
                  id="signup-email"
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
                <Hint ok={emailOk} touched={touched.email}>
                  {touched.email && !emailOk
                    ? 'That email does not look right.'
                    : 'We’ll only use it to help you back in.'}
                </Hint>
              </div>
            </div>
          </Card>

          {/* Required: the server 400s a signup without acceptedTerms, so gate the button too. */}
          <label
            htmlFor="signup-terms"
            className="mt-4 flex cursor-pointer items-start gap-3 text-[13px] leading-snug text-foreground-dim"
          >
            <input
              id="signup-terms"
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 rounded-[6px] border-border-subtle text-primary accent-primary focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <span>
              I agree to the{' '}
              <Link href="/terms" className="font-medium text-primary underline">
                Terms
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="font-medium text-primary underline">
                Privacy Policy
              </Link>
            </span>
          </label>

          {error && (
            <p role="alert" className="mt-4 text-[13px] text-destructive">
              {error}
            </p>
          )}

          <Button
            type="submit"
            fullWidth
            className="mt-6 font-semibold"
            disabled={busy || !allValid}
          >
            {busy ? 'Creating your card…' : 'Create account'}
          </Button>
        </form>

        <Link
          href="/login"
          className="mt-4 block py-2 text-center text-[14px] font-medium text-primary"
        >
          I already have an account
        </Link>
      </main>
    </>
  )
}
