import { BottomTabBar, type TabId } from '@/components/riff/BottomTabBar'
import { cn } from '@/lib/cn'

/**
 * Header / scrolling body / optional sticky action bar / tab bar.
 *
 * The reference screens position the tab bar absolutely and pad the body to clear it. This uses
 * a flex column instead, so a sticky action bar can sit between the two without either one
 * having to know the other's height.
 */
export function AppShell({
  header,
  footer,
  activeTab,
  liveIndicator,
  children,
  mainClassName,
}: {
  header?: React.ReactNode
  footer?: React.ReactNode
  /** Omit to hide the tab bar — sub-screens like the session recap have none. */
  activeTab?: TabId | null
  liveIndicator?: boolean
  children: React.ReactNode
  mainClassName?: string
}) {
  return (
    <>
      {header}
      <main className={cn('no-scrollbar flex-1 overflow-y-auto', mainClassName)}>{children}</main>
      {footer}
      {activeTab !== null && (
        <BottomTabBar activeTab={activeTab ?? undefined} liveIndicator={liveIndicator} />
      )}
    </>
  )
}

/** The white, blurred bar that floats above the tab bar on detail screens. */
export function StickyActionBar({
  children,
  className,
  note,
}: {
  children: React.ReactNode
  className?: string
  note?: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'bg-card/95 z-20 shrink-0 border-t border-border-subtle px-4 py-3 backdrop-blur-md',
        className,
      )}
    >
      <div className="flex gap-3">{children}</div>
      {note && <div className="pt-2 text-center text-[11px] text-foreground-dim">{note}</div>}
    </div>
  )
}
