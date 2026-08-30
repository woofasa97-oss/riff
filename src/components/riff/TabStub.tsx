import Link from 'next/link'
import { AppShell } from '@/components/riff/AppShell'
import { TopBar } from '@/components/riff/TopBar'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import type { TabId } from '@/components/riff/BottomTabBar'

/**
 * A tab whose screen has not been built yet. It keeps the five-tab bar honest — every tab
 * navigates somewhere real and offers a way onward — without pretending the screen exists.
 */
export function TabStub({
  tab,
  title,
  body,
  icon,
}: {
  tab: TabId
  title: string
  body: string
  icon?: React.ReactNode
}) {
  return (
    <AppShell activeTab={tab} header={<TopBar />} mainClassName="flex items-center px-4 py-6">
      <EmptyState
        className="w-full"
        icon={icon}
        title={title}
        body={body}
        action={
          <Link href="/jams">
            <Button size="sm" variant="secondary">
              Go to your jams
            </Button>
          </Link>
        }
      />
    </AppShell>
  )
}
