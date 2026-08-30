'use client'

import { cn } from '@/lib/cn'

/** iOS-style switch. Used for recording consent. */
export function Toggle({
  checked,
  onChange,
  label,
  className,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  className?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-[28px] w-[48px] shrink-0 rounded-full transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        checked ? 'bg-primary' : 'bg-muted',
        className,
      )}
    >
      <span
        className={cn(
          'absolute top-[3px] h-[22px] w-[22px] rounded-full bg-card shadow-sm transition-all',
          checked ? 'left-[23px]' : 'left-[3px]',
        )}
      />
    </button>
  )
}
