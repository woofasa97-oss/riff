import type { CompetitionEntry, Musician, Season } from '@/types'

/** Prize pool = seeded base + every entry fee. Mirrors the server's computation. */
export function prizePool(season: Season, entries: CompetitionEntry[]): number {
  return season.basePoolCredits + entries.reduce((sum, e) => sum + e.feePaidCredits, 0)
}

/** What each place would win right now, given the live pool and the season's split. */
export function projectedPayouts(season: Season, entries: CompetitionEntry[]): number[] {
  const pool = prizePool(season, entries)
  return season.payoutSplit.map((frac) => Math.round(pool * frac))
}

export function isEntered(entries: CompetitionEntry[], competitorId: string): boolean {
  return entries.some((e) => e.competitorId === competitorId)
}

/** A seed act (fixture musician) vs. a real entrant, by avatar origin. */
export function isSeedCompetitor(musician: Musician | undefined): boolean {
  return Boolean(musician?.avatarUrl.startsWith('/mock/'))
}

export const SEASON_STATUS_LABEL: Record<Season['status'], string> = {
  registration: 'Registration open',
  live: 'In progress',
  finished: 'Finished',
}
