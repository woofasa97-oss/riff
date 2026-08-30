'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Compass, Guitar, Map, RadioTower } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/cn'
import { useCurrentUser } from '@/lib/store'

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

function TabIcon({ id, active, dark }: { id: TabId; active: boolean; dark: boolean }) {
  const me = useCurrentUser()
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
      return (
        <Avatar
          src={me.avatarUrl}
          name="Your profile"
          size="xs"
          ring={false}
          className={cn(
            'h-[22px] w-[22px]',
            active ? (dark ? 'ring-2 ring-white' : 'ring-2 ring-primary') : 'opacity-80',
          )}
        />
      )
    }
  }
}

export function BottomTabBar({
  activeTab,
  liveIndicator = false,
  surface = 'light',
}: {
  activeTab?: TabId
  /** The pink dot on LIVE, shown when something is broadcasting now. */
  liveIndicator?: boolean
  /** Live and Battle screens invert the bar — see docs/DESIGN-SYSTEM.md. */
  surface?: 'light' | 'dark'
}) {
  const pathname = usePathname()
  const dark = surface === 'dark'

  return (
    <nav
      aria-label="Primary"
      className={cn(
        'pb-safe relative z-20 shrink-0 border-t backdrop-blur-md',
        dark ? 'border-white/10 bg-black/90' : 'border-border-subtle bg-card/95',
      )}
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
                  dark
                    ? active
                      ? 'text-white'
                      : 'text-white/50'
                    : active
                      ? 'text-primary'
                      : 'text-foreground-dim',
                )}
              >
                <span className="relative flex h-[22px] items-center justify-center">
                  <TabIcon id={tab.id} active={active} dark={dark} />
                  {tab.id === 'live' && liveIndicator && (
                    <span
                      className={cn(
                        'absolute -right-1 -top-0.5 h-2 w-2 rounded-full border bg-accent',
                        dark ? 'border-black/90' : 'border-card',
                      )}
                    />
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
