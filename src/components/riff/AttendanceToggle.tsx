'use client'

import { Check, X } from 'lucide-react'
import { cn } from '@/lib/cn'

/**
 * Attendance is binary, and at 375px there is no room for two side-by-side options next to a
 * name — so this is one pill that shows the current answer and flips when tapped, which is also
 * what the reference screen draws.
 */
export function AttendanceToggle({
  showedUp,
  onChange,
  personName,
  className,
}: {
  showedUp: boolean
  onChange: (next: boolean) => void
  personName: string
  className?: string
}) {
  return (
    <button
      type="button"
      aria-pressed={showedUp}
      aria-label={`${personName} ${showedUp ? 'showed up' : 'did not show up'}. Tap to change.`}
      onClick={() => onChange(!showedUp)}
      className={cn(
        'flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1',
        'text-[12px] font-medium transition-colors active:scale-95',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        showedUp ? 'bg-success-soft text-success' : 'bg-destructive/10 text-destructive',
        className,
      )}
    >
      {showedUp ? <Check size={11} strokeWidth={3} /> : <X size={11} strokeWidth={3} />}
      {showedUp ? 'Showed up' : 'No-show'}
    </button>
  )
}
