import type { Genre, Instrument, Intent, JamStatus, VouchTag } from '@/types'

const INSTRUMENT: Record<Instrument, string> = {
  drums: 'Drums',
  bass: 'Bass',
  keys: 'Keys',
  guitar: 'Guitar',
  vocals: 'Vocals',
  sax: 'Sax',
  synth: 'Synth',
  percussion: 'Percussion',
}

/** "Drums" → "Drummer" for the card subtitle line on Discover. */
const PLAYER: Record<Instrument, string> = {
  drums: 'Drummer',
  bass: 'Bassist',
  keys: 'Keys player',
  guitar: 'Guitarist',
  vocals: 'Vocalist',
  sax: 'Sax player',
  synth: 'Synth player',
  percussion: 'Percussionist',
}

const GENRE: Record<Genre, string> = {
  jazz: 'Jazz',
  'neo-soul': 'Neo-Soul',
  fusion: 'Fusion',
  indie: 'Indie',
  rock: 'Rock',
  funk: 'Funk',
  'hip-hop': 'Hip-Hop',
}

const INTENT: Record<Intent, string> = {
  casual: 'Casual Jam',
  serious: 'Serious Project',
  gigging: 'Gigging',
}

const JAM_STATUS: Record<JamStatus, string> = {
  draft: 'Draft',
  pending: 'Pending',
  confirmed: 'Confirmed',
  live: 'Live',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const instrumentLabel = (i: Instrument) => INSTRUMENT[i]
export const playerLabel = (i: Instrument) => PLAYER[i]
export const genreLabel = (g: Genre) => GENRE[g]
export const intentLabel = (i: Intent) => INTENT[i]
export const jamStatusLabel = (s: JamStatus) => JAM_STATUS[s]

/** "GreatPocket" → "#GreatPocket" */
export const vouchTagLabel = (t: VouchTag) => `#${t}`

/** "JAZZ / NEO-SOUL" */
export const genreLane = (genres: Genre[]) => genres.map(genreLabel).join(' / ').toUpperCase()

/** 2535 → "42:15" */
export function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = Math.floor(totalSeconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

/** Joins names the way the copy does: "Sarah", "Sarah and Leo", "Sarah, Leo and Nina". */
export function joinNames(names: string[]): string {
  if (names.length === 0) return ''
  if (names.length === 1) return names[0]
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

/** "three" reads better than "3" in the recording-consent line. */
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']
export const spellNumber = (n: number) => WORDS[n] ?? String(n)

/** "Greenpoint, Brooklyn" → "Greenpoint". Cards show the patch, not the borough. */
export const shortNeighborhood = (neighborhood: string) => neighborhood.split(',')[0].trim()

/** A maps deep link. Only ever called with an address the viewer is allowed to see. */
export const directionsHref = (query: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
