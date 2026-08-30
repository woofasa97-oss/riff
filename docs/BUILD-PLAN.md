# Riff — Build Plan

34 tickets across 7 phases. **Each ticket is sized to fit one Claude Code session** and states
exactly which files to read. That constraint is the whole point of this document — the original
prototype is ~1.7M tokens, and following this plan you never load more than ~15k at a time.

## How to run this

1. Start a session. `CLAUDE.md` loads automatically.
2. Say: `Do ticket P1-01 from docs/BUILD-PLAN.md`
3. Claude reads only the files that ticket names.
4. Verify, commit, then `/clear` before the next ticket.

Do not batch tickets. Do not let a session read more than the two or three reference screens
its ticket names.

---

## Phase 0 — Foundation

### P0-01 · Scaffold the project
**Read:** `docs/DESIGN-SYSTEM.md`
Next.js 15 (App Router, TypeScript, Tailwind), `src/` dir, ESLint + Prettier. Add `lucide-react`,
`clsx`, `date-fns`, `zustand`. Set up `globals.css` with the token block and wire the tokens into
`tailwind.config.ts`. Add the Lora + Geist font loaders. Configure `images.remotePatterns`.
**Done when:** `npm run dev` serves a blank page using `bg-background text-foreground`.

### P0-02 · Types and fixtures
**Read:** `docs/DATA-MODEL.md`
Write every interface into `src/types/index.ts`. Then write `src/mocks/` fixtures meeting the
volume requirements at the bottom of that doc, using the persona names from `docs/SPEC.md §2`.
Add `src/mocks/index.ts` with typed selectors: `getMusician(id)`, `listNearbyMusicians()`,
`getJam(id)`, `listJams(filter)`, `getThread(id)`, `getLeaderboard()`, etc.
**Done when:** `tsc --noEmit` passes and every selector returns non-empty data.

### P0-03 · App shell and navigation
**Read:** `docs/DESIGN-SYSTEM.md §Layout`, `reference/screens/10-map.html` (chrome only — the
header and tab bar, ignore the map body)
Build `AppShell`, `TopBar`, `BottomTabBar` (MAP · DISCOVER · JAMS · LIVE · ME with active states
and safe-area padding), and stub route files for all 5 tabs.
**Done when:** all five tabs navigate and the active tab is visibly correct.

### P0-04 · Primitive component library
**Read:** `docs/DESIGN-SYSTEM.md`
Build every component under **Primitives**: Button, Chip, Card, Avatar, AvatarStack, Badge,
StatTile, SectionHeader, Tabs, BottomSheet, Modal, Toggle, Slider, EmptyState.
Add a `/dev/components` gallery route rendering each in all its states.
**Done when:** the gallery renders and matches the token values.

---

## Phase 1 — Onboarding

### P1-01 · Welcome
**Read:** `reference/screens/01-welcome.html`
Full-bleed hero with gradient scrim, wordmark, tagline, three auth buttons (stubbed — set a
`currentUser` in the store and route to `/onboarding/location`), `I already have an account`
link, privacy footer.

### P1-02 · Onboarding stepper + Step 1 (Location)
**Read:** `reference/screens/02-onboarding-location.html`
Build `OnboardingStepper` ("Step N of 4" + Back/Continue footer) and the location step:
neighbourhood chips, travel-radius slider 1–10 mi, privacy copy. Persist to a
`useOnboardingStore` (zustand), not to the mock data yet.

### P1-03 · Step 2 (Instruments & intent)
**Read:** `reference/screens/03-onboarding-instruments.html`
`InstrumentPicker` (multi-select), genre-lane chips (multi-select), `IntentPicker` (single-select
cards with title + description). Continue is disabled until ≥1 instrument and an intent are chosen.

### P1-04 · Step 3 (Availability)
**Read:** `reference/screens/04-onboarding-availability.html`
`AvailabilityGrid` — 7 days × Morn/Aft/Eve, tap to toggle, drag to paint. Free-text note field.
`Show me as available tonight` toggle with the midnight-expiry helper text.
The grid component is reused read-only on both profile screens — build it with a `readOnly` prop now.

### P1-05 · Step 4 (Record clip)
**Read:** `reference/screens/05-onboarding-clip.html`
24-second recorder UI. Use `MediaRecorder` if available, otherwise a simulated timer — **do not
build real audio processing.** Waveform can be generated peaks. Re-record / Play back / Trim
(trim may be a no-op with a disabled state). `Skip for now` and `Save clip and finish` both
commit the onboarding store into the mock current user and route to `/map`.

---

## Phase 2 — Core loop (highest value — do not reorder)

### P2-01 · AudioClipPlayer + MusicianCard
**Read:** `reference/screens/20-discover.html`
Two components only, no page yet. `AudioClipPlayer` (waveform, play/pause, elapsed/duration).
`MusicianCard` (avatar, name, instrument/genre line, badges, intent tag, clip, distance,
availability summary, View profile / Request jam). Add both to `/dev/components`.

### P2-02 · Discover feed
**Read:** `reference/screens/20-discover.html`
The page: intent filter chips, "Who's free tonight?" header with live count, the card list, and
`OpenCallCard` interleaved. Filtering is client-side over mock data.

### P2-03 · Musician profile
**Read:** `reference/screens/42-profile-musician.html`
Identity header, season ranking card, PAST JAMS with `RecordingRow` scrubbers, vouches preview,
read-only `AvailabilityGrid`, sticky `Message` / `Request jam` footer.

### P2-04 · Request a jam
**Read:** `reference/screens/21-request-a-jam.html`
Vibe picker → time chips derived from the target's real availability (each labelled "He/She is
free") → venue chips + `Suggest a place`. The "Nothing is confirmed until X accepts" line is
required copy. Submitting writes a `JamRequest` to the store and shows a confirmation state.

### P2-05 · Incoming jam request
**Read:** `reference/screens/22-incoming-jam-request.html`
Requester card, quoted message, WHEN/WHERE/VIBE blocks, their clip, their vouch tags.
`Accept and confirm` creates a `Jam` with status `confirmed` and a thread, then routes to jam
details. `Suggest another time` opens the time picker from P2-04. `Decline politely` sends a
templated decline.

### P2-06 · Jams list
**Read:** `reference/screens/30-jams-list.html`
Tabs Upcoming / Requests (with count badge) / Past. `JamCard` with attendee stack, `Message
group` / `Directions`, pending `Awaiting N reply` state, and the "Open calls you applied to"
section. Empty states for all three tabs.

### P2-07 · Jam details
**Read:** `reference/screens/31-jam-details.html`
Venue hero, status badge, WHO IS COMING with reliability meters, LOCATION (address only when
status is `confirmed` — enforce this), thread preview, `Message group` / `Go live`, `Can't make it?`.

### P2-08 · Session recap
**Read:** `reference/screens/40-session-recap.html`
Attendance toggles, `VouchTagPicker` per attendee, recording-save block gated on unanimous
consent, `Skip` / `Post recap`. On submit, recompute reliability/repeats/vouches through the
derived-value helpers from `docs/DATA-MODEL.md` so the profile visibly changes.
**This ticket is what makes the app feel alive. Verify the numbers actually move.**

---

## Phase 3 — Messaging & notifications

### P3-01 · Messages list
**Read:** `reference/screens/32-messages-list.html`
Filter tabs All / Jams / Requests / Bands, rows with avatar, name, timestamp, preview, and the
uppercase context label.

### P3-02 · Message thread
**Read:** `reference/screens/33-message-thread.html`
Pinned jam header with `Details` link, day-grouped bubbles, inline system events, composer.
Sending appends to the mock store optimistically.

### P3-03 · Notifications
**Read:** `reference/screens/34-notifications.html`
All / Requests tabs, TODAY / EARLIER groups, one row renderer per notification kind, each
deep-linking to its target. Unread dot + mark-as-read.

---

## Phase 4 — Map

### P4-01 · Map screen
**Read:** `reference/screens/10-map.html`
Stylised zone map (SVG or absolutely-positioned pills over a background — **not** a real basemap
library in v1), zone pills with musician/live counts, "Me" marker, filter row, zone bottom sheet.
Zone-level positions only; never render exact coordinates.

### P4-02 · Live jam sheet
**Read:** `reference/screens/11-map-live-jam.html`
The raised LIVE JAM sheet as a state of P4-01: red live pill, venue, elapsed time, member
avatars, listener count, `Get directions` / `Watch live` → `/live/[id]`.

---

## Phase 5 — Profile & reputation

### P5-01 · My profile
**Read:** `reference/screens/41-profile-me.html`
Stat tiles, `Edit your player card`, YOUR CLIP with Replace, editable `AvailabilityGrid`,
THIS SEASON rank card, settings list (Your bands, Saved musicians, Past jams, Settings and
privacy, Safety centre — stub the destinations).

### P5-02 · Vouches
**Read:** `reference/screens/43-vouches.html`
Total header, tag histogram with counts, filter chips, `VouchCard` list, and the
"only confirmed attendees can vouch" integrity line.

---

## Phase 6 — Live, Battle, Venues

### P6-01 · Live session
**Read:** `reference/screens/50-live-session.html`
Dark surface, stubbed video (poster image + a `LIVE` pill), viewer count, Follow, rating and
reputation overlays, `LiveChat` with a simulated message feed and a composer.

### P6-02 · Rate this Jam modal
**Read:** `reference/screens/50-live-session.html` (the modal markup is in the same file)
Star input, explanatory copy, `Submit Rating` / `Not now`. Triggers on session end.
The modal is `hidden` in the reference file — see the inline `NOTE` comment above `#rating-modal`.

### P6-03 · Battle live + voting
**Read:** `reference/screens/60-battle-live-vote.html`
Split A/B layout, per-side band cards, `VoteBar` with animated percentages, `Vote A` / `Vote B`
locked to one vote per user, live chat.

### P6-04 · Bracket
**Read:** `reference/screens/61-battle-bracket.html`
Scope tabs Brooklyn / Global / My matches. Quarter → Semi → Final → Champion columns of
`BracketMatch`, with a LIVE state on the final. `YOUR RUN` summary footer.

### P6-05 · Leaderboard
**Read:** `reference/screens/62-leaderboard.html`
Scope selector, 1–3 podium, table rows with rank deltas, pinned current-user row, the
"40 points from the top 10" nudge and a `How points work` sheet.

### P6-06 · Band profile
**Read:** `reference/screens/63-band-profile.html`
Cover, season badge, Follow / Message, stat row, MEMBERS with reliability + `Open seat — Apply`,
LISTEN recordings, BATTLE HISTORY with Won/Lost.

### P6-07 · Venue detail
**Read:** `reference/screens/70-venue-detail.html`
Hero with `LIVE JAM ON NOW` banner, stats row, amenity chips, WHO IS PLAYING HERE, slot picker
with a SELECTED state, `Message venue` / `Book this slot`.

### P6-08 · Post a jam
**Read:** `reference/screens/23-post-a-jam.html`
Open call / Private invite toggle, roles wanted, vibe, when (date + time + duration), where with
venue change, who is already in + open seats, message textarea, `Save draft` / `Post open call`.
Posted open calls must appear in the Discover feed from P2-02.

---

## Phase 7 — Verification

### P7-01 · Route and flow audit
**Read:** `docs/SCREENS.md`
Walk every route. Confirm: no dead links, every screen matches its reference, the 5-tab bar is
correct everywhere, empty and loading states exist, `tsc --noEmit` and `npm run build` pass.

### P7-02 · Product-rule audit
**Read:** `docs/SPEC.md §5`
Verify each principle holds in code, not just in copy:
addresses hidden until a jam is confirmed · requests are never auto-accepted · vouching is
gated on confirmed co-attendance · every terminal screen has an escape hatch · location is
never rendered more precisely than a neighbourhood.

---

## Sequencing notes

- Phases 0 → 2 are strictly ordered. Everything after Phase 2 is independent and can be
  parallelised across sessions or people.
- P2-08 (session recap) is the single highest-value ticket after the shell. It is what turns a
  browsable directory into a product with a loop.
- If you have to cut scope, cut Phase 6 in this order: Venues, Battle, Live.
- `12-map-alt-musicianmap.html` and `13-map-alt-live-overlay.html` have no ticket by design.
  They are reference-only alternate directions.
