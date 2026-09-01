'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Compass, Guitar, Map, RadioTower, User } from 'lucide-react'
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
      // A guest has no avatar yet — a plain person icon reads as "your profile / sign up".
      if (!me) return <User size={size} strokeWidth={active ? 2.2 : 1.8} />
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
  className,
}: {
  activeTab?: TabId
  /** The pink dot on LIVE, shown when something is broadcasting now. */
  liveIndicator?: boolean
  /** Live and Battle screens invert the bar — see docs/DESIGN-SYSTEM.md. */
  surface?: 'light' | 'dark'
  className?: string
}) {
  const pathname = usePathname()
  const dark = surface === 'dark'

  return (
    <nav
      aria-label="Primary"
      className={cn(
        'pb-safe relative z-20 shrink-0 border-t backdrop-blur-md',
        dark ? 'border-white/10 bg-black/90' : 'border-border-subtle bg-card/95',
        className,
      )}
    >
      <ul className="flex h-[64px] items-center justify-around px-2">
        {TABS.map((tab) => {
          // Exact route or a sub-route of the tab — NOT a bare prefix, so "/messages" no longer
          // lights up "/me" and off-tab screens (notifications, musician profiles) show none.
          const active = activeTab
            ? activeTab === tab.id
            : pathname === tab.href || pathname.startsWith(`${tab.href}/`)
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

/**
 * Desktop navigation rail — the same five destinations as the bottom bar, shown as a vertical
 * left sidebar on large screens (the bottom bar is hidden there). Sentence-case labels, an active
 * pill, and the live dot on LIVE. Kept light even on dark-surface screens: it's app chrome.
 */
export function SideNav({
  activeTab,
  liveIndicator = false,
}: {
  activeTab?: TabId
  liveIndicator?: boolean
}) {
  const pathname = usePathname()
  return (
    <nav
      aria-label="Primary"
      className="hidden w-[220px] shrink-0 flex-col border-r border-border-subtle bg-card/50 px-3 py-5 lg:flex"
    >
      <Link
        href="/map"
        aria-label="Riff home"
        className="mb-6 px-3 font-serif text-[24px] font-bold leading-none text-primary"
      >
        Riff
      </Link>
      <ul className="flex flex-col gap-1">
        {TABS.map((tab) => {
          const active = activeTab
            ? activeTab === tab.id
            : pathname === tab.href || pathname.startsWith(`${tab.href}/`)
          const label = tab.label.charAt(0) + tab.label.slice(1).toLowerCase()
          return (
            <li key={tab.id}>
              <Link
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-[15px] transition-colors',
                  active
                    ? 'bg-[color:var(--hero-from)] font-semibold text-primary'
                    : 'font-medium text-foreground-dim hover:bg-surface-muted hover:text-foreground',
                )}
              >
                <span className="relative flex h-[22px] w-[22px] items-center justify-center">
                  <TabIcon id={tab.id} active={active} dark={false} />
                  {tab.id === 'live' && liveIndicator && (
                    <span className="absolute -right-1 -top-0.5 h-2 w-2 rounded-full border border-card bg-accent" />
                  )}
                </span>
                <span>{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
