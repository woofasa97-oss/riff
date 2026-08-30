'use client'

import Link from 'next/link'
import { ChevronRight, Gift, Swords, Trophy, Undo2, Wallet as WalletIcon } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { AppShell } from '@/components/riff/AppShell'
import { SubScreenHeader } from '@/components/riff/TopBar'
import { buttonClass } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/datetime'
import { formatCredits } from '@/lib/labels'
import { useIsGuest, useRiffStore } from '@/lib/store'
import type { WalletTransaction } from '@/types'

const KIND_ICON: Record<WalletTransaction['kind'], LucideIcon> = {
  signup_grant: Gift,
  entry_fee: Swords,
  prize_payout: Trophy,
  refund: Undo2,
}

export function WalletView() {
  const wallet = useRiffStore((s) => s.wallet)
  const isGuest = useIsGuest()

  return (
    <AppShell
      activeTab="me"
      header={<SubScreenHeader title="Riff Credits" backHref="/me" />}
      mainClassName="pb-2"
    >
      {/* A guest has no wallet — invite them to sign up rather than fabricate a balance. */}
      {isGuest || wallet === null ? (
        <div className="flex flex-1 items-center px-6 py-8">
          <Card className="w-full p-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--hero-from)] text-primary">
              <WalletIcon size={24} />
            </div>
            <h1 className="font-serif text-[20px] font-bold text-foreground">
              Riff Credits are yours once you sign up
            </h1>
            <p className="mx-auto mt-2 max-w-[260px] text-[13px] text-foreground-dim">
              New accounts get a starting grant — play money to enter a season with.
            </p>
            <Link href="/signup" className={cn(buttonClass({ fullWidth: true }), 'mt-5')}>
              Create an account
            </Link>
          </Card>
        </div>
      ) : (
        <div className="space-y-6 px-4 pb-10 pt-4">
          {/* HERO — the balance is the headline; the fine print keeps it honest. */}
          <div className="relative overflow-hidden rounded-[16px] bg-gradient-to-br from-primary to-accent p-5 text-white shadow-sm">
            <WalletIcon
              size={120}
              strokeWidth={1}
              className="pointer-events-none absolute -right-5 -top-6 text-white/10"
            />
            <div className="relative">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/75">
                Balance
              </p>
              <p className="mt-1 font-serif text-[40px] font-bold leading-none">
                {formatCredits(wallet.balanceCredits)}
              </p>
              <p className="mt-2 text-[12px] text-white/70">
                Play money while Riff is in preview — no real cash yet.
              </p>
            </div>
          </div>

          <Link
            href="/competition"
            className="flex items-center rounded-[16px] border border-border-subtle bg-card p-4 shadow-sm transition-transform active:scale-[0.99]"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--hero-from)] text-primary">
              <Trophy size={18} />
            </span>
            <span className="ml-3 flex-1 font-serif text-[14px] font-bold text-foreground">
              Spend them on a season entry
            </span>
            <ChevronRight size={18} className="text-foreground-dim" />
          </Link>

          {/* HISTORY */}
          <section>
            <SectionHeader>History</SectionHeader>
            {wallet.transactions.length === 0 ? (
              <EmptyState
                icon={<WalletIcon size={20} />}
                title="No transactions yet"
                body="Your grants, entries and winnings will show up here."
              />
            ) : (
              <div className="flex flex-col gap-2">
                {wallet.transactions.map((tx) => (
                  <TransactionRow key={tx.id} tx={tx} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </AppShell>
  )
}

function TransactionRow({ tx }: { tx: WalletTransaction }) {
  const Icon = KIND_ICON[tx.kind]
  const positive = tx.amountCredits > 0
  return (
    <div className="flex items-center rounded-[16px] border border-border-subtle bg-card p-3 shadow-sm">
      <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-[color:var(--hero-from)] text-primary">
        <Icon size={18} />
      </span>
      <div className="ml-3 min-w-0 flex-1">
        <span className="block truncate font-serif text-[14px] font-bold text-foreground">
          {tx.memo}
        </span>
        <span className="mt-0.5 block text-[12px] text-foreground-dim">
          {formatDate(tx.createdAt)}
        </span>
      </div>
      <span
        className={cn(
          'ml-2 shrink-0 font-serif text-[15px] font-bold',
          positive ? 'text-success' : 'text-foreground',
        )}
      >
        {positive ? `+${formatCredits(tx.amountCredits)}` : formatCredits(tx.amountCredits)}
      </span>
    </div>
  )
}
