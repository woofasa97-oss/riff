'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ShieldCheck, Star } from 'lucide-react'
import { AppShell } from '@/components/riff/AppShell'
import { SubScreenHeader } from '@/components/riff/TopBar'
import { VouchCard } from '@/components/riff/VouchCard'
import { Button, buttonClass } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { EmptyState } from '@/components/ui/EmptyState'
import { vouchTagLabel } from '@/lib/labels'
import { vouchesFor } from '@/lib/reputation'
import { useMusicianStats, useReputationContext } from '@/lib/store'
import { getMusician } from '@/mocks'
import type { VouchTag } from '@/types'

export function VouchesView({ musicianId }: { musicianId: string }) {
  const ctx = useReputationContext()
  const stats = useMusicianStats(musicianId)
  const [selected, setSelected] = useState<VouchTag | null>(null)

  /** Vouches that exist as records, newest first. The headline total can be larger — the
   * musician's baseline counts history the fixtures do not keep as rows (docs/DATA-MODEL.md). */
  const records = useMemo(
    () =>
      vouchesFor(musicianId, ctx).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    [musicianId, ctx],
  )

  const voucherCount = useMemo(() => new Set(records.map((v) => v.fromId)).size, [records])

  /** Count per tag across the records, biggest first. Each row doubles as a filter chip. */
  const histogram = useMemo(() => {
    const counts = new Map<VouchTag, number>()
    for (const vouch of records) {
      for (const tag of vouch.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
    return [...counts.entries()]
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
  }, [records])

  const musician = getMusician(musicianId)

  if (!musician || !stats) {
    return (
      <AppShell
        activeTab="discover"
        header={<SubScreenHeader title="Collaboration vouches" backHref="/discover" />}
        mainClassName="flex items-center px-4 py-6"
      >
        <EmptyState
          className="w-full"
          title="Musician not found"
          body="This profile is not on Riff, or the link is out of date."
          action={
            <Link href="/discover" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
              Back to Discover
            </Link>
          }
        />
      </AppShell>
    )
  }

  const firstName = musician.name.split(' ')[0]
  const filtered = selected ? records.filter((v) => v.tags.includes(selected)) : records
  const maxTagCount = histogram[0]?.count ?? 0

  return (
    <AppShell
      activeTab="discover"
      header={
        <SubScreenHeader title="Collaboration vouches" backHref={`/musicians/${musicianId}`} />
      }
      mainClassName="flex flex-col gap-5 py-6"
    >
      {stats.vouchCount === 0 ? (
        <div className="px-4">
          <EmptyState
            icon={<Star size={22} />}
            title="No vouches yet"
            body={`No one has vouched for ${firstName} yet. Vouches are earned in confirmed sessions, one recap at a time.`}
            action={
              <Link
                href={`/musicians/${musicianId}`}
                className={buttonClass({ variant: 'secondary', size: 'sm' })}
              >
                Back to profile
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <section className="px-4">
            <Card className="flex items-center justify-between gap-4 p-5">
              <div className="flex min-w-0 flex-col">
                <span className="font-serif text-[48px] font-bold leading-none tracking-tight text-primary">
                  {stats.vouchCount}
                </span>
                <span className="mt-1 text-[13px] font-medium text-foreground">
                  {voucherCount > 0
                    ? `vouches from ${voucherCount} musician${voucherCount === 1 ? '' : 's'}`
                    : 'vouches'}
                </span>
                {/* The honest subline: the headline includes baseline history that has no
                    record row, so say how many are actually shown below. */}
                {stats.vouchCount !== records.length && (
                  <span className="mt-0.5 text-[11px] text-foreground-dim">
                    {records.length} shown with notes
                  </span>
                )}
              </div>
              {histogram.length > 0 && (
                <div className="flex w-[110px] shrink-0 flex-col gap-2" aria-hidden="true">
                  {histogram.slice(0, 5).map(({ tag, count }, i) => (
                    <div key={tag} className="flex items-center gap-2">
                      <div className="h-[6px] flex-1">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{
                            width: `${Math.max(15, Math.round((count / maxTagCount) * 100))}%`,
                            opacity: 1 - i * 0.1,
                          }}
                        />
                      </div>
                      <span className="w-4 shrink-0 text-right text-[10px] font-bold text-foreground-dim">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </section>

          {histogram.length > 0 && (
            <section>
              <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-1">
                <Chip selected={selected === null} onClick={() => setSelected(null)}>
                  All
                </Chip>
                {histogram.map(({ tag, count }) => (
                  <Chip
                    key={tag}
                    selected={selected === tag}
                    onClick={() => setSelected((cur) => (cur === tag ? null : tag))}
                  >
                    {vouchTagLabel(tag)}
                    <span className="ml-1.5 opacity-70">{count}</span>
                  </Chip>
                ))}
              </div>
            </section>
          )}

          {records.length === 0 ? (
            <p className="px-4 text-center text-[13px] text-foreground-dim">
              These vouches were earned in earlier sessions, before written notes.
            </p>
          ) : (
            <section className="flex flex-col gap-4 px-4">
              {filtered.map((vouch) => (
                <VouchCard key={vouch.id} vouch={vouch} />
              ))}
            </section>
          )}
        </>
      )}

      {/* Product rule 4 — the reason this list can be trusted at all. */}
      <div className="mb-2 mt-1 flex items-center justify-center gap-2 px-4">
        <ShieldCheck size={13} className="shrink-0 text-primary" />
        <span className="text-center text-[11px] font-medium text-foreground-dim">
          Only musicians who were confirmed in a session can vouch.
        </span>
      </div>
    </AppShell>
  )
}
