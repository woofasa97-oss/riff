import { BottomTabBar, SideNav, type TabId } from '@/components/riff/BottomTabBar'
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
    // Mobile: a column with the bottom tab bar. Desktop (lg+): a row with a left nav rail and the
    // content pane filling the rest of the centred app frame.
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      {activeTab !== null && <SideNav activeTab={activeTab ?? undefined} liveIndicator={liveIndicator} />}

      {/* Content pane — the positioning context for the dark surface and any bottom sheet, so
          neither spills over the nav rail on desktop. */}
      <div
        className={cn(
          'relative flex min-h-0 flex-1 flex-col lg:border-l lg:border-border-subtle',
          surface === 'dark' && 'text-white',
        )}
      >
        {surface === 'dark' && (
          <div className="absolute inset-0 z-0 overflow-hidden bg-surface-dark">{background}</div>
        )}
        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          {header}
          <main className={cn('no-scrollbar min-h-0 flex-1 overflow-y-auto', mainClassName)}>
            {children}
          </main>
          {footer}
        </div>
      </div>

      {activeTab !== null && (
        <BottomTabBar
          activeTab={activeTab ?? undefined}
          liveIndicator={liveIndicator}
          surface={surface}
          className="lg:hidden"
        />
      )}
    </div>
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
