'use client'

import { create } from 'zustand'
import {
  CURRENT_USER_ID,
  NOW,
  jams as seedJams,
  messages as seedMessages,
  recordingConsents as seedConsents,
  sessionRecaps as seedRecaps,
  vouches as seedVouches,
} from '@/mocks'
import { deriveStats, type ReputationContext } from '@/lib/reputation'
import { getMusician } from '@/mocks'
import type { Jam, Message, MusicianStats, RecapVouch, SessionRecap } from '@/types'

/**
 * Session state. Seeded from the fixtures so the first server render and the first client
 * render produce identical markup; everything after that is the user's own doing.
 *
 * There is no backend (docs/CLAUDE.md), so this is where a jam's status, a filed recap and a
 * sent message live once the user has touched them.
 */
interface RiffState {
  jams: Jam[]
  recaps: SessionRecap[]
  messages: Message[]
  /** jamId → musicianIds who agreed to publish the recording. */
  recordingConsents: Record<string, string[]>
  /** Advances the mock clock a minute at a time so in-session activity sorts and reads right. */
  tick: number

  postRecap: (input: {
    jamId: string
    authorId?: string
    attendance: Record<string, boolean>
    vouches: RecapVouch[]
    publishRecording: boolean
    durationLabel: string
  }) => SessionRecap
  sendMessage: (threadId: string, body: string, authorId?: string) => Message
  setRecordingConsent: (jamId: string, musicianId: string, consents: boolean) => void
  withdrawFromJam: (jamId: string, musicianId?: string) => void
}

function nextInstant(tick: number): string {
  return new Date(Date.parse(NOW) + tick * 60_000).toISOString()
}

export const useRiffStore = create<RiffState>((set, get) => ({
  jams: seedJams,
  recaps: seedRecaps,
  messages: seedMessages,
  recordingConsents: seedConsents,
  tick: 0,

  postRecap: (input) => {
    const tick = get().tick + 1
    const recap: SessionRecap = {
      id: `recap-${input.jamId}-${input.authorId ?? CURRENT_USER_ID}`,
      jamId: input.jamId,
      authorId: input.authorId ?? CURRENT_USER_ID,
      attendance: input.attendance,
      // Drop empty vouches — an untouched card is not an endorsement.
      vouches: input.vouches.filter((v) => v.tags.length > 0 || (v.note ?? '').trim().length > 0),
      publishRecording: input.publishRecording,
      durationLabel: input.durationLabel,
      createdAt: nextInstant(tick),
    }
    set((state) => ({
      tick,
      // Re-filing replaces the author's previous recap rather than double-counting it.
      recaps: [...state.recaps.filter((r) => r.id !== recap.id), recap],
      jams: state.jams.map((jam) => (jam.id === input.jamId ? { ...jam, recapId: recap.id } : jam)),
    }))
    return recap
  },

  sendMessage: (threadId, body, authorId = CURRENT_USER_ID) => {
    const tick = get().tick + 1
    const message: Message = {
      id: `m-local-${tick}`,
      threadId,
      authorId,
      body,
      sentAt: nextInstant(tick),
      kind: 'text',
    }
    set((state) => ({ tick, messages: [...state.messages, message] }))
    return message
  },

  setRecordingConsent: (jamId, musicianId, consents) =>
    set((state) => {
      const current = state.recordingConsents[jamId] ?? []
      const next = consents
        ? Array.from(new Set([...current, musicianId]))
        : current.filter((id) => id !== musicianId)
      return { recordingConsents: { ...state.recordingConsents, [jamId]: next } }
    }),

  /**
   * "Can't make it?" — the escape hatch every jam screen owes the user (docs/SPEC.md §5.5).
   * Dropping below two confirmed players un-confirms the jam, which also re-hides the venue
   * address via src/lib/privacy.ts. Nothing stays confirmed that nobody is attending.
   */
  withdrawFromJam: (jamId, musicianId = CURRENT_USER_ID) =>
    set((state) => ({
      jams: state.jams.map((jam) => {
        if (jam.id !== jamId) return jam
        const attendees = jam.attendees.map((a) =>
          a.musicianId === musicianId ? { ...a, rsvp: 'declined' as const } : a,
        )
        const confirmed = attendees.filter((a) => a.rsvp === 'confirmed').length
        const status =
          jam.status === 'confirmed' && confirmed < 2 ? ('pending' as const) : jam.status
        return { ...jam, attendees, status }
      }),
    })),
}))

/** Reputation context assembled from live session state rather than the raw fixtures. */
export function useReputationContext(): ReputationContext {
  const jams = useRiffStore((s) => s.jams)
  const recaps = useRiffStore((s) => s.recaps)
  return { jams, recaps, vouches: seedVouches }
}

/** Live stats for one musician. Recomputed, never read from a stored percentage. */
export function useMusicianStats(musicianId: string): MusicianStats | undefined {
  const ctx = useReputationContext()
  const musician = getMusician(musicianId)
  if (!musician) return undefined
  return deriveStats(musician, ctx)
}

/** Non-hook variant, for computing several musicians at once inside one render. */
export function statsFor(musicianId: string, ctx: ReputationContext): MusicianStats | undefined {
  const musician = getMusician(musicianId)
  return musician ? deriveStats(musician, ctx) : undefined
}
