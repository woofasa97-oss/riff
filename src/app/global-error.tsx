'use client'

import { useEffect } from 'react'

/**
 * Last-resort boundary: catches errors thrown by the ROOT layout itself (e.g. a database failure
 * while building the snapshot). It replaces the entire document, so it must render its own
 * <html>/<body> and cannot rely on globals.css or the font variables being present — hence the
 * fully self-contained inline styles in Riff's palette.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[riff] fatal error:', error)
    // Also ship it to the server log sink so a browser-thrown error reaches the same structured
    // logs (and webhook) as a server error. Guarded so reporting can never throw inside a boundary.
    try {
      void fetch('/api/log', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          context: 'global-error',
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
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8f7fa',
          color: '#211d2b',
          fontFamily: 'Georgia, "Times New Roman", serif',
          textAlign: 'center',
          padding: '0 32px',
        }}
      >
        <div style={{ maxWidth: 340 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: '#8a79ab',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              fontWeight: 700,
              margin: '0 auto 20px',
            }}
          >
            R
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px', lineHeight: 1.2 }}>
            Riff hit a wrong note
          </h1>
          <p
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: 14,
              lineHeight: 1.6,
              color: '#6b6880',
              margin: '0 0 24px',
            }}
          >
            Something went wrong on our end. Try reloading — it usually clears right up.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: 15,
              fontWeight: 600,
              color: '#fff',
              background: '#8a79ab',
              border: 'none',
              borderRadius: 12,
              padding: '11px 22px',
              cursor: 'pointer',
            }}
          >
            Reload Riff
          </button>
        </div>
      </body>
    </html>
  )
}
