# Riff — handoff pack

Everything Claude Code needs to build Riff from the UX Pilot prototype, **without ever loading
the prototype**.

## The problem this solves

`riff-prototype.html` is a single 6,122KB file — 76 screens, each carrying ~40KB of duplicated
Tailwind config and inlined FontAwesome SVGs, the whole thing base64-encoded inside `<script>`
tags. That is roughly **1.7 million tokens**. No session can hold it, which is why Claude Code
balked.

This pack decodes it and throws away everything that is not signal:

| | Before | After |
|---|---|---|
| Files | 1 | 28 canonical screens + 48 archived variants |
| Total size | 6,122 KB | 423 KB canonical (~108k tokens) |
| Per screen | 60 KB decoded | 15 KB avg (~4k tokens) |
| Read per task | all of it | one screen, ~4k tokens |

What was removed: base64 wrapper, per-screen Tailwind config (now one shared doc), inlined
FontAwesome SVGs converted back to `<i class="fa-solid fa-*">`, `contenteditable` attributes,
the prototype's navigation-blocking script, and 48 duplicate design iterations of screens that
already had a better version.

Nothing visual was lost — every reference screen still opens in a browser and looks right.

## What's here

```
riff/
├── CLAUDE.md              — auto-loads in Claude Code. Contains the context rules.
├── docs/
│   ├── SPEC.md            — product: features, flows, copy, personas, principles
│   ├── DATA-MODEL.md      — TypeScript types + fixture requirements
│   ├── DESIGN-SYSTEM.md   — tokens, type, spacing, component inventory
│   ├── SCREENS.md         — 28 screens → routes → files, with a dedupe map
│   └── BUILD-PLAN.md      — 34 tickets in 7 phases, each session-sized
└── reference/
    ├── screens/           — 28 canonical screens. Build from these.
    └── _variants/         — 48 superseded iterations. Archive; don't read.
```

## Running it

Phase 0 ticket `P0-01` is done — the Next.js app is scaffolded and the design tokens are wired
in. Everything else is still to build.

```bash
npm install
npm run dev          # http://localhost:3000
```

Other scripts: `npm run typecheck` · `npm run build` · `npm run lint` · `npm run format`.

## Deploying

`render.yaml` is a Render Blueprint for a single Node web service. Push to GitHub, then
Render dashboard → New → Blueprint → pick the repo → Apply. No env vars to set, no database.
See `docs/DEPLOY-RENDER.md` for what runs and what breaks.

## Working the build plan

Open the repo in VS Code, then in the Claude Code terminal:

```bash
claude
```

Then, one at a time:

```
Do ticket P0-02 from docs/BUILD-PLAN.md
```

`/clear` between tickets. That single habit is what keeps context flat across the whole build.

## Rules of thumb

- **One ticket per session.** The plan is designed around it.
- **Never let a session read more than three reference screens.** If a task seems to need more,
  the task is too big — split it.
- **Don't copy the reference HTML.** It's FontAwesome + hardcoded strings. Extract structure,
  hierarchy and copy; write real components against `src/mocks/`.
- **Keep the original prototype outside the repo** (or in `.gitignore`) so nothing can
  accidentally read it.

## Preview a screen

Reference screens are self-contained — open any of them directly in a browser, or:

```bash
npx serve reference/screens
```

Set the browser to 375×812 to see them as designed.
