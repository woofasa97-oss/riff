/**
 * Structured logging. SERVER-ONLY.
 *
 * One seam every server error and notable event flows through, so triage reads a single
 * predictable line instead of chasing ad-hoc console.* calls scattered across routes. Each call
 * emits ONE structured JSON line — level, context, message, first stack line, meta, ISO time — to
 * the platform's stdout/stderr (which Render already captures) and, when RIFF_LOG_WEBHOOK is set,
 * fires the same JSON at that URL. That webhook is the seam a real error tracker or a Slack
 * incoming-webhook plugs into later with one env var and no code change.
 *
 * Deliberately dependency-free and non-throwing: logging must never itself take down a request.
 * Nothing here touches the clock at module load — the timestamp is read inside the call.
 */

type Meta = Record<string, unknown>

interface LogEntry {
  level: 'error' | 'info'
  context: string
  message?: string
  /** First line of the stack — enough to locate the throw without dumping the whole trace. */
  stack?: string
  meta?: Meta
  time: string
}

/** Best-effort human message from an unknown throwable. */
function messageOf(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  try {
    return JSON.stringify(err)
  } catch {
    return String(err)
  }
}

/** First line of a stack trace, if this throwable carries one. */
function firstStackLine(err: unknown): string | undefined {
  if (err instanceof Error && typeof err.stack === 'string') {
    return err.stack.split('\n')[0]?.trim() || undefined
  }
  return undefined
}

/** Serialize an entry to one line, degrading gracefully if meta is circular/non-serializable. */
function safeStringify(entry: LogEntry): string {
  try {
    return JSON.stringify(entry)
  } catch {
    return JSON.stringify({
      level: entry.level,
      context: entry.context,
      message: entry.message,
      time: entry.time,
    })
  }
}

/** Write the line to the console and, if configured, fire it at the log webhook. */
function emit(entry: LogEntry): void {
  const line = safeStringify(entry)
  if (entry.level === 'error') console.error(line)
  else console.log(line)

  const url = process.env.RIFF_LOG_WEBHOOK
  if (url) {
    // Fire-and-forget: never await (must not block the request) and never let a delivery failure
    // surface. A real error tracker / Slack incoming webhook plugs in here via one env var.
    try {
      void fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: line,
      }).catch(() => {})
    } catch {
      // fetch threw synchronously (e.g. a malformed URL) — swallow.
    }
  }
}

/** Log an error against a short context tag, with optional structured metadata. */
export function logError(context: string, err: unknown, meta?: Meta): void {
  emit({
    level: 'error',
    context,
    message: messageOf(err),
    stack: firstStackLine(err),
    ...(meta ? { meta } : {}),
    time: new Date().toISOString(),
  })
}

/** Log a notable non-error event against a short context tag. */
export function logInfo(context: string, meta?: Meta): void {
  emit({
    level: 'info',
    context,
    ...(meta ? { meta } : {}),
    time: new Date().toISOString(),
  })
}
