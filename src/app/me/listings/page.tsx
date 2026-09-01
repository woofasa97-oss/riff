import { MyListingsView } from '@/components/riff/MyListingsView'

// Static route — takes precedence over the /me/[section] stub for 'listings'.
export const metadata = { title: 'Your listings · Riff' }

export default function MyListingsPage() {
  return <MyListingsView />
}
