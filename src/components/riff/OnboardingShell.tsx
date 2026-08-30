'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

const TOTAL_STEPS = 4

/**
 * The frame every onboarding step lives in: back affordance, "Step N of 4" with a segmented
 * progress bar, serif title, and a sticky Continue footer. Steps 3 and 4 are skippable
 * (docs/SPEC.md §4.1), so the footer takes an optional skip action.
 */
export function OnboardingShell({
  step,
  title,
  subtitle,
  backHref,
  children,
  continueLabel = 'Continue',
  continueDisabled = false,
  onContinue,
  skip,
  footerNote,
}: {
  step: number
  title: string
  subtitle?: string
  backHref: string
  children: React.ReactNode
  continueLabel?: string
  continueDisabled?: boolean
  onContinue: () => void
  skip?: { label: string; onSkip: () => void }
  footerNote?: string
}) {
  return (
    <>
      <header className="flex h-[56px] shrink-0 items-center gap-2 bg-background px-4">
        <Link
          href={backHref}
          aria-label="Back"
          className="-ml-1 flex h-8 w-8 items-center justify-start text-foreground transition-transform active:scale-90"
        >
          <ChevronLeft size={20} />
        </Link>
        <span className="text-[12px] font-medium text-foreground-dim">
          Step {step} of {TOTAL_STEPS}
        </span>
        <div className="ml-auto flex w-[104px] gap-1" aria-hidden>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <span
              key={i}
              className={cn('h-1 flex-1 rounded-full', i < step ? 'bg-primary' : 'bg-muted')}
            />
          ))}
        </div>
      </header>

      <main className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-6 pb-8 pt-4">
        <h1 className="mb-2 font-serif text-[28px] font-bold leading-tight text-foreground">
          {title}
        </h1>
        {subtitle && <p className="mb-6 text-[14px] text-foreground-dim">{subtitle}</p>}
        {children}
      </main>

      <footer className="pb-safe z-20 shrink-0 border-t border-border-subtle bg-card/95 px-6 py-3 backdrop-blur-md">
        <Button fullWidth disabled={continueDisabled} onClick={onContinue}>
          {continueLabel}
        </Button>
        {skip && (
          <button
            type="button"
            onClick={skip.onSkip}
            className="mt-2 w-full py-1.5 text-center text-[13px] font-medium text-foreground-dim"
          >
            {skip.label}
          </button>
        )}
        {footerNote && (
          <p className="mt-2 text-center text-[11px] text-foreground-dim">{footerNote}</p>
        )}
      </footer>
    </>
  )
}
