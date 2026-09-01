'use client'

import Link from 'next/link'
import { Building2, ChevronRight, Guitar, Info, Store } from 'lucide-react'
import { AppShell } from '@/components/riff/AppShell'
import { SubScreenHeader } from '@/components/riff/TopBar'
import { Card } from '@/components/ui/Card'
import { useIsGuest, useRiffStore } from '@/lib/store'

/**
 * The entry to the "list on the map" flows: pick what you're putting on the map, then a
 * per-kind wizard collects the rest. Listing is gated on a finished player card (the server
 * enforces it in createListing); a guest or an unfinished profile still sees the chooser with a
 * friendly heads-up, so the path is never a dead end.
 */
const CHOICES = [
  {
    href: '/me/listings/new/studio',
    icon: Building2,
    title: 'Rent out a studio',
    body: 'A pro room or your home rig, bookable by the hour.',
  },
  {
    href: '/me/listings/new/street',
    icon: Guitar,
    title: 'Play as a street artist',
    body: 'Put your busking spot on the map while you play.',
  },
  {
    href: '/me/listings/new/shop',
    icon: Store,
    title: 'Open a music shop',
    body: 'List your storefront — instruments, vinyl, repairs, gear.',
  },
] as const

export function ListingChooser() {
  const isGuest = useIsGuest()
  const profileComplete = useRiffStore((s) => s.profileComplete)
  const needsCard = isGuest || !profileComplete

  return (
    <AppShell
      activeTab="me"
      header={<SubScreenHeader title="List on the map" backHref="/me" />}
      mainClassName="px-4 py-6"
    >
      <p className="mb-5 px-1 text-[14px] text-foreground-dim">
        Add your studio, act, or shop to the map so the scene can find it. Your Riff reputation is
        the trust anchor behind every listing.
      </p>

      {needsCard && (
        <Card className="mb-5 flex gap-3 bg-[color:var(--hero-from)] p-4">
          <Info size={18} className="mt-0.5 shrink-0 text-primary" />
          <div>
            <div className="font-serif text-[14px] font-bold text-foreground">
              Finish your player card first
            </div>
            <p className="mt-1 text-[13px] text-foreground-dim">
              Listings go live under your name, so you&apos;ll need a complete player card before
              you can publish.{' '}
              <Link href="/me/edit" className="font-semibold text-primary underline underline-offset-2">
                Finish it now
              </Link>
              .
            </p>
          </div>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {CHOICES.map(({ href, icon: Icon, title, body }) => (
          <Link key={href} href={href} className="block transition-transform active:scale-[0.98]">
            <Card className="flex items-center gap-4 p-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-[color:var(--hero-from)] text-primary">
                <Icon size={22} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-serif text-[16px] font-bold text-foreground">{title}</div>
                <p className="mt-0.5 text-[13px] text-foreground-dim">{body}</p>
              </div>
              <ChevronRight size={16} className="shrink-0 text-foreground-dim" />
            </Card>
          </Link>
        ))}
      </div>
    </AppShell>
  )
}
