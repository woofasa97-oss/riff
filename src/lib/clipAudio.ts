'use client'

/**
 * Real microphone capture for the 24-second profile clip.
 *
 * The recorder keeps the actual audio: chunks are collected into a Blob, waveform peaks are
 * decoded from THAT blob (so the bars shown are the sound recorded), and the blob is uploaded
 * to /api/riff/clip. Nothing about a clip is simulated — no mic, no clip.
 */

export interface CapturedTake {
  blob: Blob
  durationSec: number
  peaks: number[]
}

export function captureSupported(): boolean {
  return (
    typeof MediaRecorder !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia)
  )
}

/** The first container this browser can actually record — Chrome/Firefox webm, Safari mp4. */
function pickMimeType(): string | undefined {
  for (const t of ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']) {
    if (MediaRecorder.isTypeSupported(t)) return t
  }
  return undefined
}

export interface ClipCapture {
  /** Stops the recorder and resolves the real recorded bytes. */
  stop: () => Promise<Blob>
  /** Stops tracks without keeping anything — the abandon path. */
  cancel: () => void
}

/** Arms the mic and starts recording. Throws if the user denies or no device exists. */
export async function startCapture(): Promise<ClipCapture> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const mimeType = pickMimeType()
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
  const chunks: BlobPart[] = []
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  }
  recorder.start(250)

  const release = () => stream.getTracks().forEach((t) => t.stop())

  return {
    stop: () =>
      new Promise<Blob>((resolve) => {
        recorder.onstop = () => {
          release()
          resolve(new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }))
        }
        if (recorder.state === 'inactive') {
          release()
          resolve(new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }))
        } else {
          recorder.stop()
        }
      }),
    cancel: () => {
      recorder.onstop = null
      if (recorder.state !== 'inactive') recorder.stop()
      release()
    },
  }
}

/**
 * Waveform peaks decoded from the recorded audio itself — per-bucket RMS, normalised to the
 * loudest bucket so quiet takes still draw a readable shape.
 */
export async function peaksFromBlob(blob: Blob, bars = 32): Promise<number[]> {
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  const ctx = new Ctx()
  try {
    const decoded = await ctx.decodeAudioData(await blob.arrayBuffer())
    const data = decoded.getChannelData(0)
    const bucket = Math.max(1, Math.floor(data.length / bars))
    const rms: number[] = []
    for (let i = 0; i < bars; i++) {
      const start = i * bucket
      const end = Math.min(data.length, start + bucket)
      let sum = 0
      let n = 0
      for (let j = start; j < end; j += 32) {
        sum += data[j] * data[j]
        n++
      }
      rms.push(Math.sqrt(sum / Math.max(1, n)))
    }
    const max = Math.max(...rms, 1e-6)
    return rms.map((v) => Math.max(0.12, Math.min(1, v / max)))
  } finally {
    void ctx.close()
  }
}
