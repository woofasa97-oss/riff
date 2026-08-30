'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Apple } from 'lucide-react'
import { AppShell } from '@/components/riff/AppShell'
import { Button } from '@/components/ui/Button'

/**
 * Pre-onboarding welcome screen — no tab bar, no header. All three auth entries are stubs
 * that drop straight into onboarding; real auth comes with the backend (docs/SPEC.md).
 */
export function WelcomeView() {
  const router = useRouter()
  const startOnboarding = () => router.push('/onboarding/location')

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
        <Button fullWidth className="font-semibold shadow-sm" onClick={startOnboarding}>
          Create your player card
        </Button>
        <Button
          variant="outline"
          fullWidth
          className="gap-3 border-0 font-semibold shadow-sm"
          onClick={startOnboarding}
        >
          <Apple size={20} aria-hidden />
          Continue with Apple
        </Button>
        <Button
          variant="outline"
          fullWidth
          className="border-0 font-semibold shadow-sm"
          onClick={startOnboarding}
        >
          Continue with Google
        </Button>

        <Link
          href="/jams"
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
