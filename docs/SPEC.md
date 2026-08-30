# Riff — Product Spec

Derived from `riff-prototype.html` (76 UX Pilot screens, deduped to 28 canonical screens).

## 1. What Riff is

A mobile-first web app that helps musicians **find people nearby to play with tonight**, turn that
into a confirmed session, and build a reputation from sessions they actually showed up to.

Tagline from the prototype: *"Find your people. Play tonight."*

The product has one core loop and three supporting pillars.

**Core loop**

```
Discover a musician  →  Send a jam request  →  Other side accepts
        →  Jam confirmed (details + group thread)  →  Play
        →  Session recap: mark attendance + vouch  →  Reputation goes up
        →  Higher reliability = more requests = loop repeats
```

**Pillars**

| Pillar | What it adds |
|---|---|
| Map | Spatial discovery — who is nearby, which neighbourhoods are hot, which jams are live now |
| Live | Broadcast a jam, viewer chat, session ratings |
| Battle of the Bands | Seasons, brackets, live voting, city leaderboards |
| Venues | Rehearsal/live rooms with rates, backline, bookable slots |

## 2. Personas in the seed data

Keep these as fixture names — every screen references them, so consistent fixtures make the
whole app feel real immediately.

- **Marcus Chen** — the logged-in user. Drums · Jazz / Neo-Soul / Fusion. Williamsburg, Brooklyn. 98% reliability, 15 repeat jams, 24 vouches, #14 in Brooklyn Jazz Scene.
- **Sarah Jenkins** — Bassist · Indie / Rock. Queens, 3.4 mi. Verified, 4 jams hosted, 94% reliability.
- **Leo Rossi** — Keys · Neo-Soul. 91–92% reliability.
- **Nina Alvarez** (Vocals), **Theo Park** (Guitar), **Ruby Sims**, **David Chen** — leaderboard names.
- **Bands:** The Neon Echoes (Indie Rock, Brooklyn — Sarah/Marcus/Leo + open Keys seat), Velvet Static (Post-Punk, London), Lunar Resonance, Dust Radio, Paper Cranes, Iron Belle.
- **Venues:** Sonic Basement (Greenpoint, 0.9 mi, 4.8★, 62 jams, $18/hr), The Attic.
- **Recurring jam:** "Neo-Soul Session" — Fri 7:00 PM at Sonic Basement, Casual Jam, Marcus + Sarah + Leo.

## 3. Navigation

Five-tab bottom bar, present on every non-onboarding, non-modal screen:

```
MAP · DISCOVER · JAMS · LIVE · ME
```

Some prototype variants show an older 4-tab bar (`Discover · Messages · My Jams · Profile`) or
(`Explore · Chat · Jams · Me`). **The 5-tab bar is canonical.** Ignore the others.

Screens reached by push, not by tab:

- Musician profile, band profile, venue detail
- Jam details, message thread, notifications
- Request a jam, incoming jam request, post a jam
- Session recap, vouches, leaderboard, bracket

## 4. Feature specs

### 4.1 Onboarding (5 screens)

Welcome → 4 steps → land on Map.

1. **Welcome** — wordmark over a rehearsal-room photo. `Create your player card`, Continue with Apple, Continue with Google, `I already have an account`. Footer reassurance: *"Riff shows you musicians near you. You choose who sees you."*
2. **Step 1 — Location.** Pick a home patch (Williamsburg / Greenpoint / Bushwick / Bed-Stuy / Fort Greene) + travel-radius slider 1–10 mi (default 3). Privacy line: *"Riff only ever shows your neighbourhood, never your address."*
3. **Step 2 — What do you play.** Multi-select instruments (Drums, Bass, Keys, Guitar, Vocals, Sax, Synth, Percussion), multi-select genre lanes (Jazz, Neo-Soul, Fusion, Indie, Rock, Funk, Hip-Hop), single-select intent (Casual Jam / Serious Project / Gigging).
4. **Step 3 — When are you free.** 7×3 grid (days × Morn/Aft/Eve), a free-text availability blurb, and a *"Show me as available tonight"* toggle that auto-expires at midnight.
5. **Step 4 — Record your first clip.** 24-second audio capture with waveform, re-record / play back / trim, `Skip for now`. Copy: *"Musicians with a clip get 3x more jam requests."*

State is accumulated across steps and only persisted on completion. Every step has Back/Continue and steps 3 and 4 are skippable.

### 4.2 Map

- Stylised neighbourhood map (not a real basemap in the prototype) with zone pills: `Williamsburg · 20 MUSICIANS`, `Greenpoint · 1 Jam Live · 9 MUSICIANS`, `Bushwick · 14 MUSICIANS`, plus a "Me" marker.
- Filter row: `Tonight`, `All musicians`, `Bass`, `Drums`, `Keys`.
- Bottom sheet summarising the selected zone: *"20 musicians nearby · 0.6–1.4 miles away"*.
- **Live jam state:** a red `LIVE JAM` card slides up — venue, "started 20 min ago", member avatars, "Listening in · 34", `Get directions` / `Watch live`.
- Two alternate map designs exist in `_variants/` (Musicianmap). Build the canonical one; the alternates are useful reference for the live-jam overlay only.

**Privacy rule that must survive into code:** never expose exact coordinates. Zone-level only.

### 4.3 Discover

Vertical feed of musician cards, filtered by intent chips (`All`, `Casual Jam`, `Serious Project`, `Gigging`).
Header: *"Who's free tonight? — 12 musicians nearby ready to jam"*.

Musician card contains: avatar, name, `DRUMMER · JAZZ / FUSION`, a badge (`TOP RELIABILITY · 12 repeat jams` or `VERIFIED · 4 jams hosted`), an intent tag, an inline **audio clip player with duration** (0:24), distance (`Brooklyn, 1.2 mi`), availability summary (`Free Tue, Thu, Sun`), and `View profile` / `Request jam`.

Interleaved **Open Call** card: posted-time, title (*"Looking for Keys for a Neo-Soul Session"*), pitch quote, host names, date/time, `Apply to join`.

### 4.4 Jam requests

**Outgoing — Request a Jam.** Target musician header (name, instrument, reliability %). Pick a vibe (Casual / Serious / Gigging) → suggest a time (three chips drawn from the target's availability, each labelled "He is free") → where (venue chips + `Suggest a place`). Reassurance: *"Nothing is confirmed until Marcus accepts."* → `Send jam request`.

**Incoming — Jam Request.** Requester card with VERIFIED badge, their message in quotes, WHEN / WHERE / VIBE blocks, their audio clip, their vouch tags. Three actions: `Accept and confirm`, `Suggest another time`, `Decline politely`.

**Post a Jam.** Toggle `Open call` / `Private invite`. Roles wanted (multi-select instruments), vibe, when (date + time + duration), where (venue with change), who is already in (existing members + open seats), free-text message. `Save draft` / `Post open call`.

### 4.5 Jams & messaging

- **Jams list** — tabs `Upcoming` / `Requests (2)` / `Past`. Upcoming cards: title, day+time, venue, attendee avatars `+1`, `Message group` / `Directions`, or a pending state `Awaiting 1 reply`. Section: *"Open calls you applied to"* with `Pending` status.
- **Jam details** — venue header image, title, vibe tag, `Confirmed` badge, `Tonight 7:00 PM`. WHO IS COMING (each with instrument + reliability %). LOCATION (street address + `Directions`). THREAD preview with `View all`. Actions: `Message group`, `Go live`. Escape hatch: *"Can't make it?"*
- **Messages list** — filter tabs `All / Jams / Requests / Bands`. Rows carry a context label (`NEO-SOUL SESSION · FRI`, `JAM REQUEST`, `VENUE`).
- **Message thread** — pinned jam header (title, `Fri 7:00 PM · Sonic Basement`, `Details` link), grouped messages by day, system events inline (*"Sarah accepted · Tue 12 Nov"*).
- **Notifications** — tabs `All` / `Requests`; grouped `TODAY` / `EARLIER`. Types: request accepted, vouch received, open-call application, leaderboard movement, band went live.

### 4.6 Reputation

Three numbers define a musician and all three are *earned*, never self-reported:

| Metric | Earned by |
|---|---|
| **Reliability %** | Being marked "Showed up" in session recaps |
| **Repeat jams** | Playing with the same person more than once |
| **Vouches** | Tags given by confirmed co-attendees |

- **Session recap** (the growth engine — fires after a jam ends). "How was it? — Neo-Soul Session at Sonic Basement · 1h 42m". Attendance toggles per attendee. Vouch tag picker per person: `#GreatPocket #ListenFirst #EarlyBird #ProVibe #GoodEnergy`. Optional recording save, gated on *"All three players agreed to publish"*. `Skip` / `Post recap`. Footer: *"This is what builds your reliability, repeats and vouches."*
- **Vouches screen** — total (24 from 19 musicians), tag histogram with counts, filter chips per tag, list of vouch cards (voucher, sessions together, date, instrument, quote, tags). Integrity line: *"Only musicians who were confirmed in a session can vouch."*
- **Profile — me** — avatar, name, instrument/genre line, neighbourhood, three stat tiles, `Edit your player card`, YOUR CLIP with `Replace clip`, YOUR AVAILABILITY grid with `Edit`, THIS SEASON rank card, then a settings list: Your bands, Saved musicians, Past jams, Settings and privacy, Safety centre.
- **Profile — other musician** — same identity header, season ranking card, PAST JAMS with playable recordings and duration scrubbers, VOUCHES preview + `See all collaborator feedback`, AVAILABILITY grid, sticky footer `Message` / `Request jam`.

### 4.7 Live

- Full-bleed video, `LIVE` pill, band name, `8.4k watching`, `Follow`.
- Stat overlay: `4.9 Session rating`, `Legendary Reputation`.
- Scrolling chat with a bottom composer (`Add a comment...`).
- **Rate this Jam** modal on session end: star input, *"Your feedback helps musicians build their reputation on Riff."*, `Submit Rating` / `Not now`.

### 4.8 Battle of the Bands

- **Live battle** — split-screen A/B, `14.2k watching`, stage label, per-side band card (name, genre · city), `Vote A` / `Vote B` with a live percentage bar (48% / 52%), live chat.
- **Bracket** — scope tabs `Brooklyn` / `Global` / `My matches`; Quarter Finals → Semi Finals → Final → Champion, each match showing both bands and vote splits. Final row has a `LIVE · Watch now` state. Footer: `YOUR RUN` — result summary (*"The Neon Echoes — Quarter finalist, beat Dust Radio 61 / 39"*).
- **Leaderboard** — scope selector `Brooklyn / Jazz Scene / Season 4`, a podium for ranks 1–3, then a table (rank, name, rank-delta, instrument+genre, points). The current user's row is pinned/highlighted. Nudge: *"You are 40 points from the top 10"* + `How points work`.
- **Band profile** — cover, name, genre · city, season badge, `Follow` / `Message`, stats (12 sessions, 4.8 rating, 2.1k followers), MEMBERS (with reliability % and an `Open seat · Keys — Apply` row), LISTEN (recordings with durations), BATTLE HISTORY (opponent, score, Won/Lost).

### 4.9 Venues

Venue detail: hero image with a `LIVE JAM ON NOW` banner, name, *"Rehearsal room and live space · Greenpoint, Brooklyn · 0.9 mi"*, stats (4.8 rating / 62 jams hosted / $18 per hr), amenity chips (Backline provided, Drum kit, PA system, Open till 2am), WHO IS PLAYING HERE (band on now + upcoming musician), BOOK A ROOM slot picker (Tonight 9:00 PM / Fri 7:00 PM / Sat 2:00 PM with a SELECTED state), `Message venue` / `Book this slot`.

## 5. Product principles visible in the copy

Preserve these — they are the product's voice, and they are load-bearing:

1. **Nothing is confirmed until the other person accepts.** Requests are proposals, never bookings.
2. **Neighbourhood, never address.** Location is always zone-level until a jam is confirmed.
3. **Reputation is earned, never claimed.** Only confirmed co-attendees can vouch.
4. **Low-pressure by default.** *"Nobody is auditioning."* / *"Pick something loose."*
5. **Every dead end has an exit.** Skip, Decline politely, Suggest another time, Can't make it?

## 6. Out of scope for v1

Payments/payouts, venue-side admin, real audio/video infrastructure (stub the players), push
notifications, and moderation tooling beyond the Safety centre link.
