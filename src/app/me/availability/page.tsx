import { AvailabilityEditView } from '@/components/riff/AvailabilityEditView'

// Static route — takes precedence over the /me/[section] stub for 'availability'.
export const metadata = { title: 'Edit availability · Riff' }

export default function AvailabilityEditPage() {
  return <AvailabilityEditView />
}
