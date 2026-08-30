'use client'

import { cn } from '@/lib/cn'

export interface TabItem<T extends string> {
  id: T
  label: string
  /** Rendered as a filled counter pill beside the label. Omitted or 0 renders nothing. */
  count?: number
}

/** The underlined tab row at the top of Jams and Notifications. */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem<T>[]
  value: T
  onChange: (id: T) => void
  className?: string
}) {
  return (
    <div role="tablist" className={cn('flex gap-6 border-b border-border-subtle px-4', className)}>
      {items.map((item) => {
        const active = item.id === value
        return (
          <button
            key={item.id}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={cn(
              'flex items-center gap-1.5 border-b-2 pb-3 pt-2 text-[15px] transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              active
                ? 'border-primary font-semibold text-primary'
                : 'border-transparent font-medium text-foreground-dim',
            )}
          >
            {item.label}
            {item.count ? (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {item.count}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

/** The scrollable pill row used for message filters. */
export function ChipTabs<T extends string>({
  items,
  value,
  onChange,
  className,
}: {
  items: { id: T; label: string }[]
  value: T
  onChange: (id: T) => void
  className?: string
}) {
  return (
    <div className={cn('no-scrollbar overflow-x-auto', className)}>
      <div className="flex w-max gap-2">
        {items.map((item) => {
          const active = item.id === value
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(item.id)}
              className={cn(
                'shrink-0 rounded-full px-4 py-1.5 text-[13px] font-medium transition-transform active:scale-95',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border-subtle bg-card text-foreground',
              )}
            >
              {item.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
