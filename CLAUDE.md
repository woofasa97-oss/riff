# Riff

Mobile-first web app that helps musicians find people nearby to play with tonight, turn that into
a confirmed session, and build a reputation from sessions they actually showed up to.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind · zustand · lucide-react.
**Deploy:** one Render web service via `render.yaml`. No database.
**Data:** mock fixtures in `src/mocks/` for v1. No backend yet. Types are written to translate
directly into Postgres tables later — see `docs/DATA-MODEL.md`.

## Context budget — read this first

This repo was generated from a 6MB, 76-screen UX Pilot prototype export. That file is ~1.7M
tokens and **must never be read**. It has already been decoded, deduped, and slimmed into
28 canonical reference screens of ~15KB each.

Rules:

1. **Read one reference screen per task**, the one the ticket names. Never glob
   `reference/screens/`, never read the folder, never read more than three in a session.
2. `reference/_variants/` holds 48 superseded design iterations. **Do not read them** unless a
   canonical screen is genuinely ambiguous and the ticket says to.
3. Colours, fonts, spacing, radii and shadows are all in `docs/DESIGN-SYSTEM.md`. Read that once.
   Never open a reference screen just to look up a style value.
4. Work one ticket at a time from `docs/BUILD-PLAN.md`. `/clear` between tickets.

## Docs

| File | Read it when |
|---|---|
| `docs/SPEC.md` | You need product behaviour, copy, or personas |
| `docs/DATA-MODEL.md` | You are touching types, fixtures, or derived values |
| `docs/DESIGN-SYSTEM.md` | You are writing any UI. Read once, early. |
| `docs/SCREENS.md` | You need the screen → route → file mapping |
| `docs/BUILD-PLAN.md` | Always — it is the ticket list |
| `docs/DEPLOY-RENDER.md` | You are touching the build, the start command, or `render.yaml` |

## Reference screens

`reference/screens/*.html` are self-contained, previewable HTML files (Tailwind + FontAwesome
from CDN). They are **visual reference, not source to copy**. Specifically:

- They use FontAwesome `<i class="fa-solid fa-*">`. The app uses `lucide-react` — translate.
- They use hardcoded strings and demo images. The app uses fixtures from `src/mocks/` and images
  from `public/mock/`.
- Some show an older 4-tab bottom bar. The canonical bar is **MAP · DISCOVER · JAMS · LIVE · ME**.
- Prototype titles sometimes read "Riff 2" / "Riff 4". The product is just **Riff**.

Open one in a browser to see it; read it to extract structure, hierarchy, spacing and copy.

## Conventions

- `src/app/` routes, `src/components/ui/` primitives, `src/components/riff/` domain components,
  `src/mocks/` fixtures + selectors, `src/types/` types, `src/lib/` helpers.
- Server Components by default; `'use client'` only where there is state or an event handler.
- Design viewport is 375×812. Layouts must still be usable up to 768px — centre the column, do
  not stretch cards edge to edge.
- Tailwind tokens over literal hexes. If you need a colour that is not tokenised, add it to
  `tailwind.config.ts` rather than inlining it.
- No new dependencies without a reason stated in the commit message.

## Product rules that are load-bearing

These are not styling preferences — enforce them in code:

1. **Nothing is confirmed until the other person accepts.** A jam request never creates a
   confirmed jam by itself.
2. **Neighbourhood, never address.** Exact addresses render only on jams with status
   `confirmed`, and only to attendees. Map positions are zone-level.
3. **Reputation is earned.** Reliability, repeats and vouches are computed from session recaps.
   Nothing about them is user-editable.
4. **Only confirmed co-attendees can vouch.**
5. **Every terminal screen has an exit** — Skip, Decline politely, Suggest another time,
   Can't make it?

## Definition of done for a ticket

`tsc --noEmit` clean · `npm run build` passes · the screen matches its reference at 375px ·
empty and loading states exist · no hardcoded data outside `src/mocks/`.
