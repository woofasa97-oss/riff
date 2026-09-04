'use client'

import { create } from 'zustand'
import { emptyGrid } from '@/lib/availability'
import type { Genre, Instrument, Intent, Slot, Weekday } from '@/types'

/**
 * The onboarding draft. State accumulates across the four steps and is only committed on
 * completion (docs/SPEC.md §4.1) — the final step calls `useRiffStore.applyOnboarding` with
 * what is here, then `reset()`. Nothing in this store is read by the rest of the app.
 */
interface OnboardingState {
  neighborhood?: string
  travelRadiusMi: number
  instruments: Instrument[]
  genres: Genre[]
  intent?: Intent
  grid: Record<Weekday, Slot[]>
  note: string
  availableTonight: boolean
  /** Peaks + duration only. Real audio is out of scope for v1 (docs/SPEC.md §6). */
  clip: { durationSec: number; peaks: number[]; blob?: Blob } | null

  setNeighborhood: (n: string) => void
  setTravelRadius: (mi: number) => void
  toggleInstrument: (i: Instrument) => void
  toggleGenre: (g: Genre) => void
  setIntent: (i: Intent) => void
  setGrid: (grid: Record<Weekday, Slot[]>) => void
  setNote: (note: string) => void
  setAvailableTonight: (on: boolean) => void
  setClip: (clip: OnboardingState['clip']) => void
  reset: () => void
}

const initial = {
  neighborhood: undefined,
  travelRadiusMi: 3,
  instruments: [] as Instrument[],
  genres: [] as Genre[],
  intent: undefined,
  grid: emptyGrid(),
  note: '',
  availableTonight: false,
  clip: null,
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...initial,
  setNeighborhood: (neighborhood) => set({ neighborhood }),
  setTravelRadius: (travelRadiusMi) => set({ travelRadiusMi }),
  toggleInstrument: (instrument) =>
    set((s) => ({
      instruments: s.instruments.includes(instrument)
        ? s.instruments.filter((x) => x !== instrument)
        : [...s.instruments, instrument],
    })),
  toggleGenre: (genre) =>
    set((s) => ({
      genres: s.genres.includes(genre) ? s.genres.filter((x) => x !== genre) : [...s.genres, genre],
    })),
  setIntent: (intent) => set({ intent }),
  setGrid: (grid) => set({ grid }),
  setNote: (note) => set({ note }),
  setAvailableTonight: (availableTonight) => set({ availableTonight }),
  setClip: (clip) => set({ clip }),
  reset: () => set({ ...initial, grid: emptyGrid() }),
}))
