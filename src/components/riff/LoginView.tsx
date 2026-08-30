'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

const FIELD =
  'w-full rounded-[12px] border border-border-subtle bg-background px-4 py-3 text-[14px] text-foreground placeholder:text-foreground-dim focus:outline-none focus:ring-1 focus:ring-ring'

/**
 * Sign in. OUTSIDE the store provider — success navigates with a full page load so the server
 * layout builds the session store. Server errors (wrong password, the 429 throttle) render
 * inline and the form re-enables.
 */
export function LoginView() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (res.ok) {
        window.location.href = '/jams'
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
          Welcome back
        </h1>
        <p className="mb-6 text-[14px] text-foreground-dim">
          Sign in and pick up where you left off.
        </p>

        <form onSubmit={submit} noValidate>
          <Card className="p-4">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="login-username"
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
                    id="login-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="marcusdrums"
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    className={`${FIELD} pl-9`}
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="login-password"
                  className="mb-1.5 block text-[12px] font-medium text-foreground-dim"
                >
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className={FIELD}
                />
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
            disabled={busy || !username || !password}
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <Link
          href="/signup"
          className="mt-4 block py-2 text-center text-[14px] font-medium text-primary"
        >
          New to Riff? Create your player card
        </Link>
      </main>
    </>
  )
}
