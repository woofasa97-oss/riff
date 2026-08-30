'use client'

import { useEffect, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatClock } from '@/lib/labels'

/**
 * Playback is simulated. docs/SPEC.md §6 puts real audio out of scope for v1, but a play button
 * that does nothing is a dead control — so this advances a real playhead against the clip's
 * duration and fills the waveform as it goes. Swap the timer for an <audio> element later.
 */
export function WaveformPlayer({
  peaks,
  durationSec,
  label,
  className,
}: {
  peaks: number[]
  durationSec: number
  label: string
  className?: string
}) {
  const [playing, setPlaying] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const startedRef = useRef<{ at: number; from: number } | null>(null)

  useEffect(() => {
    if (!playing) {
      startedRef.current = null
      return
    }
    startedRef.current = { at: Date.now(), from: elapsed }
    const id = window.setInterval(() => {
      const started = startedRef.current
      if (!started) return
      const next = started.from + (Date.now() - started.at) / 1000
      if (next >= durationSec) {
        setElapsed(0)
        setPlaying(false)
      } else {
        setElapsed(next)
      }
    }, 100)
    return () => window.clearInterval(id)
    // `elapsed` is intentionally not a dependency: it is the seek origin, captured once per
    // play, and including it would restart the interval ten times a second.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, durationSec])

  const progress = durationSec > 0 ? elapsed / durationSec : 0

  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-[12px] border border-border-subtle bg-background p-3',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setPlaying((p) => !p)}
        aria-label={playing ? `Pause ${label}` : `Play ${label}`}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform active:scale-90"
      >
        {playing ? (
          <Pause size={16} fill="currentColor" />
        ) : (
          <Play size={16} fill="currentColor" className="ml-0.5" />
        )}
      </button>

      <div className="flex h-8 flex-1 items-center gap-0.5" aria-hidden="true">
        {peaks.map((peak, i) => {
          const played = i / peaks.length <= progress
          return (
            <div
              key={i}
              className={cn(
                'w-1 rounded-full transition-colors',
                played ? 'bg-primary' : 'bg-primary/30',
              )}
              style={{ height: `${Math.round(peak * 32)}px` }}
            />
          )
        })}
      </div>

      <span className="shrink-0 font-mono text-[13px] font-medium tabular-nums text-foreground">
        {formatClock(playing || elapsed > 0 ? Math.floor(elapsed) : durationSec)}
      </span>
    </div>
  )
}
