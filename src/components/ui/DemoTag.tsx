/**
 * The one way demo content is labelled, everywhere.
 *
 * Riff's rule for an MVP with real accounts: every number a user sees is computed from
 * recorded events, or absent, or carries this tag. Seed musicians, seeded chat lines,
 * fixture ratings and demo streams all wear it — unmistakably, in place, at the point of
 * display — so nothing fabricated can be mistaken for something a real person did.
 */
export function DemoTag({ className = '' }: { className?: string }) {
  return (
    <span
      title="Demo content — not from a real member"
      className={`inline-flex shrink-0 items-center rounded border border-dashed border-foreground-dim/40 px-1 py-px text-[9px] font-bold uppercase tracking-wider text-foreground-dim/80 ${className}`}
    >
      demo
    </span>
  )
}

/** DemoTag for dark/overlay surfaces (live streams, map sheets, battle chrome). */
export function DemoTagDark({ className = '' }: { className?: string }) {
  return (
    <span
      title="Demo content — not from a real member"
      className={`inline-flex shrink-0 items-center rounded border border-dashed border-white/40 px-1 py-px text-[9px] font-bold uppercase tracking-wider text-white/70 ${className}`}
    >
      demo
    </span>
  )
}
