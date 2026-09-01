'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Building2,
  Eye,
  MapPin,
  Music2,
  Pause,
  Pencil,
  Play,
  Plus,
  Store,
  Trash2,
  type LucideIcon,
} from 'lucide-react'
import { AppShell, StickyActionBar } from '@/components/riff/AppShell'
import { SubScreenHeader } from '@/components/riff/TopBar'
import { Badge } from '@/components/ui/Badge'
import { buttonClass } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/cn'
import { shortNeighborhood } from '@/lib/labels'
import { useMyListings, useRiffStore } from '@/lib/store'
import type { ListingKind, ListingStatus, MapListing } from '@/types'

/**
 * Manage the studios / street acts / shops the viewer has listed on the map. Publishing status,
 * pausing and deleting all route through the server-validated store actions — the client only
 * mirrors the answer. Listings the map surfaces are derived elsewhere; this screen is the owner's
 * back office for the ones they created.
 */
const KIND_META: Record<ListingKind, { label: string; icon: LucideIcon; viewBase: string }> = {
  studio: { label: 'Studio', icon: Building2, viewBase: '/studios' },
  street: { label: 'Street act', icon: Music2, viewBase: '/street' },
  shop: { label: 'Music shop', icon: Store, viewBase: '/shops' },
}

const STATUS_BADGE: Record<
  ListingStatus,
  { label: string; tone: 'success' | 'neutral' | 'warning' }
> = {
  published: { label: 'Live', tone: 'success' },
  paused: { label: 'Paused', tone: 'neutral' },
  in_review: { label: 'In review', tone: 'warning' },
  draft: { label: 'Draft', tone: 'neutral' },
}

function listingObject(listing: MapListing) {
  if (listing.kind === 'studio') return listing.studio
  if (listing.kind === 'street') return listing.street
  return listing.shop
}

export function MyListingsView() {
  const listings = useMyListings()

  return (
    <AppShell
      activeTab="me"
      header={<SubScreenHeader title="Your listings" backHref="/me" />}
      mainClassName="px-4 py-6"
      footer={
        listings.length > 0 ? (
          <StickyActionBar>
            <Link href="/me/listings/new" className={buttonClass({ fullWidth: true })}>
              <Plus size={18} />
              List something new
            </Link>
          </StickyActionBar>
        ) : undefined
      }
    >
      {listings.length === 0 ? (
        <EmptyState
          className="w-full"
          icon={<MapPin size={22} />}
          title="Nothing listed yet"
          body="List a rehearsal studio, a street act or a music shop and it shows up on the map for players nearby."
          action={
            <Link href="/me/listings/new" className={buttonClass({ size: 'sm' })}>
              <Plus size={16} />
              List on the map
            </Link>
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {listings.map((listing) => (
            <li key={listing.id}>
              <ListingRow listing={listing} />
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  )
}

const actionClass =
  'inline-flex items-center gap-1.5 rounded-[10px] px-3 py-2 text-[13px] font-medium transition-transform active:scale-95 disabled:opacity-50'

function ListingRow({ listing }: { listing: MapListing }) {
  const setStatus = useRiffStore((s) => s.setListingStatus)
  const del = useRiffStore((s) => s.deleteListing)

  const [busy, setBusy] = useState<null | 'status' | 'delete'>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const meta = KIND_META[listing.kind]
  const Icon = meta.icon
  const obj = listingObject(listing)
  const name = obj?.name ?? 'Untitled listing'
  const neighborhood = obj?.neighborhood ? shortNeighborhood(obj.neighborhood) : null
  const badge = STATUS_BADGE[listing.status]
  const published = listing.status === 'published'
  const viewHref = `${meta.viewBase}/${listing.id}`
  const editHref = `/me/listings/new/${listing.kind}?id=${listing.id}`

  async function toggleStatus() {
    if (busy) return
    setBusy('status')
    setError(null)
    try {
      await setStatus(listing.id, published ? 'paused' : 'published')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update — try again')
    } finally {
      setBusy(null)
    }
  }

  async function confirmDelete() {
    if (busy) return
    setBusy('delete')
    setError(null)
    try {
      // On success the snapshot drops this listing and the row unmounts — nothing to reset.
      await del(listing.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove — try again')
      setBusy(null)
      setConfirmingDelete(false)
    }
  }

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[color:var(--hero-from)] text-primary">
          <Icon size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 text-[11px] font-bold uppercase tracking-[0.06em] text-foreground-dim">
            {meta.label}
          </div>
          <div className="truncate font-serif text-[16px] font-bold text-foreground">{name}</div>
          {neighborhood && (
            <div className="mt-0.5 text-[12px] text-foreground-dim">{neighborhood}</div>
          )}
        </div>
        <Badge tone={badge.tone} className="shrink-0 self-start px-2.5 py-1 text-[11px]">
          {badge.label}
        </Badge>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 border-t border-border-hairline pt-3">
        <Link href={viewHref} className={cn(actionClass, 'bg-surface-muted text-foreground')}>
          <Eye size={15} />
          View
        </Link>
        <Link href={editHref} className={cn(actionClass, 'bg-surface-muted text-foreground')}>
          <Pencil size={15} />
          Edit
        </Link>
        <button
          type="button"
          onClick={toggleStatus}
          disabled={busy !== null}
          aria-label={published ? 'Pause this listing' : 'Publish this listing'}
          className={cn(actionClass, 'bg-surface-muted text-foreground')}
        >
          {published ? <Pause size={15} /> : <Play size={15} />}
          {busy === 'status' ? 'Saving…' : published ? 'Pause' : 'Publish'}
        </button>

        {confirmingDelete ? (
          <span className="inline-flex items-center gap-2">
            <button
              type="button"
              onClick={confirmDelete}
              disabled={busy !== null}
              className={cn(actionClass, 'bg-destructive/10 text-destructive')}
            >
              <Trash2 size={15} />
              {busy === 'delete' ? 'Removing…' : 'Confirm'}
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              disabled={busy !== null}
              className={cn(actionClass, 'text-foreground-dim')}
            >
              Cancel
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            disabled={busy !== null}
            aria-label="Delete this listing"
            className={cn(actionClass, 'text-destructive')}
          >
            <Trash2 size={15} />
            Delete
          </button>
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
