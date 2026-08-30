'use client'

import { cn } from '@/lib/cn'

/**
 * A labelled range input. Used for the travel radius in onboarding step 1.
 * Styling for the thumb/track lives in globals.css under `.riff-slider` — pseudo-element
 * selectors for range inputs do not compose well as utility classes.
 */
export function Slider({
  min,
  max,
  step = 1,
  value,
  onChange,
  label,
  formatValue,
  className,
}: {
  min: number
  max: number
  step?: number
  value: number
  onChange: (next: number) => void
  label: string
  /** "3 mi" instead of "3". */
  formatValue?: (v: number) => string
  className?: string
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className={cn('w-full', className)}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        aria-valuetext={formatValue ? formatValue(value) : String(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        className="riff-slider w-full"
        style={{
          // The filled part of the track, painted up to the thumb.
          background: `linear-gradient(to right, var(--primary) ${pct}%, var(--muted) ${pct}%)`,
        }}
      />
      <div className="mt-1.5 flex justify-between text-[11px] text-foreground-dim">
        <span>{formatValue ? formatValue(min) : min}</span>
        <span className="font-semibold text-primary">
          {formatValue ? formatValue(value) : value}
        </span>
        <span>{formatValue ? formatValue(max) : max}</span>
      </div>
    </div>
  )
}
