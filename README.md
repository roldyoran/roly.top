<h1 align="center">SHORTURL</h1>

<p align="center">by roldyoran</p>

> **Español**: [Documentación en español](./docs/README.es.md)

> **Note**: This repository is primarily focused on the **backend** (URL shortener API). The frontend is a simple Vue 3 application used to test the API with a nice UI, but it's not the main focus of this project.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Local Development](#local-development)
- [Monorepo Layout](#monorepo-layout)
- [API Usage](#api-usage)
- [Frontend Integration](#frontend-integration)
- [Routing & Redirect Behavior](#routing--redirect-behavior)
- [Error Format](#error-format)
- [Tests](#tests)
- [Deploy to Cloudflare Workers](#deploy-to-cloudflare-workers)
- [Useful Commands](#useful-commands)
- [Frontend (Vue 3)](#frontend-vue-3)

---

## Prerequisites

- [Bun](https://bun.sh) ≥ 1.0
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) ≥ 4.0 (included as devDependency)
- A Cloudflare account with a D1 database created

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

### 1. Environment variables (local)

Create a `.env` file in the project root:

```env
SERVICE_ADMIN_API_KEY=your_secret_api_key
```

For the frontend (optional, see `frontend/.env.example`):

```env
VITE_API_BASE_URL=http://127.0.0.1:8787
```

### 2. Wrangler — D1 binding

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

### 3. Database migrations

```bash
# Apply migrations to local D1 (development)
bun run db:migrate:local

# Apply migrations to remote D1 (production)
bun run db:migrate:remote
```

### 4. Custom domain

Point your domain (e.g. `roldy.cua`) at this Worker via the Cloudflare dashboard:
**Workers & Pages → shorturl → Settings → Triggers → Custom Domains**. The `SERVICE_ADMIN_API_KEY` must match what's set in your remote worker's env vars.

---

## Local Development

```bash
# From the repo root — runs both frontend and backend in one command:
bun dev

# Or run them separately:
bun run dev:back     # backend on http://127.0.0.1:8787
bun run dev:front    # frontend on http://localhost:5173
```

> **Tip:** the backend serves the **built** frontend (from `frontend/dist/`) via the Workers Assets binding, not the Vite dev server. If you want to test UI changes, either run `bun run dev:front` in another terminal and have the SPA hit `http://127.0.0.1:8787/v1/...` (with `VITE_API_BASE_URL` pointing there), or rebuild with `bun run build:front` and restart the backend.

---

## Monorepo Layout

```
shorturl/
├── backend/                  # Hono + Cloudflare Workers (API + redirect + assets host)
│   ├── src/                  # Application source
│   ├── tests/                # Unit tests (bun:test)
│   ├── drizzle/              # SQL migrations
│   ├── wrangler.jsonc        # Worker config (D1, Assets, env)
│   └── worker-configuration.d.ts  # Auto-generated, do not edit
├── frontend/                 # Vue 3 + Vite SPA
│   ├── src/                  # Application source
│   └── dist/                 # Built static assets (consumed by backend)
├── docs/                     # Translations & extra docs
├── package.json              # Root scripts (workspaces)
└── README.md
```

---

## API Usage

All endpoints are mounted under `/v1` except the redirect, which lives at the root: `GET /:shortCode`.

### shortCode rules

- 1 to 9 characters
- Lowercase alphanumeric only: `[a-z0-9]+`
- Auto-generated if not provided on create

### Create a short URL

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
  "visits": 0
}
```

### Create a URL with custom shortCode

```bash
curl -X POST http://localhost:8787/v1/urls \
  -H "Content-Type: application/json" \
  -d '{"originalUrl": "https://hono.dev", "shortCode": "hono"}'
```

### Redirect to original URL

```bash
curl -i http://localhost:8787/c04jzv
```

Responds with `302 Location: https://www.epicgames.com` and increments the visit counter.

If the `shortCode` doesn't exist in D1 or fails the format validation, responds with `302 Location: /` (loads the SPA).

### List all URLs

```bash
curl http://localhost:8787/v1/urls
```

### Get a URL by shortCode

```bash
curl http://localhost:8787/v1/urls/c04jzv
```

### Delete a URL (requires API key)

```bash
curl -X DELETE http://localhost:8787/v1/admin/urls/c04jzv \
  -H "Authorization: Bearer your_secret_api_key"
```

### Delete all URLs (requires API key)

```bash
curl -X DELETE http://localhost:8787/v1/admin/urls \
  -H "Authorization: Bearer your_secret_api_key"
```

---

## Frontend Integration

The backend serves the **built** frontend (from `frontend/dist/`) via the [Cloudflare Workers Assets](https://developers.cloudflare.com/workers/static-assets/) binding.

**`backend/wrangler.jsonc`:**

```jsonc
{
  "assets": {
    "directory": "../frontend/dist",
    "binding": "ASSETS"
  }
}
```

> **Important:** do **not** set `not_found_handling: "single-page-application"`. That mode serves `index.html` for any non-asset path, which breaks the `GET /:shortCode` redirect because the binding intercepts the request before the Worker can handle it.

The SPA hits the API via `VITE_API_BASE_URL` (defaults to `https://roldy.cua` in `frontend/src/api/http.ts`, overridable via `frontend/.env`). If the env var is not set, the SPA falls back to the production domain so it works the same when deployed to a custom domain or to `*.workers.dev`.

---

## Routing & Redirect Behavior

The Hono app registers routes in this order (see `backend/src/index.ts`):

1. `GET /v1/...` — REST API (mounted first to avoid collisions).
2. `GET /:shortCode` — redirect route, registered after `/v1` so shortCodes can't shadow API paths.

### `GET /:shortCode` flow

```
Request → Hono matches /:shortCode
  → zValidator("param", shortCodeSchema, redirectValidationHook)
      → on Zod fail: 302 Location: /     (loads SPA, never 400 JSON)
  → RedirectUrlUseCase.execute(shortCode)
      → null in D1 → 302 Location: /
      → found       → 302 Location: <originalUrl>  (increments visits)
```

This means **any non-API path returns HTML** (the SPA) or a 302 to it, never a 404 JSON — which is the whole point of avoiding a catch-all `/*` route.

---

## Error Format

All API errors follow this shape (see `backend/src/infrastructure/http/error-handler.ts`):

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Malformed JSON in request body",
    "statusCode": 400
  }
}
```

| `code`                       | `statusCode` | When                                                                |
|------------------------------|--------------|---------------------------------------------------------------------|
| `VALIDATION_ERROR`           | 400          | Zod validation failed, or `HTTPException` with status 400 (e.g. malformed JSON) |
| `UNAUTHORIZED`               | 401          | Missing/invalid `Authorization` header on admin routes              |
| `NOT_FOUND`                  | 404          | Resource not found (route)                                          |
| `SHORT_CODE_ALREADY_EXISTS`  | 409          | `POST /v1/urls` with a `shortCode` already in use                   |
| `URL_NOT_FOUND`              | 404          | `DELETE /v1/admin/urls/:shortCode` with unknown shortCode           |
| `INTERNAL_SERVER_ERROR`      | 500          | Unhandled error (the original message is **not** leaked to the client) |

`HTTPException` from Hono (e.g. `Malformed JSON in request body` thrown by the body parser) is reformatted into the same shape — it no longer surfaces as a raw 500.

---

## Tests

Unit tests use [Bun's built-in test runner](https://bun.sh/docs/cli/test).

```bash
bun test                  # all tests
bun run test:watch        # watch mode
bun run test:coverage     # with coverage report
bun run test:bail         # abort on first failure
bun run test:unit         # only tests/unit/
bun run test:app          # only application/ usecase tests
bun run test:utils        # only utils/ tests
```

Test files mirror `src/` structure:

```
tests/unit/
├── application/url/         # use case tests (mocked repo)
├── infrastructure/http/     # error handler tests (mocked Hono Context)
└── utils/                   # schemas, AppError
```

---

## Deploy to Cloudflare Workers

```bash
bun deploy
```

This runs `build:front` (Vite build → `frontend/dist/`) and then `wrangler deploy --minify` on the backend. The `assets` block in `wrangler.jsonc` makes wrangler upload `frontend/dist/` alongside the Worker so both ship as one.

Before deploying, make sure you've set:

- `database_id` in `wrangler.jsonc` (production D1)
- `SERVICE_ADMIN_API_KEY` as a secret (`bunx wrangler secret put SERVICE_ADMIN_API_KEY`)

---

## Useful Commands

### Monorepo (root)

```bash
bun install            # install all workspace deps
bun dev                # run backend (frontend served from dist)
bun run dev:front      # run Vite dev server for the SPA
bun run dev:back       # run wrangler dev for the Worker
bun run build          # build frontend + backend
bun run build:front    # build only the frontend
bun run build:back     # build only the backend
bun run check:front    # Biome check on frontend
bun run format:front   # Biome format on frontend
bun run lint:front     # Biome lint on frontend
```

### Backend

```bash
bun --cwd backend test                # unit tests
bun --cwd backend dev                 # wrangler dev
bun --cwd backend deploy              # wrangler deploy --minify
bun --cwd backend cf-typegen          # regenerate worker-configuration.d.ts
bun --cwd backend run db:generate     # generate SQL migration from schema
bun --cwd backend run db:migrate:local   # apply migrations to local D1
bun --cwd backend run db:migrate:remote  # apply migrations to remote D1
bun --cwd backend run db:studio       # open Drizzle Studio
bun --cwd backend run format          # Biome format on backend
```

> **`cf-typegen`** reads `wrangler.jsonc` and writes `worker-configuration.d.ts` (an `interface CloudflareBindings` with the inferred types of every binding: `DB: D1Database`, `ASSETS: Fetcher`, etc.). **Re-run it** every time you add/rename a binding.

---

## Frontend (Vue 3)

The project includes a simple Vue 3 frontend to test the API with a user-friendly interface.

### Frontend Features

- **Shorten URLs**: Create short URLs directly from the UI
- **URL Management**: View, copy, and delete your shortened URLs
- **QR Code Generation**: Generate QR codes for shortened URLs
- **Public URL List**: Browse publicly shortened URLs
- **Dark/Light Theme**: Toggle between dark and light modes
- **Responsive Design**: Works on desktop and mobile devices

### Running the Frontend

```bash
cd frontend
bun dev
```

The frontend runs on `http://localhost:5173` (Vite default). Point it at your local backend with `VITE_API_BASE_URL=http://127.0.0.1:8787` in `frontend/.env`.

### Frontend Tech Stack

- Vue 3 (Composition API)
- Vite
- Pinia (state management)
- Shadcn-VUE (UI components)
- Tailwind CSS
- TypeScript
