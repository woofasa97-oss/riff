import type { Recording, SessionRecap, Vouch } from '@/types'

/**
 * One filed recap. jam-neosoul-0821 deliberately has none — that is the jam the recap screen
 * opens on, so posting it is what makes the reputation numbers move.
 */
export const sessionRecaps: SessionRecap[] = [
  {
    id: 'recap-fusion-night',
    jamId: 'jam-fusion-night',
    authorId: 'marcus-chen',
    attendance: { 'marcus-chen': true, 'sarah-jenkins': true, 'theo-park': true },
    vouches: [
      {
        toId: 'sarah-jenkins',
        tags: ['SolidTime', 'ListenFirst'],
        note: 'Never rushed a single bar.',
      },
      { toId: 'theo-park', tags: ['GoodEnergy'], note: 'Comped behind everyone all night.' },
    ],
    publishRecording: false,
    durationLabel: '2h 05m',
    createdAt: '2026-08-15T10:12:00-04:00',
  },
]

/**
 * Vouches Marcus has received, denormalised for the vouches screen. docs/SPEC.md §2 puts him at
 * 24; these eight carry notes and the rest sit in his ReputationBaseline, because the fixtures
 * only model the recent jams rather than his whole history.
 */
const curatedVouches: Vouch[] = [
  {
    id: 'v-1',
    fromId: 'sarah-jenkins',
    toId: 'marcus-chen',
    tags: ['GreatPocket', 'SolidTime'],
    note: 'The tempo did not move once in two hours. That is rarer than it sounds.',
    sessionsTogether: 6,
    jamId: 'jam-fusion-night',
    createdAt: '2026-08-15T11:02:00-04:00',
  },
  {
    id: 'v-2',
    fromId: 'leo-rossi',
    toId: 'marcus-chen',
    tags: ['ListenFirst', 'GoodEnergy'],
    note: 'Dropped to brushes the second I started a quiet thing. Did not need asking.',
    sessionsTogether: 3,
    jamId: 'jam-neosoul-0821',
    // Filed a week after the session — which is why the vouch notification is fresh today.
    createdAt: '2026-08-28T13:55:00-04:00',
  },
  {
    id: 'v-3',
    fromId: 'theo-park',
    toId: 'marcus-chen',
    tags: ['EarlyBird', 'ProVibe'],
    note: 'Kit was up and tuned before anyone else arrived.',
    sessionsTogether: 2,
    jamId: 'jam-fusion-night',
    createdAt: '2026-08-15T18:20:00-04:00',
  },
  {
    id: 'v-4',
    fromId: 'nina-alvarez',
    toId: 'marcus-chen',
    tags: ['ListenFirst', 'EasyToPlayWith'],
    note: 'Left space for the vocal without me having to ask for it.',
    sessionsTogether: 2,
    jamId: 'jam-neosoul-0821',
    createdAt: '2026-08-22T12:15:00-04:00',
  },
  {
    id: 'v-5',
    fromId: 'ruby-sims',
    toId: 'marcus-chen',
    tags: ['GreatPocket', 'ProVibe'],
    note: 'Held a slow funk down for eleven minutes and never got bored.',
    sessionsTogether: 4,
    jamId: 'jam-july-funk',
    createdAt: '2026-07-30T20:00:00-04:00',
  },
  {
    id: 'v-6',
    fromId: 'camille-okafor',
    toId: 'marcus-chen',
    tags: ['EasyToPlayWith', 'GoodEnergy'],
    note: 'Two percussionists in one room and it never turned into a fight.',
    sessionsTogether: 3,
    jamId: 'jam-july-funk',
    createdAt: '2026-07-18T22:30:00-04:00',
  },
  {
    id: 'v-7',
    fromId: 'miles-whitfield',
    toId: 'marcus-chen',
    tags: ['SolidTime', 'ListenFirst'],
    note: 'Locked in by the second chorus. Easiest session I have had this year.',
    sessionsTogether: 5,
    jamId: 'jam-june-loft',
    createdAt: '2026-07-05T19:10:00-04:00',
  },
  {
    id: 'v-8',
    fromId: 'jonah-wills',
    toId: 'marcus-chen',
    tags: ['ProVibe', 'EarlyBird'],
    note: 'Showed up with spare sticks for someone who forgot theirs.',
    sessionsTogether: 2,
    jamId: 'jam-june-loft',
    createdAt: '2026-06-21T21:45:00-04:00',
  },
]

/**
 * Baseline vouches, materialised as records so a profile's vouch COUNT always equals the vouch
 * LIST beneath it (previously the count added an un-listed baseline and the two disagreed).
 * These are note-less "earned in earlier sessions" entries — the vouches screen renders them
 * with that framing. The curated notes above stay as-is and count on top.
 */
const VOUCH_TAG_CYCLE: import('@/types').VouchTag[] = [
  'GreatPocket',
  'ListenFirst',
  'SolidTime',
  'GoodEnergy',
  'ProVibe',
  'EasyToPlayWith',
  'EarlyBird',
]

function materialiseBaselineVouches(): Vouch[] {
  // Deterministic voucher pool: the other musicians, so each note-less vouch is attributable.
  const voucherIds = [
    'marcus-chen',
    'sarah-jenkins',
    'leo-rossi',
    'nina-alvarez',
    'theo-park',
    'ruby-sims',
    'david-chen',
    'priya-raman',
    'jonah-wills',
    'camille-okafor',
    'ana-duarte',
    'miles-whitfield',
    'ivo-marek',
    'fay-ansari',
  ]
  // Materialise exactly `baseline.vouches` records per musician. Combined with the curated
  // records and recap-derived vouches, this reproduces each musician's original total while
  // making every one of them appear in the list — so count == list length everywhere.
  const baselines: Record<string, number> = {
    'marcus-chen': 16,
    'sarah-jenkins': 11,
    'leo-rossi': 9,
    'nina-alvarez': 8,
    'theo-park': 6,
    'ruby-sims': 14,
    'david-chen': 3,
    'priya-raman': 5,
    'jonah-wills': 7,
    'camille-okafor': 13,
    'ana-duarte': 2,
    'miles-whitfield': 12,
    'ivo-marek': 6,
    'fay-ansari': 10,
  }

  const out: Vouch[] = []
  for (const [toId, total] of Object.entries(baselines)) {
    const needed = total
    let vi = 0
    for (let k = 0; k < needed; k++) {
      // Skip self-vouches; walk the pool.
      let fromId = voucherIds[vi % voucherIds.length]
      vi++
      if (fromId === toId) {
        fromId = voucherIds[vi % voucherIds.length]
        vi++
      }
      out.push({
        id: `v-base-${toId}-${k}`,
        fromId,
        toId,
        tags: [VOUCH_TAG_CYCLE[(k + toId.length) % VOUCH_TAG_CYCLE.length]],
        note: '',
        sessionsTogether: 1 + ((k + toId.length) % 4),
        jamId: 'jam-fusion-night',
        createdAt: new Date(Date.parse('2026-05-01T12:00:00-04:00') + k * 3_600_000).toISOString(),
      })
    }
  }
  return out
}

export const recordings: Recording[] = [
  {
    id: 'rec-neosoul-0821',
    title: 'Neo-Soul Session',
    venueName: 'Sonic Basement',
    recordedAt: '2026-08-21T19:08:00-04:00',
    durationSec: 2535, // 42:15
    url: '/mock/recordings/rec-neosoul-0821.m4a',
  },
]

/**
 * Publishing a session recording needs every attendee to agree. Seeded so that the three
 * co-attendees have already said yes and the decision is the current user's.
 */
export const recordingConsents: Record<string, string[]> = {
  'jam-neosoul-0821': ['sarah-jenkins', 'leo-rossi', 'nina-alvarez'],
}

/**
 * The single source of truth for vouches: curated (noted) records plus the materialised
 * baseline. A profile's vouch count is derived from THIS list, so count and list always agree.
 */
export const vouches: Vouch[] = [...curatedVouches, ...materialiseBaselineVouches()]
