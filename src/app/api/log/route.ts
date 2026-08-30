/**
 * Client error sink. The client-side error boundaries (error.tsx / global-error.tsx) POST the
 * error they caught here so browser-thrown failures land in the SAME structured log (and webhook)
 * as server errors, instead of dying silently in a viewer's console. It accepts a small JSON body,
 * caps every field so a hostile client can't flood the logs, and answers 204 no matter what —
 * error reporting must never itself become a failure surface.
 */
import { NextResponse } from 'next/server'
import { logError } from '@/server/log'

/** Trim an untrusted string field to keep a single log line bounded. */
function cap(value: unknown, max: number): string | undefined {
  return typeof value === 'string' && value ? value.slice(0, max) : undefined
}

export async function POST(req: Request) {
  if (!req.headers.get('content-type')?.includes('application/json')) {
    return NextResponse.json({ error: 'JSON only' }, { status: 415 })
  }
  const body = await req.json().catch(() => ({}))

  const context = cap(body?.context, 80) ?? 'client-error'
  const message = cap(body?.message, 500) ?? 'Unknown client error'
  const stack = cap(body?.stack, 500)
  const digest = cap(body?.digest, 80)

  // Rebuild a lightweight Error so logError formats it exactly like a server-side throw. The
  // client already sends just the first stack line, so no further trimming of the trace is needed.
  const err = new Error(message)
  err.stack = stack ?? message

  logError(context, err, digest ? { digest } : undefined)

  return new NextResponse(null, { status: 204 })
}
