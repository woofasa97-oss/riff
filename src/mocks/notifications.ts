import type { Notification } from '@/types'

export const notifications: Notification[] = [
  {
    id: 'n-1',
    kind: 'request_accepted',
    actorId: 'sarah-jenkins',
    body: 'Sarah Jenkins accepted your jam request.',
    meta: { jamId: 'jam-neosoul-0828' },
    createdAt: '2026-08-28T09:14:00-04:00',
    read: false,
  },
  {
    id: 'n-2',
    kind: 'vouch_received',
    actorId: 'leo-rossi',
    body: 'Leo Rossi vouched for you — #ListenFirst, #GoodEnergy.',
    meta: { musicianId: 'marcus-chen' },
    createdAt: '2026-08-28T08:02:00-04:00',
    read: false,
  },
  {
    id: 'n-3',
    kind: 'open_call_application',
    actorId: 'priya-raman',
    body: 'Priya Raman applied to your open call for Late Night Fusion.',
    meta: { jamId: 'jam-late-night-fusion' },
    createdAt: '2026-08-27T20:31:00-04:00',
    read: true,
  },
  {
    id: 'n-4',
    kind: 'rank_change',
    body: 'You moved up 3 places in the Brooklyn Jazz Scene. You are now #14.',
    meta: { rank: '14' },
    createdAt: '2026-08-26T07:00:00-04:00',
    read: true,
  },
  {
    id: 'n-5',
    kind: 'band_live',
    body: 'The Neon Echoes just went live at Riverside Rehearsal.',
    meta: { bandId: 'neon-echoes' },
    createdAt: '2026-08-25T21:12:00-04:00',
    read: true,
  },
]
