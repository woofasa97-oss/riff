'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { Intent } from '@/types'

/**
 * Copy per docs/SPEC.md §4.1 and §5.4 — low-pressure by default, so casual leads and the
 * descriptions do the explaining.
 */
const INTENTS: { id: Intent; title: string; description: string }[] = [
  {
    id: 'casual',
    title: 'Casual Jam',
    description: 'Low pressure. Show up, plug in, see what happens. Nobody is auditioning.',
  },
  {
    id: 'serious',
    title: 'Serious Project',
    description: 'Regular rehearsals, working toward something you can name.',
  },
  {
    id: 'gigging',
    title: 'Gigging',
    description: 'Ready to play out. Bookings, setlists, and showing up on time.',
  },
]

/** Single-select intent cards — onboarding step 2, reused for the vibe rows elsewhere. */
export function IntentPicker({
  value,
  onChange,
  className,
}: {
  value?: Intent
  onChange: (intent: Intent) => void
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)} role="radiogroup" aria-label="Intent">
      {INTENTS.map((intent) => {
        const on = value === intent.id
        return (
          <button
            key={intent.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(intent.id)}
            className={cn(
              'flex items-start gap-3 rounded-[12px] border p-4 text-left transition-transform active:scale-[0.98]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              on ? 'border-primary bg-[color:var(--hero-from)]' : 'border-border-subtle bg-card',
            )}
          >
            <span
              className={cn(
                'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                on ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card',
              )}
            >
              {on && <Check size={11} strokeWidth={3} />}
            </span>
            <span className="min-w-0">
              <span className="block font-serif text-[15px] font-bold text-foreground">
                {intent.title}
              </span>
              <span className="mt-0.5 block text-[13px] text-foreground-dim">
                {intent.description}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
