<p align="center">
  <img src="./frontend/public/url-icon.svg" alt="roly.top logo" width="100" height="100">
</p>

<h1 align="center">roly.top</h1>

<p align="center">Professional URL shortener built with Cloudflare Workers</p>

<p align="center">
  <a href="https://roly.top">Website</a> ·
  <a href="https://github.com/roldyoran/roly.top">GitHub</a> ·
  <a href="./docs/README.es.md">Documentacion en espanol</a>
</p>

---

## Overview

**roly.top** is a full-stack URL shortening platform with custom QR codes, Google OAuth, admin panel, and visit statistics. Built with Hono on Cloudflare Workers (backend) and Vue 3 + Vite (frontend).

### Features

- URL shortening with custom or auto-generated codes (max 9 chars)
- Custom QR codes with color, gradient, and logo support
- Google OAuth authentication (Better Auth)
- Admin panel for user and URL management
- Role-based access control (user/admin)
- Per-user URL limits (configurable by admin)
- ETag caching and URL deduplication
- Responsive design with light/dark themes

---

## Stack

| Layer | Technology |
|-------|------------|
| Backend | Hono, Cloudflare Workers, D1 (SQLite), Drizzle ORM, Better Auth |
| Frontend | Vue 3, Pinia, Shadcn-VUE, Tailwind CSS v4, Vite |
| Tooling | Bun, Biome, TypeScript, Wrangler |

---

## Quick Start

```bash
git clone git@github.com:roldyoran/roly.top.git
cd roly.top
bun install
bun run dev        # Frontend + backend in parallel
```

---

## Configuration

### 1. Backend (`backend/.env`)

```env
DEV_MODE=true
SERVICE_ADMIN_API_KEY=your_api_key
BETTER_AUTH_SECRET=your_32_char_secret
BETTER_AUTH_URL=http://localhost:8787
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
TRUSTED_ORIGINS=https://roly.top
```

### 2. Frontend (`frontend/.env`)

```env
VITE_API_KEY=your_service_admin_api_key
```

> Do NOT set `VITE_API_BASE_URL`. The Vite proxy handles routing.

### 3. Google OAuth

1. Create credentials at [Google Cloud Console](https://console.cloud.google.com/)
2. Add redirect URI: `http://localhost:8787/api/auth/callback/google`
3. Copy Client ID/Secret to `backend/.env`

### 4. Database

```bash
bun run db:migrate:local    # Development
bun run db:migrate:remote   # Production
```

---

## Commands

```bash
bun run dev              # Frontend + backend
bun run build            # Build both
bun run check            # Lint both (Biome)
bun run lint             # Auto-fix both
bun run test             # Run tests
bun run deploy           # Deploy to Cloudflare Workers
bun run db:generate      # Generate migration
bun run db:migrate:local # Apply to local D1
```

---

## Project Structure

```
roly.top/
├── backend/              # @roly.top/backend
│   ├── src/
│   │   ├── domain/       # Entities, repository ports
│   │   ├── application/  # Use cases
│   │   ├── infrastructure/# Implementations (Drizzle, error handler)
│   │   ├── presentation/ # HTTP routes (v1, redirect)
│   │   ├── auth/         # Better Auth config
│   │   ├── db/           # Drizzle schema
│   │   └── utils/        # CORS, context, schemas
│   ├── tests/            # Unit tests
│   └── drizzle/          # SQL migrations
├── frontend/             # @roly.top/frontend
│   ├── src/
│   │   ├── api/          # Axios client, API functions
│   │   ├── stores/       # Pinia stores
│   │   ├── composables/  # useAuth, useUrlShortener
│   │   ├── components/   # UI components
│   │   └── views/        # Page views
│   └── dist/             # Build output
├── docs/                 # Documentation
└── biome.json            # Unified Biome config
```

---

## Architecture

### Backend (Hexagonal)

```
domain/        → Entities, ports (zero dependencies)
application/   → Use cases (DI, no framework imports)
infrastructure/→ Implementations (Drizzle, D1)
presentation/  → HTTP routes (Hono)
```

**Rule**: outer layers depend on inner layers, never the reverse.

### Frontend

```
stores/     → Pinia (auth, urls)
composables/→ Reusable logic
api/        → Axios + ETag caching
components/ → Shadcn-VUE + features
views/      → Page-level components
```

### Key Decisions

1. **Vite proxy**: same-origin for cookies in development
2. **Session-based auth**: httpOnly cookies via Better Auth
3. **Repository injection**: via Hono context middleware
4. **ETag caching**: all GET endpoints
5. **URL deduplication**: returns existing URL if duplicate

---

## API

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/urls/public/stats` | Public statistics |
| GET | `/v1/urls/public` | Admin users' URLs |
| GET | `/:shortCode` | Redirect (302) + increment visits |

### Authenticated Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/urls` | List my URLs |
| POST | `/v1/urls` | Create short URL |
| GET | `/v1/urls/:shortCode` | Get URL by code |
| DELETE | `/v1/urls/:shortCode` | Delete URL |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/admin/stats` | Dashboard stats |
| GET | `/v1/admin/users` | List users (paginated) |
| POST | `/v1/admin/users/:userId/ban` | Ban user |
| POST | `/v1/admin/users/:userId/unban` | Unban user |
| PATCH | `/v1/admin/users/:userId/url-limit` | Update URL limit |
| DELETE | `/v1/admin/users/:userId` | Delete user |
| GET | `/v1/admin/urls` | List all URLs (paginated) |
| DELETE | `/v1/admin/urls/:shortCode` | Delete URL |
| DELETE | `/v1/admin/urls` | Delete all URLs |
| POST | `/v1/admin/setup/make-admin` | Make user admin |

---

## Error Format

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

| Code | HTTP Status |
|------|-------------|
| `UNAUTHORIZED` | 401 |
| `NOT_FOUND` | 404 |
| `VALIDATION_ERROR` | 400 |
| `SHORT_CODE_ALREADY_EXISTS` | 409 |
| `URL_NOT_FOUND` | 404 |
| `URL_LIMIT_REACHED` | 409 |

---

## CI/CD

GitHub Actions pipeline (`.github/workflows/deploy.yaml`):

```
lint → test → deploy (main only)
```

- **lint**: Biome check on both packages
- **test**: Backend unit tests
- **deploy**: Build frontend + deploy Workers

---

## License

[GNU General Public License v3.0](https://www.gnu.org/licenses/gpl-3.0.html)

Copyright (C) 2026 [roldyoran](https://github.com/roldyoran)
