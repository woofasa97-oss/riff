import { cn } from '@/lib/cn'

type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'accent' | 'live'

const TONE: Record<Tone, string> = {
  neutral: 'bg-card border border-border-subtle text-foreground',
  primary: 'bg-[color:var(--hero-from)] text-primary',
  success: 'bg-success-soft border border-success-border text-success',
  warning: 'bg-warning-soft border border-warning-border text-warning',
  accent: 'bg-accent-soft border border-accent-border text-accent',
  live: 'bg-live text-white',
}

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
}

export function Badge({ tone = 'neutral', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5',
        'text-[13px] font-medium',
        TONE[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}

/** The small uppercase context label under a message row. */
export function ContextLabel({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: Tone
  className?: string
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]',
        tone === 'accent'
          ? 'border border-accent-border bg-accent-soft text-accent'
          : tone === 'primary'
            ? 'border border-border-subtle bg-background text-primary'
            : 'border border-border-subtle bg-background text-foreground',
        className,
      )}
    >
      {children}
    </span>
  )
}
