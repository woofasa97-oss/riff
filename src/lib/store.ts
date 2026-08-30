'use client'

import { createContext, createElement, useContext, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createStore, useStore, type StoreApi } from 'zustand'
import { liveSessions as seedLive, battleChatSeed, getMusician, registerWorld } from '@/mocks'
import { deriveStats, type ReputationContext } from '@/lib/reputation'
import type { WorldSnapshot } from '@/lib/snapshot'
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
  Notification,
  OpenCallApplication,
  RecapVouch,
  SessionRecap,
  Thread,
  Vouch,
} from '@/types'

/**
 * Client state for one signed-in viewer.
 *
 * The server owns the world (src/server/world.ts); this store is its client-side mirror plus
 * the handful of session-local toys that never persist (battle votes, live chat, follows).
 * Every mutation POSTs to /api/riff and applies the snapshot the server answers with, so the
 * client is never more than one round-trip from the truth and the product rules live where a
 * browser cannot skip them.
 *
 * The store is created per React tree in RiffProvider — never at module scope — because a
 * module singleton on the server would leak one user's world into another's render.
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
  // --- server-owned, snapshot-replaced ---
  viewerId: string
  now: string
  profileComplete: boolean
  musicians: Musician[]
  jams: Jam[]
  requests: JamRequest[]
  applications: OpenCallApplication[]
  threads: Thread[]
  messages: Message[]
  recaps: SessionRecap[]
  recordingConsents: Record<string, string[]>
  vouches: Vouch[]
  notifications: Notification[]

  // --- session-local (never persisted; Phase-6 flavor) ---
  followedBandIds: string[]
  battleVotes: Record<string, 'A' | 'B'>
  liveChat: Record<string, LiveComment[]>
  battleChat: Record<string, LiveComment[]>
  sessionRatings: Record<string, number>
  localTick: number

  // --- sync ---
  applySnapshot: (snapshot: WorldSnapshot) => void
  refresh: () => Promise<void>

  // --- server-backed actions ---
  applyOnboarding: (overrides: ProfileOverrides) => Promise<void>
  sendJamRequest: (input: {
    toId: string
    intent: Intent
    proposedTimes: string[]
    venueId?: string
    venueSuggestion?: string
    message: string
  }) => Promise<JamRequest>
  respondToRequest: (
    input:
      | { requestId: string; action: 'accept'; startsAt: string; venueId: string }
      | { requestId: string; action: 'decline' }
      | { requestId: string; action: 'counter'; counterTimes: string[]; note?: string },
  ) => Promise<{ jamId?: string }>
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
  }) => Promise<Jam>
  applyToOpenCall: (jamId: string, instrument: Instrument) => Promise<void>
  withdrawFromJam: (jamId: string) => Promise<void>
  sendMessage: (threadId: string, body: string) => Promise<Message>
  markThreadRead: (threadId: string) => Promise<void>
  openDirectThread: (musicianId: string) => Promise<Thread>
  postRecap: (input: {
    jamId: string
    attendance: Record<string, boolean>
    vouches: RecapVouch[]
    publishRecording: boolean
    durationLabel: string
  }) => Promise<SessionRecap>
  setRecordingConsent: (jamId: string, musicianId: string, consents: boolean) => Promise<void>
  markNotificationRead: (id: string) => Promise<void>
  markAllNotificationsRead: () => Promise<void>

  // --- session-local actions ---
  toggleFollowBand: (bandId: string) => void
  voteInBattle: (battleId: string, side: 'A' | 'B') => void
  sendLiveComment: (sessionId: string, body: string, handle?: string) => void
  sendBattleComment: (battleId: string, body: string, handle?: string) => void
  rateSession: (sessionId: string, stars: number) => void
}

function snapshotSlices(snapshot: WorldSnapshot) {
  return {
    viewerId: snapshot.viewerId,
    now: snapshot.now,
    profileComplete: snapshot.profileComplete,
    musicians: snapshot.musicians,
    jams: snapshot.jams,
    requests: snapshot.requests,
    applications: snapshot.applications,
    threads: snapshot.threads,
    messages: snapshot.messages,
    recaps: snapshot.recaps,
    recordingConsents: snapshot.consents,
    vouches: snapshot.vouches,
    notifications: snapshot.notifications,
  }
}

async function callApi(
  action: string,
  payload: unknown,
): Promise<{ result: unknown; snapshot: WorldSnapshot }> {
  const res = await fetch('/api/riff', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action, payload }),
  })
  if (res.status === 401) {
    window.location.href = '/login'
    throw new Error('Signed out')
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error ?? 'Something went wrong — try again')
  return data
}

function createRiffStore(initial: WorldSnapshot): StoreApi<RiffState> {
  // Registries must be populated before the first render reads getMusician/getVenue.
  registerWorld(initial.musicians, initial.venues)

  return createStore<RiffState>((set, get) => {
    /** POST an action, adopt the server's answer, hand back the action's own result. */
    async function dispatch<T>(action: string, payload: unknown): Promise<T> {
      const { result, snapshot } = await callApi(action, payload)
      get().applySnapshot(snapshot)
      return result as T
    }

    return {
      ...snapshotSlices(initial),

      followedBandIds: [],
      battleVotes: {},
      liveChat: Object.fromEntries(seedLive.map((s) => [s.id, s.chat])),
      battleChat: battleChatSeed,
      sessionRatings: {},
      localTick: 0,

      applySnapshot: (snapshot) => {
        registerWorld(snapshot.musicians, snapshot.venues)
        set(snapshotSlices(snapshot))
      },

      refresh: async () => {
        const res = await fetch('/api/riff')
        if (res.status === 401) {
          window.location.href = '/login'
          return
        }
        if (!res.ok) return // transient — next poll will retry
        get().applySnapshot((await res.json()) as WorldSnapshot)
      },

      applyOnboarding: async (overrides) => {
        const { clip, ...rest } = overrides
        await dispatch('updateProfile', {
          ...rest,
          ...(clip !== undefined
            ? {
                clip: clip
                  ? { durationSec: clip.durationSec, waveform: clip.waveform ?? [] }
                  : null,
              }
            : {}),
        })
      },

      sendJamRequest: (input) => dispatch<JamRequest>('sendJamRequest', input),
      respondToRequest: (input) => dispatch<{ jamId?: string }>('respondToRequest', input),
      postJam: (draft) => dispatch<Jam>('postJam', draft),
      applyToOpenCall: (jamId, instrument) =>
        dispatch<void>('applyToOpenCall', { jamId, instrument }),
      withdrawFromJam: (jamId) => dispatch<void>('withdrawFromJam', { jamId }),
      sendMessage: (threadId, body) => dispatch<Message>('sendMessage', { threadId, body }),
      markThreadRead: async (threadId) => {
        // Optimistic: the dot clears the instant the thread opens; the server confirms after.
        set((state) => ({
          threads: state.threads.map((t) =>
            t.id === threadId && t.unreadCount > 0 ? { ...t, unreadCount: 0 } : t,
          ),
        }))
        await dispatch('markThreadRead', { threadId })
      },
      openDirectThread: (musicianId) => dispatch<Thread>('openDirectThread', { musicianId }),
      postRecap: (input) => dispatch<SessionRecap>('postRecap', input),
      setRecordingConsent: (jamId, musicianId, consents) =>
        dispatch<void>('setRecordingConsent', { jamId, musicianId, consents }),
      markNotificationRead: async (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        }))
        await dispatch('markNotificationRead', { id })
      },
      markAllNotificationsRead: async () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }))
        await dispatch('markAllNotificationsRead', {})
      },

      toggleFollowBand: (bandId) =>
        set((state) => ({
          followedBandIds: state.followedBandIds.includes(bandId)
            ? state.followedBandIds.filter((id) => id !== bandId)
            : [...state.followedBandIds, bandId],
        })),

      /** One vote per user per battle, and it is final — re-voting is ignored. */
      voteInBattle: (battleId, side) =>
        set((state) =>
          state.battleVotes[battleId]
            ? state
            : { battleVotes: { ...state.battleVotes, [battleId]: side } },
        ),

      sendLiveComment: (sessionId, body, handle) => {
        const tick = get().localTick + 1
        const viewer = getMusician(get().viewerId)
        const comment: LiveComment = {
          id: `lc-local-${tick}`,
          handle: handle ?? viewer?.handle ?? 'you',
          body,
          sentAt: new Date().toISOString(),
        }
        set((state) => ({
          localTick: tick,
          liveChat: {
            ...state.liveChat,
            [sessionId]: [...(state.liveChat[sessionId] ?? []), comment],
          },
        }))
      },

      sendBattleComment: (battleId, body, handle) => {
        const tick = get().localTick + 1
        const viewer = getMusician(get().viewerId)
        const comment: LiveComment = {
          id: `bc-local-${tick}`,
          handle: handle ?? viewer?.handle ?? 'you',
          body,
          sentAt: new Date().toISOString(),
        }
        set((state) => ({
          localTick: tick,
          battleChat: {
            ...state.battleChat,
            [battleId]: [...(state.battleChat[battleId] ?? []), comment],
          },
        }))
      },

      rateSession: (sessionId, stars) =>
        set((state) => ({ sessionRatings: { ...state.sessionRatings, [sessionId]: stars } })),
    }
  })
}

// ---------------------------------------------------------------------------
// Provider + hooks
// ---------------------------------------------------------------------------
const RiffStoreContext = createContext<StoreApi<RiffState> | null>(null)

const POLL_MS = 15_000

export function RiffProvider({
  snapshot,
  children,
}: {
  snapshot: WorldSnapshot
  children: React.ReactNode
}) {
  const [store] = useState(() => createRiffStore(snapshot))
  const router = useRouter()
  const pathname = usePathname()
  const profileComplete = useStore(store, (s) => s.profileComplete)

  // Other people's actions arrive by polling — enough for a scene, no sockets needed yet.
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === 'visible') void store.getState().refresh()
    }
    const id = window.setInterval(tick, POLL_MS)
    window.addEventListener('focus', tick)
    return () => {
      window.clearInterval(id)
      window.removeEventListener('focus', tick)
    }
  }, [store])

  // A profile without instruments or a neighbourhood is not discoverable yet: finish
  // onboarding first. (Being IN onboarding, or reading your own settings, is of course fine.)
  const inOnboarding = pathname.startsWith('/onboarding')
  useEffect(() => {
    if (!profileComplete && !inOnboarding) router.replace('/onboarding/location')
  }, [profileComplete, inOnboarding, router])

  return createElement(RiffStoreContext.Provider, { value: store }, children)
}

export function useRiffStore<T>(selector: (state: RiffState) => T): T {
  const store = useContext(RiffStoreContext)
  if (!store) throw new Error('useRiffStore must be used inside RiffProvider')
  return useStore(store, selector)
}

/** The signed-in musician. */
export function useCurrentUser(): Musician {
  const viewerId = useRiffStore((s) => s.viewerId)
  const musicians = useRiffStore((s) => s.musicians)
  return musicians.find((m) => m.id === viewerId) as Musician
}

export function useUnreadNotificationCount(): number {
  return useRiffStore((s) => s.notifications.filter((n) => !n.read).length)
}

/** Reputation context assembled from live server state. */
export function useReputationContext(): ReputationContext {
  const jams = useRiffStore((s) => s.jams)
  const recaps = useRiffStore((s) => s.recaps)
  const vouches = useRiffStore((s) => s.vouches)
  return { jams, recaps, vouches }
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
