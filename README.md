# roly.top — A modern, fast, and free URL shortener

> Create, share, and measure short links at the edge. Frictionless to start, powerful when you sign in.
> Built with Astro, Svelte, Cloudflare Workers, D1, and Better Auth.

<p>
  <a href="https://roly.top"><img alt="Production" src="https://img.shields.io/badge/prod-roly.top-a3e635?style=for-the-badge&logo=cloudflare&logoColor=white" /></a>
  <img alt="Astro" src="https://img.shields.io/badge/Astro-7-09090b?style=flat-square&logo=astro&logoColor=white" />
  <img alt="Svelte" src="https://img.shields.io/badge/Svelte-5-FF3E00?style=flat-square&logo=svelte&logoColor=white" />
  <img alt="Cloudflare Workers" src="https://img.shields.io/badge/Workers-D1-F38020?style=flat-square&logo=cloudflare&logoColor=white" />
  <img alt="Better Auth" src="https://img.shields.io/badge/Auth-Better_Auth-52525b?style=flat-square" />
  <img alt="Tailwind" src="https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" />
  <img alt="License" src="https://img.shields.io/badge/License-GPL--3.0-65a30d?style=flat-square" />
</p>

**Live site:** https://roly.top · **Source:** https://github.com/roldyoran/shorturl

---

## Table of contents

- [What it is](#what-it-is)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Quickstart](#quickstart)
- [Environment variables](#environment-variables)
- [Usage](#usage)
- [API reference](#api-reference)
- [Data model](#data-model)
- [Internationalization](#internationalization)
- [Design system](#design-system)
- [Testing](#testing)
- [Deployment](#deployment)
- [Security](#security)
- [SEO and discovery](#seo-and-discovery)
- [Available scripts](#available-scripts)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License and authorship](#license-and-authorship)

---

## What it is

**roly.top** is an open-source URL shortener designed for the edge, with two speeds:

1. **No account needed:** paste a long URL and get a short link instantly. Perfect for occasional use, with a free quota and an optional custom alias.
2. **With an account (Google OAuth):** a full dashboard with link management, click analytics, a styled QR code generator, a public links catalog, and an admin panel.

Everything runs on Cloudflare's free tier: **Workers** as the runtime, **D1 (serverless SQLite)** as the database, and static assets served from the edge. No KV, no R2, no infrastructure to babysit.

---

## Features

### Shortening

- Instant creation with no signup, using an anonymous cookie (`anonymous_id`) and a **quota of 10 URLs** per user or session.
- Optional custom alias (`a-z 0-9`, 3–9 characters) with Zod validation and reserved-route protection (`api`, `login`, `dashboard`, `admin`, `es`, `en`, …).
- Automatic claiming: links created anonymously are transferred to your account on sign-in (middleware + `ClaimAnonymousUrlsUseCase`).
- Immediate `302` redirect at `/{slug}`, with background click logging via `waitUntil` so latency is never penalized.

### Private dashboard

| Module | What it includes |
|---|---|
| **Overview** | Time-aware welcome banner, stat cards (total links, total clicks, 7-day clicks, top link), and quick actions. |
| **My links** | Search, copy, open, QR generation, public/private visibility toggle, and delete with confirmation. |
| **Analytics** | Clicks per day (7 / 30 / 90-day ranges), time evolution, and top links. Per-click attributes: country (Cloudflare header), device, browser, and referrer. |
| **QR codes** | Styled generator for any of your links or an arbitrary URL. PNG and SVG downloads with a centered logo. |
| **Public links** | Opt-in catalog: only links the owner marks as public appear here. |
| **Settings** | Profile (display name), language, and sign-out. |
| **Admin** | Global URL and user management (list, search, paginate, change visibility, delete). Restricted by `ADMIN_EMAILS`. |

### Public multi-type QR generator

Available on the landing page with no account. Generates styled QR codes for 9 content types, 100% client-side, nothing is stored:

`URL · Text · WiFi · Contact (vCard) · Email · SMS · Phone · WhatsApp · Location (geo)`

### Platform

- **Bilingual ES/EN** with prefixed routing (`/es`, `/en`), Spanish by default.
- **Light / dark mode** with radial transition and persisted theme.
- **Mobile-first** and responsive across every panel (collapsible sidebar, adaptive grids).
- **Complete SEO:** canonical, Open Graph, `sitemap.xml`, `robots.txt`, `llms.txt`, `humans.txt`, `security.txt`, PWA manifest, and dedicated iconography.

---

## Tech stack

| Layer | Technology | Version |
|---|---|---|
| Web framework | Astro (SSR, `output: server`) | `^7.2.10` |
| Adapter | `@astrojs/cloudflare` | `14.2.5` |
| Interactive UI | Svelte + `@astrojs/svelte` | `5.57.0` |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) | `^4.3.3` |
| Components | Starwind UI (38 Astro components) | `2.1.0` |
| Icons | Tabler Icons | `^3.46.0` |
| Auth | Better Auth + Google OAuth + Drizzle adapter | `^1.7.2` |
| Database | Cloudflare D1 + Drizzle ORM | `~0.45.2` |
| Validation | Zod | `^4.5.4` |
| QR | `qr-code-styling` | `1.9.2` |
| Fonts | Syne (display) · Inter (body) · Space Mono (mono), local `.woff2` | — |
| Language | TypeScript (alias `@/*` → `src/*`) | `^6.0.3` |
| Testing | Vitest (+ coverage v8) | `^4.1.11` |
| Infra | Wrangler + Cloudflare Workers (`nodejs_compat`) | `~4.128.0` |
| Package manager | pnpm (only supported manager) | `10` |

> Runtime requirement: **Node.js ≥ 22.12.0**.

---

## Architecture

The backend follows **clean / hexagonal architecture** with explicit ports and use cases. The frontend combines Astro SSR pages with Svelte islands for interactivity.

```text
                    ┌─────────────── FRONTEND ───────────────┐
                    │  Astro pages (SSR, i18n /es /en)       │
                    │  + Svelte islands (QR, lists, charts)  │
                    │  + Starwind UI + Tailwind v4           │
                    └───────────────┬───────────────────────┘
                                    │ fetch /api/v1/*
                    ┌───────────────▼───────────────────────┐
                    │  HTTP: pages/api + middleware          │
                    │  (session, isAdmin, anon claiming)     │
                    └───────────────┬───────────────────────┘
                                    │
        ┌───────────────────────────▼───────────────────────────┐
        │  APPLICATION (use cases)                              │
        │  create · list · update · delete · redirect           │
        │  claim-anonymous · get-public · get-analytics         │
        │  get-dashboard-summary + quota.service                │
        └───────────────┬───────────────────────┬───────────────┘
                        │                       │
        ┌───────────────▼────────┐  ┌───────────▼────────────┐
        │  DOMAIN                │  │  INFRASTRUCTURE        │
        │  url / click /         │  │  drizzle + D1          │
        │  dashboard entities,   │  │  url/click/dashboard   │
        │  ports + AppError      │  │  repositories + errors │
        └────────────────────────┘  └────────────────────────┘
```

**Applied principles:**

- Use cases never touch D1 directly: they depend on ports (`UrlRepositoryPort`, `ClickRepositoryPort`, `DashboardRepositoryPort`).
- Typed domain errors (`QuotaReachedError`, `UrlNotFoundError`, …) mapped to consistent HTTP responses.
- Edge validation with Zod (`src/shared/schemas`, `src/server/utils/schemas.ts`).
- Pure, testable utilities: `client-ip`, `user-agent`, `rate-limit`, `anonymous`, `guards`, `site`, `links`, `qr-payload`.

**Redirect flow:**

```text
GET /{slug} → validate pattern + reserved codes
           → RedirectUrlUseCase (increments visits)
           → immediate 302
           → waitUntil(insert into clicks: country, device, browser, referrer)
```

**Anonymous → authenticated flow:**

```text
POST /api/v1/urls (no session) → creates URL with sessionId = anonymous_id (cookie)
Sign in with Google            → middleware detects session + cookie
                               → ClaimAnonymousUrlsUseCase assigns userId
                               → clears cookie (single D1 write)
```

---

## Project structure

```text
roly.top/
├── src/
│   ├── pages/
│   │   ├── index.astro            # Redirects to the default locale
│   │   ├── [slug].ts              # 302 redirect + tracking
│   │   ├── es/ | en/              # i18n routes: index, login, dashboard,
│   │   │                          # admin, privacidad/privacy, terminos/terms
│   │   └── api/
│   │       ├── auth/[...all].ts   # Better Auth (GET/POST catch-all)
│   │       └── v1/
│   │           ├── urls/          # Link CRUD
│   │           ├── public-links.ts
│   │           ├── dashboard/summary.ts
│   │           ├── analytics/[urlId].ts
│   │           └── admin/         # urls + users (admin only)
│   ├── components/
│   │   ├── Hero.astro, UrlShortenerCard.astro, UrlTabs.astro, …
│   │   ├── PublicQrGenerator.svelte, PublicUrlsList.svelte, …
│   │   ├── dashboard/             # Sidebar, StatsCards, LinksPanel,
│   │   │                          # AnalyticsCard, QuickActions, …
│   │   └── starwind/              # 38 UI primitives (do not modify)
│   ├── server/
│   │   ├── application/           # Use cases + quota.service
│   │   ├── domain/                # Entities, ports, errors
│   │   ├── infrastructure/        # Drizzle persistence + HTTP errors
│   │   ├── config/                # constants, env, admin
│   │   ├── db/                    # schema, urls, clicks, auth-schema
│   │   └── utils/                 # anonymous, rate-limit, guards, …
│   ├── lib/                       # auth, auth-client, api-client, site,
│   │                              # links, qr-payload, qr-style
│   ├── i18n/                      # ui.ts dictionaries (es/en) + utils
│   ├── layouts/Layout.astro       # SEO, OG, fonts, theme
│   ├── middleware.ts              # Session, isAdmin, anonymous claiming
│   └── styles/starwind.css        # Tokens and Tailwind variants
├── drizzle/                       # Versioned D1 SQL migrations (0000–0005)
├── public/                        # Icons, OG, sitemap, robots, llms.txt, …
├── tests/
│   ├── unit/                      # 24 Vitest suites
│   └── e2e/                       # API + redirects (requires dev server)
├── .github/workflows/             # ci.yml (check + test) · deploy.yaml
├── astro.config.mjs               # SSR + Cloudflare + Svelte + i18n + fonts
├── wrangler.jsonc                 # Local runtime (never commit secrets)
├── wrangler.example.jsonc         # Template for CI/production
├── drizzle.config.ts              # Schema → src/server/db/*.ts
├── DESIGN_SYSTEM.md               # Visual guide and UI patterns
└── AGENTS.md                      # Conventions for agents/contributors
```

---

## Quickstart

### Requirements

- Node.js ≥ 22.12.0
- pnpm 10 (`npm i -g pnpm` if you don't have it)
- A Cloudflare account only for deployment (not needed for local development)

### 1. Install

```sh
pnpm install
```

### 2. Configure the environment

```sh
cp .env.example .env
```

Fill in your `.env` (see [Environment variables](#environment-variables)). For local development, Google OAuth values are enough; D1 runs locally via Miniflare/Workerd with nothing to create in the cloud.

Generate the session secret with:

```sh
openssl rand -base64 32
```

### 3. Local database

```sh
pnpm db:generate
pnpm db:migrate:local
```

### 4. Develop

```sh
pnpm dev
```

Open http://localhost:4321. The project uses managed `astro dev`; when your environment supports it, prefer background mode (`astro dev --background`, `astro dev status`, `astro dev logs`, `astro dev stop`).

### 5. Verify and build

```sh
pnpm check    # Astro/Svelte/TS types
pnpm test     # unit tests
pnpm build    # SSR build (emits dist/server + dist/client)
pnpm preview  # preview the build
```

---

## Environment variables

| Variable | Where it lives | Description |
|---|---|---|
| `PUBLIC_SITE_URL` | `.env` | Public base (canonical/OG, QR fallback). E.g. `http://localhost:4321` in dev, `https://roly.top` in prod. |
| `BETTER_AUTH_URL` | `.env` + `wrangler vars` | OAuth callback base. Must match the real domain. |
| `BETTER_AUTH_SECRET` | `.env` + CI secret | Session secret. Generate with `openssl rand -base64 32`. |
| `GOOGLE_CLIENT_ID` | `.env` + CI secret | OAuth client ID (Google Cloud Console → Credentials → Web application). |
| `GOOGLE_CLIENT_SECRET` | `.env` + CI secret | OAuth client secret. |
| `ADMIN_EMAILS` | `.env` + `wrangler vars` | Comma-separated list of admin emails. |

**Redirect URIs to register in Google Cloud Console:**

```text
http://localhost:4321/api/auth/callback/google
https://roly.top/api/auth/callback/google
```

> In production these values live in `wrangler.jsonc`, generated in CI from `wrangler.example.jsonc` + GitHub secrets. Never commit `.env`, `.dev.vars`, or `wrangler.jsonc` with real secrets.

---

## Usage

### Shorten without an account

1. Go to https://roly.top.
2. Paste your long URL into the main card.
3. Optionally define an alias (`my-alias`).
4. Copy your `roly.top/xxxxxxxxx` and share it.

Free limit: **10 URLs** per browser (anonymous cookie). When you create an account, your links follow you automatically.

### Sign in and dashboard

1. Click **Sign in** and continue with Google.
2. Under `/dashboard` you'll find your overview, links, analytics, and tools.
3. Mark any link as **public** to feature it in the community catalog.
4. Generate styled QR codes and download them as PNG or SVG.

### Admin panel

Restricted to the `ADMIN_EMAILS` list. Available at `/es/admin` and `/en/admin`, with URL and user tabs, search, pagination, and moderation actions.

---

## API reference

Base: `/api/v1`. JSON responses. Typed error codes (`400` validation, `401` unauthenticated, `403` forbidden, `404` not found, `429` quota/rate-limit).

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/urls` | Anonymous / User | Create a link. Body: `{ url, alias?, title? }`. Sets the `anonymous_id` cookie when there is no session. |
| `GET` | `/api/v1/urls` | Anonymous / User | List your own links (by `userId` or `sessionId`), with pagination and search. |
| `GET` | `/api/v1/urls/:id` | Owner | Get a single link. |
| `PATCH` | `/api/v1/urls/:id` | Owner | Edit destination, title, or public visibility. |
| `DELETE` | `/api/v1/urls/:id` | Owner | Delete a link. |
| `GET` | `/api/v1/public-links` | Public | Catalog of links flagged `isPublic`, with search. |
| `GET` | `/api/v1/dashboard/summary` | User | Summary: totals, 7-day clicks, top link. |
| `GET` | `/api/v1/analytics/:urlId` | Owner | Clicks-per-day series + breakdown by country, device, and browser. |
| `GET` | `/api/v1/admin/urls` | Admin | List every URL in the system. |
| `PATCH` / `DELETE` | `/api/v1/admin/urls/:id` | Admin | Moderate or delete any URL. |
| `GET` | `/api/v1/admin/users` | Admin | List registered users. |
| `DELETE` | `/api/v1/admin/users/:id` | Admin | Delete a user and their data. |
| `GET/POST` | `/api/auth/*` | — | Better Auth: session, sign-in, callback, sign-out. |
| `GET` | `/:slug` | Public | 302 redirect + async click logging. |

Creation example:

```sh
curl -X POST https://roly.top/api/v1/urls \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://example.com/a-very-long-article","alias":"my-alias"}'
```

```json
{
  "id": "…",
  "shortCode": "my-alias",
  "shortUrl": "https://roly.top/my-alias",
  "originalUrl": "https://example.com/a-very-long-article"
}
```

---

## Data model

Serverless SQLite (D1) via Drizzle. Versioned migrations in `drizzle/`.

**`urls`** — the shortened link.

| Column | Type | Notes |
|---|---|---|
| `id` | `text` pk | UUID |
| `original_url` | `text` | Validated destination (http/https) |
| `short_code` | `text` unique | 9 chars or alias, dedicated index |
| `user_id` | `text` nullable | Authenticated owner |
| `session_id` | `text` nullable | `anonymous_id` pre-login |
| `is_active` | `boolean` | Soft delete |
| `is_public` | `boolean` | Catalog opt-in (private by default) |
| `title` | `text` nullable | Editable label |
| `visits` | `integer` | Fast counter |
| `claim_token` / `expires_at` | `text` nullable | Reserved for expiry/transfer |
| `created_at` | `text` | ISO-8601 |

**`clicks`** — one event per visit.

| Column | Notes |
|---|---|
| `id` | UUID |
| `url_id` | FK → `urls.id`, indexed |
| `country` | From `request.cf.country` |
| `device` / `browser` | User-Agent parsing |
| `referer` | `referer` header |
| `created_at` | ISO-8601, indexed for time series |

**Auth (Better Auth):** `user`, `session`, `account`, `verification` — generated by the Better Auth CLI and managed with the Drizzle adapter (SQLite).

Business constants (`src/server/config/constants.ts`):

```ts
URL_QUOTA_LIMIT = 10      // free quota per user/session
SHORT_CODE_LENGTH = 9     // length of generated codes
RESERVED_SHORT_CODES      // routes a slug may never occupy
```

---

## Internationalization

- Locales: `es` (default) and `en`.
- `astro.config.mjs` with `prefixDefaultLocale: true`: canonical routes are `/es/…` and `/en/…`; `/` redirects to the detected language.
- Dictionaries in `src/i18n/ui.ts` + helpers in `src/i18n/utils.ts` (`getLangFromUrl`, `useTranslations`).
- Mirrored pages: `index`, `login`, `dashboard`, `admin`, `privacidad/privacy`, `terminos/terms`.

To add a string, declare it in both languages in `ui.ts`; TypeScript (`as const`) catches missing keys at compile time.

---

## Design system

Full guide in [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md). Executive summary:

- **Local typefaces:** Syne (display, 600–800) · Inter (body, 400–700) · Space Mono (mono, 400/700).
- **Color:** lime accent (`#65a30d` in light, `#a3e635` in dark) over warm neutrals. Backgrounds `#ebebef` / `#060606`, base radius `12px`.
- **Components:** Starwind only (`src/components/starwind`, 38 primitives: button, card, dialog, sidebar, table, tabs, toast, tooltip, …). Never edit `ui/`; compose in `features/` and `layout/`.
- **Documented patterns:** stat cards, quick actions, link cards, welcome banner, empty states, CTA, search input, sidebar with "lime glow" active state.
- **Effects rule:** glow, shadows, and hovers only on interactive elements; static cards and banners carry no hover.
- **Iconography:** Tabler Icons, sizes `size-3` → `size-6`.
- **Always mobile-first;** breakpoints `sm 640` · `lg 1024` · dashboard `1100px`.

---

## Testing

Vitest for unit tests, Vitest + `fetch` against the dev server for E2E.

```sh
pnpm test              # unit tests (single run)
pnpm test:watch        # watch mode
pnpm test:coverage     # coverage report
pnpm test:e2e          # E2E (requires pnpm dev running)
```

- `tests/unit/` — **24 suites**: use cases (create, delete, update, list, redirect, claim, analytics, public-links), services (quota, rate-limit), Zod schemas, HTTP/domain errors, utilities (`client-ip`, `user-agent`, `qr-payload`, `links`, `site`, `env`), and deploy config.
- `tests/e2e/` — API contract and real redirects.
- CI (`ci.yml`) runs `pnpm check` + `pnpm test` on every push/PR to `main` and `develop`. E2E runs locally before merging (needs server + OAuth).

> Project convention: all new server-side logic ships with its unit test; every endpoint change updates the E2E suite.

---

## Deployment

100% edge architecture on Cloudflare's **free tier**.

```sh
pnpm build    # Astro SSR → dist/server/entry.mjs + dist/client/
pnpm deploy   # build + wrangler deploy
```

| Piece | Configuration |
|---|---|
| Worker | `dist/server/entry.mjs`, `nodejs_compat`, existing production name reused |
| Assets | `dist/client/` via the `ASSETS` binding |
| Database | D1 (`binding: DB`, `migrations_dir: drizzle`) |
| Images | `IMAGES` binding declared for the adapter |
| Variables | `wrangler.example.jsonc` + GitHub secrets → `wrangler.jsonc` in CI |

D1 commands:

```sh
pnpm db:migrate:local    # apply migrations in dev
pnpm db:migrate:remote   # apply migrations in production
pnpm cf-typegen          # regenerate worker-configuration.d.ts
```

Pipeline (`.github/workflows/`):

- `ci.yml` — checkout, pnpm 10, Node 22, `install --frozen-lockfile`, `check`, `test`.
- `deploy.yaml` — build, `YOUR_*` substitution from secrets, and `wrangler deploy`.

---

## Security

- Google OAuth via Better Auth: 7-day sessions, 5-minute cookie cache, and `useSecureCookies` in production.
- Layered authorization: `middleware` injects `user`/`session`/`isAdmin` into `Astro.locals`; `guards.ts` protects routes and endpoints.
- Quotas and rate limits by identity (user or `anonymous_id`), never by persisted raw IP.
- Strict Zod validation at every boundary; slugs match `^[a-z0-9]{1,9}$` with a reserved list.
- No secrets in the repo: `.env`, `.dev.vars`, and `wrangler.jsonc` are ignored; only `.env.example` and `wrangler.example.jsonc` are committed.
- Headers and policy declared in `public/.well-known/security.txt`; TLS handled by Cloudflare.
- Short links are **not secrets**: they can be guessed by brute force. Never use them for sensitive content (also stated in the Terms).

---

## SEO and discovery

- `Layout.astro` centralizes canonical, Open Graph/Twitter, `og-image.png`, and structured data.
- `public/sitemap.xml`, `robots.txt` (excludes `/api/`, `/dashboard`, `/admin`, `/login`), `site.webmanifest`, and PWA icons (`icon-192/512`, `apple-touch-icon`, `mask-icon`).
- `public/llms.txt` and `public/humans.txt` describe the site for models and humans; `security.txt` exposes the security contact.

---

## Available scripts

| Command | Action |
|---|---|
| `pnpm dev` | Dev server at `localhost:4321` |
| `pnpm build` | Production SSR build to `dist/` |
| `pnpm preview` | Preview the build locally |
| `pnpm check` | Type checking (`astro check`) |
| `pnpm format` | Format with Prettier (Astro + Tailwind) |
| `pnpm test` / `test:watch` / `test:coverage` / `test:e2e` | Test suites |
| `pnpm db:generate` | Generate a Drizzle migration |
| `pnpm db:migrate:local` / `db:migrate:remote` | Apply D1 migrations |
| `pnpm cf-typegen` | Regenerate Worker types |
| `pnpm deploy` | Build + deploy to Cloudflare |
| `pnpm astro ...` | Astro CLI (`astro add`, `astro check`, …) |

---

## Roadmap

- [x] Google auth + Better Auth sessions
- [x] Anonymous mode with quota and login claiming
- [x] URL CRUD + public/private visibility
- [x] Basic analytics (country, device, browser, series)
- [x] Svelte dashboard + admin panel
- [x] Public and private multi-type QR generator
- [x] ES/EN i18n + lime design system
- [ ] Link expiration (by date or by clicks)
- [ ] Password protection
- [ ] Custom domains
- [ ] Export/import (CSV/JSON) and tags
- [ ] Bot detection and advanced analytics
- [ ] Public OpenAPI documentation

Have an idea? Open an issue or a PR — every proposal with tests is welcome.

---

## Contributing

1. Fork and create a branch (`feat/my-improvement`).
2. Use **only pnpm/pnpx** and respect the mobile-first design with Starwind components.
3. Add/update unit tests (and E2E if you touch the API).
4. Run `pnpm check`, `pnpm test`, and `pnpm format` before opening the PR.
5. Describe the change, its impact, and how to test it.

Detailed conventions for contributors and agents in [`AGENTS.md`](./AGENTS.md) and [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md).

---

## License and authorship

- **License:** GNU General Public License v3.0 — see [`LICENCE`](./LICENCE). You are free to use, study, modify, and distribute this software under the GPL-3.0 terms.
- **Author:** [@roldyoran](https://github.com/roldyoran) — design, development, and operation of roly.top.
- **Brand:** `roly.top` · lime green `#a3e635` on black `#09090b` · icon `public/icon.svg`.
- **Thanks:** Astro, Cloudflare, Svelte, Starwind UI, Better Auth, Drizzle, and the open-source community behind this project (Dub, Shlink, Kutt, Sink).

---

<p align="center">
  <strong>roly.top</strong> — shorten, share, measure.<br />
  <a href="https://roly.top">Try it now</a> ·
  <a href="https://github.com/roldyoran/shorturl">Source code</a> ·
  <a href="https://roly.top/es/privacidad">Privacy</a> ·
  <a href="https://roly.top/es/terminos">Terms</a>
</p>
