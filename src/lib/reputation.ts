import type { Jam, Musician, MusicianStats, SessionRecap, Vouch } from '@/types'

/**
 * Reputation is earned, never claimed (docs/SPEC.md §5.3). Nothing here reads a stored
 * percentage — every number is recomputed from recaps and jams using the formulas in
 * docs/DATA-MODEL.md § "Derived values". `Musician.baseline` supplies only the counts for
 * history the fixtures do not model as rows.
 */
export interface ReputationContext {
  jams: Jam[]
  recaps: SessionRecap[]
  vouches: Vouch[]
}

/**
 * Whether a musician showed up to a jam, according to the recaps their co-attendees filed.
 * Attendees each file their own recap, so this takes the majority; a tie counts as showed up,
 * because a single dissenting recap should not cost someone their reliability.
 *
 * Returns undefined when nobody has filed a recap covering them — an unrecapped jam is not
 * evidence of anything and must not enter the denominator.
 */
export function attendanceVerdict(
  jamId: string,
  musicianId: string,
  recaps: SessionRecap[],
): boolean | undefined {
  let yes = 0
  let no = 0
  for (const recap of recaps) {
    if (recap.jamId !== jamId) continue
    const answer = recap.attendance[musicianId]
    if (answer === true) yes++
    else if (answer === false) no++
  }
  if (yes === 0 && no === 0) return undefined
  return yes >= no
}

/** Completed jams a musician was a confirmed attendee of. */
function completedJamsFor(musicianId: string, jams: Jam[]): Jam[] {
  return jams.filter(
    (jam) =>
      jam.status === 'completed' &&
      jam.attendees.some((a) => a.musicianId === musicianId && a.rsvp === 'confirmed'),
  )
}

/** Distinct people this musician has completed two or more jams with. */
export function countRepeatJams(musicianId: string, jams: Jam[]): number {
  const together = new Map<string, number>()
  for (const jam of completedJamsFor(musicianId, jams)) {
    for (const attendee of jam.attendees) {
      if (attendee.musicianId === musicianId || attendee.rsvp !== 'confirmed') continue
      together.set(attendee.musicianId, (together.get(attendee.musicianId) ?? 0) + 1)
    }
  }
  let repeats = 0
  together.forEach((count) => {
    if (count >= 2) repeats++
  })
  return repeats
}

/**
 * Vouches filed inside recaps, flattened into the same shape as the standalone records so both
 * sources count once and only once.
 */
export function vouchesFromRecaps(recaps: SessionRecap[], jams: Jam[]): Vouch[] {
  const out: Vouch[] = []
  for (const recap of recaps) {
    for (const vouch of recap.vouches) {
      if (vouch.tags.length === 0 && !vouch.note) continue
      out.push({
        id: `${recap.id}:${vouch.toId}`,
        fromId: recap.authorId,
        toId: vouch.toId,
        tags: vouch.tags,
        note: vouch.note ?? '',
        sessionsTogether: sessionsTogether(recap.authorId, vouch.toId, jams),
        jamId: recap.jamId,
        createdAt: recap.createdAt,
      })
    }
  }
  return out
}

function sessionsTogether(a: string, b: string, jams: Jam[]): number {
  return completedJamsFor(a, jams).filter((jam) =>
    jam.attendees.some((x) => x.musicianId === b && x.rsvp === 'confirmed'),
  ).length
}

/** Every vouch a musician has on record, from both sources. */
export function vouchesFor(musicianId: string, ctx: ReputationContext): Vouch[] {
  return [...ctx.vouches, ...vouchesFromRecaps(ctx.recaps, ctx.jams)].filter(
    (v) => v.toId === musicianId,
  )
}

export function deriveStats(musician: Musician, ctx: ReputationContext): MusicianStats {
  let attendances = musician.baseline.attendances
  let showedUp = musician.baseline.showedUp

  for (const jam of completedJamsFor(musician.id, ctx.jams)) {
    const verdict = attendanceVerdict(jam.id, musician.id, ctx.recaps)
    if (verdict === undefined) continue
    attendances++
    if (verdict) showedUp++
  }

  const reliabilityPct = attendances === 0 ? 0 : Math.round((showedUp / attendances) * 100)
  const repeatJams = musician.baseline.repeatJamsOffset + countRepeatJams(musician.id, ctx.jams)
  const vouchCount = musician.baseline.vouches + vouchesFor(musician.id, ctx).length

  return {
    isNew: attendances === 0,
    reliabilityPct,
    repeatJams,
    vouchCount,
    jamsHosted: musician.jamsHosted,
    topReliability: reliabilityPct >= 95 && repeatJams >= 10,
  }
}
