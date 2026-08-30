'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'

/**
 * A sheet that rises from the bottom of the phone column. Positioned absolutely inside its
 * scroll parent rather than fixed to the viewport, so it lands above the tab bar and stays
 * inside the 375px frame on a wide screen.
 */
export function BottomSheet({
  open,
  onClose,
  title,
  children,
  className,
  dismissLabel = 'Close',
}: {
  open: boolean
  onClose: () => void
  /** Accessible name. Render the visible heading inside `children`. */
  title: string
  children: React.ReactNode
  className?: string
  dismissLabel?: string
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label={title}
      className={cn(
        'absolute inset-x-0 bottom-0 z-30 animate-fade-in rounded-t-[16px] border-t border-border-subtle',
        'bg-card px-4 pb-5 pt-3 shadow-[0_-8px_24px_rgba(0,0,0,0.10)]',
        className,
      )}
    >
      <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" aria-hidden />
      <button
        type="button"
        onClick={onClose}
        aria-label={dismissLabel}
        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-foreground-dim transition-transform active:scale-90"
      >
        <X size={16} />
      </button>
      {children}
    </div>
  )
}
