'use client'

import Link from 'next/link'
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Globe,
  Music2,
  Phone,
  Plus,
  Share2,
  Sparkles,
  Star,
} from 'lucide-react'
import { AppShell, StickyActionBar } from '@/components/riff/AppShell'
import { CATEGORY_META } from '@/components/riff/CatalogManagerView'
import { Button, buttonClass, iconButtonClass } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { DemoTag } from '@/components/ui/DemoTag'
import { EmptyState } from '@/components/ui/EmptyState'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { StatTile } from '@/components/ui/StatTile'
import { SubScreenHeader } from '@/components/riff/TopBar'
import { cn } from '@/lib/cn'
import { formatShortDateTime } from '@/lib/datetime'
import { directionsHref } from '@/lib/labels'
import { useCurrentUser, useListingById, useShopCatalog, useShopShows } from '@/lib/store'
import { getBand, getMusicShop } from '@/mocks'
import type { MusicShop, ShopItem } from '@/types'

const KIND_LABEL: Record<MusicShop['kind'], string> = {
  instruments: 'Instruments',
  vinyl: 'Records',
  repair: 'Repairs',
  gear: 'Gear',
}

/** One catalog entry. Seed catalogs carry the demo tag; member items are the real thing. */
function CatalogItemCard({ item, demo }: { item: ShopItem; demo: boolean }) {
  const Icon = CATEGORY_META[item.category].icon
  return (
    <Card className={cn('flex items-center gap-3 p-3', !item.inStock && 'opacity-60')}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-secondary text-map-shop">
        <Icon size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[13px] font-bold text-foreground">{item.name}</span>
          {demo && <DemoTag />}
        </div>
        {item.blurb && (
          <p className="mt-0.5 truncate text-[11px] text-foreground-dim">{item.blurb}</p>
        )}
        <div className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.05em] text-foreground-dim">
          {item.condition}
          {!item.inStock && ' · out of stock'}
        </div>
      </div>
      <span className="shrink-0 font-serif text-[15px] font-bold text-foreground">
        {item.priceUsd === 0 ? 'Free' : `$${item.priceUsd.toLocaleString()}`}
      </span>
    </Card>
  )
}

export function ShopView({ shopId }: { shopId: string }) {
  // Resolve seeded fixtures first, then fall back to a member-published listing (same shape).
  const seeded = getMusicShop(shopId)
  const listing = useListingById(shopId)
  const me = useCurrentUser()
  const catalog = useShopCatalog(shopId)
  const shows = useShopShows(shopId)
  const shop = seeded ?? listing?.shop
  const isMember = !seeded && Boolean(listing?.shop)
  const isOwner = isMember && listing?.ownerId === me?.id
  // A brand-new member listing has no rating yet — show "New", not a broken-looking 0.0.
  const isNew = isMember && shop?.reviewCount === 0

  if (!shop) {
    return (
      <AppShell
        activeTab="map"
        header={<SubScreenHeader title="Shop" backHref="/map" />}
        mainClassName="flex items-center px-4 py-6"
      >
        <EmptyState
          className="w-full"
          title="This shop is gone"
          body="It may have closed, or the link is out of date."
          action={
            <Link href="/map" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
              Back to map
            </Link>
          }
        />
      </AppShell>
    )
  }

  return (
    <AppShell
      activeTab="map"
      mainClassName="pb-2"
      footer={
        <StickyActionBar>
          <Button
            variant="secondary"
            className="flex-1"
            disabled
            title="Shop messaging is not built yet"
          >
            Message shop
          </Button>
        </StickyActionBar>
      }
    >
      {/* PHOTO HEADER — the back and share controls float over it. */}
      <div className="relative h-[280px] shrink-0 overflow-hidden rounded-b-[24px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={shop.photoUrl} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute left-0 top-0 flex h-[56px] w-full items-center justify-between px-4">
          <Link href="/map" aria-label="Back" className={iconButtonClass('dark')}>
            <ChevronLeft size={16} />
          </Link>
          <span className={cn(iconButtonClass('dark'), 'pointer-events-none opacity-60')}>
            <Share2 size={14} />
          </span>
        </div>
      </div>

      <div className="px-4 pb-5 pt-5">
        {isMember && (
          <span className="mb-2 inline-flex items-center gap-1 rounded-full border border-border-subtle bg-secondary px-2.5 py-1 text-[11px] font-bold text-foreground-dim">
            <Sparkles size={11} /> New listing
          </span>
        )}
        <h1 className="mb-1 font-serif text-[28px] font-bold leading-tight text-foreground">
          {shop.name}
        </h1>
        <p className="text-[13px] font-medium text-foreground-dim">
          {KIND_LABEL[shop.kind]} · {shop.neighborhood}
        </p>
        {isOwner && (
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/me/business/shop/${shopId}/catalog`}
              className={buttonClass({ variant: 'secondary', size: 'sm' })}
            >
              <Plus size={15} /> Manage catalog
            </Link>
            <Link
              href={`/me/business/shop/${shopId}/book`}
              className={buttonClass({ variant: 'secondary', size: 'sm' })}
            >
              <Music2 size={15} /> Book a band
            </Link>
            <Link
              href="/me/business"
              className={buttonClass({ variant: 'outline', size: 'sm' })}
            >
              Dashboard
            </Link>
          </div>
        )}

        {/* Open/closed badge + the shop's own hours copy. */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {shop.openNow ? (
            <span className="flex items-center gap-1.5 rounded-full border border-success-border bg-success-soft px-2.5 py-1 text-[11px] font-bold text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success" /> Open now
            </span>
          ) : (
            <span className="rounded-full border border-border-subtle bg-secondary px-2.5 py-1 text-[11px] font-bold text-foreground-dim">
              Closed
            </span>
          )}
          <span className="text-[12px] font-medium text-foreground-dim">{shop.hoursLabel}</span>
        </div>
      </div>

      <div className="mb-6 flex gap-3 px-4">
        <StatTile
          value={isNew ? 'New' : shop.rating}
          label="Rating"
          adornment={
            isNew ? undefined : (
              <>
                <Star size={10} className="text-[#facc15]" fill="currentColor" />
                <DemoTag />
              </>
            )
          }
          className="[&_span:first-child]:text-[18px]"
        />
        <StatTile
          value={isNew ? 'New' : shop.reviewCount}
          label="Reviews"
          adornment={isNew ? undefined : <DemoTag />}
          className="[&_span:first-child]:text-[18px]"
        />
      </div>

      {shop.tags.length > 0 && (
        <div className="mb-8 px-4">
          <div className="flex flex-wrap gap-2">
            {shop.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border-subtle bg-card px-3 py-1.5 text-[12px] font-medium text-foreground shadow-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* IN-STORE SHOWS — bands the shop booked, once the band said yes. */}
      {shows.length > 0 && (
        <section className="mb-8 px-4">
          <SectionHeader>In-store shows</SectionHeader>
          <div className="flex flex-col gap-2">
            {shows.map((show) => {
              const band = getBand(show.bandId)
              return (
                <Link key={show.id} href={band ? `/bands/${band.id}` : '#'} className="block">
                  <Card className="flex items-center gap-3 p-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[color:var(--hero-from)] text-map-shop">
                      <CalendarClock size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate font-serif text-[14px] font-bold text-foreground">
                          {band?.name ?? 'Live set'}
                        </span>
                        {show.ownerId === 'seed' && <DemoTag />}
                      </div>
                      <div className="mt-0.5 text-[12px] text-foreground-dim">
                        {formatShortDateTime(show.startsAt)} · free entry
                      </div>
                    </div>
                    <ChevronRight size={14} className="shrink-0 text-foreground-dim" />
                  </Card>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* CATALOG — what the shop sells. Member shops manage this from the owner dashboard. */}
      {(catalog.length > 0 || isOwner) && (
        <section className="mb-8 px-4">
          <SectionHeader
            action={
              isOwner ? (
                <Link
                  href={`/me/business/shop/${shopId}/catalog`}
                  className="text-[12px] font-semibold text-primary"
                >
                  Manage
                </Link>
              ) : undefined
            }
          >
            In the shop
          </SectionHeader>
          {catalog.length === 0 ? (
            <Card className="p-4 text-center text-[13px] text-foreground-dim">
              Nothing listed yet — add your first item and it shows here.
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {catalog.map((item) => (
                <CatalogItemCard key={item.id} item={item} demo={!isMember} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ADDRESS — a shop is a public storefront, so the street address is fine to show. */}
      <section className="mb-8 px-4">
        <SectionHeader>Address</SectionHeader>
        <Card className="flex items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <div className="truncate font-serif text-[15px] font-bold text-foreground">
              {shop.address}
            </div>
            <div className="text-[13px] text-foreground-dim">{shop.city}</div>
          </div>
          <a
            href={directionsHref(`${shop.address}, ${shop.city}`)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex shrink-0 items-center gap-1 text-[14px] font-medium text-map-shop"
          >
            Directions <ChevronRight size={12} />
          </a>
        </Card>
      </section>

      {(shop.phone || shop.website) && (
        <section className="mb-8 px-4">
          <SectionHeader>Contact</SectionHeader>
          <Card className="flex flex-col p-1">
            {shop.phone && (
              <a
                href={`tel:${shop.phone}`}
                className="flex items-center gap-3 border-b border-border-hairline p-3 last:border-0"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground-dim">
                  <Phone size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-foreground-dim">
                    Phone
                  </div>
                  <div className="truncate text-[14px] font-medium text-foreground">
                    {shop.phone}
                  </div>
                </div>
                <ChevronRight size={14} className="shrink-0 text-foreground-dim" />
              </a>
            )}
            {shop.website && (
              // The website is a placeholder domain, so it renders as plain text — not a link.
              <div className="flex items-center gap-3 border-b border-border-hairline p-3 last:border-0">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground-dim">
                  <Globe size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-foreground-dim">
                    Website
                  </div>
                  <div className="truncate text-[14px] font-medium text-foreground-dim">
                    {shop.website}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </section>
      )}
    </AppShell>
  )
}
