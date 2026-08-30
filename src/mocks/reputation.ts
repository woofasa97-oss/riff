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
export const vouches: Vouch[] = [
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
    createdAt: '2026-08-22T09:40:00-04:00',
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
    jamId: 'jam-fusion-night',
    createdAt: '2026-07-30T20:00:00-04:00',
  },
  {
    id: 'v-6',
    fromId: 'camille-okafor',
    toId: 'marcus-chen',
    tags: ['EasyToPlayWith', 'GoodEnergy'],
    note: 'Two percussionists in one room and it never turned into a fight.',
    sessionsTogether: 3,
    jamId: 'jam-fusion-night',
    createdAt: '2026-07-18T22:30:00-04:00',
  },
  {
    id: 'v-7',
    fromId: 'miles-whitfield',
    toId: 'marcus-chen',
    tags: ['SolidTime', 'ListenFirst'],
    note: 'Locked in by the second chorus. Easiest session I have had this year.',
    sessionsTogether: 5,
    jamId: 'jam-fusion-night',
    createdAt: '2026-07-05T19:10:00-04:00',
  },
  {
    id: 'v-8',
    fromId: 'jonah-wills',
    toId: 'marcus-chen',
    tags: ['ProVibe', 'EarlyBird'],
    note: 'Showed up with spare sticks for someone who was not him.',
    sessionsTogether: 2,
    jamId: 'jam-fusion-night',
    createdAt: '2026-06-21T21:45:00-04:00',
  },
]

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
