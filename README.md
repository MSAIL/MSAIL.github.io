# MSAIL website

The site for the **Michigan Student Artificial Intelligence Lab** (MSAIL) at the
University of Michigan, built as a fully static export for GitHub Pages at
<https://msail.github.io>.

## Stack

- **Next.js 16** (App Router) with `output: "export"` — `next build` emits the
  whole site as static HTML into `./out`. No server.
- **Tailwind CSS v4** — design tokens (colors, type scale, spacing) live in
  [`src/app/globals.css`](src/app/globals.css) under `@theme`.
- **Typed content layer** — all copy, links, rosters, talks, and resources live
  in [`src/data/`](src/data/) so future maintainers can edit content without
  touching React. Each migrated item carries a provenance `Flag`
  (`verified` / `stale` / `unverified` / `awaiting`) — see
  [`src/data/content-status.ts`](src/data/content-status.ts). Flag notes are
  internal; pages render the separate user-facing `notice` strings.
- **Fonts** — Inter (body), Anton (display, single weight), IBM Plex Mono
  (labels) via `next/font`.

## Develop

```bash
npm install
npm run dev      # dev server at http://localhost:3000
```

## Build & preview

```bash
npm run build    # static export → ./out
npm run start    # serve ./out locally (what GitHub Pages will serve)
```

> `next start` does not work with `output: "export"`; `npm run start` serves
> the static artifact instead.

## Deploy

Pushes to `main` build and publish `./out` to GitHub Pages via
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). For the root
domain, the repo must live at `MSAIL/MSAIL.github.io` with Pages set to
**GitHub Actions** (Settings → Pages → Build and deployment). There is no
`basePath`; `trailingSlash: true` emits `/about/index.html`-style paths, and
`public/.nojekyll` keeps Pages from mangling `_next/` assets.

## Checks

```bash
npx tsc --noEmit   # types
npm run lint       # eslint
```
