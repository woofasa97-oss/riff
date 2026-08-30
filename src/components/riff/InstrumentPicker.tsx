'use client'

import { Drum, Guitar, KeyboardMusic, MicVocal, Music, Music2, Music4, Piano } from 'lucide-react'
import { cn } from '@/lib/cn'
import { instrumentLabel } from '@/lib/labels'
import type { Instrument } from '@/types'

const INSTRUMENTS: { id: Instrument; icon: React.ReactNode }[] = [
  { id: 'drums', icon: <Drum size={20} /> },
  { id: 'bass', icon: <Music size={20} /> },
  { id: 'keys', icon: <Piano size={20} /> },
  { id: 'guitar', icon: <Guitar size={20} /> },
  { id: 'vocals', icon: <MicVocal size={20} /> },
  { id: 'sax', icon: <Music2 size={20} /> },
  { id: 'synth', icon: <KeyboardMusic size={20} /> },
  { id: 'percussion', icon: <Music4 size={20} /> },
]

/** Multi-select instrument tiles — onboarding step 2 and the roles-wanted row on Post a jam. */
export function InstrumentPicker({
  selected,
  onToggle,
  className,
}: {
  selected: Instrument[]
  onToggle: (instrument: Instrument) => void
  className?: string
}) {
  return (
    <div className={cn('grid grid-cols-4 gap-2', className)} role="group" aria-label="Instruments">
      {INSTRUMENTS.map(({ id, icon }) => {
        const on = selected.includes(id)
        return (
          <button
            key={id}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(id)}
            className={cn(
              'flex flex-col items-center gap-1.5 rounded-[12px] border px-1 py-3 transition-transform active:scale-95',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              on
                ? 'border-primary bg-[color:var(--hero-from)] text-primary'
                : 'border-border-subtle bg-card text-foreground-dim',
            )}
          >
            {icon}
            <span
              className={cn('text-[11px] font-medium', on ? 'text-primary' : 'text-foreground')}
            >
              {instrumentLabel(id)}
            </span>
          </button>
        )
      })}
    </div>
  )
}
