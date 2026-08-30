'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Compass, Guitar, Map, RadioTower } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/cn'
import { getCurrentUser } from '@/mocks'

export type TabId = 'map' | 'discover' | 'jams' | 'live' | 'me'

/**
 * MAP · DISCOVER · JAMS · LIVE · ME — the canonical bar (docs/SPEC.md §3). Older reference
 * screens show a four-tab bar; that is an artifact of the iteration they came from.
 */
const TABS: { id: TabId; href: string; label: string }[] = [
  { id: 'map', href: '/map', label: 'MAP' },
  { id: 'discover', href: '/discover', label: 'DISCOVER' },
  { id: 'jams', href: '/jams', label: 'JAMS' },
  { id: 'live', href: '/live', label: 'LIVE' },
  { id: 'me', href: '/me', label: 'ME' },
]

function TabIcon({ id, active }: { id: TabId; active: boolean }) {
  const size = 22
  switch (id) {
    case 'map':
      return <Map size={size} strokeWidth={active ? 2.2 : 1.8} />
    case 'discover':
      return <Compass size={size} strokeWidth={active ? 2.2 : 1.8} />
    case 'jams':
      return <Guitar size={size} strokeWidth={active ? 2.2 : 1.8} />
    case 'live':
      return <RadioTower size={size} strokeWidth={active ? 2.2 : 1.8} />
    case 'me': {
      const me = getCurrentUser()
      return (
        <Avatar
          src={me.avatarUrl}
          name="Your profile"
          size="xs"
          ring={false}
          className={cn('h-[22px] w-[22px]', active ? 'ring-2 ring-primary' : 'opacity-80')}
        />
      )
    }
  }
}

export function BottomTabBar({
  activeTab,
  liveIndicator = false,
}: {
  activeTab?: TabId
  /** The pink dot on LIVE, shown when something is broadcasting now. */
  liveIndicator?: boolean
}) {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Primary"
      className="pb-safe bg-card/95 z-20 shrink-0 border-t border-border-subtle backdrop-blur-md"
    >
      <ul className="flex h-[64px] items-center justify-around px-2">
        {TABS.map((tab) => {
          const active = activeTab ? activeTab === tab.id : pathname.startsWith(tab.href)
          return (
            <li key={tab.id}>
              <Link
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex w-16 flex-col items-center justify-center gap-1 py-1',
                  active ? 'text-primary' : 'text-foreground-dim',
                )}
              >
                <span className="relative flex h-[22px] items-center justify-center">
                  <TabIcon id={tab.id} active={active} />
                  {tab.id === 'live' && liveIndicator && (
                    <span className="absolute -right-1 -top-0.5 h-2 w-2 rounded-full border border-card bg-accent" />
                  )}
                </span>
                <span className={cn('text-[10px]', active ? 'font-semibold' : 'font-medium')}>
                  {tab.label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
