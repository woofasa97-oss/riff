'use client'

import { create } from 'zustand'
import {
  CURRENT_USER_ID,
  NOW,
  battleChatSeed,
  jamRequests as seedRequests,
  jams as seedJams,
  liveSessions as seedLive,
  messages as seedMessages,
  notifications as seedNotifications,
  openCallApplications as seedApplications,
  recordingConsents as seedConsents,
  sessionRecaps as seedRecaps,
  threads as seedThreads,
  vouches as seedVouches,
} from '@/mocks'
import { deriveStats, type ReputationContext } from '@/lib/reputation'
import { getCurrentUser, getMusician } from '@/mocks'
import type {
  AudioClip,
  Availability,
  Genre,
  Instrument,
  Intent,
  Jam,
  JamRequest,
  LiveComment,
  Message,
  Musician,
  MusicianStats,
  OpenCallApplication,
  RecapVouch,
  SessionRecap,
  Thread,
} from '@/types'

/**
 * Session state. Seeded from the fixtures so the first server render and the first client
 * render produce identical markup; everything after that is the user's own doing.
 *
 * There is no backend (docs/CLAUDE.md), so this is where a jam's status, a filed recap and a
 * sent message live once the user has touched them.
 */
/**
 * What onboarding is allowed to change about the current user. Everything else on Musician —
 * reliability, repeats, vouches — is earned, and no store action may touch it
 * (docs/SPEC.md §5.3).
 */
export interface ProfileOverrides {
  neighborhood?: string
  travelRadiusMi?: number
  instruments?: Instrument[]
  genres?: Genre[]
  intent?: Intent
  availability?: Availability
  availableTonight?: boolean
  clip?: AudioClip
}

interface RiffState {
  jams: Jam[]
  recaps: SessionRecap[]
  messages: Message[]
  threads: Thread[]
  requests: JamRequest[]
  applications: OpenCallApplication[]
  /** Set when onboarding completes; merged over the fixture user by useCurrentUser(). */
  profileOverrides: ProfileOverrides | null
  /** jamId → musicianIds who agreed to publish the recording. */
  recordingConsents: Record<string, string[]>
  /** Advances the mock clock a minute at a time so in-session activity sorts and reads right. */
  tick: number
  /** notificationId → read. */
  notificationsRead: Record<string, boolean>
  followedBandIds: string[]
  /** battleId → the side this user voted for. One vote each, and it does not change. */
  battleVotes: Record<string, 'A' | 'B'>
  /** liveSessionId → comments added this session, appended to the seeded ones. */
  liveChat: Record<string, LiveComment[]>
  /** battleId → its chat, seeded and appended like liveChat. */
  battleChat: Record<string, LiveComment[]>
  /** liveSessionId → the star rating this user submitted. */
  sessionRatings: Record<string, number>

  postRecap: (input: {
    jamId: string
    authorId?: string
    attendance: Record<string, boolean>
    vouches: RecapVouch[]
    publishRecording: boolean
    durationLabel: string
  }) => SessionRecap
  sendMessage: (threadId: string, body: string, authorId?: string) => Message
  /** Opening a conversation clears its unread dot. */
  markThreadRead: (threadId: string) => void
  setRecordingConsent: (jamId: string, musicianId: string, consents: boolean) => void
  withdrawFromJam: (jamId: string, musicianId?: string) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  toggleFollowBand: (bandId: string) => void
  voteInBattle: (battleId: string, side: 'A' | 'B') => void
  sendLiveComment: (sessionId: string, body: string, handle?: string) => void
  sendBattleComment: (battleId: string, body: string, handle?: string) => void
  rateSession: (sessionId: string, stars: number) => void

  /**
   * A request is a proposal, never a booking. This creates a JamRequest and the direct thread
   * that carries it — and deliberately no Jam. Only respondToRequest('accept') can do that
   * (docs/SPEC.md §5.1).
   */
  sendJamRequest: (input: {
    toId: string
    intent: Intent
    proposedTimes: string[]
    venueId?: string
    venueSuggestion?: string
    message: string
  }) => JamRequest
  respondToRequest: (
    input:
      | { requestId: string; action: 'accept'; startsAt: string; venueId: string }
      | { requestId: string; action: 'decline' }
      | { requestId: string; action: 'counter'; counterTimes: string[]; note?: string },
  ) => { jamId?: string }
  /** Post an open call or a private invite. Drafts are kept but never shown on Discover. */
  postJam: (draft: {
    title: string
    intent: Intent
    isOpenCall: boolean
    openSeats: Instrument[]
    startsAt: string
    durationHours: number
    venueId: string
    message?: string
    invitedIds?: string[]
    asDraft?: boolean
  }) => Jam
  applyToOpenCall: (jamId: string, instrument: Instrument) => void
  applyOnboarding: (overrides: ProfileOverrides) => void
  /**
   * The direct thread between the viewer and one musician, created empty if none exists.
   * Behind the Message button on a musician profile.
   */
  openDirectThread: (musicianId: string) => Thread
}

function nextInstant(tick: number): string {
  return new Date(Date.parse(NOW) + tick * 60_000).toISOString()
}

export const useRiffStore = create<RiffState>((set, get) => ({
  jams: seedJams,
  recaps: seedRecaps,
  messages: seedMessages,
  threads: seedThreads,
  requests: seedRequests,
  applications: seedApplications,
  profileOverrides: null,
  recordingConsents: seedConsents,
  tick: 0,
  notificationsRead: Object.fromEntries(seedNotifications.map((n) => [n.id, n.read])),
  followedBandIds: [],
  battleVotes: {},
  liveChat: Object.fromEntries(seedLive.map((s) => [s.id, s.chat])),
  battleChat: battleChatSeed,
  sessionRatings: {},

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
    set((state) => ({
      tick,
      messages: [...state.messages, message],
      threads: state.threads.map((t) =>
        t.id === threadId ? { ...t, lastMessageAt: message.sentAt } : t,
      ),
    }))
    return message
  },

  markThreadRead: (threadId) =>
    set((state) => ({
      threads: state.threads.map((t) =>
        t.id === threadId && t.unreadCount > 0 ? { ...t, unreadCount: 0 } : t,
      ),
    })),

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

  markNotificationRead: (id) =>
    set((state) => ({ notificationsRead: { ...state.notificationsRead, [id]: true } })),

  markAllNotificationsRead: () =>
    set((state) => ({
      notificationsRead: Object.fromEntries(
        Object.keys(state.notificationsRead).map((id) => [id, true]),
      ),
    })),

  toggleFollowBand: (bandId) =>
    set((state) => ({
      followedBandIds: state.followedBandIds.includes(bandId)
        ? state.followedBandIds.filter((id) => id !== bandId)
        : [...state.followedBandIds, bandId],
    })),

  /** One vote per user per battle, and it is final — re-voting is ignored, not overwritten. */
  voteInBattle: (battleId, side) =>
    set((state) =>
      state.battleVotes[battleId]
        ? state
        : { battleVotes: { ...state.battleVotes, [battleId]: side } },
    ),

  sendLiveComment: (sessionId, body, handle) => {
    const tick = get().tick + 1
    const comment: LiveComment = {
      id: `lc-local-${tick}`,
      handle: handle ?? 'marcus_c',
      body,
      sentAt: nextInstant(tick),
    }
    set((state) => ({
      tick,
      liveChat: { ...state.liveChat, [sessionId]: [...(state.liveChat[sessionId] ?? []), comment] },
    }))
  },

  rateSession: (sessionId, stars) =>
    set((state) => ({ sessionRatings: { ...state.sessionRatings, [sessionId]: stars } })),

  sendBattleComment: (battleId, body, handle) => {
    const tick = get().tick + 1
    const comment: LiveComment = {
      id: `bc-local-${tick}`,
      handle: handle ?? 'marcus_c',
      body,
      sentAt: nextInstant(tick),
    }
    set((state) => ({
      tick,
      battleChat: {
        ...state.battleChat,
        [battleId]: [...(state.battleChat[battleId] ?? []), comment],
      },
    }))
  },

  sendJamRequest: (input) => {
    const tick = get().tick + 1
    const request: JamRequest = {
      id: `req-local-${tick}`,
      fromId: CURRENT_USER_ID,
      toId: input.toId,
      intent: input.intent,
      proposedTimes: input.proposedTimes,
      venueId: input.venueId,
      venueSuggestion: input.venueSuggestion,
      message: input.message,
      status: 'pending',
      createdAt: nextInstant(tick),
    }
    // The request rides in the direct thread with that person — reusing the existing one if
    // you already talk, exactly like openDirectThread does. Still no jam: that only exists
    // once the other side says yes.
    const existing = get().threads.find(
      (t) =>
        t.kind === 'direct' &&
        t.participantIds.includes(CURRENT_USER_ID) &&
        t.participantIds.includes(input.toId),
    )
    const thread: Thread = existing
      ? { ...existing, requestId: request.id, lastMessageAt: request.createdAt }
      : {
          id: `thread-${request.id}`,
          kind: 'direct',
          requestId: request.id,
          participantIds: [CURRENT_USER_ID, input.toId],
          lastMessageAt: request.createdAt,
          unreadCount: 0,
        }
    const message: Message = {
      id: `m-${request.id}`,
      threadId: thread.id,
      authorId: CURRENT_USER_ID,
      body: input.message,
      sentAt: request.createdAt,
      kind: 'text',
    }
    set((state) => ({
      tick,
      requests: [...state.requests, request],
      threads: existing
        ? state.threads.map((t) => (t.id === thread.id ? thread : t))
        : [...state.threads, thread],
      messages: [...state.messages, message],
    }))
    return request
  },

  respondToRequest: (input) => {
    const state = get()
    const request = state.requests.find((r) => r.id === input.requestId)
    if (!request || request.status !== 'pending') return {}
    // Only the person a request was sent TO can answer it. Without this, the sender could
    // confirm a jam on their own — the exact thing product rule 1 forbids.
    if (request.toId !== CURRENT_USER_ID) return {}
    const tick = state.tick + 1
    const at = nextInstant(tick)
    const from = getMusician(request.fromId)
    const me = getMusician(request.toId)

    /** The direct thread this request lives in, created on demand for fixture requests. */
    function requestThread(): { thread: Thread; created: boolean } {
      const existing = state.threads.find((t) => t.requestId === request!.id)
      if (existing) return { thread: existing, created: false }
      return {
        thread: {
          id: `thread-${request!.id}`,
          kind: 'direct',
          requestId: request!.id,
          participantIds: [request!.fromId, request!.toId],
          lastMessageAt: at,
          unreadCount: 0,
        },
        created: true,
      }
    }

    if (input.action === 'accept') {
      // The one place in the app a confirmed jam comes into being: both sides have now agreed.
      const jamId = `jam-${request.id}`
      const threadId = `thread-${jamId}`
      const jam: Jam = {
        id: jamId,
        title: from ? `Jam with ${from.name.split(' ')[0]}` : 'New jam',
        intent: request.intent,
        status: 'confirmed',
        startsAt: input.startsAt,
        durationHours: 2,
        venueId: input.venueId,
        hostId: request.fromId,
        attendees: [
          {
            musicianId: request.fromId,
            instrument: from?.instruments[0] ?? 'guitar',
            rsvp: 'confirmed',
          },
          {
            musicianId: request.toId,
            instrument: me?.instruments[0] ?? 'drums',
            rsvp: 'confirmed',
          },
        ],
        openSeats: [],
        isOpenCall: false,
        threadId,
      }
      const thread: Thread = {
        id: threadId,
        kind: 'jam',
        jamId,
        participantIds: [request.fromId, request.toId],
        lastMessageAt: at,
        unreadCount: 0,
      }
      const confirmation: Message = {
        id: `m-${jamId}-confirmed`,
        threadId,
        authorId: 'system',
        body: `${me?.name.split(' ')[0] ?? 'They'} accepted. ${jam.title} is confirmed.`,
        sentAt: at,
        kind: 'system',
      }
      set((s) => ({
        tick,
        jams: [...s.jams, jam],
        threads: [...s.threads, thread],
        messages: [...s.messages, confirmation],
        requests: s.requests.map((r) =>
          r.id === request.id ? { ...r, status: 'accepted' as const, jamId } : r,
        ),
      }))
      return { jamId }
    }

    if (input.action === 'decline') {
      const { thread, created } = requestThread()
      const decline: Message = {
        id: `m-${request.id}-decline`,
        threadId: thread.id,
        authorId: request.toId,
        // The templated polite decline — a no that keeps the door open (docs/SPEC.md §5.5).
        body: "Thanks for thinking of me — I can't make this one work. Ask me again soon.",
        sentAt: at,
        kind: 'text',
      }
      set((s) => ({
        tick,
        threads: created
          ? [...s.threads, { ...thread, lastMessageAt: at }]
          : s.threads.map((t) => (t.id === thread.id ? { ...t, lastMessageAt: at } : t)),
        messages: [...s.messages, decline],
        requests: s.requests.map((r) =>
          r.id === request.id ? { ...r, status: 'declined' as const } : r,
        ),
      }))
      return {}
    }

    // Counter-propose: the request stays alive with new times on it, and nothing is confirmed.
    const { thread, created } = requestThread()
    const counter: Message = {
      id: `m-${request.id}-counter-${tick}`,
      threadId: thread.id,
      authorId: request.toId,
      body:
        input.note?.trim() ||
        'That time is tricky for me — I suggested another one. Does it work for you?',
      sentAt: at,
      kind: 'text',
    }
    set((s) => ({
      tick,
      threads: created
        ? [...s.threads, { ...thread, lastMessageAt: at }]
        : s.threads.map((t) => (t.id === thread.id ? { ...t, lastMessageAt: at } : t)),
      messages: [...s.messages, counter],
      requests: s.requests.map((r) =>
        r.id === request.id
          ? { ...r, status: 'counter-proposed' as const, counterTimes: input.counterTimes }
          : r,
      ),
    }))
    return {}
  },

  postJam: (draft) => {
    const tick = get().tick + 1
    const at = nextInstant(tick)
    const me = getMusician(CURRENT_USER_ID)
    const jamId = `jam-local-${tick}`
    const threadId = `thread-${jamId}`
    const invited = (draft.invitedIds ?? []).filter((id) => id !== CURRENT_USER_ID)
    const jam: Jam = {
      id: jamId,
      title: draft.title,
      intent: draft.intent,
      // Nothing is confirmed until people accept: a fresh post is pending (or a private draft).
      status: draft.asDraft ? 'draft' : 'pending',
      startsAt: draft.startsAt,
      durationHours: draft.durationHours,
      venueId: draft.venueId,
      hostId: CURRENT_USER_ID,
      attendees: [
        {
          musicianId: CURRENT_USER_ID,
          instrument: me?.instruments[0] ?? 'drums',
          rsvp: 'confirmed',
        },
        ...invited.map((id) => ({
          musicianId: id,
          instrument: getMusician(id)?.instruments[0] ?? ('guitar' as Instrument),
          rsvp: 'pending' as const,
        })),
      ],
      openSeats: draft.openSeats,
      isOpenCall: draft.isOpenCall,
      postedAt: at,
      message: draft.message?.trim() || undefined,
      threadId,
    }
    // A draft has not been sent to anyone, so it gets no thread — the invited must not see
    // a conversation for a jam that never went out.
    const thread: Thread | null = draft.asDraft
      ? null
      : {
          id: threadId,
          kind: 'jam',
          jamId,
          participantIds: [CURRENT_USER_ID, ...invited],
          lastMessageAt: at,
          unreadCount: 0,
        }
    set((state) => ({
      tick,
      jams: [...state.jams, jam],
      threads: thread ? [...state.threads, thread] : state.threads,
    }))
    return jam
  },

  applyToOpenCall: (jamId, instrument) =>
    set((state) => {
      const jam = state.jams.find((j) => j.id === jamId)
      // You cannot apply to your own call, and applying twice is a no-op.
      if (!jam || jam.hostId === CURRENT_USER_ID) return state
      if (state.applications.some((a) => a.jamId === jamId && a.applicantId === CURRENT_USER_ID)) {
        return state
      }
      const tick = state.tick + 1
      const application: OpenCallApplication = {
        id: `app-local-${tick}`,
        jamId,
        applicantId: CURRENT_USER_ID,
        instrument,
        status: 'pending',
        appliedAt: nextInstant(tick),
      }
      return { ...state, tick, applications: [...state.applications, application] }
    }),

  applyOnboarding: (overrides) =>
    set((state) => ({ profileOverrides: { ...state.profileOverrides, ...overrides } })),

  openDirectThread: (musicianId) => {
    const state = get()
    const existing = state.threads.find(
      (t) =>
        t.kind === 'direct' &&
        t.participantIds.includes(CURRENT_USER_ID) &&
        t.participantIds.includes(musicianId),
    )
    if (existing) return existing
    const tick = state.tick + 1
    const thread: Thread = {
      id: `thread-direct-${musicianId}-${tick}`,
      kind: 'direct',
      participantIds: [CURRENT_USER_ID, musicianId],
      lastMessageAt: nextInstant(tick),
      unreadCount: 0,
    }
    set((s) => ({ tick, threads: [...s.threads, thread] }))
    return thread
  },
}))

/**
 * The current user, with any onboarding choices merged over the fixture. This is the only
 * write path into the profile, and it can only touch the fields ProfileOverrides names —
 * reputation stays derived.
 */
export function useCurrentUser(): Musician {
  const overrides = useRiffStore((s) => s.profileOverrides)
  const base = getCurrentUser()
  if (!overrides) return base
  const { clip, ...rest } = overrides
  return { ...base, ...rest, clip: clip ?? base.clip }
}

/** Unread notification count — drives the dot on the profile header's bell. */
export function useUnreadNotificationCount(): number {
  const read = useRiffStore((s) => s.notificationsRead)
  return seedNotifications.filter((n) => !read[n.id]).length
}

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
