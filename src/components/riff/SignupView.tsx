'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

const FIELD =
  'w-full rounded-[12px] border border-border-subtle bg-background px-4 py-3 text-[14px] text-foreground placeholder:text-foreground-dim focus:outline-none focus:ring-1 focus:ring-ring'

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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
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
                  placeholder="Marcus Chen"
                  autoComplete="name"
                  className={FIELD}
                />
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
                    placeholder="marcusdrums"
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    className={`${FIELD} pl-9`}
                  />
                </div>
                <p className="mt-1.5 text-[12px] text-foreground-dim">
                  3–20 characters · lowercase letters, numbers and _
                </p>
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
                  autoComplete="new-password"
                  className={FIELD}
                />
                <p className="mt-1.5 text-[12px] text-foreground-dim">At least 8 characters</p>
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
                  placeholder="you@example.com"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className={FIELD}
                />
                <p className="mt-1.5 text-[12px] text-foreground-dim">
                  We&rsquo;ll only use it to help you back in.
                </p>
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
            disabled={busy || !name.trim() || !username || !password || !acceptedTerms}
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
