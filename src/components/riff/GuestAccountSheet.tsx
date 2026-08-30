'use client'

import Link from 'next/link'
import { Sparkles, X } from 'lucide-react'
import { buttonClass } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

/**
 * The sign-up nudge shown when a guest tries to act. Deliberately gentle — the whole point of
 * guest mode is that people try the app first, so this frames the account as the way to join
 * in, names the exact thing they reached for, and lets them dismiss and keep looking.
 *
 * Positioned inside the phone column (the app is `max-w-md mx-auto`), so it rises from the
 * bottom of the frame rather than covering the whole browser.
 */
export function GuestAccountSheet({
  feature,
  onDismiss,
}: {
  feature: string
  onDismiss: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 mx-auto flex w-full max-w-md flex-col justify-end">
      <button
        type="button"
        aria-label="Keep looking"
        onClick={onDismiss}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      <div className="relative animate-fade-in rounded-t-[16px] border-t border-border-subtle bg-card px-5 pb-8 pt-4 shadow-[0_-8px_24px_rgba(0,0,0,0.12)]">
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Close"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-foreground-dim transition-transform active:scale-90"
        >
          <X size={16} />
        </button>

        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[color:var(--hero-from)] text-primary">
          <Sparkles size={20} />
        </div>
        <h2 className="font-serif text-[20px] font-bold text-foreground">
          Create your player card to {feature}
        </h2>
        <p className="mt-1.5 text-[14px] text-foreground-dim">
          You&apos;re just looking around — that&apos;s allowed. To {feature}, claim a handle and
          you&apos;re in. It takes a minute.
        </p>

        <div className="mt-5 flex flex-col gap-2">
          <Link href="/signup" className={buttonClass({ fullWidth: true })}>
            Create your player card
          </Link>
          <Link
            href="/login"
            className={cn(buttonClass({ variant: 'secondary', fullWidth: true }))}
          >
            I already have an account
          </Link>
          <button
            type="button"
            onClick={onDismiss}
            className="mt-1 py-1.5 text-center text-[13px] font-medium text-foreground-dim"
          >
            Keep looking
          </button>
        </div>
      </div>
    </div>
  )
}
