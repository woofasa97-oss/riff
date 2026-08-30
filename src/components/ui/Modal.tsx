'use client'

import { useEffect } from 'react'
import { cn } from '@/lib/cn'

/**
 * Centred sheet over the phone column. The body is the positioning context, so this stays
 * inside the 375px frame instead of covering the whole browser window.
 *
 * Every modal has a dismiss path — Escape, the backdrop, and whatever the caller renders
 * (docs/SPEC.md §5.5).
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  className?: string
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
    <div className="absolute inset-0 z-50 flex items-center justify-center px-6">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative w-full rounded-[16px] border border-border-subtle bg-card p-6 shadow-xl',
          className,
        )}
      >
        {children}
      </div>
    </div>
  )
}
