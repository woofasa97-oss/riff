import { ProfileEditView } from '@/components/riff/ProfileEditView'

// Static route — takes precedence over the /me/[section] stub for 'edit'.
export const metadata = { title: 'Edit player card · Riff' }

export default function ProfileEditPage() {
  return <ProfileEditView />
}
