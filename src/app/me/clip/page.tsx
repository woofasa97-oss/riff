import { ClipEditView } from '@/components/riff/ClipEditView'

// Static route — takes precedence over the /me/[section] stub for 'clip'.
export const metadata = { title: 'Your clip · Riff' }

export default function ClipEditPage() {
  return <ClipEditView />
}
