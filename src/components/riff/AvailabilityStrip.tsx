import { cn } from '@/lib/cn'
import type { Availability, Weekday } from '@/types'

const DAYS: { id: Weekday; label: string }[] = [
  { id: 'mon', label: 'MON' },
  { id: 'tue', label: 'TUE' },
  { id: 'wed', label: 'WED' },
  { id: 'thu', label: 'THU' },
  { id: 'fri', label: 'FRI' },
  { id: 'sat', label: 'SAT' },
  { id: 'sun', label: 'SUN' },
]

/**
 * The seven-day read-only summary the profile screens show. The full 7×3 day-by-slot grid with
 * an edit mode is docs/BUILD-PLAN.md P1-04, which builds it for onboarding first.
 */
export function AvailabilityStrip({
  availability,
  className,
}: {
  availability: Availability
  className?: string
}) {
  return (
    <div className={className}>
      <ul className="mb-2 flex justify-between gap-1">
        {DAYS.map((day) => {
          const slots = availability.grid[day.id] ?? []
          const free = slots.length > 0
          return (
            <li
              key={day.id}
              title={free ? slots.join(', ') : 'Not free'}
              className={cn(
                'flex h-[36px] flex-1 items-center justify-center rounded-[8px] border text-[11px] font-bold shadow-sm',
                free
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border-subtle bg-card text-foreground-dim',
              )}
            >
              {day.label}
            </li>
          )
        })}
      </ul>
      {availability.note && (
        <p className="px-1 text-[13px] italic text-foreground-dim">{availability.note}</p>
      )}
    </div>
  )
}
