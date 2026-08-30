import Link from 'next/link'

export const metadata = { title: 'Not found · Riff' }

/**
 * Branded 404 — renders inside the root layout's phone column, so a mistyped or dead URL lands
 * in Riff rather than on Next's bare default page (product rule 5: every screen has an exit).
 */
export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-8 text-center">
      <p className="font-serif text-[56px] font-bold leading-none text-primary">404</p>
      <h1 className="mt-3 font-serif text-[22px] font-bold text-foreground">
        This page isn’t on the setlist
      </h1>
      <p className="mt-2 max-w-[280px] text-[14px] leading-relaxed text-foreground-dim">
        The link may be old or the page may have moved. Let’s get you back to the music.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          href="/map"
          className="rounded-[12px] bg-primary px-5 py-2.5 text-[15px] font-semibold text-primary-foreground transition-transform active:scale-95"
        >
          Back to the map
        </Link>
        <Link
          href="/discover"
          className="rounded-[12px] bg-surface-muted px-5 py-2.5 text-[15px] font-semibold text-foreground transition-transform active:scale-95"
        >
          Discover
        </Link>
      </div>
    </main>
  )
}
