import { cn } from '@/lib/cn'

/** White, rounded-[16px], hairline border, shadow-sm — the dominant card in the reference set. */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-[16px] border border-border-subtle bg-card shadow-sm', className)}
      {...props}
    />
  )
}
