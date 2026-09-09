import type { TeacherProfile } from '@/types'
import { NOW } from './clock'

/**
 * Seed teachers — musicians from the fixture cast who take students, so the directory is a
 * living page before any member lists themselves. Instruments match each musician's own
 * profile (src/mocks/musicians.ts); a mismatch there would read as a lie on the teacher card.
 * Seeded on first boot (src/server/db.ts) and flagged is_seed there: they auto-accept lesson
 * requests after a short beat, the same convention as seed musicians accepting jam requests.
 */
export const seedTeachers: TeacherProfile[] = [
  {
    musicianId: 'priya-raman',
    headline: 'Jazz piano from the changes up',
    bio: 'Fifteen years of gigging and eight of teaching. We start from tunes you love, build voicings and comping you can actually use at a session, and get you to your first jam inside two months.',
    instruments: ['keys'],
    ratePerHourUsd: 48,
    online: true,
    inPerson: true,
    active: true,
    createdAt: NOW,
  },
  {
    musicianId: 'theo-park',
    headline: 'Guitar — rhythm first, solos second',
    bio: 'Most players can shred alone and vanish in a band. I teach the opposite order: pocket, voicing choices, and listening. Bring the songs you want to play with other people.',
    instruments: ['guitar'],
    ratePerHourUsd: 40,
    online: true,
    inPerson: true,
    active: true,
    createdAt: NOW,
  },
  {
    musicianId: 'ruby-sims',
    headline: 'Saxophone tone and vocabulary',
    bio: 'Long tones that do not bore you to death, transcription in small honest pieces, and how to walk into a jam knowing what to play on the head and what to leave out.',
    instruments: ['sax'],
    ratePerHourUsd: 55,
    online: false,
    inPerson: true,
    active: true,
    createdAt: NOW,
  },
  {
    musicianId: 'miles-whitfield',
    headline: 'Bass lines that make the band sound better',
    bio: 'Electric and upright. Walking lines, groove construction, and the discipline of playing less. First lesson is a diagnostic — we chart exactly what to fix in what order.',
    instruments: ['bass'],
    ratePerHourUsd: 35,
    online: true,
    inPerson: false,
    active: true,
    createdAt: NOW,
  },
  {
    musicianId: 'fay-ansari',
    headline: 'Voice — range, control, confidence',
    bio: 'Technique without the mysticism: breath, placement, and repertoire matched to your actual voice. Beginners welcome; so are gigging singers whose voice tires by the third set.',
    instruments: ['vocals', 'keys'],
    ratePerHourUsd: 45,
    online: true,
    inPerson: true,
    active: true,
    createdAt: NOW,
  },
]
