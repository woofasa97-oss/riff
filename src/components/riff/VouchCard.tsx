import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/datetime'
import { instrumentLabel, vouchTagLabel } from '@/lib/labels'
import { getMusician } from '@/mocks'
import type { Vouch } from '@/types'

/**
 * One vouch on the vouches screen: who said it, the shared history that earned them the right
 * to say it (docs/SPEC.md — only confirmed co-attendees can vouch), and what they said.
 */
export function VouchCard({ vouch, className }: { vouch: Vouch; className?: string }) {
  const voucher = getMusician(vouch.fromId)
  // A vouch from someone not in the fixtures is a data error, not something to render around.
  if (!voucher) return null

  const sessions =
    vouch.sessionsTogether === 1
      ? '1 session together'
      : `${vouch.sessionsTogether} sessions together`

  return (
    <Card className={cn('flex flex-col p-4', className)}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <Link
          href={`/musicians/${vouch.fromId}`}
          className="flex min-w-0 items-center gap-3 transition-transform active:scale-[0.98]"
        >
          <Avatar src={voucher.avatarUrl} name={voucher.name} size="lg" />
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-serif text-[16px] font-bold text-foreground">
              {voucher.name}
            </span>
            <span className="truncate text-[12px] text-foreground-dim">
              {sessions} · {formatDate(vouch.createdAt)}
            </span>
          </div>
        </Link>
        <span className="shrink-0 rounded-[6px] border border-border-subtle bg-card px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-foreground">
          {instrumentLabel(voucher.instruments[0])}
        </span>
      </div>

      {vouch.note && (
        <p
          className={cn(
            'text-[14px] italic leading-relaxed text-foreground',
            vouch.tags.length > 0 && 'mb-4',
          )}
        >
          &ldquo;{vouch.note}&rdquo;
        </p>
      )}

      {vouch.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {vouch.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-[color:var(--hero-from)] px-2.5 py-1 text-[11px] font-medium text-primary"
            >
              {vouchTagLabel(tag)}
            </span>
          ))}
        </div>
      )}
    </Card>
  )
}
