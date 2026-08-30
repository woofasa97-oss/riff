import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/cn'

/** The home header: wordmark left, actions right, no bottom border. */
export function TopBar({ actions }: { actions?: React.ReactNode }) {
  return (
    <header className="flex h-[56px] shrink-0 items-center justify-between bg-background px-4">
      <Link href="/jams" className="font-serif text-[22px] font-bold text-primary">
        Riff
      </Link>
      <div className="flex gap-2">{actions}</div>
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
  backHref,
  action,
  className,
}: {
  title: string
  backHref: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <header
      className={cn(
        'flex h-[56px] shrink-0 items-center gap-2 border-b border-border-subtle bg-background px-4',
        className,
      )}
    >
      <Link
        href={backHref}
        aria-label="Back"
        className="-ml-1 flex h-8 w-8 items-center justify-start text-foreground transition-transform active:scale-90"
      >
        <ChevronLeft size={20} />
      </Link>
      <h1 className="flex-1 text-center font-serif text-[17px] font-bold text-foreground">
        {title}
      </h1>
      <div className="flex h-8 w-8 items-center justify-end">{action}</div>
    </header>
  )
}
