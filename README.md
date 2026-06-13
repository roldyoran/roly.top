<h1 align="center">SHORTURL</h1>

<p align="center">by roldyoran</p>

> **Español**: [Documentación en español](./docs/README.es.md)

> **Note**: This repository includes a **backend** (URL shortener API with authentication) and a **frontend** (Vue 3 SPA with Google OAuth login). The backend uses **Better Auth** for authentication with Google OAuth and role-based access control.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Authentication](#authentication)
- [Local Development](#local-development)
- [Monorepo Layout](#monorepo-layout)
- [API Usage](#api-usage)
- [Routing & Redirect Behavior](#routing--redirect-behavior)
- [Error Format](#error-format)
- [Tests](#tests)
- [Deploy to Cloudflare Workers](#deploy-to-cloudflare-workers)
- [Useful Commands](#useful-commands)
- [Frontend (Vue 3)](#frontend-vue-3)
- [Architecture](#architecture)

---

## Prerequisites

- [Bun](https://bun.sh) ≥ 1.0
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) ≥ 4.0 (included as devDependency)
- A Cloudflare account with a D1 database created
- A Google Cloud project with OAuth 2.0 credentials

---

## Installation

```bash
# 1. Clone the repository
git clone git@github.com:roldyoran/shorturl.git
cd shorturl

# 2. Install dependencies
bun install
```

---

## Configuration

### 1. Backend environment variables

Create `backend/.env`:

```env
# Cloudflare D1
DEV_MODE=true
SERVICE_ADMIN_API_KEY=your_secret_api_key

# Better Auth
BETTER_AUTH_SECRET=your_32char_secret_here
BETTER_AUTH_URL=http://localhost:8787
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Optional: comma-separated frontend origins for production
# TRUSTED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

### 2. Frontend environment variables

Create `frontend/.env`:

```env
# Leave empty to use Vite proxy in dev (same-origin, cookies work)
VITE_API_KEY=your_service_admin_api_key
```

> **Important**: Do NOT set `VITE_API_BASE_URL` in development. The Vite proxy handles routing to the backend.

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add `http://localhost:8787/api/auth/callback/google` as authorized redirect URI
4. Copy Client ID and Client Secret to `backend/.env`

### 4. Wrangler — D1 binding

Edit `backend/wrangler.jsonc` and replace the `database_id` with your D1 database ID:

```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "shorturl",
      "database_id": "<your-database-id>"
    }
  ]
}
```

### 5. Database migrations

```bash
# Apply migrations to local D1 (development)
bun run db:migrate:local

# Apply migrations to remote D1 (production)
bun run db:migrate:remote
```

---

## Authentication

The project uses **Better Auth** with Google OAuth for authentication and the **Admin plugin** for role-based access control.

### How it works

1. User clicks "Sign In" in the frontend
2. Frontend calls `POST /api/auth/sign-in/social` → backend redirects to Google
3. Google authenticates → redirects back to `GET /api/auth/callback/google`
4. Backend creates/updates user in `users` table, sets session cookie
5. Frontend reads session via `GET /api/auth/get-session`

### Roles

| Role | Permissions |
|------|-------------|
| `user` | Create own URLs, view own URLs |
| `admin` | All user permissions + public URL listing + admin endpoints |

### Making a user admin

After a user signs in with Google for the first time:

```bash
curl -X POST http://localhost:8787/v1/admin/setup/make-admin \
  -H "Authorization: Bearer your_service_admin_api_key" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

Then the user must **sign out and sign in again** to get the updated role in their session.

### Admin plugin endpoints

Managed by Better Auth at `/api/auth/admin/*`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/admin/create-user` | Create a new user |
| POST | `/api/auth/admin/set-role` | Change user role |
| GET | `/api/auth/admin/list-users` | List all users |
| POST | `/api/auth/admin/ban-user` | Ban a user |
| POST | `/api/auth/admin/unban-user` | Unban a user |

---

## Local Development

```bash
# From the repo root — runs both frontend and backend:
bun run dev:back       # backend on http://localhost:8787
bun run dev:front      # frontend on http://localhost:5173
```

The Vite dev server proxies `/api/*` and `/v1/*` requests to the backend, maintaining same-origin for cookies.

---

## Monorepo Layout

```
shorturl/
├── backend/                  # Hono + Cloudflare Workers + Better Auth
│   ├── src/
│   │   ├── auth/             # Better Auth configuration
│   │   ├── domain/           # Entities and repository ports
│   │   ├── application/      # Use cases
│   │   ├── infrastructure/   # Repository implementations
│   │   ├── presentation/     # HTTP routes (v1, redirect)
│   │   ├── db/               # Drizzle schema (urls + auth tables)
│   │   └── utils/            # CORS, context, schemas
│   ├── tests/                # Unit tests (bun:test)
│   ├── drizzle/              # SQL migrations
│   └── wrangler.jsonc        # Worker config (D1, Assets, env)
├── frontend/                 # Vue 3 + Vite SPA
│   ├── src/
│   │   ├── api/              # Axios client, API functions
│   │   ├── lib/              # Better Auth client
│   │   ├── stores/           # Pinia stores (auth, urls)
│   │   ├── composables/      # useAuth, useUrlShortener
│   │   ├── components/       # UI components
│   │   └── views/            # Page views
│   └── dist/                 # Built static assets
├── docs/                     # Translations & extra docs
└── package.json              # Root scripts (workspaces)
```

---

## API Usage

### shortCode rules

- 1 to 9 characters
- Lowercase alphanumeric only: `[a-z0-9]+`
- Auto-generated if not provided on create
- Generated with `crypto.getRandomValues()` (cryptographically secure)

### Public endpoints (no auth)

#### List public URLs (admin users only)

```bash
curl http://localhost:8787/v1/urls/public
```

Returns URLs created by users with `role: "admin"`.

### Authenticated endpoints (require session cookie)

#### Create a short URL

```bash
curl -X POST http://localhost:8787/v1/urls \
  -H "Content-Type: application/json" \
  -d '{"originalUrl": "https://www.epicgames.com"}'
```

```json
{
  "id": 1,
  "originalUrl": "https://www.epicgames.com",
  "shortCode": "c04jzv",
  "createdAt": "2026-03-03T19:02:53.404Z",
  "visits": 0,
  "userId": "user_id_here"
}
```

#### List my URLs

```bash
curl http://localhost:8787/v1/urls
```

#### Get a URL by shortCode

```bash
curl http://localhost:8787/v1/urls/c04jzv
```

### Admin endpoints (require API key)

#### Delete a URL

```bash
curl -X DELETE http://localhost:8787/v1/admin/urls/c04jzv \
  -H "Authorization: Bearer your_service_admin_api_key"
```

#### Delete all URLs

```bash
curl -X DELETE http://localhost:8787/v1/admin/urls \
  -H "Authorization: Bearer your_service_admin_api_key"
```

#### Make user admin

```bash
curl -X POST http://localhost:8787/v1/admin/setup/make-admin \
  -H "Authorization: Bearer your_service_admin_api_key" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

### Redirect

```bash
curl -i http://localhost:8787/c04jzv
```

Responds with `302 Location: https://www.epicgames.com` and increments the visit counter.

---

## Routing & Redirect Behavior

The Hono app registers routes in this order:

1. `/api/auth/*` — Better Auth handler (Google OAuth, sessions, admin)
2. `/v1/*` — REST API (URLs, admin)
3. `/:shortCode` — redirect route (registered last to avoid collisions)

---

## Error Format

All API errors follow this shape:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "La URL debe comenzar con http:// o https://",
    "statusCode": 400
  }
}
```

---

## Tests

```bash
bun test                  # all tests
bun run test:watch        # watch mode
bun run test:coverage     # with coverage report
bun run test:bail         # abort on first failure
```

---

## Deploy to Cloudflare Workers

```bash
bun run build:front       # build frontend
bun run deploy            # deploy backend + frontend assets
```

Before deploying, make sure you've set:

- `database_id` in `wrangler.jsonc` (production D1)
- `BETTER_AUTH_SECRET` as a secret
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` as secrets
- `SERVICE_ADMIN_API_KEY` as a secret
- `TRUSTED_ORIGINS` with your production domain

```bash
bunx wrangler secret put BETTER_AUTH_SECRET
bunx wrangler secret put GOOGLE_CLIENT_ID
bunx wrangler secret put GOOGLE_CLIENT_SECRET
bunx wrangler secret put SERVICE_ADMIN_API_KEY
```

---

## Useful Commands

### Monorepo (root)

```bash
bun install              # install all workspace deps
bun run dev:back         # run wrangler dev
bun run dev:front        # run Vite dev server
bun run build:front      # build frontend
bun run build:back       # build backend
bun run check            # Biome check on frontend
bun run format           # Biome format
bun run lint             # Biome lint
```

### Backend

```bash
bun --cwd backend test                  # unit tests
bun --cwd backend dev                   # wrangler dev
bun --cwd backend deploy                # wrangler deploy --minify
bun --cwd backend run db:generate       # generate SQL migration
bun --cwd backend run db:migrate:local  # apply to local D1
bun --cwd backend run db:migrate:remote # apply to remote D1
```

---

## Frontend (Vue 3)

### Features

- **Google OAuth Login**: Sign in with Google account
- **Shorten URLs**: Create short URLs (requires authentication)
- **URL Management**: View, copy, and delete your URLs
- **QR Code Generation**: Generate QR codes for shortened URLs
- **Public URL List**: Browse URLs created by admin users
- **Dark/Light Theme**: Toggle between modes
- **Responsive Design**: Works on desktop and mobile

### Tech Stack

- Vue 3 (Composition API + `<script setup>`)
- TypeScript
- Vite
- Pinia (state management)
- Better Auth (authentication client)
- Shadcn-VUE (UI components)
- Tailwind CSS
- Axios (HTTP client)
- Lucide Vue Next (icons)

---

## Architecture

### Backend (Hexagonal Architecture)

```
domain/          → Entities, repository ports (no external deps)
application/     → Use cases (orchestrate business logic)
infrastructure/  → Repository implementations (Drizzle + D1)
presentation/    → HTTP routes (Hono handlers)
auth/            → Better Auth configuration
db/              → Drizzle schema (urls + auth tables)
```

**Dependency rule**: outer layers depend on inner layers, never the reverse.

### Frontend

```
lib/             → Better Auth client configuration
stores/          → Pinia stores (authStore, urlStore)
composables/     → Reusable logic (useAuth, useUrlShortener)
api/             → Axios instance, API functions
components/      → Vue components (features, layout, ui)
views/           → Page-level components
```

### Key design decisions

1. **Vite proxy**: In dev, frontend requests go through Vite proxy (same-origin) so cookies work without CORS issues
2. **Session-based auth**: Better Auth manages sessions via httpOnly cookies (not tokens)
3. **Role-based access**: Admin plugin provides `user`/`admin` roles with different permissions
4. **Public URLs**: Only URLs created by admin users are shown in the public list
5. **Repository injection**: `UrlRepository` is injected via Hono context middleware (not instantiated per route)
