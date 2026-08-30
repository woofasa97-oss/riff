import type { Band } from '@/types'

/**
 * Minimal band fixtures — enough for the Bands filter on the messages list to resolve a name.
 * The full set (docs/DATA-MODEL.md asks for four, plus battles and a bracket) belongs to
 * Phase 6, where the screens that render them get built.
 */
export const bands: Band[] = [
  {
    id: 'neon-echoes',
    name: 'The Neon Echoes',
    genre: 'Indie Rock',
    city: 'Brooklyn, NY',
    coverUrl: '/mock/venues/riverside-rehearsal.svg',
    followers: 2100,
    rating: 4.8,
    sessionCount: 12,
    members: [
      { musicianId: 'sarah-jenkins', role: 'Bass', reliabilityPct: 94 },
      { musicianId: 'marcus-chen', role: 'Drums', reliabilityPct: 98 },
      { musicianId: 'leo-rossi', role: 'Keys', reliabilityPct: 91 },
    ],
    openSeats: ['keys'],
    recordings: [],
    battleHistory: [
      { opponentBandId: 'dust-radio', scoreFor: 61, scoreAgainst: 39, result: 'won' },
    ],
    seasonBadge: 'Season 4 · Quarter finalist',
  },
  {
    id: 'dust-radio',
    name: 'Dust Radio',
    genre: 'Alt Country',
    city: 'Brooklyn, NY',
    coverUrl: '/mock/venues/the-attic.svg',
    followers: 840,
    rating: 4.3,
    sessionCount: 7,
    members: [{ musicianId: 'ana-duarte', role: 'Guitar', reliabilityPct: 89 }],
    openSeats: ['drums'],
    recordings: [],
    battleHistory: [
      { opponentBandId: 'neon-echoes', scoreFor: 39, scoreAgainst: 61, result: 'lost' },
    ],
  },
]
