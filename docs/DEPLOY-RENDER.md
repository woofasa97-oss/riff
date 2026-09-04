# Deploying to Render

`render.yaml` at the repo root is a Blueprint: a **single Node web service** (`riff-web`) running
the Next.js app, with **SQLite on a persistent disk**. There is no separate database service and
no separate API — the app's own API routes talk to `better-sqlite3` in-process.

> If you are looking for the Postgres + Express + Prisma blueprint, that belongs to a different,
> older Riff scaffold. It does not match this repo's architecture — see `CLAUDE.md`.

## The shape of the deploy

| Setting | Value | Why |
|---|---|---|
| `plan` | `starter` | Paid tier is **required**: the free tier has no persistent disks (every deploy would wipe all accounts) and sleeps after ~15 minutes idle. Durability is a launch blocker, not a nice-to-have. |
| `disk` | `riff-data`, mounted at `/var/data`, 1 GB | This is where the SQLite database lives. It is the only stateful thing in the deploy — everything users create (accounts, jams, messages, recaps, reputation) is in this one file. |
| `RIFF_DB_PATH` | `/var/data/riff.db` | Points the app at the disk. Without it, SQLite would land on the ephemeral project filesystem and reset on every deploy. |
| `autoDeploy` | `false` | Deploys are deliberate. Push freely; ship from the dashboard (**Manual Deploy → Deploy latest commit**) when you mean it. |
| `RESEND_API_KEY` | secret (`sync: false`) | Set the value in the Render dashboard, never in the repo. See below. |

## First deploy

1. Push this repo to GitHub.
2. Render dashboard → **New → Blueprint** → select the repo → **Apply**.
3. Render creates `riff-web` with the `riff-data` disk attached and prompts for the one secret
   env var (`RESEND_API_KEY` — you can leave it empty at first; see below).
4. You get `https://riff-web.onrender.com`.

**On first boot** the app creates `/var/data/riff.db` and seeds it **once** from the fixtures in
`src/mocks/` — the demo world, with every timestamp shifted so the scene starts "today". Real
sign-ups join that world. Seed musicians are flagged (`isSeed`) and have no login. Because the
database is on the disk, this seeding happens exactly once: later deploys find the existing file
and leave it alone. **Data survives deploys.**

## What runs on each deploy

| Step | Command |
|---|---|
| Build | `npm ci --include=dev && npm run build` |
| Start | `npm run start` → `next start -p ${PORT:-3000}` |

## The boot guard: unwritable disk fails the deploy

The server **refuses to boot** if `RIFF_DB_PATH` is set but the path is not writable — for
example the disk is missing, detached, or mis-mounted (`src/server/db.ts`). It throws:

```
Riff refuses to start: RIFF_DB_PATH=/var/data/riff.db is not writable.
Fix the disk mount rather than silently serving an ephemeral database.
```

This is deliberate. The failure mode it prevents is worse than downtime: silently booting a
fresh, empty, ephemeral database — users could sign up, create jams, and lose everything on the
next deploy.

**How it shows up in Render:** the deploy's **Logs** show a
`[riff] could not open database at /var/data/riff.db: …` error followed by the
`Riff refuses to start` throw, the process exits, the health check never passes, and the deploy
is marked **failed**. Render keeps the **last healthy release** serving traffic, so existing
users see the old version, not an empty app. To fix it: check that the `riff-data` disk exists
and is mounted at `/var/data` on the service (dashboard → riff-web → **Disks**), then redeploy.

Locally, where `RIFF_DB_PATH` is unset, the app defaults to `./data/riff.db` (gitignored) and
may fall back to the OS temp dir with a logged warning — ephemerality is the stated deal only
when the variable is not configured.

## RESEND_API_KEY (password-recovery email)

Signup collects an optional recovery email; reset codes are delivered by email via Resend
(`src/server/email.ts`). The key is declared in `render.yaml` with `sync: false`, which means
**the value lives only in the Render dashboard**:

1. Create an API key at [resend.com](https://resend.com).
2. Render dashboard → riff-web → **Environment** → set `RESEND_API_KEY` → **Save** (this
   triggers a restart; with `autoDeploy: false` nothing else redeploys).
3. Once you have a verified sending domain, also add `RIFF_EMAIL_FROM` in the dashboard, e.g.
   `Riff <no-reply@yourdomain.com>`.

Until the key is set, reset codes are issued but not delivered anywhere — accounts without a
working email path cannot self-recover. There is **no preview backdoor**: codes are never
returned over HTTP, and the reset response is identical whether or not the account exists, so
usernames cannot be enumerated. A reset always requires BOTH the username AND the account's
matching recovery email — a username alone can never reset an account.

## Verify after deploy

Run this checklist against the live URL after every meaningful deploy:

1. **Sign up** with a fresh username; you land in the app with a real account.
2. **Post a jam** (an open call is fine); it appears in the feed.
3. **Redeploy** from the dashboard (Manual Deploy → Deploy latest commit).
4. **Sign back in** — your account still exists and the jam is **still there**. If it is not,
   the database is not on the disk: check `RIFF_DB_PATH` and the disk mount before anything else.

## Gotchas that will actually bite

- **`--include=dev` is load-bearing.** `tailwindcss`, `postcss`, `autoprefixer` and `typescript`
  are devDependencies, and `next build` needs all four. If anything sets `NODE_ENV=production`
  on the service, a plain `npm ci` silently omits them and the build dies with
  `Cannot find module 'tailwindcss'`. This is why `render.yaml` deliberately does **not** set
  `NODE_ENV` — `next build` always produces a production build and `next start` always serves
  one, so the variable buys nothing and breaks the install.
- **`package-lock.json` must be committed.** `npm ci` fails without it. It is not gitignored;
  keep it that way.
- **Bind to `$PORT`.** Render sets it (10000 by default). The `start` script reads it. A
  hardcoded `next start` on port 3000 would pass the build and then fail the health check.
- **One instance only.** SQLite is per-process. Never scale `riff-web` horizontally; when that
  day comes, the schema is written to translate 1:1 to Postgres (`docs/DATA-MODEL.md`).
- **Node version is pinned** to 22 via `NODE_VERSION`, and `engines` in `package.json` says
  `>=20 <23`. Change both together.
- **`autoDeploy` is off.** A push to `main` does NOT ship. If "why isn't my change live"
  ever comes up, this is why — deploy from the dashboard.
- **`reference/` ships in the deploy.** It is ~1.1MB of static HTML that Next never serves and
  never bundles, so it costs build time only. If that ever matters, add it to `.dockerignore` or
  move the pack to its own branch — do not delete it.

## Accounts and secrets

Riff has real username + password accounts. Sessions are random tokens stored hashed in the
database, so there is no signing key to manage; passwords are scrypt-hashed with per-user salts.
The only secret the deploy needs is `RESEND_API_KEY` (above).

## Guest mode

The app is browsable without an account. A signed-out visitor gets a read-only "guest snapshot"
(public musicians, open calls, completed history, the competition, the map — no private data,
no addresses). `middleware.ts` lets guests roam; the store gates every ACTION behind sign-up
(the `requireAccount` prompt), and the API refuses any mutation without a session. So guest
mode is safe by construction: the client makes browsing pleasant, the server enforces the wall.

## The competition and Riff Credits (mock currency)

The season is a paid competition — pay an entry fee to enter, the prize pool is base + all fees,
top places split it at season end into the winners' wallets. **Riff Credits are mock money.**
There is no payment processor, no real cash, and nothing collects card details — new accounts
are simply granted a starting balance (`SIGNUP_GRANT_CREDITS`). This is deliberate: it lets
people try the pay-to-enter / win-a-prize loop end to end without any real-money surface. If
Riff ever takes real entry fees, that is a separate, regulated build (payments, KYC, payouts)
and must not reuse this mock ledger as-is. The wallet lives in the `wallets` / `wallet_txns`
tables; entries and payouts in `competition_entries`; settlement is in `settleSeason`
(src/server/world.ts), which currently ranks by entry order as a stand-in for real bracket
results.

## Custom domain

Add it on `riff-web` in the Render dashboard. Nothing else in this repo needs to change.

## Map tiles

The map screen (`/map`) draws a real basemap with Leaflet. Tiles come from
`tile.openstreetmap.org`, which needs no API key — the app ships with no map credentials and
nothing to configure on Render.

That is fine for a prototype and wrong for production. OSM's
[tile usage policy](https://operations.osmfoundation.org/policies/tiles/) rules out heavy or
commercial traffic against those servers. Before this takes real load, swap the tile URL in
`src/components/riff/ZoneMap.tsx` for a keyed provider and add the key as an environment
variable here:

- **CARTO Positron** matches the design system's muted palette best, and is what the prototype
  screens were designed against. It now watermarks every tile unless you hold a key.
- **Stadia**, **MapTiler** and **Mapbox** are the usual alternatives, all keyed.

If you move to a provider whose palette is already muted, drop the
`.riff-map .leaflet-tile-pane` desaturation filter in `globals.css` — it exists only to bring
OSM's default styling back in line with the rest of the app.

**What never changes:** the map renders neighbourhoods, never people. `MapZone.center` is the
only geography in the data, and musicians carry no coordinates at all — see `src/lib/privacy.ts`
and `docs/SPEC.md` §5.2.
