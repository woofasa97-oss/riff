import { Compass } from 'lucide-react'
import { TabStub } from '@/components/riff/TabStub'

export const metadata = { title: 'Discover · Riff' }

export default function DiscoverPage() {
  return (
    <TabStub
      tab="discover"
      icon={<Compass size={22} />}
      title="Discover is not built yet"
      body="Musicians free tonight, their clips, and the open calls you can apply to."
    />
  )
}
