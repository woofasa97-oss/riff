'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Briefcase,
  Building2,
  CalendarClock,
  Check,
  ChevronRight,
  GraduationCap,
  Guitar,
  HandCoins,
  MapPin,
  Music2,
  Pencil,
  Plus,
  Store,
  X,
} from 'lucide-react'
import { AppShell } from '@/components/riff/AppShell'
import { SubScreenHeader } from '@/components/riff/TopBar'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { buttonClass } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Toggle } from '@/components/ui/Toggle'
import { cn } from '@/lib/cn'
import { formatShortDateTime, formatTime } from '@/lib/datetime'
import { formatCredits, instrumentLabel } from '@/lib/labels'
import { useIsGuest, useOwnerRoles, useRiffStore } from '@/lib/store'
import { getBand, getMusician } from '@/mocks'
import type { GigOffer, LessonRequest, MapListing } from '@/types'

/**
 * The owner's back office — every business the viewer runs, with its admin controls in one
 * place: shop catalogs and band bookings, studio and street listings, teaching and the lesson
 * inbox, and the credits their businesses have earned. A member with nothing listed sees the
 * four ways in, not an empty page.
 */
export function OwnerDashboardView() {
  const isGuest = useIsGuest()
  const roles = useOwnerRoles()

  return (
    <AppShell
      activeTab="me"
      header={<SubScreenHeader title="Owner dashboard" backHref="/me" />}
      mainClassName="px-4 py-6"
    >
      {isGuest ? (
        <GuestInvite />
      ) : (
        <>
          <HeroCard />
          {roles.isOwner ? <OwnerBody /> : <StartCards />}
        </>
      )}
    </AppShell>
  )
}

function GuestInvite() {
  return (
    <Card className="p-6 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--hero-from)] text-primary">
        <Briefcase size={24} />
      </div>
      <h1 className="font-serif text-[20px] font-bold text-foreground">Run something on Riff</h1>
      <p className="mx-auto mt-2 max-w-[280px] text-[13px] text-foreground-dim">
        Rent out a studio, open a shop with a real catalog, busk with a tip jar, book bands, or
        take students. It all starts with an account.
      </p>
      <Link href="/signup" className={cn(buttonClass({ fullWidth: true }), 'mt-5')}>
        Create your player card
      </Link>
    </Card>
  )
}

/** Roles + earnings up top: what you run, and what it has earned you. */
function HeroCard() {
  const roles = useOwnerRoles()
  const wallet = useRiffStore((s) => s.wallet)
  const tipsReceived = useMemo(
    () =>
      (wallet?.transactions ?? [])
        .filter((t) => t.kind === 'tip_received' || t.kind === 'gig_payout')
        .reduce((sum, t) => sum + t.amountCredits, 0),
    [wallet],
  )

  const chips: string[] = []
  if (roles.shops.length > 0) chips.push(roles.shops.length === 1 ? 'Shop owner' : `${roles.shops.length} shops`)
  if (roles.studios.length > 0) chips.push('Studio host')
  if (roles.street.length > 0) chips.push('Street artist')
  if (roles.teacher) chips.push(roles.teacher.active ? 'Teacher' : 'Teacher (paused)')

  return (
    <div className="relative mb-6 overflow-hidden rounded-[16px] bg-gradient-to-br from-primary to-accent p-5 text-white shadow-sm">
      <Briefcase
        size={110}
        strokeWidth={1}
        className="pointer-events-none absolute -right-4 -top-5 text-white/10"
      />
      <div className="relative">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/75">Owner mode</p>
        {chips.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {chips.map((c) => (
              <span
                key={c}
                className="rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[12px] font-semibold"
              >
                {c}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-1 font-serif text-[20px] font-bold leading-tight">
            You&apos;re not running anything yet
          </p>
        )}
        <Link href="/wallet" className="mt-3 flex items-center gap-1.5 text-[12px] text-white/80">
          <HandCoins size={13} />
          {tipsReceived > 0
            ? `${formatCredits(tipsReceived)} earned from tips and shows`
            : 'Tips and show payouts land in your wallet'}
          <ChevronRight size={12} />
        </Link>
      </div>
    </div>
  )
}

/** The four ways into owner mode, shown until the member runs something. */
const START_CARDS = [
  {
    href: '/me/listings/new/shop',
    icon: Store,
    title: 'Open a music shop',
    body: 'A storefront on the map, with a catalog you manage and bands you book.',
  },
  {
    href: '/me/listings/new/studio',
    icon: Building2,
    title: 'Rent out a studio',
    body: 'A pro room or your home rig, bookable by the hour.',
  },
  {
    href: '/me/listings/new/street',
    icon: Guitar,
    title: 'Go street today',
    body: 'Put your busking spot on the map — with a CR tip jar.',
  },
  {
    href: '/me/business/teacher',
    icon: GraduationCap,
    title: 'Teach on Riff',
    body: 'List your instrument and rate; students request lessons.',
  },
] as const

function StartCards() {
  return (
    <div className="flex flex-col gap-3">
      {START_CARDS.map(({ href, icon: Icon, title, body }) => (
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
  )
}

function OwnerBody() {
  const roles = useOwnerRoles()
  const gigOffers = useRiffStore((s) => s.gigOffers)

  return (
    <>
      {(roles.shops.length > 0 || roles.studios.length > 0 || roles.street.length > 0) && (
        <section className="mb-8">
          <SectionHeader
            action={
              <Link href="/me/listings/new" className="text-[12px] font-semibold text-primary">
                Add another
              </Link>
            }
          >
            Your businesses
          </SectionHeader>
          <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2">
            {roles.shops.map((l) => (
              <ShopAdminCard key={l.id} listing={l} />
            ))}
            {roles.studios.map((l) => (
              <StudioAdminCard key={l.id} listing={l} />
            ))}
            {roles.street.map((l) => (
              <StreetAdminCard key={l.id} listing={l} />
            ))}
          </div>
        </section>
      )}

      <TeachingSection />

      {gigOffers.length > 0 && (
        <section className="mb-8">
          <SectionHeader>Band bookings</SectionHeader>
          <div className="flex flex-col gap-2">
            {gigOffers.map((offer) => (
              <GigOfferRow key={offer.id} offer={offer} />
            ))}
          </div>
        </section>
      )}

      {!roles.teacher && roles.isOwner && (
        <section className="mb-8">
          <Link href="/me/business/teacher" className="block transition-transform active:scale-[0.98]">
            <Card className="flex items-center gap-4 p-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-[color:var(--hero-from)] text-primary">
                <GraduationCap size={22} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-serif text-[16px] font-bold text-foreground">Teach on Riff</div>
                <p className="mt-0.5 text-[13px] text-foreground-dim">
                  List your instrument and rate; students request lessons.
                </p>
              </div>
              <ChevronRight size={16} className="shrink-0 text-foreground-dim" />
            </Card>
          </Link>
        </section>
      )}

      <section className="mb-4">
        <Card className="overflow-hidden">
          <Link
            href="/me/listings"
            className="flex items-center justify-between border-b border-border-hairline p-4"
          >
            <span className="flex items-center gap-2 text-[15px] font-medium text-foreground">
              <MapPin size={16} className="text-foreground-dim" /> All map listings
            </span>
            <ChevronRight size={14} className="text-foreground-dim" />
          </Link>
          <Link href="/wallet" className="flex items-center justify-between p-4">
            <span className="flex items-center gap-2 text-[15px] font-medium text-foreground">
              <HandCoins size={16} className="text-foreground-dim" /> Wallet &amp; earnings
            </span>
            <ChevronRight size={14} className="text-foreground-dim" />
          </Link>
        </Card>
      </section>
    </>
  )
}

const STATUS_BADGE: Record<MapListing['status'], { label: string; tone: 'success' | 'neutral' | 'warning' }> = {
  published: { label: 'Live', tone: 'success' },
  paused: { label: 'Paused', tone: 'neutral' },
  in_review: { label: 'In review', tone: 'warning' },
  draft: { label: 'Draft', tone: 'neutral' },
}

const adminAction =
  'inline-flex items-center gap-1.5 rounded-[10px] bg-surface-muted px-3 py-2 text-[13px] font-medium text-foreground transition-transform active:scale-95'

function AdminCardShell({
  icon: Icon,
  kindLabel,
  name,
  status,
  meta,
  children,
}: {
  icon: typeof Store
  kindLabel: string
  name: string
  status: MapListing['status']
  meta?: string
  children: React.ReactNode
}) {
  const badge = STATUS_BADGE[status]
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[color:var(--hero-from)] text-primary">
          <Icon size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 text-[11px] font-bold uppercase tracking-[0.06em] text-foreground-dim">
            {kindLabel}
          </div>
          <div className="truncate font-serif text-[16px] font-bold text-foreground">{name}</div>
          {meta && <div className="mt-0.5 text-[12px] text-foreground-dim">{meta}</div>}
        </div>
        <Badge tone={badge.tone} className="shrink-0 self-start px-2.5 py-1 text-[11px]">
          {badge.label}
        </Badge>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 border-t border-border-hairline pt-3">{children}</div>
    </Card>
  )
}

function ShopAdminCard({ listing }: { listing: MapListing }) {
  const items = useRiffStore((s) => s.shopItems[listing.id] ?? [])
  const shows = useRiffStore((s) => s.shopShows[listing.id] ?? [])
  const name = listing.shop?.name ?? 'Your shop'
  const metaBits = [
    items.length === 1 ? '1 item in catalog' : `${items.length} items in catalog`,
    shows.length > 0 ? (shows.length === 1 ? '1 show booked' : `${shows.length} shows booked`) : null,
  ].filter(Boolean)
  return (
    <AdminCardShell
      icon={Store}
      kindLabel="Music shop"
      name={name}
      status={listing.status}
      meta={metaBits.join(' · ')}
    >
      <Link href={`/me/business/shop/${listing.id}/catalog`} className={adminAction}>
        <Plus size={15} /> Catalog
      </Link>
      <Link href={`/me/business/shop/${listing.id}/book`} className={adminAction}>
        <Music2 size={15} /> Book a band
      </Link>
      <Link href={`/shops/${listing.id}`} className={adminAction}>
        View page
      </Link>
      <Link href={`/me/listings/new/shop?id=${listing.id}`} className={adminAction}>
        <Pencil size={15} /> Edit
      </Link>
    </AdminCardShell>
  )
}

function StudioAdminCard({ listing }: { listing: MapListing }) {
  const studio = listing.studio
  return (
    <AdminCardShell
      icon={Building2}
      kindLabel="Studio"
      name={studio?.name ?? 'Your studio'}
      status={listing.status}
      meta={studio ? `$${studio.hourlyRateUsd}/hr · ${studio.neighborhood}` : undefined}
    >
      <Link href={`/studios/${listing.id}`} className={adminAction}>
        View page
      </Link>
      <Link href={`/me/listings/new/studio?id=${listing.id}`} className={adminAction}>
        <Pencil size={15} /> Edit
      </Link>
    </AdminCardShell>
  )
}

function StreetAdminCard({ listing }: { listing: MapListing }) {
  const street = listing.street
  const live = Boolean(street?.live)
  return (
    <AdminCardShell
      icon={Guitar}
      kindLabel="Street act"
      name={street?.name ?? 'Your act'}
      status={listing.status}
      meta={
        street
          ? live
            ? `Playing now at ${street.spotLabel} until ${formatTime(street.until)}`
            : `Last set: ${street.spotLabel}`
          : undefined
      }
    >
      <Link href={`/street/${listing.id}`} className={adminAction}>
        View page
      </Link>
      <Link href={`/me/listings/new/street?id=${listing.id}`} className={adminAction}>
        <Guitar size={15} /> {live ? 'Change spot' : 'Head out again'}
      </Link>
    </AdminCardShell>
  )
}

// --- teaching ---------------------------------------------------------------

function TeachingSection() {
  const roles = useOwnerRoles()
  const viewerId = useRiffStore((s) => s.viewerId)
  const lessons = useRiffStore((s) => s.lessonRequests)
  const setActive = useRiffStore((s) => s.setTeacherActive)
  const [busy, setBusy] = useState(false)
  const teacher = roles.teacher
  const incoming = useMemo(
    () => lessons.filter((l) => l.teacherId === viewerId),
    [lessons, viewerId],
  )

  if (!teacher) return null

  async function toggle(next: boolean) {
    if (busy) return
    setBusy(true)
    try {
      await setActive(next)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mb-8">
      <SectionHeader
        action={
          <Link href="/me/business/teacher" className="text-[12px] font-semibold text-primary">
            Edit profile
          </Link>
        }
      >
        Teaching
      </SectionHeader>
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[color:var(--hero-from)] text-primary">
            <GraduationCap size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate font-serif text-[15px] font-bold text-foreground">
              {teacher.headline}
            </div>
            <div className="text-[12px] text-foreground-dim">
              {teacher.instruments.map(instrumentLabel).join(' · ')} · ${teacher.ratePerHourUsd}/hr
            </div>
          </div>
          <Toggle
            checked={teacher.active}
            onChange={toggle}
            label="Taking students"
            className={busy ? 'opacity-60' : undefined}
          />
        </div>
        <p className="mt-2 text-[12px] text-foreground-dim">
          {teacher.active
            ? 'You’re listed in the teacher directory.'
            : 'Paused — your profile is hidden from the directory.'}
        </p>
      </Card>

      {incoming.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {incoming.map((req) => (
            <LessonRequestRow key={req.id} req={req} />
          ))}
        </div>
      )}
    </section>
  )
}

function LessonRequestRow({ req }: { req: LessonRequest }) {
  const respond = useRiffStore((s) => s.respondToLesson)
  const [busy, setBusy] = useState<null | 'accept' | 'decline'>(null)
  const [error, setError] = useState<string | null>(null)
  const student = getMusician(req.studentId)

  async function answer(action: 'accept' | 'decline') {
    if (busy) return
    setBusy(action)
    setError(null)
    try {
      await respond(req.id, action)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not answer — try again')
    } finally {
      setBusy(null)
    }
  }

  return (
    <Card className="p-3">
      <div className="flex items-center gap-3">
        <Avatar
          src={student?.avatarUrl ?? '/mock/bands/lunar-resonance.svg'}
          name={student?.name ?? 'Student'}
          size="sm"
          ring={false}
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-bold text-foreground">
            {student?.name ?? 'A player'} · {instrumentLabel(req.instrument)}
          </div>
          {req.note && <p className="mt-0.5 truncate text-[12px] text-foreground-dim">{req.note}</p>}
        </div>
        {req.status === 'pending' ? (
          <span className="flex shrink-0 gap-1.5">
            <button
              type="button"
              onClick={() => answer('accept')}
              disabled={busy !== null}
              aria-label={`Accept ${student?.name ?? 'this student'}`}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-success text-white transition-transform active:scale-90 disabled:opacity-50"
            >
              <Check size={16} />
            </button>
            <button
              type="button"
              onClick={() => answer('decline')}
              disabled={busy !== null}
              aria-label={`Decline ${student?.name ?? 'this student'}`}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-muted text-foreground-dim transition-transform active:scale-90 disabled:opacity-50"
            >
              <X size={16} />
            </button>
          </span>
        ) : (
          <Badge
            tone={req.status === 'accepted' ? 'success' : 'neutral'}
            className="shrink-0 px-2.5 py-1 text-[11px]"
          >
            {req.status === 'accepted' ? 'Accepted' : 'Declined'}
          </Badge>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-[12px] text-destructive">
          {error}
        </p>
      )}
    </Card>
  )
}

// --- gig offers -------------------------------------------------------------

const GIG_BADGE: Record<GigOffer['status'], { label: string; tone: 'success' | 'neutral' | 'warning' }> = {
  pending: { label: 'Waiting on the band', tone: 'warning' },
  accepted: { label: 'Confirmed', tone: 'success' },
  declined: { label: 'Declined · refunded', tone: 'neutral' },
  cancelled: { label: 'Withdrawn · refunded', tone: 'neutral' },
}

function GigOfferRow({ offer }: { offer: GigOffer }) {
  const cancel = useRiffStore((s) => s.cancelGigOffer)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const band = getBand(offer.bandId)
  const badge = GIG_BADGE[offer.status]

  async function withdraw() {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      await cancel(offer.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not withdraw — try again')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="p-3">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[color:var(--hero-from)] text-primary">
          <CalendarClock size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-bold text-foreground">
            {band?.name ?? 'Band'} at {offer.shopName}
          </div>
          <div className="mt-0.5 text-[12px] text-foreground-dim">
            {formatShortDateTime(offer.startsAt)} · {formatCredits(offer.feeCredits)}
          </div>
        </div>
        <Badge tone={badge.tone} className="shrink-0 px-2.5 py-1 text-[11px]">
          {badge.label}
        </Badge>
      </div>
      {offer.status === 'pending' && (
        <div className="mt-2 border-t border-border-hairline pt-2">
          <button
            type="button"
            onClick={withdraw}
            disabled={busy}
            className="text-[12px] font-medium text-destructive disabled:opacity-50"
          >
            {busy ? 'Withdrawing…' : 'Withdraw offer (fee returns to your wallet)'}
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-2 text-[12px] text-destructive">
          {error}
        </p>
      )}
    </Card>
  )
}
