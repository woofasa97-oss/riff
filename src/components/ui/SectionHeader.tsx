import { cn } from '@/lib/cn'

/** The uppercase primary-coloured section label that opens nearly every block. */
export function SectionHeader({
  children,
  action,
  className,
}: {
  children: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-3 flex items-center justify-between', className)}>
      <h2 className="font-sans text-[11px] font-bold uppercase tracking-[0.08em] text-primary">
        {children}
      </h2>
      {action}
    </div>
  )
}
