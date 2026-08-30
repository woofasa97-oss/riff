'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Lightbulb, Mic, RotateCcw } from 'lucide-react'
import { AppShell, StickyActionBar } from '@/components/riff/AppShell'
import { AudioClipPlayer } from '@/components/riff/AudioClipPlayer'
import { WaveformPlayer } from '@/components/riff/WaveformPlayer'
import { SubScreenHeader } from '@/components/riff/TopBar'
import { Button, buttonClass } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/cn'
import { formatClock } from '@/lib/labels'
import { useCurrentUser, useRiffStore } from '@/lib/store'
import { peaksFor } from '@/lib/waveform'
import type { AudioClip } from '@/types'

const MAX_SEC = 24
const CLIP_SEED = 'clip-edit'
/** Static bars behind the live take. Deterministic seed, so every render agrees. */
const LIVE_PEAKS = peaksFor(CLIP_SEED, 28)
const RING_RADIUS = 41
const RING_CIRC = 2 * Math.PI * RING_RADIUS

type Phase = 'idle' | 'recording' | 'recorded'
type Take = { durationSec: number; peaks: number[] }

/**
 * Add or replace the 24-second clip on your own player card (study finding: every seeded player
 * has one and it is the most trust-building thing on a profile, yet there was no way to record
 * your own). Reuses the onboarding recorder exactly — capture is real where the browser grants a
 * mic, but real audio is out of scope for v1 (docs/SPEC.md §6), so all we keep is
 * { durationSec, waveform } and playback is the same simulated WaveformPlayer as everywhere else.
 */
export function ClipEditView() {
  const me = useCurrentUser()
  const applyOnboarding = useRiffStore((s) => s.applyOnboarding)
  const router = useRouter()

  // With a clip already on the card we open on playback; a fresh card opens straight into
  // the recorder. `me` may be null for guests — the early return below handles that.
  const [recorderOpen, setRecorderOpen] = useState(() => !me?.clip)
  const [phase, setPhase] = useState<Phase>('idle')
  const [take, setTake] = useState<Take | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startedAtRef = useRef(0)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  /** getUserMedia in flight — the permission dialog must not arm two recorders. */
  const armingRef = useRef(false)
  const mountedRef = useRef(true)

  function releaseCapture() {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    }
    recorderRef.current = null
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      releaseCapture()
    }
  }, [])

  async function startRecording() {
    if (phase === 'recording' || armingRef.current || busy) return
    armingRef.current = true
    try {
      // Real capture when granted; a denial or missing device just means the timer alone
      // simulates the take. Either way nothing recorded here is ever decoded.
      if (typeof MediaRecorder !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        if (!mountedRef.current) {
          stream.getTracks().forEach((t) => t.stop())
          armingRef.current = false
          return
        }
        streamRef.current = stream
        const recorder = new MediaRecorder(stream)
        recorder.start()
        recorderRef.current = recorder
      }
    } catch {
      // Fall through to the simulated timer.
    }
    armingRef.current = false
    setTake(null)
    setElapsed(0)
    startedAtRef.current = Date.now()
    setPhase('recording')
  }

  function stopRecording(seconds: number) {
    releaseCapture()
    const durationSec = Math.min(MAX_SEC, Math.round(seconds))
    // A tap-and-regret take under a second is discarded rather than kept as a 0s clip —
    // which also keeps durationSec strictly positive everywhere it divides.
    if (durationSec < 1) {
      setElapsed(0)
      setPhase('idle')
      return
    }
    setTake({ durationSec, peaks: peaksFor(CLIP_SEED) })
    setPhase('recorded')
  }

  useEffect(() => {
    if (phase !== 'recording') return
    const id = window.setInterval(() => {
      const next = (Date.now() - startedAtRef.current) / 1000
      if (next >= MAX_SEC) {
        stopRecording(MAX_SEC) // auto-stop: 24 seconds is the whole point
      } else {
        setElapsed(next)
      }
    }, 100)
    return () => window.clearInterval(id)
    // stopRecording is stable in everything but identity — refs and setters only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  function reRecord() {
    if (busy) return
    setTake(null)
    setElapsed(0)
    setPhase('idle')
  }

  /** Return to the existing clip without saving a new take — the recorder's exit. */
  function keepCurrent() {
    if (busy) return
    releaseCapture()
    setTake(null)
    setElapsed(0)
    setPhase('idle')
    setRecorderOpen(false)
  }

  async function save() {
    if (!take || busy) return
    setBusy(true)
    setError(null)
    releaseCapture()
    // The server rebuilds id/url/recordedAt and keeps only durationSec + waveform (see
    // applyOnboarding); this mirrors exactly what OnboardingClipView sends.
    const clip: AudioClip = {
      id: '',
      url: '',
      durationSec: take.durationSec,
      waveform: take.peaks,
      recordedAt: new Date().toISOString(),
    }
    try {
      await applyOnboarding({ clip })
    } catch (err) {
      setBusy(false)
      setError(err instanceof Error ? err.message : 'Something went wrong — try again')
      return
    }
    router.push('/me')
  }

  if (!me) {
    return (
      <AppShell
        activeTab="me"
        header={<SubScreenHeader title="Your clip" backHref="/me" />}
        mainClassName="flex items-center px-4 py-6"
      >
        <EmptyState
          className="w-full"
          title="Sign in to add a clip"
          body="A short clip is the most trust-building thing on your card. Claim a handle first."
          action={
            <Link href="/signup" className={buttonClass({ size: 'sm' })}>
              Create your player card
            </Link>
          }
        />
      </AppShell>
    )
  }

  const recording = phase === 'recording'
  const progress = Math.min(elapsed / MAX_SEC, 1) // MAX_SEC is a non-zero constant
  const showExisting = Boolean(me.clip) && !recorderOpen

  const footer =
    !showExisting && phase === 'recorded' && take ? (
      <StickyActionBar note={me.clip ? 'This replaces the clip on your card.' : undefined}>
        <Button className="flex-1" disabled={busy} onClick={() => void save()}>
          {busy ? 'Saving…' : me.clip ? 'Replace my clip' : 'Save my clip'}
        </Button>
      </StickyActionBar>
    ) : undefined

  return (
    <AppShell
      activeTab="me"
      header={<SubScreenHeader title="Your clip" backHref="/me" />}
      mainClassName="px-4 py-6"
      footer={footer}
    >
      {showExisting && me.clip ? (
        <>
          <p className="mb-4 text-[13px] leading-snug text-foreground-dim">
            This is the clip people hear on your card. Musicians with a clip get 3x more jam
            requests.
          </p>
          <Card className="mb-4 p-4">
            <AudioClipPlayer clip={me.clip} label="your clip" compact={false} className="w-full" />
          </Card>
          <button
            type="button"
            onClick={() => {
              setPhase('idle')
              setTake(null)
              setElapsed(0)
              setRecorderOpen(true)
            }}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-[12px] border border-border-subtle',
              'bg-card px-4 py-3 text-[14px] font-medium text-foreground transition-transform active:scale-[0.99]',
            )}
          >
            <RotateCcw size={16} />
            Record a new one
          </button>
        </>
      ) : (
        <>
          <Card className="mb-4 flex min-h-[280px] flex-col items-center justify-center p-6">
            {phase === 'recorded' && take ? (
              <>
                <WaveformPlayer
                  peaks={take.peaks}
                  durationSec={take.durationSec}
                  label="your new clip"
                  className="w-full"
                />
                <div className="mt-6 flex items-center justify-center gap-8">
                  <button
                    type="button"
                    onClick={reRecord}
                    className="flex flex-col items-center gap-2"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-border-subtle bg-card text-foreground transition-transform active:scale-90">
                      <RotateCcw size={15} />
                    </span>
                    <span className="text-[12px] font-medium text-foreground-dim">Re-record</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <div
                  className={cn(
                    'mb-6 font-mono text-[22px] font-medium tabular-nums',
                    recording ? 'text-primary' : 'text-foreground-dim',
                  )}
                >
                  {formatClock(Math.min(elapsed, MAX_SEC))} / {formatClock(MAX_SEC)}
                </div>

                <div
                  className="mb-8 flex h-10 w-full items-center justify-center gap-0.5"
                  aria-hidden="true"
                >
                  {LIVE_PEAKS.map((peak, i) => (
                    <div
                      key={i}
                      className={cn(
                        'w-1 rounded-full transition-colors',
                        recording && i / LIVE_PEAKS.length <= progress
                          ? 'bg-primary'
                          : 'bg-primary/20',
                      )}
                      style={{ height: `${Math.round(peak * 36)}px` }}
                    />
                  ))}
                </div>

                <div className="relative flex h-[88px] w-[88px] items-center justify-center">
                  {/* Progress ring — fills clockwise to 0:24, then the take auto-stops. */}
                  <svg viewBox="0 0 88 88" className="absolute inset-0 -rotate-90" aria-hidden="true">
                    <circle
                      cx="44"
                      cy="44"
                      r={RING_RADIUS}
                      fill="none"
                      strokeWidth="3"
                      className="stroke-border-subtle"
                    />
                    <circle
                      cx="44"
                      cy="44"
                      r={RING_RADIUS}
                      fill="none"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={RING_CIRC}
                      strokeDashoffset={RING_CIRC * (1 - (recording ? progress : 0))}
                      className="stroke-primary"
                    />
                  </svg>
                  <button
                    type="button"
                    onClick={() => (recording ? stopRecording(elapsed) : void startRecording())}
                    aria-label={recording ? 'Stop recording' : 'Start recording'}
                    className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform active:scale-95"
                  >
                    {recording ? (
                      <span className="h-6 w-6 rounded-[4px] bg-primary-foreground" aria-hidden />
                    ) : (
                      <Mic size={26} />
                    )}
                  </button>
                </div>
                <span
                  className={cn(
                    'mt-3 text-[10px] font-bold uppercase tracking-[0.08em]',
                    recording ? 'animate-pulse text-primary' : 'text-foreground-dim',
                  )}
                >
                  {recording ? 'Recording' : 'Tap to record'}
                </span>
              </>
            )}
          </Card>

          <p className="mb-4 text-center text-[11px] text-foreground-dim">
            Preview recorder — captures a short sample.
          </p>

          <div className="flex items-start gap-3 rounded-[16px] bg-surface-muted p-4">
            <Lightbulb size={18} className="mt-0.5 shrink-0 text-primary" />
            <div>
              <p className="text-[14px] font-bold text-foreground">Pick something loose.</p>
              <p className="mt-0.5 text-[14px] leading-snug text-foreground-dim">
                A groove, a riff, a few bars. Nobody is auditioning.
              </p>
            </div>
          </div>

          {me.clip && phase !== 'recording' && (
            <button
              type="button"
              onClick={keepCurrent}
              className="mt-4 w-full text-center text-[13px] font-medium text-foreground-dim transition-colors active:text-foreground"
            >
              Keep my current clip
            </button>
          )}

          {error && (
            <p role="alert" className="mt-3 text-center text-[13px] font-medium text-destructive">
              {error}
            </p>
          )}
        </>
      )}
    </AppShell>
  )
}
