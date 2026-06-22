<p align="center">
  <img src="../frontend/public/url-icon.svg" alt="roly.top logo" width="100" height="100">
</p>

<h1 align="center">roly.top</h1>

<p align="center">Professional URL shortener</p>

<p align="center">
  <a href="https://roly.top">Website</a> ·
  <a href="https://github.com/roldyoran/roly.top">GitHub</a> ·
  <a href="./README.es.md">Documentación en español</a>
</p>

---

## Description

**roly.top** is a complete URL shortening platform built with modern and scalable architecture. It allows you to create custom or auto-generated short links, generate QR codes, get visit statistics, and manage URLs through a complete admin panel.

### Key Features

- **URL shortening** with custom or auto-generated codes (max 9 characters)
- **Custom QR codes** with color, gradient, and logo support
- **Complete authentication** with Google OAuth (Better Auth)
- **Admin panel** for user and URL management
- **Role system** with differentiated permissions (user/admin)
- **User ban system** with reason and expiration
- **URL limits** per user (configurable by admin)
- **Visit statistics** and public metrics
- **Complete REST API** with integrated documentation
- **Responsive design** mobile-first with light/dark themes

---

## Table of Contents

- [Stack Features](#stack-features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Local Development](#local-development)
- [Project Structure](#project-structure)
- [API](#api)
- [Authentication](#authentication)
- [Database](#database)
- [Tests](#tests)
- [Deployment](#deployment)
- [Useful Commands](#useful-commands)
- [Architecture](#architecture)

---

## Stack Features

### Backend

| Layer | Technology | Version |
|-------|------------|---------|
| Runtime | Cloudflare Workers | - |
| HTTP Framework | Hono | ^4.12.3 |
| Database | Cloudflare D1 (SQLite) | - |
| ORM | Drizzle ORM | ^0.45.1 |
| Authentication | Better Auth | ^1.6.15 |
| Validation | Zod | ^4.3.6 |
| Language | TypeScript | ^5.8.3 |
| Testing | Bun test runner | - |

### Frontend

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Vue 3 (Composition API) | ^3.5.24 |
| Router | Vue Router | 4 |
| State | Pinia | ^3.0.4 |
| UI | Shadcn-VUE + Radix Vue | - |
| Styles | Tailwind CSS | ^4.1.17 |
| HTTP Client | Axios | ^1.13.2 |
| Build Tool | Vite | ^6.4.1 |
| Linter | Biome | 2.4.5 |

---

## Prerequisites

- [Bun](https://bun.sh) ≥ 1.0
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) ≥ 4.0 (included as devDependency)
- Cloudflare account with a D1 database created
- Google Cloud project with OAuth 2.0 credentials

---

## Installation

```bash
# 1. Clone the repository
git clone git@github.com:roldyoran/roly.top.git
cd roly.top

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
BETTER_AUTH_SECRET=your_32_character_secret
BETTER_AUTH_URL=http://localhost:8787
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Allowed origins (production)
TRUSTED_ORIGINS=https://roly.top
```

### 2. Frontend environment variables

Create `frontend/.env`:

```env
# Leave empty to use Vite proxy in development
VITE_API_KEY=your_service_admin_api_key
```

> **Important**: Do NOT set `VITE_API_BASE_URL` in development. The Vite proxy handles routing to the backend.

### 3. Google OAuth Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add `http://localhost:8787/api/auth/callback/google` as authorized redirect URI
4. Copy Client ID and Client Secret to `backend/.env`

### 4. Wrangler — D1 Binding

Edit `backend/wrangler.jsonc` and replace the `database_id` with your D1 database ID:

```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "roly-top-db",
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

### 6. Full schema sync (remote D1)

If the remote database schema is out of sync or you need to start from scratch, run the full migration:

```bash
cd backend
bun --env-file=.env ./node_modules/.bin/wrangler.exe d1 execute DB --remote --config wrangler.jsonc --file drizzle/full_migration.sql
```

> **Warning**: This drops and recreates all tables. Only use when setting up a new database or correcting schema deviations.

The full migration creates these tables:
- `users` — Better Auth users (with `role`, `banned`, `url_limit`)
- `sessions` — Better Auth sessions (with `impersonated_by`)
- `accounts` — Better Auth accounts (OAuth providers)
- `verifications` — Better Auth email verifications
- `urls` — Short URLs (with `user_id`)

### 7. Cloudflare Workers Variables

Set these **Secrets** in Cloudflare Dashboard → Workers → roly.top → Settings → Variables and Secrets:

| Secret | Description |
|--------|-------------|
| `BETTER_AUTH_SECRET` | Generate with `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | `https://roly.top` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| `SERVICE_ADMIN_API_KEY` | Your admin API key |
| `TRUSTED_ORIGINS` | `https://roly.top` |
| `DEV_MODE` | `false` |

### 8. Google OAuth Redirect URI

Add this URI in [Google Cloud Console](https://console.cloud.google.com/) → Credentials → OAuth Client ID → Authorized redirect URIs:

```
https://roly.top/api/auth/callback/google
```

---

## Local Development

```bash
# From the repo root — runs both frontend and backend:
bun run dev:back       # Backend at http://localhost:8787
bun run dev:front      # Frontend at http://localhost:5173
```

The Vite dev server proxies `/api/*` and `/v1/*` requests to the backend, keeping same-origin for cookies.

---

## Project Structure

```
roly.top/
├── backend/                  # Hono + Cloudflare Workers + Better Auth
│   ├── src/
│   │   ├── domain/           # Entities and repository ports
│   │   ├── application/      # Use cases
│   │   ├── infrastructure/   # Repository implementations
│   │   ├── presentation/     # HTTP routes (v1, redirect)
│   │   ├── auth/             # Better Auth configuration
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
├── docs/                     # Translations and additional documentation
└── package.json              # Root scripts (workspaces)
```

---

## API

### shortCode Rules

- 1 to 9 characters
- Lowercase alphanumeric only: `[a-z0-9]+`
- Auto-generated if not provided on creation
- Generated with `crypto.getRandomValues()` (cryptographically secure)

### Public Endpoints (no auth)

#### Public statistics

```bash
curl http://localhost:8787/v1/urls/public/stats
```

#### List public URLs (admin users only)

```bash
curl http://localhost:8787/v1/urls/public
```

Returns URLs created by users with `role: "admin"`.

### Authenticated Endpoints (require session cookie)

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

#### Delete a URL

```bash
curl -X DELETE http://localhost:8787/v1/urls/c04jzv
```

### Admin Endpoints (require admin role)

#### Get dashboard statistics

```bash
curl http://localhost:8787/v1/admin/stats
```

#### List paginated users

```bash
curl "http://localhost:8787/v1/admin/users?page=1&pageSize=10&search=example"
```

#### Get user details

```bash
curl http://localhost:8787/v1/admin/users/:userId
```

#### Ban user

```bash
curl -X POST http://localhost:8787/v1/admin/users/:userId/ban \
  -H "Content-Type: application/json" \
  -d '{"reason": "Spam", "expiresAt": "2026-12-31T23:59:59.000Z"}'
```

#### Unban user

```bash
curl -X POST http://localhost:8787/v1/admin/users/:userId/unban
```

#### Update URL limit

```bash
curl -X PATCH http://localhost:8787/v1/admin/users/:userId/url-limit \
  -H "Content-Type: application/json" \
  -d '{"limit": 10}'
```

#### Delete user

```bash
curl -X DELETE http://localhost:8787/v1/admin/users/:userId
```

#### List all URLs (paginated)

```bash
curl "http://localhost:8787/v1/admin/urls?page=1&pageSize=10&search=example"
```

#### Delete a specific URL

```bash
curl -X DELETE http://localhost:8787/v1/admin/urls/c04jzv
```

#### Delete all URLs

```bash
curl -X DELETE http://localhost:8787/v1/admin/urls
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

## Authentication

The project uses **Better Auth** with Google OAuth for authentication and the **Admin plugin** for role-based access control.

### Authentication Flow

1. User clicks "Sign In" on the frontend
2. Frontend calls `POST /api/auth/sign-in/social` → backend redirects to Google
3. Google authenticates → redirects back to `GET /api/auth/callback/google`
4. Backend creates/updates user in the `users` table, sets session cookie
5. Frontend gets the session via `GET /api/auth/get-session`

### Roles

| Role | Permissions |
|------|-------------|
| `user` | Create own URLs, view own URLs, delete own URLs |
| `admin` | All user permissions + list public URLs + admin endpoints |

### Make user admin

After a user signs in with Google for the first time:

```bash
curl -X POST http://localhost:8787/v1/admin/setup/make-admin \
  -H "Authorization: Bearer your_service_admin_api_key" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

Then the user must **sign out and sign back in** to get the updated role in their session.

### Admin Plugin Endpoints

Managed by Better Auth at `/api/auth/admin/*`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/admin/create-user` | Create new user |
| POST | `/api/auth/admin/set-role` | Change user role |
| GET | `/api/auth/admin/list-users` | List all users |
| POST | `/api/auth/admin/ban-user` | Ban user |
| POST | `/api/auth/admin/unban-user` | Unban user |

---

## Database

### Full Schema

#### `urls` Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PK, autoincrement | Unique identifier |
| `original_url` | TEXT | NOT NULL | Target URL |
| `short_code` | TEXT | NOT NULL, UNIQUE | Short code (max 9 chars) |
| `created_at` | TEXT | NOT NULL | Creation date (ISO) |
| `visits` | INTEGER | NOT NULL, default 0 | Visit counter |
| `user_id` | TEXT | nullable, indexed | FK to owner user |

#### `users` Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PK | Better Auth ID |
| `name` | TEXT | NOT NULL | User name |
| `email` | TEXT | NOT NULL, UNIQUE | User email |
| `email_verified` | INTEGER | NOT NULL, default false | Email verified |
| `image` | TEXT | nullable | Profile image URL |
| `created_at` | INTEGER | NOT NULL | Creation timestamp |
| `updated_at` | INTEGER | NOT NULL | Update timestamp |
| `role` | TEXT | default "user" | Role (user/admin) |
| `banned` | INTEGER | default false | Ban status |
| `ban_reason` | TEXT | nullable | Ban reason |
| `ban_expires` | INTEGER | nullable | Ban expiration |
| `url_limit` | INTEGER | default 2 | URL limit |

#### Better Auth Tables

- `sessions` — User sessions (with `impersonated_by` for admin)
- `accounts` — OAuth accounts (Google)
- `verifications` — Email verifications

### Relationships

- `users` → has many `sessions`, `accounts`
- `sessions` → belongs to `users`
- `accounts` → belongs to `users`

---

## Error Format

All API errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The URL must start with http:// or https://",
    "statusCode": 400
  }
}
```

### Code Mapping

| Code | HTTP Status |
|------|-------------|
| `UNAUTHORIZED` | 401 |
| `NOT_FOUND` | 404 |
| `VALIDATION_ERROR` | 400 |
| `SHORT_CODE_ALREADY_EXISTS` | 409 |
| `URL_NOT_FOUND` | 404 |
| `URL_LIMIT_REACHED` | 409 |
| `INTERNAL_SERVER_ERROR` | 500 |

---

## Tests

```bash
# Backend
bun --cwd backend test                  # All tests
bun --cwd backend run test:watch        # Watch mode
bun --cwd backend run test:coverage     # With coverage report

# All monorepo tests
bun test
```

### Test Conventions

- Mocks are in `tests/__mocks__/url.repository.mock.ts`
- Completely unit tests (no D1, Wrangler, or network)
- Descriptions in Spanish
- Organization by layer → entity → use case

---

## Deployment

```bash
# Build frontend
bun run build:front

# Deploy backend + frontend assets
bun run deploy
```

Before deploying, make sure you have configured:

- `database_id` in `wrangler.jsonc` (production D1)
- `BETTER_AUTH_SECRET` as secret
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` as secrets
- `SERVICE_ADMIN_API_KEY` as secret
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
bun install              # Install all workspace dependencies
bun run dev:back         # Run wrangler dev
bun run dev:front        # Run Vite dev server
bun run build:front      # Build frontend
bun run build:back       # Build backend
bun run check            # Check code with Biome
bun run format           # Format with Biome
bun run lint             # Lint with Biome
```

### Backend

```bash
bun --cwd backend test                  # Unit tests
bun --cwd backend dev                   # wrangler dev
bun --cwd backend deploy                # wrangler deploy --minify
bun --cwd backend run db:generate       # Generate SQL migration
bun --cwd backend run db:migrate:local  # Apply to local D1
bun --cwd backend run db:migrate:remote # Apply to remote D1
bun --cwd backend run db:studio         # Drizzle Studio GUI
```

### Frontend

```bash
bun --cwd frontend dev                  # Development server
bun --cwd frontend build                # Production build
bun --cwd frontend check                # Check code
bun --cwd frontend format               # Format code
bun --cwd frontend lint                 # Lint and auto-fix
```

---

## Architecture

### Backend (Hexagonal Architecture)

```
domain/          → Entities, repository ports (no external dependencies)
application/     → Use cases (orchestrate business logic)
infrastructure/  → Repository implementations (Drizzle + D1)
presentation/    → HTTP routes (Hono handlers)
auth/            → Better Auth configuration
db/              → Drizzle schema (urls + auth tables)
```

**Dependency rule**: outer layers depend on inner layers, never the other way around.

### Frontend

```
lib/             → Better Auth client configuration
stores/          → Pinia stores (authStore, urlStore)
composables/     → Reusable logic (useAuth, useUrlShortener)
api/             → Axios instance, API functions
components/      → Vue components (features, layout, ui)
views/           → Page-level components
```

### Key Design Decisions

1. **Vite proxy**: in development, frontend requests go through the Vite proxy (same origin) so cookies work without CORS issues
2. **Session-based auth**: Better Auth handles sessions via httpOnly cookies (not tokens)
3. **Role-based access**: the admin plugin provides `user`/`admin` roles with different permissions
4. **Public URLs**: only URLs created by admin users are shown in the public list
5. **Repository injection**: `UrlRepository` is injected via Hono context middleware (not instantiated per route)
6. **ETag caching**: all GET endpoints implement ETags to optimize bandwidth usage
7. **URL deduplication**: `POST /v1/urls` returns the existing URL if it already exists for the user
8. **Per-user limits**: configurable by admin, only checked on creation

---

## License

This project is licensed under the [GNU General Public License v3.0](https://www.gnu.org/licenses/gpl-3.0.html).

Copyright (C) 2026 [roldyoran](https://github.com/roldyoran)
