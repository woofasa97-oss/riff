import { cn } from '@/lib/cn'

/** The white tile used for the three-up stat rows on profiles, venues and bands. */
export function StatTile({
  value,
  label,
  adornment,
  className,
}: {
  value: React.ReactNode
  label: string
  /** A star beside a rating, for instance. */
  adornment?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-1 flex-col items-center justify-center rounded-[16px] border border-border-subtle bg-card p-3 shadow-sm',
        className,
      )}
    >
      <span className="mb-0.5 flex items-center gap-1 font-serif text-[22px] font-bold text-foreground">
        {value}
        {adornment}
      </span>
      <span className="text-center text-[9px] font-bold uppercase tracking-[0.06em] text-foreground-dim">
        {label}
      </span>
    </div>
  )
}
