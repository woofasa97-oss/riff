/**
 * Deterministic peaks for a stubbed waveform. Same seed, same bars — so the server and the
 * client render identical markup and React does not complain about a hydration mismatch.
 */
export function peaksFor(seed: string, bars = 32): number[] {
  let x = 0
  for (let i = 0; i < seed.length; i++) x = (x * 31 + seed.charCodeAt(i)) % 2147483647
  const peaks: number[] = []
  for (let i = 0; i < bars; i++) {
    x = (x * 1103515245 + 12345) % 2147483648
    peaks.push(0.25 + (x / 2147483648) * 0.75)
  }
  return peaks
}
