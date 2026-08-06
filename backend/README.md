# @roly.top/backend

Hono API on Cloudflare Workers with hexagonal architecture.

## Stack

- **Hono** — HTTP framework
- **Cloudflare D1** — SQLite database
- **Drizzle ORM** — Type-safe queries
- **Better Auth** — Google OAuth + sessions
- **Zod** — Validation

## Commands

```bash
bun run dev              # Wrangler dev (localhost:8787)
bun run build            # wrangler deploy --dry-run
bun run deploy           # Deploy to Cloudflare Workers
bun run test             # Unit tests
bun run check            # Biome check
bun run db:generate      # Generate migration from schema
bun run db:migrate:local # Apply to local D1
```

## Architecture (Hexagonal)

```
domain/         → Entities, ports, errors (zero dependencies)
application/    → Use cases + shared services
infrastructure/ → Drizzle repos, error handler, CORS
presentation/   → HTTP routes (v1, redirect)
```

**Key files**:
- `src/domain/url/url.errors.ts` — Business errors
- `src/application/shared/url-limit.service.ts` — URL limit logic
- `src/infrastructure/http/cors.middleware.ts` — CORS config
- `src/infrastructure/http/error-handler.ts` — Global error handler

## Conventions

- Tests in Spanish, 100% unit (no D1/network)
- Errors: `AppError` subclasses in `domain/`, never include `statusCode`
- Short codes: `crypto.getRandomValues` with bias elimination
- See [backend/AGENTS.md](./AGENTS.md) for full guidelines
