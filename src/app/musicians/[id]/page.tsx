import { redirect } from 'next/navigation'
import { MusicianProfileView } from '@/components/riff/MusicianProfileView'
import { CURRENT_USER_ID, getMusician } from '@/mocks'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const musician = getMusician(id)
  return { title: musician ? `${musician.name} · Riff` : 'Profile · Riff' }
}

export default async function MusicianProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // Your own profile is the editable one on /me — this screen is how everyone else sees you.
  if (id === CURRENT_USER_ID) redirect('/me')
  return <MusicianProfileView musicianId={id} />
}
