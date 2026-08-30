import type { Jam, JamRequest, OpenCallApplication } from '@/types'

/**
 * The scene, relative to src/mocks/clock.ts (Fri 28 Aug 2026, 3:00 PM ET).
 *
 * docs/SPEC.md §2 calls the Neo-Soul Session a *recurring* jam, so it appears twice: last
 * Friday's instance is completed and still owes a recap, and tonight's instance is confirmed.
 * That pairing is what gives the recap screen something real to file and the reputation
 * helpers a repeat-jam pair to find.
 */
export const jams: Jam[] = [
  {
    id: 'jam-neosoul-0828',
    title: 'Neo-Soul Session',
    intent: 'casual',
    status: 'confirmed',
    startsAt: '2026-08-28T19:00:00-04:00',
    durationHours: 2,
    venueId: 'sonic-basement',
    hostId: 'marcus-chen',
    attendees: [
      { musicianId: 'marcus-chen', instrument: 'drums', rsvp: 'confirmed' },
      { musicianId: 'sarah-jenkins', instrument: 'bass', rsvp: 'confirmed' },
      { musicianId: 'leo-rossi', instrument: 'keys', rsvp: 'confirmed' },
      { musicianId: 'nina-alvarez', instrument: 'vocals', rsvp: 'confirmed' },
    ],
    openSeats: [],
    isOpenCall: false,
    threadId: 'thread-neosoul',
  },
  {
    id: 'jam-late-night-fusion',
    title: 'Late Night Fusion',
    intent: 'casual',
    // Pending: Priya has not replied, so nothing is confirmed. See docs/SPEC.md §5.1.
    status: 'pending',
    startsAt: '2026-08-30T16:00:00-04:00',
    durationHours: 3,
    venueId: 'the-attic',
    hostId: 'marcus-chen',
    attendees: [
      { musicianId: 'marcus-chen', instrument: 'drums', rsvp: 'confirmed' },
      { musicianId: 'jonah-wills', instrument: 'synth', rsvp: 'confirmed' },
      { musicianId: 'priya-raman', instrument: 'keys', rsvp: 'pending' },
    ],
    openSeats: [],
    isOpenCall: false,
    threadId: 'thread-fusion',
  },
  {
    id: 'jam-neosoul-0821',
    title: 'Neo-Soul Session',
    intent: 'casual',
    // Completed last Friday and still un-recapped — this is what /jams/[id]/recap opens on.
    status: 'completed',
    startsAt: '2026-08-21T19:00:00-04:00',
    durationHours: 2,
    actualDurationMin: 102, // "1h 42m"

    venueId: 'sonic-basement',
    hostId: 'marcus-chen',
    attendees: [
      { musicianId: 'marcus-chen', instrument: 'drums', rsvp: 'confirmed' },
      { musicianId: 'sarah-jenkins', instrument: 'bass', rsvp: 'confirmed' },
      { musicianId: 'leo-rossi', instrument: 'keys', rsvp: 'confirmed' },
      { musicianId: 'nina-alvarez', instrument: 'vocals', rsvp: 'confirmed' },
    ],
    openSeats: [],
    isOpenCall: false,
    threadId: 'thread-neosoul-0821',
    recordingId: 'rec-neosoul-0821',
  },
  {
    id: 'jam-fusion-night',
    title: 'Fusion Night',
    intent: 'casual',
    status: 'completed',
    startsAt: '2026-08-14T20:00:00-04:00',
    durationHours: 2,
    actualDurationMin: 125, // "2h 05m"

    venueId: 'the-attic',
    hostId: 'sarah-jenkins',
    attendees: [
      { musicianId: 'marcus-chen', instrument: 'drums', rsvp: 'confirmed', showedUp: true },
      { musicianId: 'sarah-jenkins', instrument: 'bass', rsvp: 'confirmed', showedUp: true },
      { musicianId: 'theo-park', instrument: 'guitar', rsvp: 'confirmed', showedUp: true },
    ],
    openSeats: [],
    isOpenCall: false,
    threadId: 'thread-fusion-night',
    recordingId: 'rec-fusion-night',
    recapId: 'recap-fusion-night',
  },
  {
    id: 'jam-open-call-keys',
    title: 'Looking for Keys for a Neo-Soul Session',
    intent: 'casual',
    status: 'pending',
    startsAt: '2026-09-04T20:00:00-04:00',
    durationHours: 2,
    venueId: 'sonic-basement',
    hostId: 'leo-rossi',
    attendees: [{ musicianId: 'leo-rossi', instrument: 'keys', rsvp: 'confirmed' }],
    // Marcus applied on drums; the title leads with keys because that is the harder seat.
    openSeats: ['keys', 'drums'],
    isOpenCall: true,
    postedAt: '2026-08-28T13:00:00-04:00',
    message:
      'Loose neo-soul thing, nobody is auditioning. Bring something you have been sitting on.',
    threadId: 'thread-open-call-keys',
  },
  {
    // Older history: these two carry the vouches whose authors are not on the recent jams,
    // so rule 4 (only confirmed co-attendees vouch) holds for every vouch on record.
    // No recaps exist for them, so they add nothing to the attendance denominator.
    id: 'jam-june-loft',
    title: 'Loft Session',
    intent: 'casual',
    status: 'completed',
    startsAt: '2026-06-20T20:00:00-04:00',
    durationHours: 2,
    venueId: 'the-attic',
    hostId: 'marcus-chen',
    attendees: [
      { musicianId: 'marcus-chen', instrument: 'drums', rsvp: 'confirmed' },
      { musicianId: 'miles-whitfield', instrument: 'bass', rsvp: 'confirmed' },
      { musicianId: 'jonah-wills', instrument: 'synth', rsvp: 'confirmed' },
    ],
    openSeats: [],
    isOpenCall: false,
    threadId: 'thread-june-loft',
  },
  {
    id: 'jam-july-funk',
    title: 'July Funk Night',
    intent: 'casual',
    status: 'completed',
    startsAt: '2026-07-17T20:00:00-04:00',
    durationHours: 2,
    venueId: 'riverside-rehearsal',
    hostId: 'camille-okafor',
    attendees: [
      { musicianId: 'marcus-chen', instrument: 'drums', rsvp: 'confirmed' },
      { musicianId: 'ruby-sims', instrument: 'sax', rsvp: 'confirmed' },
      { musicianId: 'camille-okafor', instrument: 'percussion', rsvp: 'confirmed' },
    ],
    openSeats: [],
    isOpenCall: false,
    threadId: 'thread-july-funk',
  },
  {
    // The one open call the current user has NOT touched — it keeps the "Apply to join"
    // state reachable on Discover (the other two calls are his own or already applied to).
    id: 'jam-open-call-rhythm',
    title: 'Vocalist seeks a funk rhythm section',
    intent: 'gigging',
    status: 'pending',
    startsAt: '2026-09-05T20:00:00-04:00',
    durationHours: 2,
    venueId: 'the-attic',
    hostId: 'nina-alvarez',
    attendees: [{ musicianId: 'nina-alvarez', instrument: 'vocals', rsvp: 'confirmed' }],
    openSeats: ['drums', 'bass'],
    isOpenCall: true,
    postedAt: '2026-08-28T09:30:00-04:00',
    message:
      'Three originals and a set of covers, aiming at a paid slot in October. Tight but fun.',
    threadId: 'thread-open-call-rhythm',
  },
  {
    id: 'jam-open-call-bass',
    title: 'Bass wanted for a Thursday standards session',
    intent: 'casual',
    status: 'pending',
    startsAt: '2026-09-03T19:30:00-04:00',
    durationHours: 2,
    venueId: 'riverside-rehearsal',
    hostId: 'marcus-chen',
    attendees: [{ musicianId: 'marcus-chen', instrument: 'drums', rsvp: 'confirmed' }],
    openSeats: ['bass'],
    isOpenCall: true,
    postedAt: '2026-08-27T18:00:00-04:00',
    message: 'Real book, slow tempos, nobody is auditioning. Bring a pencil.',
    threadId: 'thread-open-call-bass',
  },
]

export const jamRequests: JamRequest[] = [
  {
    id: 'req-miles-marcus',
    fromId: 'miles-whitfield',
    toId: 'marcus-chen',
    intent: 'serious',
    proposedTimes: ['2026-08-29T19:00:00-04:00', '2026-08-30T18:00:00-04:00'],
    venueId: 'riverside-rehearsal',
    message:
      'Heard your clip — that shuffle at 0:12 is exactly the feel I have been chasing. Two hours somewhere quiet?',
    status: 'pending',
    createdAt: '2026-08-28T11:20:00-04:00',
  },
  {
    id: 'req-camille-marcus',
    fromId: 'camille-okafor',
    toId: 'marcus-chen',
    intent: 'casual',
    proposedTimes: ['2026-08-31T20:00:00-04:00'],
    venueSuggestion: 'Anywhere in Bed-Stuy with a decent kit',
    message: 'Two drummers, one kit, no ego. Worth a try?',
    status: 'pending',
    createdAt: '2026-08-27T16:45:00-04:00',
  },
]

export const openCallApplications: OpenCallApplication[] = [
  {
    id: 'app-jonah-bass-call',
    jamId: 'jam-open-call-bass',
    applicantId: 'jonah-wills',
    instrument: 'bass',
    status: 'pending',
    appliedAt: '2026-08-28T12:00:00-04:00',
  },
  {
    id: 'app-marcus-keys-call',
    jamId: 'jam-open-call-keys',
    applicantId: 'marcus-chen',
    instrument: 'drums',
    status: 'pending',
    appliedAt: '2026-08-28T13:00:00-04:00',
  },
]
