'use client'

import { useEffect, useRef, useState } from 'react'
import { SLOTS, SLOT_LABEL, WEEKDAYS, WEEKDAY_LABEL } from '@/lib/availability'
import { cn } from '@/lib/cn'
import type { Slot, Weekday } from '@/types'

/**
 * The 7-day × Morn/Aft/Eve grid from onboarding step 3, reused read-only on the profile
 * screens (docs/BUILD-PLAN.md P1-04). Tap toggles a cell; dragging paints — the first cell
 * touched decides whether the drag turns cells on or off.
 */
export function AvailabilityGrid({
  value,
  onChange,
  readOnly = false,
  className,
}: {
  value: Record<Weekday, Slot[]>
  onChange?: (next: Record<Weekday, Slot[]>) => void
  readOnly?: boolean
  className?: string
}) {
  // null = not painting; true/false = the value this drag applies.
  const [painting, setPainting] = useState<boolean | null>(null)
  const valueRef = useRef(value)
  valueRef.current = value

  useEffect(() => {
    if (painting === null) return
    const stop = () => setPainting(null)
    window.addEventListener('pointerup', stop)
    window.addEventListener('pointercancel', stop)
    return () => {
      window.removeEventListener('pointerup', stop)
      window.removeEventListener('pointercancel', stop)
    }
  }, [painting])

  function applyCell(day: Weekday, slot: Slot, on: boolean) {
    const current = valueRef.current
    const slots = current[day] ?? []
    const has = slots.includes(slot)
    if (has === on) return
    onChange?.({ ...current, [day]: on ? [...slots, slot] : slots.filter((s) => s !== slot) })
  }

  return (
    <div
      className={cn('select-none', className)}
      role="grid"
      aria-label="Weekly availability"
      aria-readonly={readOnly}
    >
      {/* Day headers */}
      <div role="row" className="mb-1.5 grid grid-cols-[44px_repeat(7,1fr)] gap-1">
        <span aria-hidden />
        {WEEKDAYS.map((day) => (
          <span
            key={day}
            role="columnheader"
            className="text-center text-[10px] font-bold uppercase tracking-[0.04em] text-foreground-dim"
          >
            {WEEKDAY_LABEL[day].slice(0, 1)}
          </span>
        ))}
      </div>

      {SLOTS.map((slot) => (
        <div key={slot} role="row" className="mb-1 grid grid-cols-[44px_repeat(7,1fr)] gap-1">
          <span
            role="rowheader"
            className="flex items-center text-[11px] font-medium text-foreground-dim"
          >
            {SLOT_LABEL[slot]}
          </span>
          {WEEKDAYS.map((day) => {
            const on = (value[day] ?? []).includes(slot)
            const cellLabel = `${WEEKDAY_LABEL[day]} ${slot}`
            if (readOnly) {
              return (
                <span
                  key={day}
                  role="gridcell"
                  aria-label={cellLabel}
                  aria-selected={on}
                  className={cn(
                    'h-[34px] rounded-[8px] border',
                    on ? 'border-primary bg-primary' : 'border-border-subtle bg-card',
                  )}
                />
              )
            }
            return (
              <button
                key={day}
                type="button"
                role="gridcell"
                aria-label={cellLabel}
                aria-selected={on}
                onPointerDown={(e) => {
                  // Release capture so pointerenter fires on the cells the drag crosses.
                  e.currentTarget.releasePointerCapture?.(e.pointerId)
                  setPainting(!on)
                  applyCell(day, slot, !on)
                }}
                onPointerEnter={() => {
                  if (painting !== null) applyCell(day, slot, painting)
                }}
                className={cn(
                  'h-[34px] touch-none rounded-[8px] border transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  on ? 'border-primary bg-primary' : 'border-border-subtle bg-card',
                )}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}
