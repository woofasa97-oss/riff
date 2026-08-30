import { MusicianProfileView } from '@/components/riff/MusicianProfileView'
import { getMusician } from '@/mocks'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const musician = getMusician(id)
  return { title: musician ? `${musician.name} · Riff` : 'Profile · Riff' }
}

export default async function MusicianProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // Your own profile is the editable one on /me. Only the client knows who is signed in, so
  // the view handles that redirect — this route stays session-blind.
  return <MusicianProfileView musicianId={id} />
}
