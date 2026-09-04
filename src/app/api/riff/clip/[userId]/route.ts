/** Serves the stored clip audio for a musician's public profile — the actual recorded bytes. */
import { readClip } from '@/server/world'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params
  const clip = readClip(userId)
  if (!clip) return new Response('Not found', { status: 404 })
  return new Response(new Uint8Array(clip.bytes), {
    headers: {
      'content-type': clip.mime,
      // The URL is stable per user and re-recording replaces the bytes; short private cache.
      'cache-control': 'private, max-age=300',
    },
  })
}
