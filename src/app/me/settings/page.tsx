import { SettingsView } from '@/components/riff/SettingsView'

// A static route: it takes precedence over the /me/[section] stub for 'settings'.
export const metadata = { title: 'Settings & privacy · Riff' }

export default function SettingsPage() {
  return <SettingsView />
}
