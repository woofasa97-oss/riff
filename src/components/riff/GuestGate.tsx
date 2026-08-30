'use client'

import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { AppShell } from '@/components/riff/AppShell'
import { SubScreenHeader } from '@/components/riff/TopBar'
import { buttonClass } from '@/components/ui/Button'
import type { TabId } from '@/components/riff/BottomTabBar'

/**
 * A whole-screen sign-up gate for account-required PAGES (post a jam, respond to a request,
 * file a recap). A guest who deep-links or navigates to one of these lands here instead of a
 * form that can't work — with the same gentle framing as the action prompt.
 */
export function GuestGate({
  feature,
  backHref,
  activeTab = 'jams',
}: {
  feature: string
  backHref: string
  activeTab?: TabId | null
}) {
  return (
    <AppShell
      activeTab={activeTab}
      header={<SubScreenHeader title="Create your player card" backHref={backHref} />}
      mainClassName="flex items-center px-6 py-8"
    >
      <div className="w-full text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--hero-from)] text-primary">
          <Sparkles size={28} />
        </div>
        <h1 className="mb-2 font-serif text-[24px] font-bold text-foreground">
          Sign up to {feature}
        </h1>
        <p className="mx-auto mb-8 max-w-[280px] text-[14px] text-foreground-dim">
          You&apos;ve been browsing as a guest. Claim a handle to {feature} and join the scene.
        </p>
        <div className="flex flex-col gap-2">
          <Link href="/signup" className={buttonClass({ fullWidth: true })}>
            Create your player card
          </Link>
          <Link href="/login" className={buttonClass({ variant: 'secondary', fullWidth: true })}>
            I already have an account
          </Link>
        </div>
      </div>
    </AppShell>
  )
}
