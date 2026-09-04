'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lightbulb, Mic, RotateCcw, Scissors } from 'lucide-react'
import { OnboardingShell } from '@/components/riff/OnboardingShell'
import { WaveformPlayer } from '@/components/riff/WaveformPlayer'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/cn'
import { formatClock } from '@/lib/labels'
import { captureSupported, peaksFromBlob, startCapture, type ClipCapture } from '@/lib/clipAudio'
import { useOnboardingStore } from '@/lib/onboarding-store'
import { useRiffStore, type ProfileOverrides } from '@/lib/store'
import { peaksFor } from '@/lib/waveform'

const MAX_SEC = 24
const CLIP_SEED = 'clip-onboarding'
/** Static bars behind the live take. Deterministic seed, so every render agrees. */
const LIVE_PEAKS = peaksFor(CLIP_SEED, 28)
const RING_RADIUS = 41
const RING_CIRC = 2 * Math.PI * RING_RADIUS

type Phase = 'idle' | 'recording' | 'recorded'

/**
 * Step 4 of 4 — the 24-second first clip. Capture is REAL: the take is kept as a Blob, its
 * waveform is decoded from those bytes, and Save uploads them to /api/riff/clip so the clip
 * on the new card plays exactly what was recorded. No mic access means Skip is the only path —
 * nothing simulated ever lands on a profile. Both Save and Skip commit the whole onboarding
 * draft — the clip is the only thing Skip leaves out.
 */
export function OnboardingClipView() {
  const router = useRouter()
  const clip = useOnboardingStore((s) => s.clip)
  const setClip = useOnboardingStore((s) => s.setClip)
  const applyOnboarding = useRiffStore((s) => s.applyOnboarding)
  const uploadClip = useRiffStore((s) => s.uploadClip)

  const [busy, setBusy] = useState(false)
  const [commitError, setCommitError] = useState<string | null>(null)
  const [micError, setMicError] = useState<string | null>(null)

  // Returning to this step with a draft take intact resumes on the playback state.
  const [phase, setPhase] = useState<Phase>(() =>
    useOnboardingStore.getState().clip ? 'recorded' : 'idle',
  )
  const [elapsed, setElapsed] = useState(0)
  const startedAtRef = useRef(0)
  const captureRef = useRef<ClipCapture | null>(null)
  /** getUserMedia in flight — the permission dialog must not arm two recorders. */
  const armingRef = useRef(false)
  /** Set the moment either footer action fires; everything after is a no-op. */
  const doneRef = useRef(false)
  const mountedRef = useRef(true)

  function releaseCapture() {
    captureRef.current?.cancel()
    captureRef.current = null
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
    setMicError(null)
    // No mic, no clip — Skip is the honest path; a simulated take would fabricate a recording.
    if (!captureSupported()) {
      setMicError('Recording needs a microphone this browser can use — you can skip for now.')
      return
    }
    armingRef.current = true
    try {
      const capture = await startCapture()
      if (!mountedRef.current) {
        capture.cancel()
        armingRef.current = false
        return
      }
      captureRef.current = capture
    } catch {
      armingRef.current = false
      setMicError('Allow microphone access to record — or skip and add a clip later.')
      return
    }
    armingRef.current = false
    setClip(null)
    setElapsed(0)
    startedAtRef.current = Date.now()
    setPhase('recording')
  }

  function stopRecording(seconds: number) {
    const capture = captureRef.current
    captureRef.current = null
    const durationSec = Math.min(MAX_SEC, Math.round(seconds))
    // A tap-and-regret take under a second is discarded rather than kept as a 0s clip —
    // which also keeps durationSec strictly positive everywhere it divides.
    if (!capture || durationSec < 1) {
      capture?.cancel()
      setElapsed(0)
      setPhase('idle')
      return
    }
    void capture.stop().then(async (blob) => {
      const peaks = await peaksFromBlob(blob).catch(() => peaksFor(CLIP_SEED))
      if (!mountedRef.current) return
      setClip({ durationSec, peaks, blob })
      setPhase('recorded')
    })
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
  async function commit(saveClip: boolean) {
    if (doneRef.current) return
    doneRef.current = true
    setBusy(true)
    setCommitError(null)
    releaseCapture()
    const draft = useOnboardingStore.getState()
    const overrides: ProfileOverrides = {}
    // The server merges these over the existing profile, so an undefined or empty value
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
    try {
      await applyOnboarding(overrides)
      // The clip is real recorded bytes and travels separately as an upload.
      if (saveClip && draft.clip?.blob) {
        await uploadClip(draft.clip.blob, draft.clip.durationSec, draft.clip.peaks)
      }
    } catch (err) {
      // Re-arm both footer actions — the draft is intact, so the user can just retry.
      doneRef.current = false
      setBusy(false)
      setCommitError(err instanceof Error ? err.message : 'Something went wrong — try again')
      return
    }
    draft.reset()
    router.push('/map')
  }

  const recording = phase === 'recording'
  const progress = Math.min(elapsed / MAX_SEC, 1) // MAX_SEC is a non-zero constant

  return (
    <OnboardingShell
      step={4}
      title="Let them hear you"
      subtitle="24 seconds is all it takes. A short clip shows people how you actually sound."
      backHref="/onboarding/availability"
      continueLabel={busy ? 'Saving…' : 'Save clip and finish'}
      continueDisabled={phase !== 'recorded' || !clip?.blob || busy}
      onContinue={() => void commit(true)}
      // While busy the doneRef guard makes skip a no-op — the shell has no disabled skip.
      skip={{ label: busy ? 'Saving…' : 'Skip for now', onSkip: () => void commit(false) }}
    >
      <Card className="mb-4 flex min-h-[280px] flex-col items-center justify-center p-6">
        {phase === 'recorded' && clip ? (
          <>
            <TakePreview clip={clip} />
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

      {(commitError ?? micError) && (
        <p role="alert" className="mt-3 text-center text-[13px] font-medium text-destructive">
          {commitError ?? micError}
        </p>
      )}
    </OnboardingShell>
  )
}

/** Plays the just-recorded take from its in-memory bytes; a blobless draft take shows a re-record hint. */
function TakePreview({ clip }: { clip: { durationSec: number; peaks: number[]; blob?: Blob } }) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!clip.blob) return
    const u = URL.createObjectURL(clip.blob)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [clip.blob])
  if (!clip.blob || !url) {
    return (
      <p className="text-center text-[13px] text-foreground-dim">
        This draft take lost its audio — record it again to hear it.
      </p>
    )
  }
  return (
    <WaveformPlayer
      src={url}
      peaks={clip.peaks}
      durationSec={clip.durationSec}
      label="your first clip"
      className="w-full"
    />
  )
}
