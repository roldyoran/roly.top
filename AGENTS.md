# AGENTS.md — roly.top

Monorepo con **bun** — shortener de URLs en Cloudflare Workers. Lee las guías por área antes de editar.

## Áreas

| Área | Guía |
|------|------|
| Backend | [backend/AGENTS.md](backend/AGENTS.md) |
| Frontend | [frontend/AGENTS.md](frontend/AGENTS.md) |

## Documentación adicional
- **Backend**: [backend/README.md](backend/README.md) — setup, API, deploy, comandos
- **Frontend**: [frontend/README.md](frontend/README.md) — stack, features, configuración
- **Arquitectura**: [docs/BACKEND_ARCHITECTURE.md](docs/BACKEND_ARCHITECTURE.md)

---

## Comandos del Monorepo

> **IMPORTANTE**: Este es un monorepo con **bun** como package manager. Todos los comandos deben ejecutarse desde la raíz o especificar el workspace.

### Scripts disponibles

```bash
# Setup
bun run setup              # Crear .env en backend/ y frontend/

# Desarrollo
bun run dev                # Frontend + Backend en paralelo (Turborepo)
bun run dev:front          # Solo frontend (Vite, HMR)
bun run dev:back           # Solo backend (Wrangler, localhost:8787)

# Build
bun run build              # Frontend + Backend (Turborepo)
bun run build:front        # vue-tsc -b && vite build
bun run build:back         # Build del backend

# Verificación de código (frontend + backend)
bun run check              # Biome check en paralelo
bun run lint               # Biome lint --write en paralelo
bun run format             # Biome format --write en paralelo

# Tests
bun run test               # Todos los tests
bun run test:back          # Solo backend tests

# Base de datos
bun run db:generate        # Generar migración desde schema
bun run db:migrate:local   # Aplicar migración en D1 local
bun run db:migrate:remote  # Aplicar migración en D1 remoto

# Deploy
bun run deploy             # Deploy backend a Cloudflare Workers
```

### Instalar dependencias

```bash
bun install                # Instala todos los workspaces
```

---

## Arquitectura

### Backend — Hexagonal (Ports & Adapters)

```
domain/        → Entidades, puertos, errores (cero dependencias)
application/   → Casos de uso + shared services (DI manual)
infrastructure/→ Implementaciones (Drizzle+D1, error-handler, CORS)
presentation/  → HTTP routes (Hono)
```

**Regla de dependencia**: las capas externas dependen de las internas. Domain/Application nunca importan Hono, Drizzle, o Workers.

**Entry point**: `backend/src/index.ts` — security headers → CORS → auth → health → auth handler → v1 router → redirect router → SPA fallback

**DB**: Cloudflare D1 (SQLite). Schema en `backend/src/db/schema.ts` (urls) y `backend/src/db/auth-schema.ts` (Better Auth tables). Migraciones via `bun run db:generate`.

### Frontend — Vue 3 SPA

- **Framework**: Vue 3 + Composition API + `<script setup>`
- **UI**: Shadcn-VUE (28 componentes en `components/ui/`)
- **Icons**: Solo `lucide-vue-next` (no otros sistemas)
- **State**: Pinia (Composition API style)
- **Data**: TanStack Vue Query + Axios (ETag caching)
- **Routing**: vue-router con auth guards
- **Build**: Vite + Tailwind CSS v4
- **Types**: Centralizados en `types/` (url.ts, user.ts, admin.ts)

---

## Convenciones Importantes

### Backend
- Tests en español, 100% unit tests (sin D1 ni red)
- Mock repository en `tests/__mocks__/url.repository.mock.ts`
- Error handling: `AppError` subclases en `domain/` (nunca `statusCode`)
- Errores de negocio: `domain/url/url.errors.ts`, `domain/admin/admin.errors.ts`
- Límites de URLs: `application/shared/url-limit.service.ts`
- Short codes: `crypto.getRandomValues` con bias elimination

### Frontend
- Componentes en `components/features/` (función), `components/ui/` (Shadcn)
- Stores en Composition API style
- Toasts: solo `vue-sonner` (no `alert()`)
- Formatos: Biome (tabs, comillas dobles)
- `components/ui/` no debe modificarse directamente
- Tipos centralizados en `types/` (no definir en api/ o stores/)

### Variables de Entorno
- Backend y frontend usan `.env` SEPARADOS (seguridad)
- Frontend: NO definir `VITE_API_BASE_URL` (usa proxy de Vite)
- Documentación centralizada en `.env.example` raíz
- Setup: `bun run setup` copia templates a cada workspace

### CI/CD
- Deploy solo en push a `main` (GitHub Actions)
- Pipeline: lint → test → deploy (build frontend incluido en deploy)
- Secrets via GitHub Actions secrets (nunca en archivos)
- `wrangler.jsonc` se genera desde `wrangler.example.jsonc` en CI

### Git
- Ramas: `main` (producción), `develop` (integración), `feat/*` (features)
- Commits: Conventional Commits (`feat:`, `fix:`, `chore:`, etc.)
- Merge con `--no-ff` para preservar historia de branches
