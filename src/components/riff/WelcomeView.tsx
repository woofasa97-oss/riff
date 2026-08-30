import Link from 'next/link'
import { Compass } from 'lucide-react'
import { AppShell } from '@/components/riff/AppShell'
import { buttonClass } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

/**
 * Pre-auth welcome screen — no tab bar, no header. Both entries are full navigations into the
 * real account flow: /signup creates an account, /login signs an existing one back in.
 */
export function WelcomeView() {
  return (
    <AppShell
      activeTab={null}
      surface="dark"
      background={
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mock/stage/welcome-hero.svg" alt="" className="h-full w-full object-cover" />
          {/* Scrim darkens toward the bottom so the actions and footer stay legible. */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/50 to-black/90" />
        </>
      }
      mainClassName="flex flex-col justify-between px-6 py-12"
    >
      <div className="mt-12 flex flex-col items-center text-center">
        <h1 className="mb-4 font-serif text-5xl font-bold tracking-tight text-white drop-shadow-md">
          Riff
        </h1>
        <p className="text-[17px] font-medium text-white/90">Find your people. Play tonight.</p>
      </div>

      <div className="mt-auto flex w-full flex-col items-center gap-4 pt-12">
        <Link
          href="/signup"
          className={cn(buttonClass({ fullWidth: true }), 'font-semibold shadow-sm')}
        >
          Create your player card
        </Link>

        {/* Guest mode's front door: a real button, styled to sit under the primary — not a text link. */}
        <Link
          href="/discover"
          className={cn(
            'inline-flex h-[48px] w-full select-none items-center justify-center gap-2 rounded-[12px]',
            'border border-white/30 bg-white/[0.12] text-[15px] font-semibold text-white backdrop-blur-md',
            'transition-transform active:scale-95',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          )}
        >
          <Compass size={16} />
          Look around first
        </Link>

        <Link
          href="/login"
          className="mt-4 py-2 text-[14px] font-medium text-white/80 transition-colors hover:text-white"
        >
          I already have an account
        </Link>

        <p className="mt-2 max-w-xs text-center text-[11px] leading-relaxed text-white/60">
          Riff shows you musicians near you. You choose who sees you.
        </p>
      </div>
    </AppShell>
  )
}
