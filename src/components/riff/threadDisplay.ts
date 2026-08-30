import { formatWeekdayAbbr } from '@/lib/datetime'
import { getBand, getJam, getMusician, getVenue } from '@/mocks'
import type { Jam, Musician, Thread } from '@/types'

export interface ThreadDisplay {
  title: string
  /** The uppercase pill under the preview. */
  contextLabel: string
  contextTone: 'primary' | 'accent' | 'neutral'
  /** Faces to draw. Empty for venue and band threads, which use an icon instead. */
  faces: Pick<Musician, 'id' | 'name' | 'avatarUrl'>[]
  icon: 'venue' | 'band' | null
  /** Group threads prefix the preview with who said it. */
  showAuthorInPreview: boolean
}

/**
 * Everything a message row needs to render, resolved in one place so the list and the thread
 * header cannot drift apart.
 */
export function describeThread(
  thread: Thread,
  viewerId: string,
  /** Live jams from the store, so threads created this session resolve their jam. */
  jams?: Jam[],
): ThreadDisplay {
  const others = thread.participantIds
    .filter((id) => id !== viewerId)
    .map((id) => getMusician(id))
    .filter((m): m is Musician => Boolean(m))
    .map((m) => ({ id: m.id, name: m.name, avatarUrl: m.avatarUrl }))

  const jam = thread.jamId
    ? (jams?.find((j) => j.id === thread.jamId) ?? getJam(thread.jamId))
    : undefined
  const jamContext = jam
    ? {
        contextLabel: `${jam.title} · ${formatWeekdayAbbr(jam.startsAt)}`,
        contextTone: 'primary' as const,
      }
    : undefined

  if (thread.kind === 'venue') {
    const venue = thread.venueId ? getVenue(thread.venueId) : undefined
    return {
      title: venue?.name ?? 'Venue',
      contextLabel: 'Venue',
      contextTone: 'neutral',
      faces: [],
      icon: 'venue',
      showAuthorInPreview: false,
    }
  }

  if (thread.kind === 'band') {
    const band = thread.bandId ? getBand(thread.bandId) : undefined
    return {
      title: band?.name ?? 'Band',
      contextLabel: band?.name ?? 'Band',
      contextTone: 'neutral',
      faces: others,
      icon: 'band',
      showAuthorInPreview: true,
    }
  }

  if (thread.kind === 'jam') {
    return {
      title: jam?.title ?? 'Jam',
      ...(jamContext ?? { contextLabel: 'Jam', contextTone: 'primary' as const }),
      faces: others,
      icon: null,
      showAuthorInPreview: others.length > 1,
    }
  }

  // Direct. A request is the more useful label when there is one; otherwise fall back to the
  // jam that the conversation is about.
  const context = thread.requestId
    ? { contextLabel: 'Jam request', contextTone: 'accent' as const }
    : (jamContext ?? { contextLabel: 'Direct', contextTone: 'neutral' as const })

  return {
    title: others[0]?.name ?? 'Conversation',
    ...context,
    faces: others,
    icon: null,
    showAuthorInPreview: false,
  }
}

/** Message authors are usually musicians, but a venue thread's other side is the venue. */
export function authorName(authorId: string): string {
  if (authorId === 'system') return 'Riff'
  return getMusician(authorId)?.name ?? getVenue(authorId)?.name ?? 'Someone'
}
