# Riff — Design System

Extracted verbatim from the prototype. All 76 screens use the same token set, so this file is
the single source of truth — **read this once, then you never need to open a reference screen
just to find a colour.**

## Tokens

Put these in `src/app/globals.css` under `:root` and wire them into `tailwind.config.ts`.

```css
:root {
  --background: #f8f7fa;   --foreground: #3d3c4f;
  --card: #ffffff;         --card-foreground: #3d3c4f;
  --popover: #ffffff;      --popover-foreground: #3d3c4f;
  --primary: #8a79ab;      --primary-foreground: #f8f7fa;   /* muted violet */
  --secondary: #dfd9ec;    --secondary-foreground: #3d3c4f;
  --muted: #dcd9e3;        --muted-foreground: #6b6880;
  --accent: #e6a5b8;       --accent-foreground: #4b2e36;    /* dusty pink */
  --destructive: #d95c5c;  --destructive-foreground: #f8f7fa;
  --border: #cec9d9;       --input: #eae7f0;   --ring: #8a79ab;
  --chart-1: #8a79ab; --chart-2: #e6a5b8; --chart-3: #77b8a1;
  --chart-4: #f0c88d; --chart-5: #a0bbe3;
  --radius: 0.5rem;
}
```

Recurring literal hexes that are not tokenised in the prototype (add them as Tailwind colours).
Counts are actual occurrences across the 28 canonical screens:

| Hex | Uses | Used for |
|---|---|---|
| `#E4DFEE` | 140 | Hairline borders on white cards, icon buttons, chips |
| `#9C97A9` | 114 | Dim label and metadata text — one step lighter than `--muted-foreground` |
| `#3D3C4F` | 267 | Body text on white (same as `--foreground`) |
| Black + `from-black/20 via-black/50 to-black/90` | — | Photo scrims on Welcome, Live, Venue hero |

Live / Battle / Map-live surfaces invert to a **black background with white text** and a red
`LIVE` pill. Treat that as a `.surface-dark` variant, not a separate theme — the app has no
user-facing dark mode.

## Type

```css
--font-sans:  Geist, ui-sans-serif, system-ui, sans-serif;   /* body + UI */
--font-serif: "Lora", Georgia, serif;                        /* wordmark + section titles */
--font-mono:  "Fira Code", "Courier New", monospace;         /* timers, durations */
```

Serif is used sparingly and deliberately: the `Riff` wordmark, screen titles, band names.
Everything else is sans.

Observed scale, ranked by actual frequency across the canonical screens:

| Size | Uses | Role |
|---|---|---|
| `text-[10px]` | 116 | Nav labels, badges, micro-labels |
| `text-[14px]` | 105 | Default body — the workhorse |
| `text-[13px]` | 100 | Chips, metadata, message previews |
| `text-[12px]` | 93 | Timestamps, secondary metadata |
| `text-[15px]` | 83 | List item primary text |
| `text-[22px]` | 82 | Screen titles (serif) |
| `text-[11px]` | 67 | Uppercase section headers |
| `text-[16px]` / `text-[17px]` | 33 / 24 | Card titles |
| `text-5xl` | — | Welcome wordmark |

Uppercase section headers use `text-[11px] tracking-[0.08em] text-muted-foreground`.

## Shadows & radii

```css
--shadow-sm: 1px 2px 5px 1px hsl(0 0% 0% / .06), 1px 1px 2px 0 hsl(0 0% 0% / .06);
--shadow-md: 1px 2px 5px 1px hsl(0 0% 0% / .06), 1px 2px 4px 0 hsl(0 0% 0% / .06);
--shadow-lg: 1px 2px 5px 1px hsl(0 0% 0% / .06), 1px 4px 6px 0 hsl(0 0% 0% / .06);
```

Radii, by measured frequency: chips, pills, avatars and most buttons `rounded-full` (496 uses);
**cards `rounded-[16px]` (79)** — this is the dominant card radius, more common than
`rounded-[12px]` (57), which is used for inner cards, inputs and tighter tiles; small tiles
`rounded-[8px]` (18); bottom sheets `rounded-t-[16px]`.

## Layout constants

| Thing | Value |
|---|---|
| Design viewport | 375 × 812 |
| Top header | `h-[56px]`, background `--background`, no border |
| Bottom tab bar | `h-[64px]` + `env(safe-area-inset-bottom)`, white, top hairline `#E4DFEE` |
| Primary button | `w-full h-[48px] rounded-[12px] font-semibold active:scale-95` |
| Horizontal page padding | `px-4` (`px-6` on onboarding) |
| Card | white, `rounded-[16px]`, `border border-[#E4DFEE]`, `shadow-sm`, `p-4` |
| Safe area | `.pb-safe { padding-bottom: env(safe-area-inset-bottom, 1rem); }` |

Scroll containers hide their scrollbar via `.no-scrollbar`.

## Component inventory

Build these once, in this order, before any screen work. Every screen is assembled from them.

**Primitives** — `Button` (primary/secondary/ghost/destructive), `Chip` (selectable, with
selected state), `Card`, `Avatar` (+ `AvatarStack` with `+N` overflow), `Badge`
(VERIFIED / TOP RELIABILITY / Confirmed / LIVE), `StatTile`, `SectionHeader`, `Tabs`,
`BottomSheet`, `Modal`, `Toggle`, `Slider`, `EmptyState`.

**Domain** — `MusicianCard`, `OpenCallCard`, `JamCard`, `VenueCard`, `BandCard`,
`AudioClipPlayer` (waveform + duration + play/pause), `RecordingRow` (scrubber + timestamps),
`AvailabilityGrid` (7×3, read + edit modes), `VouchTagPicker`, `VouchCard`, `ReliabilityMeter`,
`InstrumentPicker`, `IntentPicker`, `LeaderboardRow`, `BracketMatch`, `VoteBar`, `LiveChat`,
`ChatBubble`, `NotificationRow`, `MapZonePill`, `LiveJamSheet`.

**Chrome** — `AppShell`, `TopBar`, `BottomTabBar`, `OnboardingStepper`.

## Icons

FontAwesome 6.5 free. The reference screens use `<i class="fa-solid fa-*">`. In the Next.js app,
swap to `lucide-react` — map on sight, don't add a FontAwesome dependency.

The icons that actually appear, with their lucide equivalents:

| FontAwesome | lucide-react | | FontAwesome | lucide-react |
|---|---|---|---|---|
| `fa-map` | `Map` | | `fa-bolt` | `Zap` |
| `fa-compass` | `Compass` | | `fa-calendar` | `Calendar` |
| `fa-guitar` | `Guitar` | | `fa-trophy` | `Trophy` |
| `fa-tower-broadcast` | `RadioTower` | | `fa-share-nodes` | `Share2` |
| `fa-star` | `Star` | | `fa-plus` | `Plus` |
| `fa-chevron-left` / `-right` | `ChevronLeft` / `ChevronRight` | | `fa-xmark` | `X` |
| `fa-check` / `fa-circle-check` | `Check` / `CircleCheck` | | `fa-shield-halved` | `ShieldCheck` |
| `fa-play` | `Play` | | `fa-location-dot` | `MapPin` |
| `fa-magnifying-glass` | `Search` | | `fa-map-location-dot` | `MapPinned` |
| `fa-sliders` | `SlidersHorizontal` | | `fa-microphone` | `Mic` |
| `fa-drum` | `Drum` (or `Disc`) | | `fa-keyboard` | `Piano` |
| `fa-heart` | `Heart` | | `fa-user` | `User` |

## Imagery

The reference screens point at `storage.googleapis.com/uxpilot-auth.appspot.com/...` URLs
(125 references across the canonical set). These are prototype assets and will rot. Replace with
local files in `public/mock/` or a placeholder service; whitelist whatever host you use in
`next.config.js` `images.remotePatterns`.

## Motion

Keep motion to the minimum the prototype uses:

```css
@keyframes fadeIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:none } }
.animate-fade-in { animation: fadeIn .3s ease-out forwards }
```

Plus `active:scale-95` on tappable buttons (`active:scale-90` on small icon buttons).
No page transitions, no parallax.

Two more are worth keeping because they carry meaning rather than decoration: a `pulse-ring`
keyframe behind live map pins, and `animate-pulse` on loading skeletons. Everything else the
prototype animated (floating hearts on the live screen) was demo filler and has been stripped.
