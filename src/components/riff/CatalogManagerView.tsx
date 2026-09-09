'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Disc3,
  Guitar,
  Package,
  Pencil,
  Piano,
  Plus,
  Trash2,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { AppShell, StickyActionBar } from '@/components/riff/AppShell'
import { SubScreenHeader } from '@/components/riff/TopBar'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Badge } from '@/components/ui/Badge'
import { Button, buttonClass } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Toggle } from '@/components/ui/Toggle'
import { cn } from '@/lib/cn'
import { useListingById, useRiffStore, useShopCatalog } from '@/lib/store'
import type { ShopItem, ShopItemCategory } from '@/types'

export const CATEGORY_META: Record<ShopItemCategory, { label: string; icon: LucideIcon }> = {
  guitars: { label: 'Guitars & amps', icon: Guitar },
  'keys-synths': { label: 'Keys & synths', icon: Piano },
  'drums-percussion': { label: 'Drums & percussion', icon: Disc3 },
  records: { label: 'Records', icon: Disc3 },
  accessories: { label: 'Accessories', icon: Package },
  services: { label: 'Services', icon: Wrench },
}

const CONDITIONS: ShopItem['condition'][] = ['new', 'used', 'vintage']

/**
 * The shop owner's catalog admin: add, edit, hide and remove what the shop sells. The public
 * shop page renders the same items — this screen IS the difference between being a customer
 * and being the owner.
 */
export function CatalogManagerView({ shopId }: { shopId: string }) {
  const listing = useListingById(shopId)
  const me = useRiffStore((s) => s.viewerId)
  const items = useShopCatalog(shopId)
  const [editing, setEditing] = useState<ShopItem | null>(null)
  const [adding, setAdding] = useState(false)

  const isOwner = listing?.kind === 'shop' && listing.ownerId === me

  if (!isOwner) {
    return (
      <AppShell
        activeTab="me"
        header={<SubScreenHeader title="Catalog" backHref="/me/business" />}
        mainClassName="flex items-center px-4 py-6"
      >
        <EmptyState
          className="w-full"
          title="Not your shop"
          body="Only a shop's owner can manage its catalog."
          action={
            <Link href="/me/business" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
              Back to your dashboard
            </Link>
          }
        />
      </AppShell>
    )
  }

  const shopName = listing.shop?.name ?? 'Your shop'

  return (
    <AppShell
      activeTab="me"
      header={<SubScreenHeader title={`${shopName} — catalog`} backHref="/me/business" />}
      mainClassName="px-4 py-6"
      footer={
        <StickyActionBar>
          <Button className="flex-1" onClick={() => setAdding(true)}>
            <Plus size={18} />
            Add an item
          </Button>
        </StickyActionBar>
      }
    >
      <p className="mb-5 px-1 text-[13px] text-foreground-dim">
        Everything here shows on your public shop page. Mark an item out of stock instead of
        deleting it if it&apos;s coming back.
      </p>

      {items.length === 0 ? (
        <EmptyState
          className="w-full"
          icon={<Package size={22} />}
          title="Nothing in the catalog yet"
          body="Add what you sell — instruments, records, services — and visitors see it on your shop page."
        />
      ) : (
        <ul className="flex flex-col gap-2 lg:grid lg:grid-cols-2">
          {items.map((item) => (
            <li key={item.id}>
              <ItemRow item={item} onEdit={() => setEditing(item)} />
            </li>
          ))}
        </ul>
      )}

      <ItemFormSheet
        open={adding || editing !== null}
        onClose={() => {
          setAdding(false)
          setEditing(null)
        }}
        shopId={shopId}
        item={editing}
      />
    </AppShell>
  )
}

function ItemRow({ item, onEdit }: { item: ShopItem; onEdit: () => void }) {
  const del = useRiffStore((s) => s.deleteShopItem)
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const Icon = CATEGORY_META[item.category].icon

  async function remove() {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      await del(item.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove — try again')
      setBusy(false)
      setConfirming(false)
    }
  }

  return (
    <Card className={cn('p-3', !item.inStock && 'opacity-70')}>
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[color:var(--hero-from)] text-primary">
          <Icon size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-bold text-foreground">{item.name}</div>
          <div className="mt-0.5 text-[12px] text-foreground-dim">
            ${item.priceUsd.toLocaleString()} · {item.condition}
            {!item.inStock && ' · out of stock'}
          </div>
        </div>
        <span className="flex shrink-0 gap-1.5">
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${item.name}`}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-muted text-foreground transition-transform active:scale-90"
          >
            <Pencil size={15} />
          </button>
          {confirming ? (
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              aria-label={`Confirm removing ${item.name}`}
              className="flex h-9 items-center justify-center rounded-full bg-destructive/10 px-3 text-[12px] font-semibold text-destructive transition-transform active:scale-90 disabled:opacity-50"
            >
              {busy ? '…' : 'Sure?'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              aria-label={`Remove ${item.name}`}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-muted text-destructive transition-transform active:scale-90"
            >
              <Trash2 size={15} />
            </button>
          )}
        </span>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-[12px] text-destructive">
          {error}
        </p>
      )}
    </Card>
  )
}

/** One sheet for both add and edit — `item` present means editing. */
function ItemFormSheet({
  open,
  onClose,
  shopId,
  item,
}: {
  open: boolean
  onClose: () => void
  shopId: string
  item: ShopItem | null
}) {
  const add = useRiffStore((s) => s.addShopItem)
  const update = useRiffStore((s) => s.updateShopItem)

  // Key the inner form by target so switching add→edit resets cleanly.
  return (
    <BottomSheet open={open} onClose={onClose} title={item ? `Edit ${item.name}` : 'Add an item'}>
      <ItemForm key={item?.id ?? 'new'} item={item} onDone={onClose} save={(data) => (item ? update(item.id, data) : add(shopId, data))} />
    </BottomSheet>
  )
}

function ItemForm({
  item,
  save,
  onDone,
}: {
  item: ShopItem | null
  save: (data: Record<string, unknown>) => Promise<unknown>
  onDone: () => void
}) {
  const [name, setName] = useState(item?.name ?? '')
  const [category, setCategory] = useState<ShopItemCategory>(item?.category ?? 'guitars')
  const [price, setPrice] = useState(item ? String(item.priceUsd) : '')
  const [condition, setCondition] = useState<ShopItem['condition']>(item?.condition ?? 'used')
  const [blurb, setBlurb] = useState(item?.blurb ?? '')
  const [inStock, setInStock] = useState(item?.inStock ?? true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const priceNum = Math.round(Number(price))
  const canSubmit =
    name.trim().length >= 2 && price.trim() !== '' && Number.isFinite(priceNum) && priceNum >= 0

  async function submit() {
    if (!canSubmit || busy) return
    setBusy(true)
    setError(null)
    try {
      await save({
        name: name.trim(),
        category,
        priceUsd: priceNum,
        condition,
        blurb: blurb.trim(),
        inStock,
      })
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save — try again')
    } finally {
      setBusy(false)
    }
  }

  const field =
    'w-full rounded-[12px] border border-border-subtle bg-background px-4 py-3 text-[14px] text-foreground placeholder:text-foreground-dim focus:outline-none focus:ring-1 focus:ring-ring'

  return (
    <div className="max-h-[70vh] overflow-y-auto px-1 pb-1 pt-2">
      <h2 className="mb-4 text-center font-serif text-[18px] font-bold text-foreground">
        {item ? 'Edit item' : 'Add an item'}
      </h2>

      {error && (
        <p role="alert" className="mb-3 rounded-[12px] border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
          {error}
        </p>
      )}

      <label className="mb-3 block">
        <span className="mb-1 block px-1 text-[12px] font-medium text-foreground-dim">Name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 60))}
          placeholder="e.g. '72 Telecaster Deluxe"
          aria-label="Item name"
          className={field}
        />
      </label>

      <div className="mb-3">
        <span className="mb-1 block px-1 text-[12px] font-medium text-foreground-dim">Category</span>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(CATEGORY_META) as ShopItemCategory[]).map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-[12px] font-medium transition-transform active:scale-95',
                category === c
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border-subtle bg-card text-foreground',
              )}
            >
              {CATEGORY_META[c].label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3 flex gap-3">
        <label className="flex-1">
          <span className="mb-1 block px-1 text-[12px] font-medium text-foreground-dim">
            Price (USD)
          </span>
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, '').slice(0, 5))}
            inputMode="numeric"
            placeholder="0"
            aria-label="Price in dollars"
            className={field}
          />
        </label>
        <div className="flex-1">
          <span className="mb-1 block px-1 text-[12px] font-medium text-foreground-dim">
            Condition
          </span>
          <div className="flex gap-1.5">
            {CONDITIONS.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={condition === c}
                onClick={() => setCondition(c)}
                className={cn(
                  'flex-1 rounded-[10px] border px-1 py-2.5 text-[12px] font-medium capitalize transition-transform active:scale-95',
                  condition === c
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border-subtle bg-card text-foreground',
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      <label className="mb-3 block">
        <span className="mb-1 block px-1 text-[12px] font-medium text-foreground-dim">
          One-liner (optional)
        </span>
        <input
          value={blurb}
          onChange={(e) => setBlurb(e.target.value.slice(0, 160))}
          placeholder="What makes it worth a visit"
          aria-label="Item description"
          className={field}
        />
      </label>

      <div className="mb-4 flex items-center justify-between rounded-[12px] border border-border-subtle bg-card px-4 py-3">
        <span className="text-[14px] font-medium text-foreground">In stock</span>
        <Toggle checked={inStock} onChange={setInStock} label="In stock" />
      </div>

      <Button fullWidth disabled={!canSubmit || busy} onClick={submit}>
        {busy ? 'Saving…' : item ? 'Save changes' : 'Add to catalog'}
      </Button>
      {item && (
        <Badge tone="neutral" className="mt-3 block text-center text-[11px]">
          Changes go live on your shop page immediately
        </Badge>
      )}
    </div>
  )
}
