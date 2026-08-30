import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export const metadata: Metadata = { title: 'Privacy · Riff' }

/**
 * A calm, honest placeholder for the real privacy policy. No tab bar — this is a leaf reached
 * from signup. Server component: static copy, no state.
 */
export default function PrivacyPage() {
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
          Privacy
        </h1>
        <p className="mb-6 text-[13px] text-foreground-dim">Last updated August 2026</p>

        <div className="space-y-4 text-[14px] leading-relaxed text-foreground">
          <p>
            <span className="font-semibold">We store what you enter.</span> Your handle, display
            name, the instruments and genres you pick, your neighbourhood, and the sessions you take
            part in — that&rsquo;s the account. We keep it so Riff can show the right people to each
            other.
          </p>
          <p>
            <span className="font-semibold">Email is optional and only for recovery.</span> If you
            give us one, we use it to help you back into your account and nothing else — no
            marketing, no selling it on, no surprise newsletters. Leave it blank and Riff still
            works; you just have fewer ways back in if you forget your password.
          </p>
          <p>
            <span className="font-semibold">Neighbourhood, never address.</span> Riff shows the area
            you play in, not where you live. A precise location only ever appears on a session
            you&rsquo;ve confirmed, and only to the people going.
          </p>
          <p>
            This is a preview built on mock data, so much of what you see is illustrative. As Riff
            grows into something real, this page will grow with it — and we&rsquo;ll be plain about
            what changes.
          </p>
        </div>

        <p className="mt-8 text-[13px] text-foreground-dim">
          See also our{' '}
          <Link href="/terms" className="font-medium text-primary underline">
            Terms of use
          </Link>
          .
        </p>
      </main>
    </>
  )
}
