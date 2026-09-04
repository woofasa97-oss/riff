'use client'

import { useEffect, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatClock } from '@/lib/labels'

/**
 * Plays the clip's actual audio. `src` is the recording uploaded via /api/riff/clip — the
 * play button drives a real <audio> element and the playhead follows real currentTime, so the
 * bars a listener watches fill are the sound they are hearing. Without a `src` there is no
 * audio to play, so render nothing: a play button that plays nothing is a fabricated datum.
 */
export function WaveformPlayer({
  src,
  peaks,
  durationSec,
  label,
  className,
  compact = false,
}: {
  /** URL of the real recorded audio. No URL → no player. */
  src?: string
  peaks: number[]
  durationSec: number
  label: string
  className?: string
  /** The tighter variant used inside MusicianCard on Discover. */
  compact?: boolean
}) {
  const [playing, setPlaying] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [failed, setFailed] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Follow the element's real position while playing.
  useEffect(() => {
    if (!playing) return
    const id = window.setInterval(() => {
      const el = audioRef.current
      if (el) setElapsed(el.currentTime)
    }, 100)
    return () => window.clearInterval(id)
  }, [playing])

  if (!src || failed) return null

  const toggle = () => {
    const el = audioRef.current
    if (!el) return
    if (el.paused) {
      void el.play().catch(() => setFailed(true))
    } else {
      el.pause()
    }
  }

  const total = durationSec > 0 ? durationSec : (audioRef.current?.duration ?? 0)
  const progress = total > 0 ? elapsed / total : 0

  return (
    <div
      className={cn(
        'flex items-center rounded-[12px] border border-border-subtle bg-background',
        compact ? 'gap-2 p-2.5' : 'gap-4 p-3',
        className,
      )}
    >
      <audio
        ref={audioRef}
        src={src}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false)
          setElapsed(0)
        }}
        onError={() => setFailed(true)}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? `Pause ${label}` : `Play ${label}`}
        className={cn(
          'flex shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform active:scale-90',
          compact ? 'h-8 w-8' : 'h-10 w-10',
        )}
      >
        {playing ? (
          <Pause size={compact ? 13 : 16} fill="currentColor" />
        ) : (
          <Play size={compact ? 13 : 16} fill="currentColor" className="ml-0.5" />
        )}
      </button>

      <div
        className={cn('flex flex-1 items-center gap-0.5', compact ? 'h-6' : 'h-8')}
        aria-hidden="true"
      >
        {peaks.map((peak, i) => {
          const played = i / peaks.length <= progress
          return (
            <div
              key={i}
              className={cn(
                'w-1 rounded-full transition-colors',
                played ? 'bg-primary' : 'bg-primary/30',
              )}
              style={{ height: `${Math.round(peak * (compact ? 24 : 32))}px` }}
            />
          )
        })}
      </div>

      <span
        className={cn(
          'shrink-0 font-mono font-medium tabular-nums text-foreground',
          compact ? 'text-[12px]' : 'text-[13px]',
        )}
      >
        {formatClock(playing || elapsed > 0 ? Math.floor(elapsed) : Math.round(total))}
      </span>
    </div>
  )
}
