'use client'

import { createContext, createElement, useContext, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createStore, useStore, type StoreApi } from 'zustand'
import { liveSessions as seedLive, battleChatSeed, getMusician, registerWorld } from '@/mocks'
import { GuestAccountSheet } from '@/components/riff/GuestAccountSheet'
import { deriveStats, type ReputationContext } from '@/lib/reputation'
import type { WorldSnapshot } from '@/lib/snapshot'
import type {
  AudioClip,
  Availability,
  CompetitionEntry,
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
  Season,
  SessionRecap,
  Thread,
  Vouch,
  Wallet,
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
  /** No account: read-only, every action prompts sign-up. */
  isGuest: boolean
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
  season: Season
  competitionEntries: CompetitionEntry[]
  wallet: Wallet | null

  // --- session-local (never persisted; Phase-6 flavor) ---
  followedBandIds: string[]
  battleVotes: Record<string, 'A' | 'B'>
  liveChat: Record<string, LiveComment[]>
  battleChat: Record<string, LiveComment[]>
  sessionRatings: Record<string, number>
  localTick: number
  /** When a guest attempts an action, the feature they wanted — drives the sign-up prompt. */
  accountPrompt: string | null

  // --- sync ---
  applySnapshot: (snapshot: WorldSnapshot) => void
  refresh: () => Promise<void>
  /**
   * True if the viewer may act; if a guest, opens the sign-up prompt for `feature` and returns
   * false. Every gated action calls this first.
   */
  requireAccount: (feature: string) => boolean
  dismissAccountPrompt: () => void

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
  enterCompetition: () => Promise<CompetitionEntry>

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
    isGuest: snapshot.isGuest,
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
    season: snapshot.season,
    competitionEntries: snapshot.competitionEntries,
    wallet: snapshot.wallet,
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

/** Thrown when a guest attempts a mutation; callers can ignore it — the prompt is already up. */
export class AccountRequiredError extends Error {
  constructor() {
    super('Account required')
    this.name = 'AccountRequiredError'
  }
}

/** Human phrasing for the sign-up prompt, per dispatched action. */
const FEATURE_LABELS: Record<string, string> = {
  sendJamRequest: 'send a jam request',
  respondToRequest: 'reply to a request',
  postJam: 'post a jam',
  applyToOpenCall: 'apply to an open call',
  withdrawFromJam: 'change a jam',
  sendMessage: 'send a message',
  openDirectThread: 'message a musician',
  postRecap: 'post a recap',
  setRecordingConsent: 'publish a recording',
  updateProfile: 'build your profile',
  enterCompetition: 'enter the competition',
}

function createRiffStore(initial: WorldSnapshot): StoreApi<RiffState> {
  // Registries must be populated before the first render reads getMusician/getVenue.
  registerWorld(initial.musicians, initial.venues)

  return createStore<RiffState>((set, get) => {
    /**
     * POST an action, adopt the server's answer, hand back the action's own result.
     * A guest cannot mutate: attempting one opens the sign-up prompt and rejects, so callers'
     * await paths stop cleanly without a spurious error toast (FEATURE_LABELS names the prompt).
     */
    async function dispatch<T>(action: string, payload: unknown): Promise<T> {
      if (get().isGuest) {
        set({ accountPrompt: FEATURE_LABELS[action] ?? 'do that' })
        throw new AccountRequiredError()
      }
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
      accountPrompt: null,

      applySnapshot: (snapshot) => {
        registerWorld(snapshot.musicians, snapshot.venues)
        set(snapshotSlices(snapshot))
      },

      requireAccount: (feature) => {
        if (!get().isGuest) return true
        set({ accountPrompt: feature })
        return false
      },
      dismissAccountPrompt: () => set({ accountPrompt: null }),

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
      enterCompetition: () => dispatch<CompetitionEntry>('enterCompetition', {}),

      toggleFollowBand: (bandId) => {
        if (!get().requireAccount('follow a band')) return
        set((state) => ({
          followedBandIds: state.followedBandIds.includes(bandId)
            ? state.followedBandIds.filter((id) => id !== bandId)
            : [...state.followedBandIds, bandId],
        }))
      },

      /** One vote per user per battle, and it is final — re-voting is ignored. */
      voteInBattle: (battleId, side) => {
        if (!get().requireAccount('vote in a battle')) return
        set((state) =>
          state.battleVotes[battleId]
            ? state
            : { battleVotes: { ...state.battleVotes, [battleId]: side } },
        )
      },

      sendLiveComment: (sessionId, body, handle) => {
        if (!get().requireAccount('join the chat')) return
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
        if (!get().requireAccount('join the chat')) return
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

      rateSession: (sessionId, stars) => {
        if (!get().requireAccount('rate a session')) return
        set((state) => ({ sessionRatings: { ...state.sessionRatings, [sessionId]: stars } }))
      },
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
  const isGuest = useStore(store, (s) => s.isGuest)

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
    // Guests are not pushed into onboarding — they have no account to complete.
    if (!isGuest && !profileComplete && !inOnboarding) router.replace('/onboarding/location')
  }, [isGuest, profileComplete, inOnboarding, router])

  return createElement(
    RiffStoreContext.Provider,
    { value: store },
    children,
    createElement(AccountPrompt, { key: 'account-prompt' }),
  )
}

/**
 * The sign-up nudge a guest sees the moment they try to act. Mounted once by the provider and
 * driven by store.accountPrompt, so every gated action anywhere pops the same sheet.
 */
function AccountPrompt() {
  const feature = useRiffStore((s) => s.accountPrompt)
  const dismiss = useRiffStore((s) => s.dismissAccountPrompt)
  if (!feature) return null
  return createElement(GuestAccountSheet, { feature, onDismiss: dismiss })
}

export function useRiffStore<T>(selector: (state: RiffState) => T): T {
  const store = useContext(RiffStoreContext)
  if (!store) throw new Error('useRiffStore must be used inside RiffProvider')
  return useStore(store, selector)
}

/** The signed-in musician, or null for a guest / before onboarding resolves. */
export function useCurrentUser(): Musician | null {
  const viewerId = useRiffStore((s) => s.viewerId)
  const musicians = useRiffStore((s) => s.musicians)
  return musicians.find((m) => m.id === viewerId) ?? null
}

/** Whether the viewer is browsing without an account. */
export function useIsGuest(): boolean {
  return useRiffStore((s) => s.isGuest)
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
