import { RadioTower } from 'lucide-react'
import { TabStub } from '@/components/riff/TabStub'

export const metadata = { title: 'Live · Riff' }

export default function LivePage() {
  return (
    <TabStub
      tab="live"
      icon={<RadioTower size={22} />}
      title="Live is not built yet"
      body="Sessions broadcasting right now, with chat and ratings."
    />
  )
}
