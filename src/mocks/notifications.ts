import type { Notification } from '@/types'

/**
 * `body` is the sentence *after* the actor's name, so the row renderer can set the name in the
 * serif face the way every reference screen does. Notifications with no actor carry the whole
 * sentence in `body`.
 */
export const notifications: Notification[] = [
  {
    id: 'n-1',
    kind: 'request_accepted',
    actorId: 'sarah-jenkins',
    body: 'accepted your jam request',
    meta: { jamId: 'jam-neosoul-0828' },
    createdAt: '2026-08-28T14:48:00-04:00',
    read: false,
  },
  {
    id: 'n-2',
    kind: 'vouch_received',
    actorId: 'leo-rossi',
    body: 'vouched for you',
    meta: { tags: '#ListenFirst #GoodEnergy', musicianId: 'marcus-chen' },
    createdAt: '2026-08-28T14:00:00-04:00',
    read: false,
  },
  {
    id: 'n-3',
    kind: 'open_call_application',
    actorId: 'jonah-wills',
    body: 'applied to your open call',
    meta: { jamId: 'jam-open-call-bass' },
    createdAt: '2026-08-28T12:00:00-04:00',
    read: true,
  },
  {
    id: 'n-4',
    kind: 'rank_change',
    body: 'You moved up 3 spots to #14 in',
    meta: { rank: '14', delta: '3', scene: 'Brooklyn Jazz Scene' },
    createdAt: '2026-08-27T09:00:00-04:00',
    read: true,
  },
  {
    id: 'n-5',
    kind: 'band_live',
    body: 'went live at Sonic Basement',
    meta: {
      bandId: 'lunar-resonance',
      venueId: 'sonic-basement',
      liveId: 'live-lunar-resonance',
    },
    createdAt: '2026-08-26T21:12:00-04:00',
    read: true,
  },
]
