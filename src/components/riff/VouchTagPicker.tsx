'use client'

import { cn } from '@/lib/cn'
import { vouchTagLabel } from '@/lib/labels'
import type { VouchTag } from '@/types'

/** Every tag a vouch can carry. Order is the order the reference screen shows them in. */
export const VOUCH_TAGS: VouchTag[] = [
  'GreatPocket',
  'ListenFirst',
  'EarlyBird',
  'ProVibe',
  'GoodEnergy',
  'SolidTime',
  'EasyToPlayWith',
]

export function VouchTagPicker({
  selected,
  onToggle,
  disabled = false,
  className,
}: {
  selected: VouchTag[]
  onToggle: (tag: VouchTag) => void
  disabled?: boolean
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap justify-center gap-2', className)}>
      {VOUCH_TAGS.map((tag) => {
        const on = selected.includes(tag)
        return (
          <button
            key={tag}
            type="button"
            disabled={disabled}
            aria-pressed={on}
            onClick={() => onToggle(tag)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-[13px] font-medium transition-transform active:scale-95',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'disabled:pointer-events-none disabled:opacity-40',
              on
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border-subtle bg-card text-foreground',
            )}
          >
            {vouchTagLabel(tag)}
          </button>
        )
      })}
    </div>
  )
}
