'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Flag } from 'lucide-react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { AccountRequiredError, useRiffStore } from '@/lib/store'

const REASONS = [
  'No-show',
  'Made me uncomfortable',
  'Fake profile',
  'Inappropriate messages',
  'Something else',
] as const

const DETAIL_MAX = 500

/**
 * A calm reporting dialog for people and jams (safety-report ticket). Reports go to the server
 * for out-of-band review via `reportContent` — nothing about the target changes in the UI.
 * Guests are auto-prompted to sign up by the store's dispatch, so the thrown gate is swallowed
 * quietly here rather than surfaced as an error.
 */
export function ReportSheet({
  open,
  onClose,
  targetMusicianId,
  jamId,
  subjectLabel,
}: {
  open: boolean
  onClose: () => void
  targetMusicianId?: string
  jamId?: string
  subjectLabel: string
}) {
  const report = useRiffStore((s) => s.reportContent)
  const [reason, setReason] = useState<string | null>(null)
  const [detail, setDetail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  // A fresh open starts clean — no leftover reason, draft, or confirmation from last time.
  useEffect(() => {
    if (open) {
      setReason(null)
      setDetail('')
      setBusy(false)
      setError(null)
      setDone(false)
    }
  }, [open])

  async function submit() {
    if (!reason || busy) return
    setBusy(true)
    setError(null)
    try {
      await report({
        targetMusicianId,
        jamId,
        reason,
        detail: detail.trim() || undefined,
      })
      setDone(true)
    } catch (err) {
      // A guest triggers the sign-up prompt instead — close quietly, that sheet is already up.
      if (err instanceof AccountRequiredError) {
        onClose()
        return
      }
      setError(err instanceof Error ? err.message : 'Something went wrong — try again')
    } finally {
      setBusy(false)
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={`Report ${subjectLabel}`}>
      {done ? (
        <div className="pb-1 pt-1 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success-soft text-success">
            <CheckCircle2 size={24} />
          </div>
          <h2 className="mb-1 font-serif text-[18px] font-bold text-foreground">
            Thanks — our team will take a look
          </h2>
          <p className="mb-5 text-[13px] text-foreground-dim">
            Reports are confidential. We review every one and follow up when it&apos;s needed.
          </p>
          <Button fullWidth onClick={onClose}>
            Done
          </Button>
        </div>
      ) : (
        <div className="pt-1">
          <div className="mb-1 flex items-center gap-2">
            <Flag size={16} className="text-primary" />
            <h2 className="font-serif text-[18px] font-bold text-foreground">
              Report {subjectLabel}
            </h2>
          </div>
          <p className="mb-4 text-[13px] text-foreground-dim">
            What&apos;s going on? This is confidential and won&apos;t be shared with them.
          </p>

          <div className="mb-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Reason">
            {REASONS.map((r) => {
              const selected = reason === r
              return (
                <button
                  key={r}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setReason(r)}
                  className={cn(
                    'rounded-full border px-3.5 py-2 text-[13px] font-medium transition-transform active:scale-95',
                    selected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border-subtle bg-card text-foreground',
                  )}
                >
                  {r}
                </button>
              )
            })}
          </div>

          <label htmlFor="report-detail" className="mb-1.5 block text-[13px] font-medium text-foreground">
            Add detail <span className="font-normal text-foreground-dim">(optional)</span>
          </label>
          <textarea
            id="report-detail"
            value={detail}
            onChange={(e) => setDetail(e.target.value.slice(0, DETAIL_MAX))}
            maxLength={DETAIL_MAX}
            rows={3}
            placeholder="What happened? Anything that helps us understand."
            className="w-full resize-none rounded-[12px] border border-border-subtle bg-surface-muted px-3 py-2.5 text-[14px] text-foreground placeholder:text-foreground-dim focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="mb-4 mt-1 text-right text-[11px] text-foreground-dim">
            {detail.length}/{DETAIL_MAX}
          </div>

          {error && (
            <p role="alert" className="mb-3 text-[13px] text-destructive">
              {error}
            </p>
          )}

          <Button fullWidth disabled={!reason || busy} onClick={submit}>
            {busy ? 'Sending…' : 'Submit report'}
          </Button>
        </div>
      )}
    </BottomSheet>
  )
}
