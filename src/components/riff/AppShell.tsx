import { BottomTabBar, type TabId } from '@/components/riff/BottomTabBar'
import { cn } from '@/lib/cn'

export type Surface = 'light' | 'dark'

/**
 * Header / scrolling body / optional sticky action bar / tab bar.
 *
 * The reference screens position the tab bar absolutely and pad the body to clear it. This uses
 * a flex column instead, so a sticky action bar can sit between the two without either one
 * having to know the other's height.
 *
 * `surface="dark"` is the inverted variant docs/DESIGN-SYSTEM.md describes for Live, Battle and
 * Map-live. It paints a full-bleed layer behind the whole shell — pass `background` to put a
 * poster or gradient there — and switches the tab bar to its dark styling.
 */
export function AppShell({
  header,
  footer,
  activeTab,
  liveIndicator,
  children,
  mainClassName,
  surface = 'light',
  background,
}: {
  header?: React.ReactNode
  footer?: React.ReactNode
  /** Omit to hide the tab bar — sub-screens like the session recap have none. */
  activeTab?: TabId | null
  liveIndicator?: boolean
  children: React.ReactNode
  mainClassName?: string
  surface?: Surface
  background?: React.ReactNode
}) {
  return (
    <>
      {surface === 'dark' && (
        <div className="absolute inset-0 z-0 overflow-hidden bg-surface-dark">{background}</div>
      )}
      <div
        className={cn(
          'relative z-10 flex min-h-0 flex-1 flex-col',
          surface === 'dark' && 'text-white',
        )}
      >
        {header}
        <main className={cn('no-scrollbar min-h-0 flex-1 overflow-y-auto', mainClassName)}>
          {children}
        </main>
        {footer}
      </div>
      {activeTab !== null && (
        <BottomTabBar
          activeTab={activeTab ?? undefined}
          liveIndicator={liveIndicator}
          surface={surface}
        />
      )}
    </>
  )
}

/** The bar that floats above the tab bar on detail screens. */
export function StickyActionBar({
  children,
  className,
  note,
  surface = 'light',
}: {
  children: React.ReactNode
  className?: string
  note?: React.ReactNode
  surface?: Surface
}) {
  return (
    <div
      className={cn(
        'z-20 shrink-0 border-t px-4 py-3 backdrop-blur-md',
        surface === 'dark' ? 'border-white/10 bg-black/50' : 'border-border-subtle bg-card/95',
        className,
      )}
    >
      <div className="flex gap-3">{children}</div>
      {note && (
        <div
          className={cn(
            'pt-2 text-center text-[11px]',
            surface === 'dark' ? 'text-white/60' : 'text-foreground-dim',
          )}
        >
          {note}
        </div>
      )}
    </div>
  )
}
