'use client'

import Link from 'next/link'
import { ChevronRight, LogOut, ShieldCheck, UserPlus } from 'lucide-react'
import { AppShell } from '@/components/riff/AppShell'
import { SubScreenHeader } from '@/components/riff/TopBar'
import { Card } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { buttonClass } from '@/components/ui/Button'
import { useCurrentUser, useIsGuest } from '@/lib/store'
import type { Musician } from '@/types'

/** Legal + support leaves. Everyone can reach these — none of them is a gated action. */
const LEGAL_ROWS = [
  { label: 'Terms of Use', href: '/terms' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Help & FAQ', href: '/help' },
  { label: 'About Riff', href: '/about' },
  { label: 'Contact us', href: '/contact' },
]

const rowClass =
  'flex items-center justify-between border-b border-border-hairline p-4 last:border-b-0'

export function SettingsView() {
  const me = useCurrentUser()
  const isGuest = useIsGuest()
  const signedIn = !isGuest && me

  return (
    <AppShell
      activeTab="me"
      header={<SubScreenHeader title="Settings & privacy" backHref="/me" />}
      mainClassName="px-4 py-6"
    >
      {signedIn ? <AccountCard me={me} /> : <GuestPrompt />}

      <section className="mt-6">
        <SectionHeader>Legal & support</SectionHeader>
        <Card className="overflow-hidden">
          {LEGAL_ROWS.map((row) => (
            <Link key={row.href} href={row.href} className={rowClass}>
              <span className="text-[15px] font-medium text-foreground">{row.label}</span>
              <ChevronRight size={14} className="text-foreground-dim" />
            </Link>
          ))}
        </Card>
      </section>

      {/* Reinforces product rule 2: neighbourhood, never address (docs/SPEC.md). */}
      <div className="mt-6 flex items-start gap-3 rounded-[12px] bg-surface-muted p-4">
        <ShieldCheck size={16} className="mt-0.5 shrink-0 text-primary" />
        <p className="text-[13px] leading-relaxed text-foreground-dim">
          <span className="font-semibold text-foreground">Privacy.</span> Riff shows your
          neighbourhood, never your address. An exact location appears only on a confirmed jam, and
          only to the people going.
        </p>
      </div>
    </AppShell>
  )
}

/** The signed-in account block: who you are, plus the way out. */
function AccountCard({ me }: { me: Musician }) {
  return (
    <section>
      <SectionHeader>Account</SectionHeader>
      <Card className="overflow-hidden">
        <div className="border-b border-border-hairline p-4">
          <div className="text-[16px] font-semibold text-foreground">{me.name}</div>
          <div className="text-[13px] font-medium text-foreground-dim">@{me.handle}</div>
          <p className="mt-2 text-[12px] leading-relaxed text-foreground-dim">
            Your name and handle are how people find you on Riff. Your account details are managed
            here — your reputation is earned from real sessions and stays read-only.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            // Redirect even if the POST fails — /welcome is safe either way, and a dead session on
            // the server just means the next request signs the user out anyway.
            void fetch('/api/auth/logout', { method: 'POST' }).finally(() => {
              window.location.href = '/welcome'
            })
          }}
          className="flex w-full items-center justify-between p-4 text-left"
        >
          <span className="text-[15px] font-medium text-destructive">Log out</span>
          <LogOut size={14} className="text-destructive" />
        </button>
      </Card>
    </section>
  )
}

/** Guests get the join prompt where the account block would be. */
function GuestPrompt() {
  return (
    <section>
      <SectionHeader>Account</SectionHeader>
      <Card className="p-5 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--hero-from)] text-primary">
          <UserPlus size={22} />
        </div>
        <h2 className="mb-1 font-serif text-[18px] font-bold text-foreground">
          Browsing as a guest
        </h2>
        <p className="mx-auto mb-4 max-w-[260px] text-[13px] leading-relaxed text-foreground-dim">
          Claim a handle to build a reputation, get jam requests, and manage your account.
        </p>
        <Link href="/signup" className={buttonClass({ fullWidth: true })}>
          Create your player card
        </Link>
      </Card>
    </section>
  )
}
