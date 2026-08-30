/**
 * The app's single data endpoint.
 *   GET  → the viewer's world snapshot.
 *   POST → { action, payload } dispatched to the matching authorized mutation, answering with
 *          a fresh snapshot so the client is always exactly one round-trip from the truth.
 * Mirrors the client store's action surface one-to-one — src/lib/store.ts is the other half.
 */
import { NextResponse } from 'next/server'
import { viewerFromCookies } from '@/server/auth'
import * as world from '@/server/world'
import { WorldError } from '@/server/world'

export async function GET() {
  const viewerId = await viewerFromCookies()
  try {
    // No session → the public world for a guest. Signing up is the only gate on mutations.
    return NextResponse.json(viewerId ? world.buildSnapshot(viewerId) : world.buildGuestSnapshot())
  } catch (e) {
    if (e instanceof WorldError)
      return NextResponse.json({ error: e.message }, { status: e.status })
    throw e
  }
}

export async function POST(req: Request) {
  const viewerId = await viewerFromCookies()
  if (!viewerId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  if (!req.headers.get('content-type')?.includes('application/json')) {
    return NextResponse.json({ error: 'JSON only' }, { status: 415 })
  }
  const { action, payload } = await req.json().catch(() => ({}))

  try {
    let result: unknown
    switch (action) {
      case 'updateProfile':
        world.updateProfile(viewerId, payload)
        break
      case 'sendJamRequest':
        result = world.sendJamRequest(viewerId, payload)
        break
      case 'respondToRequest':
        result = world.respondToRequest(viewerId, payload)
        break
      case 'postJam':
        result = world.postJam(viewerId, payload)
        break
      case 'applyToOpenCall':
        world.applyToOpenCall(viewerId, payload.jamId, payload.instrument)
        break
      case 'withdrawFromJam':
        world.withdrawFromJam(viewerId, payload.jamId)
        break
      case 'sendMessage':
        result = world.sendMessage(viewerId, payload.threadId, payload.body)
        break
      case 'markThreadRead':
        world.markThreadRead(viewerId, payload.threadId)
        break
      case 'openDirectThread':
        result = world.openDirectThread(viewerId, payload.musicianId)
        break
      case 'postRecap':
        result = world.postRecap(viewerId, payload)
        break
      case 'setRecordingConsent':
        world.setRecordingConsent(viewerId, payload.jamId, payload.consents)
        break
      case 'markNotificationRead':
        world.markNotificationRead(viewerId, payload.id)
        break
      case 'markAllNotificationsRead':
        world.markAllNotificationsRead(viewerId)
        break
      case 'enterCompetition':
        result = world.enterCompetition(viewerId)
        break
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
    return NextResponse.json({ result: result ?? null, snapshot: world.buildSnapshot(viewerId) })
  } catch (e) {
    if (e instanceof WorldError)
      return NextResponse.json({ error: e.message }, { status: e.status })
    throw e
  }
}
