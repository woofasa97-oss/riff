'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lightbulb, Mic, RotateCcw, Scissors } from 'lucide-react'
import { OnboardingShell } from '@/components/riff/OnboardingShell'
import { WaveformPlayer } from '@/components/riff/WaveformPlayer'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/cn'
import { formatClock } from '@/lib/labels'
import { useOnboardingStore } from '@/lib/onboarding-store'
import { useRiffStore, type ProfileOverrides } from '@/lib/store'
import { peaksFor } from '@/lib/waveform'
import { NOW } from '@/mocks'

const MAX_SEC = 24
const CLIP_SEED = 'clip-onboarding'
/** Static bars behind the live take. Deterministic seed, so every render agrees. */
const LIVE_PEAKS = peaksFor(CLIP_SEED, 28)
const RING_RADIUS = 41
const RING_CIRC = 2 * Math.PI * RING_RADIUS

type Phase = 'idle' | 'recording' | 'recorded'

/**
 * Step 4 of 4 — the 24-second first clip. Capture is real where the browser grants a mic
 * (MediaRecorder keeps the stream honest), but real audio is out of scope for v1
 * (docs/SPEC.md §6): the recording we keep is only { durationSec, peaks }, and playback is
 * the same simulated WaveformPlayer the rest of the app uses. Both Save and Skip commit the
 * whole onboarding draft — the clip is the only thing Skip leaves out.
 */
export function OnboardingClipView() {
  const router = useRouter()
  const clip = useOnboardingStore((s) => s.clip)
  const setClip = useOnboardingStore((s) => s.setClip)

  // Returning to this step with a draft take intact resumes on the playback state.
  const [phase, setPhase] = useState<Phase>(() =>
    useOnboardingStore.getState().clip ? 'recorded' : 'idle',
  )
  const [elapsed, setElapsed] = useState(0)
  const startedAtRef = useRef(0)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  /** getUserMedia in flight — the permission dialog must not arm two recorders. */
  const armingRef = useRef(false)
  /** Set the moment either footer action fires; everything after is a no-op. */
  const doneRef = useRef(false)
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
    if (phase === 'recording' || armingRef.current || doneRef.current) return
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
    setClip(null)
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
    setClip({ durationSec, peaks: peaksFor(CLIP_SEED) })
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
    if (doneRef.current) return
    setClip(null)
    setElapsed(0)
    setPhase('idle')
  }

  /** Commits the whole onboarding draft. Skip differs from Save only by omitting the clip. */
  function commit(saveClip: boolean) {
    if (doneRef.current) return
    doneRef.current = true
    releaseCapture()
    const draft = useOnboardingStore.getState()
    const overrides: ProfileOverrides = {}
    // useCurrentUser spreads these over the fixture user, so an undefined or empty value
    // from a skipped step would blank a field the flow never touched — only settled
    // choices go in. Step 3 is skippable: an untouched empty grid must not erase the
    // profile's existing availability.
    const touchedAvailability =
      Object.values(draft.grid).some((slots) => slots.length > 0) || draft.note.trim().length > 0
    if (touchedAvailability) {
      overrides.availability = { grid: draft.grid, note: draft.note }
    }
    if (touchedAvailability || draft.availableTonight) {
      overrides.availableTonight = draft.availableTonight
    }
    if (draft.neighborhood) {
      // Radius only travels with a completed step 1 — it is meaningless on its own.
      overrides.travelRadiusMi = draft.travelRadiusMi
    }
    if (draft.neighborhood) overrides.neighborhood = draft.neighborhood
    if (draft.instruments.length > 0) overrides.instruments = draft.instruments
    if (draft.genres.length > 0) overrides.genres = draft.genres
    if (draft.intent) overrides.intent = draft.intent
    if (saveClip && draft.clip) {
      overrides.clip = {
        id: 'clip-onboarding',
        url: '/mock/clips/clip-onboarding.m4a',
        durationSec: draft.clip.durationSec,
        waveform: draft.clip.peaks,
        recordedAt: NOW,
      }
    }
    useRiffStore.getState().applyOnboarding(overrides)
    draft.reset()
    router.push('/map')
  }

  const recording = phase === 'recording'
  const progress = Math.min(elapsed / MAX_SEC, 1) // MAX_SEC is a non-zero constant

  return (
    <OnboardingShell
      step={4}
      title="Let them hear you"
      subtitle="24 seconds is all it takes. Musicians with a clip get 3x more jam requests."
      backHref="/onboarding/availability"
      continueLabel="Save clip and finish"
      continueDisabled={phase !== 'recorded' || !clip}
      onContinue={() => commit(true)}
      skip={{ label: 'Skip for now', onSkip: () => commit(false) }}
    >
      <Card className="mb-4 flex min-h-[280px] flex-col items-center justify-center p-6">
        {phase === 'recorded' && clip ? (
          <>
            <WaveformPlayer
              peaks={clip.peaks}
              durationSec={clip.durationSec}
              label="your first clip"
              className="w-full"
            />
            <div className="mt-6 flex items-start justify-center gap-8">
              <button type="button" onClick={reRecord} className="flex flex-col items-center gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-border-subtle bg-card text-foreground transition-transform active:scale-90">
                  <RotateCcw size={15} />
                </span>
                <span className="text-[12px] font-medium text-foreground-dim">Re-record</span>
              </button>
              <button
                type="button"
                disabled
                title="Trimming is not in v1 — re-record if the take ran long."
                className="flex flex-col items-center gap-2 opacity-40"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-border-subtle bg-card text-foreground">
                  <Scissors size={15} />
                </span>
                <span className="text-[12px] font-medium text-foreground-dim">Trim</span>
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
                    recording && i / LIVE_PEAKS.length <= progress ? 'bg-primary' : 'bg-primary/20',
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
                onClick={() => (recording ? stopRecording(elapsed) : startRecording())}
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

      <div className="flex items-start gap-3 rounded-[16px] bg-surface-muted p-4">
        <Lightbulb size={18} className="mt-0.5 shrink-0 text-primary" />
        <div>
          <p className="text-[14px] font-bold text-foreground">Pick something loose.</p>
          <p className="mt-0.5 text-[14px] leading-snug text-foreground-dim">
            A groove, a riff, a few bars. Nobody is auditioning.
          </p>
        </div>
      </div>
    </OnboardingShell>
  )
}
