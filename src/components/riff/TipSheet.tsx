'use client'

import { useState } from 'react'
import Link from 'next/link'
import { HandCoins, Heart, Wallet as WalletIcon } from 'lucide-react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button, buttonClass } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { formatCredits } from '@/lib/labels'
import { AccountRequiredError, useRiffStore } from '@/lib/store'

const PRESETS = [5, 10, 25, 50]

/**
 * Tip Riff Credits to a street act or a live stream. Real credits move — the sheet shows the
 * viewer's balance, refuses politely when it can't cover the tip, and confirms with the exact
 * amount that left the wallet. One component for both contexts so tipping feels the same
 * everywhere.
 */
export function TipSheet({
  open,
  onClose,
  context,
  targetId,
  recipientName,
}: {
  open: boolean
  onClose: () => void
  context: 'street' | 'live'
  targetId: string
  recipientName: string
}) {
  const wallet = useRiffStore((s) => s.wallet)
  const sendTip = useRiffStore((s) => s.sendTip)
  const [amount, setAmount] = useState(10)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState<number | null>(null)

  const balance = wallet?.balanceCredits ?? 0
  const short = balance < amount

  async function submit() {
    if (busy || short) return
    setBusy(true)
    setError(null)
    try {
      const res = await sendTip(context, targetId, amount)
      setSent(res.amount)
    } catch (err) {
      // A guest already got the global sign-up prompt — close quietly under it.
      if (err instanceof AccountRequiredError) {
        onClose()
        return
      }
      setError(err instanceof Error ? err.message : 'Could not send the tip — try again')
    } finally {
      setBusy(false)
    }
  }

  function close() {
    setSent(null)
    setError(null)
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={close} title={`Tip ${recipientName}`}>
      {sent !== null ? (
        <div className="px-2 pb-2 pt-4 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--hero-from)] text-primary">
            <Heart size={24} fill="currentColor" />
          </div>
          <h2 className="font-serif text-[20px] font-bold text-foreground">
            {formatCredits(sent)} sent to {recipientName}
          </h2>
          <p className="mx-auto mt-2 max-w-[260px] text-[13px] text-foreground-dim">
            Straight from your wallet to theirs. It shows in both histories.
          </p>
          <Button fullWidth className="mt-5" onClick={close}>
            Done
          </Button>
        </div>
      ) : (
        <div className="px-2 pb-2 pt-4">
          <h2 className="text-center font-serif text-[20px] font-bold text-foreground">
            Tip {recipientName}
          </h2>
          <p className="mt-1 text-center text-[13px] text-foreground-dim">
            Riff Credits — play money while Riff is in preview, but it really moves.
          </p>

          <div className="mt-5 flex justify-center gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={amount === p}
                onClick={() => setAmount(p)}
                className={cn(
                  'min-w-[64px] rounded-[12px] border px-3 py-3 font-serif text-[16px] font-bold transition-transform active:scale-95',
                  amount === p
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border-subtle bg-card text-foreground',
                )}
              >
                {p} CR
              </button>
            ))}
          </div>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-[12px] text-foreground-dim">
            <WalletIcon size={13} />
            Your balance: {formatCredits(balance)}
          </p>

          {short && (
            <p className="mt-2 text-center text-[12px] text-destructive">
              Not enough credits for that tip.{' '}
              <Link href="/wallet" className="font-semibold underline underline-offset-2">
                See your wallet
              </Link>
            </p>
          )}
          {error && (
            <p role="alert" className="mt-2 text-center text-[12px] text-destructive">
              {error}
            </p>
          )}

          <Button fullWidth className="mt-5" disabled={busy || short} onClick={submit}>
            <HandCoins size={16} />
            {busy ? 'Sending…' : `Send ${amount} CR`}
          </Button>
        </div>
      )}
    </BottomSheet>
  )
}
