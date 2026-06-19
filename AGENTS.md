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
- **Mejoras**: [PLAN-MEJORAS.md](PLAN-MEJORAS.md) — auditoría y fases de mejoras

## OpenCode

- `opencode.json` — MCP habilitado para shadcn-vue (`bunx shadcn-vue@latest mcp`)

---

## Comandos del Monorepo

> **IMPORTANTE**: Este es un monorepo con **bun** como package manager. Todos los comandos deben ejecutarse desde la raíz o especificar el workspace.

### Scripts disponibles

```bash
# Desarrollo
bun run dev:front     # Inicia servidor frontend (Vite, HMR)
bun run dev:back      # Inicia servidor backend (Wrangler, localhost:8787)

# Build
bun run build:front   # vue-tsc -b && vite build
bun run build:back    # Build del backend

# Verificación de código (frontend)
bun run check         # Biome check (lint + format) — falla si hay errores
bun run lint          # Biome lint --write (auto-fix, no format)
bun run format        # Biome format --write

# Backend
bun test              # Todos los tests (100 tests, ~600ms)
bun run test:unit     # Solo tests/unit/
bun run test:watch    # Watch mode
```

### Instalar dependencias

```bash
bun install           # Instala todos los workspaces
```

---

## Arquitectura

### Backend — Hexagonal (Ports & Adapters)

```
domain/        → Entidades e interfaces (cero dependencias externas)
application/   → Casos de uso (DI manual, no importan Hono/Drizzle)
infrastructure/→ Implementaciones (Drizzle+D1, error-handler)
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

---

## Convenciones Importantes

### Backend
- Tests en español, 100% unit tests (sin D1 ni red)
- Mock repository en `tests/__mocks__/url.repository.mock.ts`
- Error handling: `AppError` subclases (ValidationError, NotFoundError, etc.)
- Short codes: `crypto.getRandomValues` con bias elimination

### Frontend
- Componentes en `components/features/` (función), `components/ui/` (Shadcn)
- Stores en Composition API style
- Toasts: solo `vue-sonner` (no `alert()`)
- Formatos: Biome (tabs, comillas dobles)
- `components/ui/` no debe modificarse directamente

### CI/CD
- Deploy solo en push a `main` (GitHub Actions)
- Pipeline: lint → test → build frontend → deploy Workers
- Secrets via `wrangler --var` (nunca en archivos)
- `wrangler.jsonc` se genera desde `wrangler.example.jsonc` en CI

### Git
- Ramas: `main` (producción), `develop` (integración), `feat/*` (features)
- Commits: Conventional Commits (`feat:`, `fix:`, `chore:`, etc.)
- Merge con `--no-ff` para preservar historia de branches
