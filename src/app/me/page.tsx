import { User } from 'lucide-react'
import { TabStub } from '@/components/riff/TabStub'

export const metadata = { title: 'Me · Riff' }

export default function MePage() {
  return (
    <TabStub
      tab="me"
      icon={<User size={22} />}
      title="Your profile is not built yet"
      body="Your stats, clip, availability and season rank live here."
    />
  )
}
