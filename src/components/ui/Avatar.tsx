import { cn } from '@/lib/cn'

const SIZE = {
  xs: 'h-6 w-6',
  sm: 'h-7 w-7',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
  xl: 'h-14 w-14',
} as const

export type AvatarSize = keyof typeof SIZE

export interface AvatarProps {
  src: string
  name: string
  size?: AvatarSize
  className?: string
  /** The white keyline that lets avatars overlap legibly in a stack. */
  ring?: boolean
}

/**
 * Mock avatars are local SVGs in public/mock/avatars/. next/image would need
 * `dangerouslyAllowSVG` to touch them and would buy nothing — they are already tiny and
 * resolution-independent — so this is the one place a plain <img> is correct.
 */
export function Avatar({ src, name, size = 'md', ring = true, className }: AvatarProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      className={cn(
        'shrink-0 rounded-full bg-muted object-cover',
        SIZE[size],
        ring && 'border-2 border-card',
        className,
      )}
    />
  )
}

export interface AvatarStackProps {
  people: { id: string; name: string; avatarUrl: string }[]
  /** How many faces to show before collapsing the rest into +N. */
  max?: number
  size?: AvatarSize
  className?: string
}

export function AvatarStack({ people, max = 3, size = 'md', className }: AvatarStackProps) {
  const shown = people.slice(0, max)
  const overflow = people.length - shown.length
  return (
    <div className={cn('flex items-center', className)}>
      <div className="flex -space-x-2">
        {shown.map((p) => (
          <Avatar key={p.id} src={p.avatarUrl} name={p.name} size={size} />
        ))}
      </div>
      {overflow > 0 && (
        <div
          className={cn(
            'ml-2 flex items-center justify-center rounded-full border-2 border-card bg-card',
            'text-[12px] font-medium text-primary',
            SIZE[size],
          )}
          aria-label={`${overflow} more`}
        >
          +{overflow}
        </div>
      )}
    </div>
  )
}
