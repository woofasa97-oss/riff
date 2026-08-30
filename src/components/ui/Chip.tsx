'use client'

import { cn } from '@/lib/cn'

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean
}

/** Pill-shaped filter control. Selected fills with primary; unselected is a bordered pill. */
export function Chip({ selected = false, className, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        'shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-[13px] font-medium',
        'transition-transform active:scale-95',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        selected
          ? 'border border-primary bg-primary text-primary-foreground'
          : 'border border-border-subtle bg-card text-foreground',
        className,
      )}
      {...props}
    />
  )
}
