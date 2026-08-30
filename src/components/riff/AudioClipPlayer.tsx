'use client'

import { WaveformPlayer } from '@/components/riff/WaveformPlayer'
import { peaksFor } from '@/lib/waveform'
import type { AudioClip } from '@/types'

/**
 * An AudioClip rendered as an inline player (docs/BUILD-PLAN.md P2-01). Playback is a real
 * playhead over stubbed audio — see WaveformPlayer. Peaks come from the clip when it has them,
 * otherwise deterministically from its id so server and client agree.
 */
export function AudioClipPlayer({
  clip,
  label,
  compact = true,
  className,
}: {
  clip: AudioClip
  label: string
  compact?: boolean
  className?: string
}) {
  return (
    <WaveformPlayer
      peaks={clip.waveform ?? peaksFor(clip.id)}
      durationSec={clip.durationSec}
      label={label}
      compact={compact}
      className={className}
    />
  )
}
