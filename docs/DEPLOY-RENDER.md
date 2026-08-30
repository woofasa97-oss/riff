# Deploying to Render

`render.yaml` at the repo root is a Blueprint. v1 is a **single Node web service** running the
Next.js app — no database and no API, because all data comes from fixtures in `src/mocks/`.

> If you are looking for the Postgres + Express + Prisma blueprint, that belongs to a different,
> older Riff scaffold. It does not match this repo's architecture — see `CLAUDE.md`.

## First deploy

1. Push this repo to GitHub.
2. Render dashboard → **New → Blueprint** → select the repo → **Apply**.
3. Render creates one service, `riff-web`, and gives you `https://riff-web.onrender.com`.

There are no environment variables to fix up by hand and nothing to seed. That is the whole
benefit of the mocks-only v1 — the first deploy either works or fails on the build, with no
half-configured middle state.

## What runs on each deploy

| Step | Command |
|---|---|
| Build | `npm ci --include=dev && npm run build` |
| Start | `npm run start` → `next start -p ${PORT:-3000}` |

Verified locally against a clean `node_modules`: build succeeds and the server answers `200` on
`PORT=10000`, which is the port Render injects.

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
- **Free services sleep** after ~15 minutes idle; the next request takes 30–60s to wake. Fine
  for review, not for a user test.
- **Node version is pinned** to 22 via `NODE_VERSION`, and `engines` in `package.json` says
  `>=20 <23`. Change both together.
- **`reference/` ships in the deploy.** It is ~1.1MB of static HTML that Next never serves and
  never bundles, so it costs build time only. If that ever matters, add it to `.dockerignore` or
  move the pack to its own branch — do not delete it.

## When the API arrives

Add the database and the API service to `render.yaml` alongside `riff-web`, and wire
`NEXT_PUBLIC_API_URL` with `fromService`. Two things to know before you do:

- Render's `property: host` yields a bare hostname (`riff-api.onrender.com`), not an origin.
  Anything that needs a scheme must add `https://` itself, or you set the full value by hand.
- `NEXT_PUBLIC_*` is inlined at **build** time. Changing it requires a rebuild of `riff-web`,
  not a restart.

## Custom domain

Add it on `riff-web` in the Render dashboard. Nothing else in this repo needs to change while
v1 is mocks-only.

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
