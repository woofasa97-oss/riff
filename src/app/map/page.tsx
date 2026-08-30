import { Map } from 'lucide-react'
import { TabStub } from '@/components/riff/TabStub'

export const metadata = { title: 'Map · Riff' }

export default function MapPage() {
  return (
    <TabStub
      tab="map"
      icon={<Map size={22} />}
      title="Map is not built yet"
      body="Neighbourhood zones, live jams and who is nearby land here."
    />
  )
}
