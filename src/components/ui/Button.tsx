import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive'
type Size = 'md' | 'sm'

const VARIANT: Record<Variant, string> = {
  primary: 'bg-primary text-primary-foreground',
  secondary: 'bg-surface-muted text-foreground',
  outline: 'bg-card text-foreground border border-border-subtle',
  ghost: 'bg-transparent text-primary',
  destructive: 'bg-transparent text-destructive',
}

const SIZE: Record<Size, string> = {
  md: 'h-[48px] rounded-[12px] text-[15px]',
  sm: 'h-[44px] rounded-[12px] text-[14px]',
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex select-none items-center justify-center gap-2 font-medium transition-transform',
        'active:scale-95 disabled:pointer-events-none disabled:opacity-40',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        VARIANT[variant],
        SIZE[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    />
  )
}

/** The 36px circular icon button in every screen header. */
export function IconButton({
  className,
  label,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      aria-label={label}
      className={cn(
        'flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-full',
        'border border-border-subtle bg-card text-foreground transition-transform active:scale-90',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
