import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/cn'

/** The home header: wordmark left, actions right, no bottom border. */
export function TopBar({
  actions,
  lead,
  surface = 'light',
}: {
  actions?: React.ReactNode
  /** Extra content beside the wordmark — the LIVE pill on the battle screen. */
  lead?: React.ReactNode
  surface?: 'light' | 'dark'
}) {
  const dark = surface === 'dark'
  return (
    <header
      className={cn(
        'flex h-[56px] shrink-0 items-center justify-between px-4',
        dark ? 'bg-transparent' : 'bg-background',
      )}
    >
      <div className="flex items-center gap-2">
        <Link
          href="/jams"
          className={cn(
            'font-serif text-[22px] font-bold tracking-wide',
            dark ? 'text-white' : 'text-primary',
          )}
        >
          Riff
        </Link>
        {lead}
      </div>
      <div className="flex items-center gap-2">{actions}</div>
    </header>
  )
}

/**
 * The pushed-screen header: back affordance, centred serif title, optional trailing action.
 * `backHref` renders a Link so the back target survives a cold load or a shared URL — a
 * history-only back button dead-ends when the screen is the first one opened.
 */
export function SubScreenHeader({
  title,
  subtitle,
  backHref,
  action,
  className,
  surface = 'light',
  bordered = true,
  lead,
}: {
  title: React.ReactNode
  subtitle?: React.ReactNode
  backHref: string
  action?: React.ReactNode
  className?: string
  surface?: 'light' | 'dark'
  bordered?: boolean
  /** Rendered inline before the title — the avatar stack on a group thread. */
  lead?: React.ReactNode
}) {
  const dark = surface === 'dark'
  return (
    <header
      className={cn(
        'flex h-[56px] shrink-0 items-center gap-2 px-4',
        bordered && (dark ? 'border-b border-white/10' : 'border-b border-border-subtle'),
        dark ? 'bg-transparent' : 'bg-background',
        className,
      )}
    >
      <Link
        href={backHref}
        aria-label="Back"
        className={cn(
          '-ml-1 flex h-8 w-8 shrink-0 items-center justify-start transition-transform active:scale-90',
          dark ? 'text-white' : 'text-foreground',
        )}
      >
        <ChevronLeft size={20} />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col items-center justify-center">
        <h1
          className={cn(
            'flex items-center gap-2 truncate font-serif text-[17px] font-bold',
            dark ? 'text-white' : 'text-foreground',
          )}
        >
          {lead}
          <span className="truncate">{title}</span>
        </h1>
        {subtitle && (
          <span className={cn('text-[10px]', dark ? 'text-white/60' : 'text-foreground-dim')}>
            {subtitle}
          </span>
        )}
      </div>
      <div className="flex h-9 w-9 shrink-0 items-center justify-end">{action}</div>
    </header>
  )
}
