'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Clock, Heart, MapPin, Music2 } from 'lucide-react'
import { AppShell, StickyActionBar } from '@/components/riff/AppShell'
import { SubScreenHeader } from '@/components/riff/TopBar'
import { Avatar } from '@/components/ui/Avatar'
import { Button, buttonClass } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/cn'
import { formatTime, relativeDayLabel } from '@/lib/datetime'
import { genreLabel, instrumentLabel } from '@/lib/labels'
import { useRiffStore } from '@/lib/store'
import { getMusician, getStreetPerformer } from '@/mocks'

/**
 * A light profile for a busker reached from the map. Everything here is public — no home is
 * exposed, only the spot they are playing. The one gated action (tipping) is a preview stub.
 */
export function StreetPerformerView({ performerId }: { performerId: string }) {
  // Anchor all relative copy to the fixed scene clock, never Date.now().
  const now = useRiffStore((s) => s.now)
  const requireAccount = useRiffStore((s) => s.requireAccount)
  const performer = getStreetPerformer(performerId)
  const [tipped, setTipped] = useState(false)

  if (!performer) {
    return (
      <AppShell
        activeTab="map"
        header={<SubScreenHeader title="Street performer" backHref="/map" />}
        mainClassName="flex items-center px-4 py-6"
      >
        <EmptyState
          className="w-full"
          title="That performer has moved on"
          body="Buskers come and go — this spot may be quiet now."
          action={
            <Link href="/map" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
              Back to the map
            </Link>
          }
        />
      </AppShell>
    )
  }

  const firstName = performer.name.split(' ')[0]
  // Only link out if they really are a Riff musician — confirm the id resolves.
  const riffMusician = performer.musicianId ? getMusician(performer.musicianId) : undefined

  const handleTip = () => {
    if (!requireAccount('tip a performer')) return // guest → global signup prompt
    setTipped(true)
  }

  return (
    <AppShell
      activeTab="map"
      header={<SubScreenHeader title="Street performer" backHref="/map" />}
      mainClassName="pb-2"
      footer={
        <StickyActionBar note="Preview only — Riff doesn't take a real payment yet.">
          <Button
            className="flex-1"
            variant={tipped ? 'secondary' : 'primary'}
            disabled={tipped}
            onClick={handleTip}
          >
            {tipped ? (
              <span className="flex items-center gap-1.5">
                <Heart size={14} fill="currentColor" /> Thanks sent
              </span>
            ) : (
              `Tip ${firstName}`
            )}
          </Button>
        </StickyActionBar>
      }
    >
      {/* IDENTITY — a warm, centred block; no big photo, buskers are about the sound. */}
      <div className="flex flex-col items-center px-4 pb-2 pt-8 text-center">
        <Avatar
          src={performer.avatarUrl}
          name={performer.name}
          size="xl"
          ring={false}
          className="border-2 border-map-street/40"
        />
        <h1 className="mt-4 font-serif text-[24px] font-bold leading-tight text-foreground">
          {performer.name}
        </h1>
        {performer.handle && (
          <p className="mt-0.5 text-[13px] font-medium text-foreground-dim">{performer.handle}</p>
        )}

        <div className="mt-3">
          {performer.live ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-map-street/30 bg-map-street/10 px-3 py-1 text-[12px] font-bold text-map-street">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-map-street" />
              Playing now
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-card px-3 py-1 text-[12px] font-medium text-foreground-dim">
              <Clock size={12} /> Later today
            </span>
          )}
        </div>
      </div>

      {/* META — what and where. */}
      <div className="mb-5 flex flex-col items-center gap-1.5 px-4 text-center">
        <p className="flex items-center gap-1.5 text-[13px] font-medium text-foreground">
          <Music2 size={13} className="text-map-street" />
          {performer.instruments.map(instrumentLabel).join(' · ')}
        </p>
        <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-foreground-dim">
          {performer.genres.map(genreLabel).join(' · ')}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-[13px] font-medium text-foreground-dim">
          <MapPin size={13} className="text-map-street" />
          {performer.spotLabel}
        </p>
      </div>

      {/* TIMING */}
      <div className="mb-5 px-4">
        <Card className="flex items-center justify-between px-4 py-3">
          <span className="flex items-center gap-2 text-[14px] font-bold text-foreground">
            <Clock size={15} className="text-map-street" />
            Playing until {formatTime(performer.until)}
          </span>
          <span className="text-[12px] text-foreground-dim">
            {relativeDayLabel(performer.startedAt, now)} · from {formatTime(performer.startedAt)}
          </span>
        </Card>
      </div>

      {/* BLURB */}
      <div className="mb-6 px-4">
        <Card className="px-4 py-4">
          <p className="text-[14px] leading-relaxed text-foreground">{performer.blurb}</p>
        </Card>
      </div>

      {/* RIFF LINK — a genuine cross-link only when they are on Riff. */}
      <div className="mb-6 px-4">
        {riffMusician ? (
          <Link
            href={`/musicians/${riffMusician.id}`}
            className={buttonClass({ variant: 'outline', fullWidth: true })}
          >
            View Riff profile
          </Link>
        ) : (
          <p className="text-center text-[12px] text-foreground-dim">Not on Riff yet.</p>
        )}
      </div>

      {/* TIP CONFIRMATION — calm, honest, no real charge. */}
      {tipped && (
        <div className="mb-6 px-4">
          <Card
            className={cn(
              'flex items-center gap-3 border-map-street/30 bg-map-street/5 px-4 py-4',
            )}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-map-street/10 text-map-street">
              <Heart size={16} fill="currentColor" />
            </span>
            <div className="min-w-0">
              <p className="text-[14px] font-bold text-foreground">
                Thanks for supporting live music
              </p>
              <p className="mt-0.5 text-[12px] text-foreground-dim">
                This is a preview — no money changes hands yet.
              </p>
            </div>
          </Card>
        </div>
      )}
    </AppShell>
  )
}
