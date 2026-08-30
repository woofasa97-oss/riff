import type { LeaderboardEntry, Season } from '@/types'

export const seasons: Season[] = [
  {
    id: 'season-4',
    number: 4,
    scene: 'Jazz Scene',
    city: 'Brooklyn',
    startsAt: '2026-06-01T00:00:00-04:00',
    endsAt: '2026-09-30T23:59:59-04:00',
  },
]

export const currentSeasonId = 'season-4'

/**
 * Points are authored constants, standing in for a season of history the fixtures do not
 * model — the same trick ReputationBaseline plays for reliability. The derived formula
 * docs/DATA-MODEL.md asks for (attendance + vouches + battle results, weights in one place)
 * belongs to the backend that will actually have the rows to sum; deriving it from these
 * fixtures would produce two-digit totals and break every reference number.
 *
 * Fourteen ranked players. Marcus sits at #14 on 4,280 points and rank 10 holds 4,320 — which
 * is what makes the nudge "You are 40 points from the top 10" literally true rather than copy.
 */
export const leaderboard: LeaderboardEntry[] = [
  {
    rank: 1,
    musicianId: 'nina-alvarez',
    points: 12850,
    delta: 0,
    instrumentLabel: 'Vocals, Neo-Soul',
  },
  { rank: 2, musicianId: 'theo-park', points: 9420, delta: 2, instrumentLabel: 'Guitar, Fusion' },
  { rank: 3, musicianId: 'ruby-sims', points: 8900, delta: -1, instrumentLabel: 'Sax, Jazz' },
  { rank: 4, musicianId: 'david-chen', points: 8420, delta: 1, instrumentLabel: 'Guitar, Indie' },
  {
    rank: 5,
    musicianId: 'sarah-jenkins',
    points: 7950,
    delta: -2,
    instrumentLabel: 'Bassist, Indie',
  },
  { rank: 6, musicianId: 'leo-rossi', points: 7100, delta: 0, instrumentLabel: 'Keys, Neo-Soul' },
  {
    rank: 7,
    musicianId: 'camille-okafor',
    points: 6480,
    delta: 3,
    instrumentLabel: 'Percussion, Funk',
  },
  {
    rank: 8,
    musicianId: 'miles-whitfield',
    points: 5920,
    delta: -1,
    instrumentLabel: 'Bass, Jazz',
  },
  { rank: 9, musicianId: 'fay-ansari', points: 4980, delta: 4, instrumentLabel: 'Vocals, Hip-Hop' },
  {
    rank: 10,
    musicianId: 'priya-raman',
    points: 4320,
    delta: 0,
    instrumentLabel: 'Keys, Neo-Soul',
  },
  { rank: 11, musicianId: 'jonah-wills', points: 4310, delta: -3, instrumentLabel: 'Synth, Funk' },
  { rank: 12, musicianId: 'ivo-marek', points: 4300, delta: 1, instrumentLabel: 'Drums, Rock' },
  { rank: 13, musicianId: 'ana-duarte', points: 4290, delta: -2, instrumentLabel: 'Guitar, Indie' },
  { rank: 14, musicianId: 'marcus-chen', points: 4280, delta: 3, instrumentLabel: 'Drums, Jazz' },
]

/** How many points the top ten is away. Rendered on the leaderboard and the profile nudge. */
export function pointsFromTopTen(musicianId: string): number | undefined {
  const me = leaderboard.find((e) => e.musicianId === musicianId)
  const tenth = leaderboard.find((e) => e.rank === 10)
  if (!me || !tenth || me.rank <= 10) return undefined
  return tenth.points - me.points
}
