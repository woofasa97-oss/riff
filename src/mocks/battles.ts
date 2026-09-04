import type { Battle } from '@/types'

/**
 * Vote figures are raw counts, not percentages — the bracket and battle screens derive the
 * share. One extra vote does not move a percentage, which is exactly the point.
 *
 * Season 4, eight bands. The Brooklyn scope on the bracket screen filters this down to the
 * matches a Brooklyn band played, which is the half-bracket the reference screen draws.
 */
export const battles: Battle[] = [
  {
    id: 'b-qf-1',
    seasonId: 'season-4',
    round: 'quarter',
    bandAId: 'neon-echoes',
    bandBId: 'dust-radio',
    votesA: 6100,
    votesB: 3900,
    status: 'finished',
    winnerBandId: 'neon-echoes',
    stageLabel: 'Stage 01 · Grand Ballroom',
  },
  {
    id: 'b-qf-2',
    seasonId: 'season-4',
    round: 'quarter',
    bandAId: 'paper-cranes',
    bandBId: 'iron-belle',
    votesA: 4500,
    votesB: 5500,
    status: 'finished',
    winnerBandId: 'iron-belle',
    stageLabel: 'Stage 02 · Warehouse 7',
  },
  {
    id: 'b-qf-3',
    seasonId: 'season-4',
    round: 'quarter',
    bandAId: 'velvet-static',
    bandBId: 'cold-tangerine',
    votesA: 6700,
    votesB: 3300,
    status: 'finished',
    winnerBandId: 'velvet-static',
    stageLabel: 'Stage 01 · Grand Ballroom',
  },
  {
    id: 'b-qf-4',
    seasonId: 'season-4',
    round: 'quarter',
    bandAId: 'lunar-resonance',
    bandBId: 'harbour-lights',
    votesA: 5200,
    votesB: 4800,
    status: 'finished',
    winnerBandId: 'lunar-resonance',
    stageLabel: 'Stage 02 · Warehouse 7',
  },
  {
    id: 'b-sf-1',
    seasonId: 'season-4',
    round: 'semi',
    bandAId: 'neon-echoes',
    bandBId: 'iron-belle',
    votesA: 5800,
    votesB: 4200,
    status: 'finished',
    winnerBandId: 'neon-echoes',
    stageLabel: 'Stage 03 · Grand Ballroom',
  },
  {
    id: 'b-sf-2',
    seasonId: 'season-4',
    round: 'semi',
    bandAId: 'velvet-static',
    bandBId: 'lunar-resonance',
    votesA: 5400,
    votesB: 4600,
    status: 'finished',
    winnerBandId: 'velvet-static',
    stageLabel: 'Stage 03 · Warehouse 7',
  },
  {
    id: 'b-final',
    seasonId: 'season-4',
    round: 'final',
    bandAId: 'neon-echoes',
    bandBId: 'velvet-static',
    votesA: 6816,
    votesB: 7384,
    status: 'live',
    stageLabel: 'Stage 04 · Grand Ballroom vs. Warehouse 7',
    kind: 'bracket',
  },
  // Casual head-to-heads running live right now — free and unlimited, outside the bracket. These
  // fill the Live "Battles" grid so there is always more than one to choose between.
  {
    id: 'b-live-funk',
    seasonId: 'season-4',
    round: 'quarter',
    bandAId: 'cold-tangerine',
    bandBId: 'iron-belle',
    votesA: 2140,
    votesB: 1890,
    status: 'live',
    stageLabel: 'Casual battle · Bushwick',
    kind: 'casual',
  },
  {
    id: 'b-live-dream',
    seasonId: 'season-4',
    round: 'quarter',
    bandAId: 'paper-cranes',
    bandBId: 'harbour-lights',
    votesA: 980,
    votesB: 1240,
    status: 'live',
    stageLabel: 'Casual battle · Greenpoint',
    kind: 'casual',
  },
  {
    id: 'b-live-alt',
    seasonId: 'season-4',
    round: 'quarter',
    bandAId: 'dust-radio',
    bandBId: 'lunar-resonance',
    votesA: 3050,
    votesB: 3310,
    status: 'live',
    stageLabel: 'Casual battle · Williamsburg',
    kind: 'casual',
  },
]

export const ROUND_ORDER = ['quarter', 'semi', 'final'] as const

export const ROUND_LABEL: Record<Battle['round'], string> = {
  quarter: 'Quarter finals',
  semi: 'Semi finals',
  final: 'Final',
}

/** The furthest round a band reached, as a badge string. */
export function seasonBadgeFor(bandId: string): string | undefined {
  const played = battles.filter((b) => b.bandAId === bandId || b.bandBId === bandId)
  if (played.length === 0) return undefined
  if (played.some((b) => b.round === 'final')) {
    const final = played.find((b) => b.round === 'final')!
    if (final.status !== 'finished') return 'Season 1 · Finalist'
    return final.winnerBandId === bandId ? 'Season 1 · Champion' : 'Season 1 · Runner-up'
  }
  if (played.some((b) => b.round === 'semi')) return 'Season 1 · Semi finalist'
  return 'Season 1 · Quarter finalist'
}

/** Vote share as whole percentages that always add to 100. */
/** @deprecated superseded by the server-computed battleTallies in the snapshot. */
export function voteShare(battle: Battle): { a: number; b: number } {
  const total = battle.votesA + battle.votesB
  if (total === 0) return { a: 50, b: 50 }
  const a = Math.round((battle.votesA / total) * 100)
  return { a, b: 100 - a }
}

/** Seed chat for the live final — the same shape live-session chat uses. */
export const battleChatSeed: Record<string, import('@/types').LiveComment[]> = {
  'b-final': [
    {
      id: 'bc-1',
      handle: 'sarahj',
      body: 'They are absolutely killing this set',
      sentAt: '2026-08-28T14:48:00-04:00',
    },
    {
      id: 'bc-2',
      handle: 'mike_r',
      body: 'Need them to win this one',
      sentAt: '2026-08-28T14:52:00-04:00',
    },
    {
      id: 'bc-3',
      handle: 'jax_m',
      body: 'warehouse 7 is going crazy right now',
      sentAt: '2026-08-28T14:57:00-04:00',
    },
  ],
}
