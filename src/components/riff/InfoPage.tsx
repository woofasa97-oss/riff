import Link from 'next/link'
import { AppShell } from '@/components/riff/AppShell'
import { SubScreenHeader } from '@/components/riff/TopBar'

/**
 * Shared layout for readable content pages — About, Help, Contact and any future prose leaf.
 * No tab bar (these are reached from the profile, not a top-level tab), a centred back-titled
 * header, and a single readable column that stays comfortable from 375px up to the 768px cap.
 *
 * Server-safe: static copy only, no state or handlers. Compose the body from {@link InfoSection}
 * and {@link InfoQA}, or drop in your own elements — it is just a spaced column.
 */
export function InfoPage({
  title,
  backHref,
  children,
}: {
  title: string
  backHref: string
  children: React.ReactNode
}) {
  return (
    <AppShell activeTab={null} header={<SubScreenHeader title={title} backHref={backHref} />}>
      <div className="mx-auto max-w-[600px] px-6 pb-16 pt-5">
        <div className="space-y-8">{children}</div>
      </div>
    </AppShell>
  )
}

/**
 * A titled prose section: serif heading over dimmed body copy. Wrap paragraphs in <p> — the
 * body already stacks its children with comfortable spacing.
 */
export function InfoSection({
  title,
  children,
}: {
  title?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3">
      {title && (
        <h2 className="font-serif text-[19px] font-bold leading-tight text-foreground">{title}</h2>
      )}
      <div className="space-y-3 text-[15px] leading-relaxed text-foreground-dim">{children}</div>
    </section>
  )
}

/** One question-and-answer entry for a help/FAQ page. */
export function InfoQA({ q, children }: { q: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="font-serif text-[17px] font-bold leading-snug text-foreground">{q}</h2>
      <div className="space-y-2 text-[15px] leading-relaxed text-foreground-dim">{children}</div>
    </section>
  )
}

/**
 * A quiet inline link inside body copy. Internal routes get client-side navigation via
 * next/link; `mailto:` and external hrefs fall back to a plain anchor.
 */
export function InfoLink({ href, children }: { href: string; children: React.ReactNode }) {
  const className = 'font-medium text-primary underline'
  if (href.startsWith('/')) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    )
  }
  return (
    <a href={href} className={className}>
      {children}
    </a>
  )
}
