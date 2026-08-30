import { battles } from './battles'
import type { Band, Recording } from '@/types'

/**
 * Battle history is not authored here — it is folded out of the battles fixture, so the bracket
 * screen and a band's profile can never disagree about who beat whom.
 */
function historyFor(bandId: string): Band['battleHistory'] {
  return battles
    .filter((b) => b.status === 'finished' && (b.bandAId === bandId || b.bandBId === bandId))
    .map((b) => {
      const isA = b.bandAId === bandId
      return {
        opponentBandId: isA ? b.bandBId : b.bandAId,
        scoreFor: isA ? b.votesA : b.votesB,
        scoreAgainst: isA ? b.votesB : b.votesA,
        result: b.winnerBandId === bandId ? ('won' as const) : ('lost' as const),
      }
    })
}

function recording(
  id: string,
  title: string,
  venueName: string | undefined,
  recordedAt: string,
  durationSec: number,
): Recording {
  return { id, title, venueName, recordedAt, durationSec, url: `/mock/recordings/${id}.m4a` }
}

interface BandSeed {
  id: string
  name: string
  genre: string
  city: string
  followers: number
  rating: number
  sessionCount: number
  members: { musicianId: string; role: string }[]
  openSeats: Band['openSeats']
  recordings: Recording[]
}

const seeds: BandSeed[] = [
  {
    id: 'neon-echoes',
    name: 'The Neon Echoes',
    genre: 'Indie Rock',
    city: 'Brooklyn, NY',
    followers: 2100,
    rating: 4.8,
    sessionCount: 12,
    members: [
      { musicianId: 'sarah-jenkins', role: 'Bassist' },
      { musicianId: 'marcus-chen', role: 'Drums' },
      { musicianId: 'leo-rossi', role: 'Keys' },
    ],
    // A second keyboard seat — they want the Rhodes and the synth covered at once.
    openSeats: ['keys'],
    recordings: [
      recording(
        'rec-ne-1',
        'Basement Session vol. 4',
        'Sonic Basement',
        '2026-08-12T21:00:00-04:00',
        222,
      ),
      recording(
        'rec-ne-2',
        'Riff Battle: Quarter Finals',
        'vs Velvet Static',
        '2026-07-28T20:30:00-04:00',
        255,
      ),
    ],
  },
  {
    id: 'velvet-static',
    name: 'Velvet Static',
    genre: 'Post-Punk',
    city: 'London, UK',
    followers: 3400,
    rating: 4.7,
    sessionCount: 19,
    members: [{ musicianId: 'ana-duarte', role: 'Guitar' }],
    openSeats: [],
    recordings: [
      recording('rec-vs-1', 'Cold Room Demos', undefined, '2026-08-02T19:00:00-04:00', 198),
    ],
  },
  {
    id: 'lunar-resonance',
    name: 'Lunar Resonance',
    genre: 'Neo-Soul',
    city: 'Brooklyn, NY',
    followers: 1800,
    rating: 4.9,
    sessionCount: 15,
    members: [
      { musicianId: 'nina-alvarez', role: 'Vocals' },
      { musicianId: 'priya-raman', role: 'Keys' },
      { musicianId: 'camille-okafor', role: 'Percussion' },
    ],
    openSeats: ['bass'],
    recordings: [
      recording('rec-lr-1', 'Moonlit Set', 'Sonic Basement', '2026-08-20T22:00:00-04:00', 314),
    ],
  },
  {
    id: 'dust-radio',
    name: 'Dust Radio',
    genre: 'Alt Country',
    city: 'Brooklyn, NY',
    followers: 840,
    rating: 4.3,
    sessionCount: 7,
    members: [{ musicianId: 'theo-park', role: 'Guitar' }],
    openSeats: ['drums'],
    recordings: [],
  },
  {
    id: 'paper-cranes',
    name: 'Paper Cranes',
    genre: 'Dream Pop',
    city: 'Brooklyn, NY',
    followers: 1120,
    rating: 4.4,
    sessionCount: 9,
    members: [{ musicianId: 'fay-ansari', role: 'Vocals' }],
    openSeats: ['guitar'],
    recordings: [],
  },
  {
    id: 'iron-belle',
    name: 'Iron Belle',
    genre: 'Garage Rock',
    city: 'Brooklyn, NY',
    followers: 1560,
    rating: 4.5,
    sessionCount: 11,
    members: [{ musicianId: 'ivo-marek', role: 'Drums' }],
    openSeats: [],
    recordings: [],
  },
  {
    id: 'cold-tangerine',
    name: 'Cold Tangerine',
    genre: 'Funk',
    city: 'Berlin, DE',
    followers: 990,
    rating: 4.2,
    sessionCount: 6,
    members: [{ musicianId: 'jonah-wills', role: 'Synth' }],
    openSeats: ['sax'],
    recordings: [],
  },
  {
    id: 'harbour-lights',
    name: 'Harbour Lights',
    genre: 'Indie Folk',
    city: 'Manchester, UK',
    followers: 720,
    rating: 4.1,
    sessionCount: 5,
    members: [{ musicianId: 'miles-whitfield', role: 'Bass' }],
    openSeats: [],
    recordings: [],
  },
]

export const bands: Band[] = seeds.map((seed) => ({
  ...seed,
  coverUrl: `/mock/bands/${seed.id}.svg`,
  battleHistory: historyFor(seed.id),
}))
