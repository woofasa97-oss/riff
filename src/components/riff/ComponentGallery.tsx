'use client'

import { Fragment, useState } from 'react'
import { Guitar, Heart, Plus, Search } from 'lucide-react'
import { AppShell } from '@/components/riff/AppShell'
import { AttendanceToggle } from '@/components/riff/AttendanceToggle'
import { AudioClipPlayer } from '@/components/riff/AudioClipPlayer'
import { AvailabilityGrid } from '@/components/riff/AvailabilityGrid'
import { InstrumentPicker } from '@/components/riff/InstrumentPicker'
import { IntentPicker } from '@/components/riff/IntentPicker'
import { MusicianCard } from '@/components/riff/MusicianCard'
import { OpenCallCard } from '@/components/riff/OpenCallCard'
import { SubScreenHeader } from '@/components/riff/TopBar'
import { VouchTagPicker } from '@/components/riff/VouchTagPicker'
import { WaveformPlayer } from '@/components/riff/WaveformPlayer'
import { Avatar, AvatarStack, type AvatarSize } from '@/components/ui/Avatar'
import { Badge, ContextLabel } from '@/components/ui/Badge'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button, IconButton } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Slider } from '@/components/ui/Slider'
import { StatTile } from '@/components/ui/StatTile'
import { ChipTabs, Tabs } from '@/components/ui/Tabs'
import { Toggle } from '@/components/ui/Toggle'
import { emptyGrid } from '@/lib/availability'
import { useCurrentUser, useMusicianStats, useRiffStore } from '@/lib/store'
import { peaksFor } from '@/lib/waveform'
import { getMusician, listNearbyMusicians } from '@/mocks'
import type { Instrument, Intent, Slot, VouchTag, Weekday } from '@/types'

const BUTTON_VARIANTS = ['primary', 'secondary', 'outline', 'ghost', 'destructive'] as const
const BUTTON_SIZES = ['md', 'sm'] as const
const BADGE_TONES = ['neutral', 'primary', 'success', 'warning', 'accent', 'live'] as const
const CONTEXT_TONES = ['neutral', 'primary', 'accent'] as const
const AVATAR_SIZES: AvatarSize[] = ['xs', 'sm', 'md', 'lg', 'xl']

type GalleryTab = 'upcoming' | 'requests' | 'past'
type GalleryFilter = 'all' | 'requests' | 'unread'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <SectionHeader>{title}</SectionHeader>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

/** Dim inline note for a fixture the gallery cannot render. */
function MissingFixture({ what }: { what: string }) {
  return <p className="text-[13px] text-foreground-dim">Fixture missing: {what}.</p>
}

/**
 * Dev-only gallery: every primitive in each of its states on one screen, so a styling
 * regression is visible at a glance. Not linked from the product chrome.
 */
export function ComponentGallery() {
  const user = useCurrentUser()
  const viewerId = useRiffStore((s) => s.viewerId)
  const musicians = useRiffStore((s) => s.musicians)
  const sarah = getMusician('sarah-jenkins')
  const neighbors = listNearbyMusicians({ viewerId }, musicians).slice(0, 5)
  const stats = useMusicianStats(viewerId)
  const jams = useRiffStore((s) => s.jams)
  const requests = useRiffStore((s) => s.requests)
  const openCall = jams.find((j) => j.isOpenCall)
  const pendingCount = requests.filter((r) => r.toId === viewerId && r.status === 'pending').length

  const [chipOn, setChipOn] = useState(true)
  const [tab, setTab] = useState<GalleryTab>('upcoming')
  const [filter, setFilter] = useState<GalleryFilter>('all')
  const [toggleA, setToggleA] = useState(true)
  const [toggleB, setToggleB] = useState(false)
  const [showedUp, setShowedUp] = useState(true)
  const [radius, setRadius] = useState(() => Math.min(10, Math.max(1, user?.travelRadiusMi ?? 3)))
  const [modalOpen, setModalOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [grid, setGrid] = useState<Record<Weekday, Slot[]>>(emptyGrid)
  const [instruments, setInstruments] = useState<Instrument[]>([])
  const [intent, setIntent] = useState<Intent | undefined>(undefined)
  const [vouchTags, setVouchTags] = useState<VouchTag[]>([])

  // Dev-only surface — requires a signed-in viewer for the live-data samples.
  if (!user) return null

  const demoDuration = sarah?.clip?.durationSec ?? 24

  return (
    <AppShell
      activeTab={null}
      header={<SubScreenHeader title="Components" backHref="/jams" />}
      mainClassName="bg-background px-4 py-6"
    >
      <div className="space-y-10 pb-10">
        <Section title="Button">
          {BUTTON_VARIANTS.map((variant) => (
            <div key={variant} className="flex flex-wrap items-center gap-2">
              <span className="w-[76px] shrink-0 text-[11px] text-foreground-dim">{variant}</span>
              {BUTTON_SIZES.map((size) => (
                <Fragment key={size}>
                  <Button variant={variant} size={size} className="px-4">
                    {size}
                  </Button>
                  <Button variant={variant} size={size} disabled className="px-4">
                    {size} off
                  </Button>
                </Fragment>
              ))}
            </div>
          ))}
          <Button fullWidth>Full width</Button>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <IconButton label="Search (light)">
                <Search size={16} />
              </IconButton>
              <IconButton label="Add (light)">
                <Plus size={16} />
              </IconButton>
            </div>
            {/* Dark icon buttons on the surface they actually appear on (Live / Battle). */}
            <div className="flex items-center gap-3 rounded-[12px] bg-surface-dark p-3">
              <IconButton surface="dark" label="Search (dark)">
                <Search size={16} />
              </IconButton>
              <IconButton surface="dark" label="Favourite (dark)">
                <Heart size={16} />
              </IconButton>
            </div>
          </div>
        </Section>

        <Section title="Chips & tabs">
          <div className="flex flex-wrap items-center gap-2">
            <Chip selected={chipOn} onClick={() => setChipOn((v) => !v)}>
              Selected (tap me)
            </Chip>
            <Chip>Unselected</Chip>
          </div>
          <ChipTabs<GalleryFilter>
            items={[
              { id: 'all', label: 'All' },
              { id: 'requests', label: 'Requests' },
              { id: 'unread', label: 'Unread' },
            ]}
            value={filter}
            onChange={setFilter}
          />
          <Tabs<GalleryTab>
            items={[
              { id: 'upcoming', label: 'Upcoming' },
              { id: 'requests', label: 'Requests', count: pendingCount },
              { id: 'past', label: 'Past' },
            ]}
            value={tab}
            onChange={setTab}
            className="-mx-4"
          />
        </Section>

        <Section title="Card, badges, labels">
          <Card className="p-4">
            <p className="text-[14px] text-foreground">
              Card — white, rounded-[16px], hairline border, shadow-sm.
            </p>
          </Card>
          <div className="flex flex-wrap items-center gap-2">
            {BADGE_TONES.map((tone) => (
              <Badge key={tone} tone={tone}>
                {tone}
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {CONTEXT_TONES.map((tone) => (
              <ContextLabel key={tone} tone={tone}>
                {tone}
              </ContextLabel>
            ))}
          </div>
          <Card className="p-4">
            <SectionHeader
              action={
                <button type="button" className="text-[12px] font-semibold text-primary">
                  See all
                </button>
              }
            >
              With action
            </SectionHeader>
            <p className="text-[13px] text-foreground-dim">
              SectionHeader takes an optional trailing action.
            </p>
          </Card>
          {/* Stats are derived from recaps — never authored (product rule 3). */}
          {stats ? (
            <div className="flex gap-3">
              <StatTile value={`${stats.reliabilityPct}%`} label="Reliability" />
              <StatTile value={stats.repeatJams} label="Repeat jams" />
              <StatTile value={stats.vouchCount} label="Vouches" />
            </div>
          ) : (
            <MissingFixture what="current-user stats" />
          )}
          <EmptyState
            icon={<Guitar size={20} />}
            title="Nothing here yet"
            body="Every list owes the user an empty state with a way forward."
            action={
              <Button size="sm" className="px-5">
                Take the exit
              </Button>
            }
          />
        </Section>

        <Section title="Avatars">
          <div className="flex items-end gap-3">
            {AVATAR_SIZES.map((size) => (
              <div key={size} className="flex flex-col items-center gap-1">
                <Avatar src={user.avatarUrl} name={user.name} size={size} />
                <span className="text-[10px] text-foreground-dim">{size}</span>
              </div>
            ))}
          </div>
          <AvatarStack
            people={neighbors.map((m) => ({ id: m.id, name: m.name, avatarUrl: m.avatarUrl }))}
            max={3}
          />
        </Section>

        <Section title="Controls">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Toggle checked={toggleA} onChange={setToggleA} label="Demo toggle A" />
              <span className="text-[12px] text-foreground-dim">{toggleA ? 'On' : 'Off'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Toggle checked={toggleB} onChange={setToggleB} label="Demo toggle B" />
              <span className="text-[12px] text-foreground-dim">{toggleB ? 'On' : 'Off'}</span>
            </div>
          </div>
          <AttendanceToggle
            showedUp={showedUp}
            onChange={setShowedUp}
            personName={sarah?.name ?? user.name}
          />
          <Slider
            min={1}
            max={10}
            value={radius}
            onChange={setRadius}
            label="Travel radius"
            formatValue={(v) => `${v} mi`}
          />
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="px-5"
              onClick={() => setModalOpen(true)}
            >
              Open modal
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="px-5"
              onClick={() => setSheetOpen(true)}
            >
              Open bottom sheet
            </Button>
          </div>
        </Section>

        <Section title="Audio">
          <WaveformPlayer
            peaks={peaksFor('gallery-normal')}
            durationSec={demoDuration}
            label="Waveform demo"
          />
          <WaveformPlayer
            peaks={peaksFor('gallery-compact')}
            durationSec={demoDuration}
            compact
            label="Compact waveform demo"
          />
          {sarah?.clip ? (
            <AudioClipPlayer clip={sarah.clip} label={`${sarah.name}'s clip`} />
          ) : (
            <MissingFixture what="sarah-jenkins clip" />
          )}
        </Section>

        <Section title="Availability grid">
          <p className="text-[12px] text-foreground-dim">Editable — tap or drag to paint.</p>
          <AvailabilityGrid value={grid} onChange={setGrid} />
          <p className="text-[12px] text-foreground-dim">
            Read-only — the current user&rsquo;s grid.
          </p>
          <AvailabilityGrid value={user.availability.grid} readOnly />
        </Section>

        <Section title="Pickers">
          <InstrumentPicker
            selected={instruments}
            onToggle={(i) =>
              setInstruments((prev) =>
                prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i],
              )
            }
          />
          <IntentPicker value={intent} onChange={setIntent} />
          <VouchTagPicker
            selected={vouchTags}
            onToggle={(tag) =>
              setVouchTags((prev) =>
                prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
              )
            }
          />
        </Section>

        <Section title="Domain cards">
          {sarah ? <MusicianCard musician={sarah} /> : <MissingFixture what="sarah-jenkins" />}
          {openCall ? <OpenCallCard jam={openCall} /> : <MissingFixture what="open-call jam" />}
        </Section>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Gallery modal">
        <h3 className="font-serif text-[17px] font-bold text-foreground">Modal</h3>
        <p className="mt-2 text-[13px] text-foreground-dim">
          Centred over the phone column. Escape and the backdrop both dismiss it.
        </p>
        <Button fullWidth className="mt-5" onClick={() => setModalOpen(false)}>
          Close
        </Button>
      </Modal>

      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Gallery bottom sheet"
      >
        <h3 className="font-serif text-[17px] font-bold text-foreground">Bottom sheet</h3>
        <p className="mt-2 text-[13px] text-foreground-dim">
          Rises from the bottom of the phone column and stays inside the 375px frame.
        </p>
        <Button fullWidth variant="secondary" className="mt-5" onClick={() => setSheetOpen(false)}>
          Close
        </Button>
      </BottomSheet>
    </AppShell>
  )
}
