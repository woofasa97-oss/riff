import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export const metadata: Metadata = { title: 'Terms · Riff' }

/**
 * A calm, honest placeholder for the real terms. No tab bar — this is a leaf reached from
 * signup. Server component: it is static copy with no state.
 */
export default function TermsPage() {
  return (
    <>
      <header className="flex h-[56px] shrink-0 items-center bg-background px-4">
        <Link
          href="/me"
          aria-label="Back"
          className="-ml-1 flex h-8 w-8 items-center justify-start text-foreground transition-transform active:scale-90"
        >
          <ChevronLeft size={20} />
        </Link>
      </header>

      <main className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-6 pb-12 pt-4">
        <h1 className="mb-2 font-serif text-[28px] font-bold leading-tight text-foreground">
          Terms of use
        </h1>
        <p className="mb-6 text-[13px] text-foreground-dim">Last updated August 2026</p>

        <div className="space-y-4 text-[14px] leading-relaxed text-foreground">
          <p>
            <span className="font-semibold">Riff is in preview.</span> It exists to help musicians
            find people to play with, turn that into a real session, and build a reputation from
            sessions they actually showed up to. Treat everything here as a work in progress —
            features and copy will change as we learn.
          </p>
          <p>
            <span className="font-semibold">Riff Credits are not real money.</span> They have no
            cash value, cannot be bought, sold, or withdrawn, and exist only to make the preview
            feel alive. Nothing you see involving Credits is a financial transaction.
          </p>
          <p>
            Be decent. Show up when you say you will, treat the people you meet with respect, and
            don&rsquo;t post anything you wouldn&rsquo;t want a bandmate to read. We may remove
            content or accounts that make the space worse for everyone.
          </p>
          <p>
            Reputation on Riff is earned from real sessions and computed from recaps. You
            can&rsquo;t edit it directly — that&rsquo;s the whole point of it being worth something.
          </p>
          <p>
            Questions about how any of this works? This is a preview, so the honest answer is: ask,
            and we&rsquo;ll tell you what&rsquo;s real and what&rsquo;s still pretend.
          </p>
        </div>

        <p className="mt-8 text-[13px] text-foreground-dim">
          See also our{' '}
          <Link href="/privacy" className="font-medium text-primary underline">
            Privacy Policy
          </Link>
          .
        </p>
      </main>
    </>
  )
}
