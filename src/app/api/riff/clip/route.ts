/**
 * Real audio upload for the profile clip.
 *   POST multipart/form-data: audio (Blob), durationSec, peaks (JSON array of 0–1 numbers).
 * The profile's clip URL then points at /api/riff/clip/[userId], which serves these exact
 * bytes — the player plays what was recorded, or there is no player at all.
 */
import { NextResponse } from 'next/server'
import { viewerFromCookies } from '@/server/auth'
import * as world from '@/server/world'
import { WorldError } from '@/server/world'

export async function POST(req: Request) {
  const viewerId = await viewerFromCookies()
  if (!viewerId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Send the recording as form data' }, { status: 415 })
  }
  const audio = form.get('audio')
  if (!(audio instanceof Blob)) {
    return NextResponse.json({ error: 'The recording is missing' }, { status: 400 })
  }
  let peaks: number[] = []
  try {
    const parsed = JSON.parse(String(form.get('peaks') ?? '[]'))
    if (Array.isArray(parsed)) peaks = parsed
  } catch {
    // ignored — the clip just renders with default bars
  }
  try {
    const clip = world.saveClip(viewerId, {
      mime: audio.type,
      bytes: Buffer.from(await audio.arrayBuffer()),
      durationSec: Number(form.get('durationSec')),
      peaks,
    })
    return NextResponse.json({ result: clip, snapshot: world.buildSnapshot(viewerId) })
  } catch (e) {
    if (e instanceof WorldError)
      return NextResponse.json({ error: e.message }, { status: e.status })
    throw e
  }
}
