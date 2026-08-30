import { cn } from '@/lib/cn'

/**
 * A neutral loading placeholder. `animate-pulse` is the one loading motion the design system
 * keeps (docs/DESIGN-SYSTEM.md). Use for content that pops in abruptly — panels, rows, cards —
 * to soften the transition.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-[8px] bg-muted/60', className)} aria-hidden />
}
