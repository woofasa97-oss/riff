'use client'

import { useEffect } from 'react'

/**
 * Route-segment error boundary. Renders inside the root layout (so it inherits the fonts, tokens
 * and the centred phone column) whenever a page or its data throws. Calm and branded, with a
 * real way forward — never Next's bare "Application error" white screen.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Surfaces in the server logs / browser console for triage.
    console.error('[riff] route error:', error)
    // Also ship it to the server log sink so a browser-thrown error reaches the same structured
    // logs (and webhook) as a server error. Guarded so reporting can never throw inside a boundary.
    try {
      void fetch('/api/log', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          context: 'route-error',
          message: error.message,
          stack: error.stack?.split('\n')[0],
          digest: error.digest,
        }),
      }).catch(() => {})
    } catch {
      // ignore
    }
  }, [error])

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-8 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-foreground-dim">
        <span className="font-serif text-[24px] font-bold">!</span>
      </div>
      <h1 className="font-serif text-[24px] font-bold leading-tight text-foreground">
        Something went off-key
      </h1>
      <p className="mt-2 max-w-[300px] text-[14px] leading-relaxed text-foreground-dim">
        A part of Riff hit a snag loading. It’s not you — try again, and if it keeps happening head
        back home.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-[12px] bg-primary px-5 py-2.5 text-[15px] font-semibold text-primary-foreground transition-transform active:scale-95"
        >
          Try again
        </button>
        <a
          href="/map"
          className="rounded-[12px] bg-surface-muted px-5 py-2.5 text-[15px] font-semibold text-foreground transition-transform active:scale-95"
        >
          Go home
        </a>
      </div>
    </main>
  )
}
