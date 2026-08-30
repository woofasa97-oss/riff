# Riff — Canonical Screen Index

The prototype contains 76 screens, but most are repeat design iterations of the same screen
(labelled Riff 2 / Riff 3 / Riff 4 / Riff 6 / Musicianmap in the export). They collapse to the
**28 canonical screens** below.

- `reference/screens/<slug>.html` — **build from these.** One self-contained, previewable file each (~15KB).
- `reference/_variants/` — the 48 superseded iterations. Open one only if a canonical screen is ambiguous.

**Read exactly one canonical screen per ticket.** Never glob the folder.
## Onboarding

| Screen | Route | File | Size | Supersedes |
|---|---|---|---|---|
| **Welcome** | `/welcome` | `01-welcome.html` | 8KB | #60 |
| **Step 1: Location** | `/onboarding/location` | `02-onboarding-location.html` | 11KB | — |
| **Step 2: What do you play** | `/onboarding/instruments` | `03-onboarding-instruments.html` | 13KB | #23, #39 |
| **Step 3: When are you free** | `/onboarding/availability` | `04-onboarding-availability.html` | 12KB | — |
| **Step 4 of 4: Record your first clip** | `/onboarding/clip` | `05-onboarding-clip.html` | 11KB | #7, #61 |
## Map

| Screen | Route | File | Size | Supersedes |
|---|---|---|---|---|
| **Map** | `/map` | `10-map.html` | 14KB | #1 |
| **Map — live jam sheet** | `/map (live-jam sheet open)` | `11-map-live-jam.html` | 15KB | #53 |
| **Discovery Map** | `— (alt design, reference only)` | `12-map-alt-musicianmap.html` | 12KB | #17, #41, #59, #62, #72 |
| **Musicianmap 2** | `— (alt design, reference only)` | `13-map-alt-live-overlay.html` | 18KB | #25 |

- **11-map-live-jam** — Same screen as 10-map with the LIVE JAM bottom sheet raised. Build as a state, not a route.
- **12-map-alt-musicianmap** — Alternate 'Musicianmap' visual direction with a 4-tab bar. Do not build. Useful only for zone-pill styling ideas.
- **13-map-alt-live-overlay** — Alternate direction showing a live jam player docked over the map. Do not build; mine for the watch-live affordance.
## Discover

| Screen | Route | File | Size | Supersedes |
|---|---|---|---|---|
| **Discover** | `/discover` | `20-discover.html` | 20KB | #36, #40, #56 |
| **Request a Jam** | `/musicians/[id]/request` | `21-request-a-jam.html` | 14KB | #16, #45 |
| **Jam Request** | `/requests/[id]` | `22-incoming-jam-request.html` | 13KB | #46 |
| **Post a jam** | `/jams/new` | `23-post-a-jam.html` | 13KB | #35, #58 |

- **22-incoming-jam-request** — Recipient side of 21. Three outcomes: accept / counter-propose / decline.
## Jams

| Screen | Route | File | Size | Supersedes |
|---|---|---|---|---|
| **Jams** | `/jams` | `30-jams-list.html` | 14KB | #19, #37 |
| **Jam details** | `/jams/[id]` | `31-jam-details.html` | 17KB | #9, #48 |
| **Messages** | `/messages` | `32-messages-list.html` | 16KB | #12, #55 |
| **Neo-Soul Session** | `/messages/[threadId]` | `33-message-thread.html` | 14KB | #52, #63 |
| **Notifications** | `/notifications` | `34-notifications.html` | 15KB | #33 |
## Reputation

| Screen | Route | File | Size | Supersedes |
|---|---|---|---|---|
| **Session Recap** | `/jams/[id]/recap` | `40-session-recap.html` | 16KB | #0, #51 |
| **Profile — me** | `/me` | `41-profile-me.html` | 17KB | #66 |
| **Profile — musician** | `/musicians/[id]` | `42-profile-musician.html` | 18KB | #30, #64 |
| **Collaboration Vouches** | `/musicians/[id]/vouches` | `43-vouches.html` | 17KB | — |

- **40-session-recap** — The growth engine. Everything in Reputation depends on this screen existing.
## Live

| Screen | Route | File | Size | Supersedes |
|---|---|---|---|---|
| **Live Session** | `/live/[id]` | `50-live-session.html` | 19KB | #3, #18, #67 |

- **50-live-session** — Includes the 'Rate this Jam' modal in the same file — build modal as a separate component.
  The modal markup carries `class="hidden"`; the prototype revealed it on a click. Delete that
  class to preview it. An inline `NOTE` comment in the file says so.
## Battle

| Screen | Route | File | Size | Supersedes |
|---|---|---|---|---|
| **Battle of the Bands: Finals** | `/battles/[id]` | `60-battle-live-vote.html` | 13KB | #21, #38, #69 |
| **Battle Bracket** | `/battles/bracket` | `61-battle-bracket.html` | 17KB | #11 |
| **Leaderboard** | `/leaderboard` | `62-leaderboard.html` | 18KB | #2, #8 |
| **The Neon Echoes Profile** | `/bands/[id]` | `63-band-profile.html` | 21KB | #20, #34 |

- **63-band-profile** — Shared by Battle and by the Bands tab of Messages.
## Venues

| Screen | Route | File | Size | Supersedes |
|---|---|---|---|---|
| **Venue Detail** | `/venues/[id]` | `70-venue-detail.html` | 15KB | #6, #70 |

## Budget

28 canonical screens, 423KB total (~108k tokens if you read all of them, which you should not).
Average screen is 15KB — about 4k tokens. The original single-file prototype was 6,122KB — 1.7M tokens.
## Alternate tab bars to ignore

Older iterations show `Discover · Messages · My Jams · Profile` or `Explore · Chat · Jams · Me`.
The canonical bar is **MAP · DISCOVER · JAMS · LIVE · ME**. If a reference screen shows a different
bar, that is an artifact of the iteration it came from — use the canonical bar regardless.

## Removed runtime scripts

The prototype shipped small demo scripts that injected extra generated rows at runtime (extra
live-chat lines, extra map list items) and animated decoration. Those scripts were stripped —
they were demo filler, not design. The inline `onclick` attributes that called into them were
stripped with them, so no reference screen contains dangling handlers; the buttons are still
drawn, they are simply inert.

Three canonical files carry an inline `NOTE` comment where this applied:

| File | What was stripped | What was preserved |
|---|---|---|
| `50-live-session.html` | Floating-hearts animation, a fake-comment generator, and the click handler that revealed the rating modal | The modal markup, still `hidden`. The static chat already shows the intended layout |
| `12-map-alt-musicianmap.html` | A `zoneData` object that populated the zone bottom sheet | The zone data itself, written into the NOTE comment — Williamsburg, Greenpoint and Bushwick with their per-instrument counts |
| `13-map-alt-live-overlay.html` | The same `zoneData` pattern, Williamsburg only | Same — kept in the NOTE comment |

Apart from those three, the static markup in every reference screen already shows the full
intended layout.
