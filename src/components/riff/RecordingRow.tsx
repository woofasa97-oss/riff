import { WaveformPlayer } from '@/components/riff/WaveformPlayer'
import { AvatarStack } from '@/components/ui/Avatar'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/datetime'
import { peaksFor } from '@/lib/waveform'
import { getMusician, getRecording, getVenue } from '@/mocks'
import type { Jam, Musician } from '@/types'

/**
 * One completed jam with its recording — the PAST JAMS row on a musician profile
 * (42-profile-musician.html). Renders nothing when the jam's recording id resolves to
 * nothing: a session without published audio is history, not a row here.
 */
export function RecordingRow({ jam, className }: { jam: Jam; className?: string }) {
  const recording = jam.recordingId ? getRecording(jam.recordingId) : undefined
  if (!recording) return null

  // The venue's name only — a recording never carries an address (product rule 2).
  const venueName = recording.venueName ?? getVenue(jam.venueId)?.name
  const players = jam.attendees
    .filter((a) => a.rsvp === 'confirmed')
    .map((a) => getMusician(a.musicianId))
    .filter((m): m is Musician => Boolean(m))

  return (
    <Card className={cn('p-4', className)}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-serif text-[16px] font-bold leading-tight text-foreground">
            {recording.title}
          </h3>
          {venueName && (
            <p className="mt-0.5 truncate text-[12px] text-foreground-dim">{venueName}</p>
          )}
        </div>
        <span className="mt-1 shrink-0 text-[11px] font-bold uppercase tracking-[0.04em] text-foreground-dim">
          {formatDate(recording.recordedAt)}
        </span>
      </div>

      {players.length > 0 && <AvatarStack people={players} size="sm" className="mb-3" />}

      {/* The scrubber shows the running clock and total via formatClock. */}
      <WaveformPlayer
        peaks={peaksFor(recording.id)}
        durationSec={recording.durationSec}
        label={`${recording.title} recording`}
        compact
      />
    </Card>
  )
}
