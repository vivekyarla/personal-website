# vivekyarla.com — Project Handoff

Personal site of Vivek Yarlagedda. Live at **https://vivekyarla.com**. Local
repo: `/Users/viveky/personal-website-v2` (GitHub: `vivekyarla/personal-website`,
**public repo — never commit secrets or private data**).

## Stack

- **Next.js 16** (App Router, Turbopack) + React 19 + TypeScript.
  ⚠️ Next 16 has breaking changes vs. training data (async `params`/`cookies`,
  etc.) — read `node_modules/next/dist/docs/` before writing Next-specific code
  (see AGENTS.md).
- **Tailwind CSS v4** (CSS-first config in `app/globals.css` via `@theme`).
  Gotcha: Tailwind ships a `.invert` filter utility — that's why dark mode uses
  the class `.dark`, never `.invert`.
- **Supabase** (Postgres) for all dynamic content. Two clients:
  `lib/supabase.ts` (publishable key, RLS-respecting, client-safe) and
  `lib/supabase-admin.ts` (secret key, `import "server-only"` — never import
  into client components).
- **Vercel** hosting + Analytics. Domain `vivekyarla.com` via A/CNAME records.
- **react-tweet** for server-rendered tweet embeds (no widgets.js).
- **Substack RSS** (`vyarla.substack.com/feed`) is the source of truth for
  essays — parsed in `lib/substack.ts`, ISR-cached.

## Build / Deploy

Every change ships the same way:

```bash
cd /Users/viveky/personal-website-v2
npm run build          # must pass before deploying
git add -A && git commit -m "..."
git push
npx vercel@latest --prod --yes
```

The owner prefers deploying straight to prod after a passing build (no preview
step). Env vars live in `.env.local` (local) and Vercel project env (prod):
Supabase URL/keys, `ADMIN_PASSWORD`, `SESSION_SECRET` (must be 32+ chars),
`CAPTURE_TOKEN` (bearer token for the Apple Shortcut), `PASSKEY_*`.

## Pages

- `/` — home. Name (click = dark-mode toggle), live viewer-local clock, bio,
  interests, Writing/Repository buttons, Projects, Experience, socials.
  **Hard scroll-lock**: `HomeViewport` adds `html.home-locked` (overflow hidden
  ≥640px wide). Content must always fit — spacing uses `clamp()` so it
  compresses.
- `/writing` — Ayn Rand quote, `X in · Y out` index, then a **breakout
  two-column band** (`.writing-bleed`, ~58rem) with Inbound (curated readings,
  tag filter chips, expandable highlighter quotes) | Outbound (Substack essays).
- `/writing/[slug]` — essay page rendering Substack HTML (`.prose-editorial`).
  Slightly stale styling; restyle before first publish.
- `/repository` — quotes, `N tweets · M categories` index, collapsible
  **Latest** (defaultOpen, category labels) + collapsible category sections,
  each a full-bleed horizontal tweet carousel with edge fog.
- `/admin` — passkey (TouchID/FaceID) or password auth. Manages inbound
  readings, tweet categories/tweets, and a habit tracker (Today quick-check,
  grid, momentum charts, perfect days). Auth: iron-session cookie +
  SimpleWebAuthn; guarded by `requireAuth()` from `lib/session.ts`.
- `not-found.tsx` — custom 404 ("This page does not exist. What a tragedy.").

## API routes (`app/api/`)

`auth/*` (password, logout, passkey register/login) · `inbound` (+`[id]`) ·
`categories` (+`[id]`) · `tweets` (+`[id]`) — POST accepts admin session OR
`Authorization: Bearer CAPTURE_TOKEN` (used by the iPhone share-sheet Shortcut;
fetches oEmbed, derives post date from the tweet snowflake ID) · `habits`,
`habit-entries`, `habits/reorder` · `geo` (Vercel IP-geo headers for sunset
dark mode).

## Design system (all in `app/globals.css`)

- **Colors as CSS vars**: `--background` (#fff light / #0e0e0e dark),
  `--foreground` (#111 / #fafaf7), `--muted`, `--rule` (hairlines), mapped to
  Tailwind as `bg-background`, `text-muted`, `border-rule`, etc.
- **Dark mode** = `html.dark`, set pre-paint by an inline script in
  `app/layout.tsx`: sunset/sunrise at the viewer's location (cached IP geo from
  `/api/geo`, UTC-offset estimate as fallback). Clicking the name toggles and
  wins for the session (`sessionStorage.themeOverride`).
- **Type**: system SF Pro stack (`--font-sans`); base body `text-[0.9rem]`;
  headings `font-semibold tracking-tight` (h1 `text-2xl`, section h2
  `text-base`); metadata lines `text-[0.72rem] text-muted/80 tabular-nums`,
  tags UPPERCASE `tracking-wide`. Links: `underline decoration-rule
  underline-offset-4 hover:decoration-foreground`.
- **Shared header baseline**: every page's title+clock row sits at
  `pt-[clamp(1.5rem,7vh,6rem)]` so the clock never moves when navigating.
  Back-links are absolutely positioned (`absolute top-6 left-0`) to stay out
  of flow. Any new page must follow this.
- **Quote style**: `leading-relaxed italic text-center text-muted` with curly
  quotes, attribution on a `block not-italic mt-1 text-muted/70` span.

## Signature animations

- **Waterfall**: `.waterfall` on a page root staggers direct children
  (fade + 6px rise) on load. Use on every new page.
- **Spotlight blur** (the site's signature): hovering one item dims (0.3) and
  blurs (2.4px) its siblings; blur-out is slower (.42s) than sharpen (.3s).
  Two implementations:
  - CSS-only: `.blur-group` / `.blur-item` — uses
    `:has(.blur-item:hover) .blur-item:not(:hover)`.
  - JS class-driven (`tw-spot`/`tw-active` via `.tweet-spot-group` items):
    needed wherever content moves under a stationary cursor (carousels,
    scrollable lists) — see `TweetSpotlightGroup.tsx` / `InboundList.tsx`
    (pointer tracking + `elementFromPoint` on scroll frames, mouse-only).
  - Hit areas must tile contiguously (padding inside items, not gaps/margins)
    or the effect resets between items.
- **Collapse/expand**: grid-rows 0fr↔1fr transition (500ms
  `cubic-bezier(0.22,1,0.36,1)`); content wrapper needs `min-h-0
  overflow-y-clip overflow-x-visible` (x-visible lets full-bleed children
  escape; min-h-0 keeps the row collapsible). Wide content fades in place
  (`.fan-body`/`.fan-open`) — no positional animation.
- **Full-bleed carousels**: `.tweet-bleed` (100vw minus 1rem/side, centered via
  negative margin) with permanent backdrop-blur edge fog (`.tweet-edge-*`).
  `body { overflow-x: clip }` guards against sideways scroll.
- Always include `prefers-reduced-motion` fallbacks.

## Conventions & gotchas

- Divider lines between list rows: rows own **both** top and bottom borders
  (`border-t border-b -mt-px first:border-t-0 last:border-b-0` + z-raise on
  the active row) so a spotlighted row keeps both its lines crisp.
- `divide-y` in Tailwind v4 puts borders on the *bottom* of rows — avoid it
  where the spotlight needs crisp framing.
- Dev-only serif experiment: headings include
  `process.env.NODE_ENV === "development" ? "font-serif font-normal" : "font-semibold"`
  ternaries — localhost shows serif, prod shows sans. Preserve when editing.
- Everything must work on mobile (thumb-size targets, no nested scroll traps)
  and in both themes.
- SEO: per-page `metadata` exports, `app/sitemap.ts`, `app/robots.ts`
  (admin/api disallowed + noindex), OG card at `app/opengraph-image.tsx`,
  Person JSON-LD on home, Google site verification in root layout.
- Weekly Supabase backup: `.github/workflows/backup.yml` →
  `scripts/backup-supabase.mjs` → `backups/*.json` (public-content tables
  only; habits/credentials deliberately excluded — public repo).
- Supabase schema changes are run manually by the owner in the Supabase SQL
  editor — provide SQL, wait for confirmation, then ship dependent code.
