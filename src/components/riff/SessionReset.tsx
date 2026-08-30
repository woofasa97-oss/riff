'use client'

import { useEffect } from 'react'

/**
 * Rendered when a session cookie exists but no longer matches a live session (expired, or the
 * database was reset). Clears the cookie server-side and returns to the front door — without
 * this, middleware would keep letting the stale cookie through to screens that need a viewer.
 */
export function SessionReset() {
  useEffect(() => {
    void fetch('/api/auth/logout', { method: 'POST' }).finally(() => {
      window.location.href = '/welcome'
    })
  }, [])
  return (
    <main className="flex flex-1 items-center justify-center px-6">
      <p className="text-[14px] text-foreground-dim">Signing you out…</p>
    </main>
  )
}
