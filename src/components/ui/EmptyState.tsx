import { cn } from '@/lib/cn'

/**
 * Every list in the app owes the user an empty state with a way forward — docs/SPEC.md §5.5,
 * "every dead end has an exit".
 */
export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
}: {
  icon?: React.ReactNode
  title: string
  body?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-[16px] border border-dashed border-border-subtle',
        'bg-card/60 px-6 py-10 text-center',
        className,
      )}
    >
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--hero-from)] text-primary">
          {icon}
        </div>
      )}
      <h3 className="font-serif text-[17px] font-bold text-foreground">{title}</h3>
      {body && <p className="mt-2 max-w-[260px] text-[13px] text-foreground-dim">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
