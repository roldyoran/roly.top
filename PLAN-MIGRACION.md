# Plan de Migración: roly.top v2

## Estado Actual

- **Tech**: Astro 7 + Cloudflare Workers + D1 + Drizzle ORM + Starwind UI
- **Better Auth** integrado (FASE 1 completada)
- **Modo anónimo + límites** implementado (FASE 2 completada)
- **Sin KV cache ni R2 storage** - todo en capa gratuita de Cloudflare
- **Solo backend** por ahora - dashboard para después

---

## FASE 1: Better Auth + Google OAuth ✅ COMPLETADA

### Archivos creados/modificados:

| Archivo | Descripción |
|---------|-------------|
| `src/lib/auth.ts` | Config Better Auth con Google OAuth, Drizzle adapter (sqlite), cookie cache 5min |
| `src/lib/auth-client.ts` | Cliente Better Auth vanilla |
| `src/pages/api/auth/[...all].ts` | Handler catch-all GET/POST para rutas `/api/auth/*` |
| `src/middleware.ts` | Inyecta `user` y `session` en `Astro.locals`, salta rutas `/api/auth` y `/api/v1` |
| `src/server/db/auth-schema.ts` | Schema Drizzle: user, session, account, verification (generado por CLI) |
| `src/server/db/urls.ts` | Tabla urlsTable extraída de schema.ts |
| `src/server/db/schema.ts` | Re-exporta auth-schema + urls |
| `src/env.d.ts` | Tipos App.Locals (user, session, runtime con env) |
| `tsconfig.json` | Alias `@/*` para `src/*` |
| `drizzle.config.ts` | Schema apunta a `src/server/db/*.ts` |
| `drizzle/0001_cool_zarek.sql` | Migración SQL de tablas Better Auth |

### Variables de entorno requeridas:

```env
BETTER_AUTH_SECRET=<genera con: openssl rand -base64 32>
BETTER_AUTH_URL=http://localhost:4321
GOOGLE_CLIENT_ID=<tu_client_id>
GOOGLE_CLIENT_SECRET=<tu_client_secret>
```

### Endpoints:

- `GET/POST /api/auth/*` - Better Auth (login, register, session, callback, etc.)
- `GET /api/auth/ok` - Health check auth

### Google Cloud Console:

1. Crear proyecto en https://console.cloud.google.com
2. Credentials → Create Credentials → OAuth client ID → Web application
3. Redirect URIs:
   - `http://localhost:4321/api/auth/callback/google`
   - `https://roly.top/api/auth/callback/google`
4. Copiar Client ID y Client Secret al `.env`

---

## FASE 2: Modo Anónimo + Límites ✅ COMPLETADA

### Archivos creados/modificados:

| Archivo | Descripción |
|---------|-------------|
| `src/server/db/urls.ts` | Agregadas columnas userId, sessionId, isActive, title; eliminada creatorIp |
| `src/server/utils/anonymous.ts` | Helper para manejar cookie anonymous_id (get, create, set, clear) |
| `src/server/domain/url/url.entity.ts` | Entidad actualizada con userId, sessionId, isActive, title |
| `src/server/domain/url/url.repository.port.ts` | Métodos actualizados: findByOriginalUrlAndIdentity, countByIdentity, findByUserId |
| `src/server/domain/url/url.errors.ts` | IpLimitReachedError → QuotaReachedError |
| `src/server/config/constants.ts` | FREE_IP_URL_LIMIT → URL_QUOTA_LIMIT (50) |
| `src/server/application/shared/quota.service.ts` | Nuevo servicio de quotas por usuario/sesión |
| `src/server/application/url/create-url.usecase.ts` | Use case actualizado con nueva lógica de quotas |
| `src/server/infrastructure/persistence/url.repository.impl.ts` | Repositorio actualizado con nuevos métodos |
| `src/pages/api/v1/urls.ts` | POST actualizado: soporte anónimo + cookie + quotas |
| `src/middleware.ts` | Ya no salta rutas /api/v1 (necesario para inyectar sesión) |
| `drizzle/0002_add_user_session_columns.sql` | Migración: columnas user_id, session_id, is_active, title |
| `tests/unit/quota.service.test.ts` | Nuevo test para QuotaService |
| `tests/unit/create-url.usecase.test.ts` | Tests actualizados para nuevo dominio |
| `tests/unit/redirect-url.usecase.test.ts` | Tests actualizados para nuevo dominio |
| `tests/unit/url.errors.test.ts` | Tests actualizados para QuotaReachedError |

### Archivos eliminados:

| Archivo | Razón |
|---------|-------|
| `src/server/application/shared/ip-limit.service.ts` | Reemplazado por quota.service.ts |
| `tests/unit/ip-limit.service.test.ts` | Reemplazado por quota.service.test.ts |

---

## FASE 3: CRUD URLs con Límites

### Objetivo:
- Crear, listar, editar, eliminar URLs
- Límite: 50 URLs por usuario/anónimo
- Sin IP storage

### Endpoints:

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/v1/urls` | Crear URL (anónimo o autenticado) |
| GET | `/api/v1/urls` | Listar URLs del usuario/sesión |
| PATCH | `/api/v1/urls/:id` | Editar URL (solo propietario) |
| DELETE | `/api/v1/urls/:id` | Eliminar URL (solo propietario) |

### Lógica de límites:

```ts
const session = await auth.api.getSession({ headers: request.headers });
const anonymousId = getCookie("anonymous_id");

let urlCount: number;

if (session) {
  urlCount = await db.select().from(urls)
    .where(eq(urls.userId, session.user.id)).execute();
} else if (anonymousId) {
  urlCount = await db.select().from(urls)
    .where(eq(urls.sessionId, anonymousId)).execute();
} else {
  urlCount = 0;
}

if (urlCount >= 50) {
  return new Response("Límite alcanzado", { status: 429 });
}
```

---

## FASE 4: Analytics Básicos

### Objetivo:
- Contar clicks por URL
- Stats básicas: país, dispositivo, referer, clicks over time
- Sin analytics en tiempo real

### Cambios en DB:

```sql
CREATE TABLE clicks (
  id TEXT PRIMARY KEY,
  url_id TEXT NOT NULL REFERENCES urls(id),
  country TEXT,
  device TEXT,
  browser TEXT,
  referer TEXT,
  created_at TEXT NOT NULL
);
```

### Captura en redirect `[slug].ts`:

```ts
// Después del redirect, analytics async (no bloquear):
context.waitUntil(
  db.insert(clicks).values({
    urlId: url.id,
    country: request.cf?.country,
    device: parseDevice(userAgent),
    browser: parseBrowser(userAgent),
    referer: request.headers.get("referer"),
    createdAt: new Date().toISOString(),
  }).execute()
);
```

### Endpoint analytics:

```ts
GET /api/v1/analytics/:urlId
// Retorna: totalClicks, clicksByCountry, clicksByDevice, clicksByBrowser
```

---

## FASE 5: Login + Dashboard Básico (Svelte)

### Objetivo:
- Página `/login` con botón "Iniciar sesión con Google"
- Página `/dashboard` con lista de URLs del usuario
- **Framework UI**: Svelte (via `@astrojs/svelte`)

### Tech Stack para Dashboard:

```bash
pnpm add @astrojs/svelte svelte
```

```js
// astro.config.mjs
import svelte from "@astrojs/svelte";

export default defineConfig({
  integrations: [svelte()],
});
```

### Páginas:

- `/login` - Botón Google, redirige a `/dashboard`
- `/dashboard` - Componente Svelte con lista de URLs

### Componentes Svelte:

```
src/components/dashboard/
├── UrlList.svelte        # Lista principal de URLs
├── UrlCard.svelte        # Card individual con acciones
├── CreateUrlForm.svelte  # Formulario de creación
├── StatsBar.svelte       # Stats resumen (total links, clicks)
└── Pagination.svelte     # Paginación
```

### Dashboard features:

- Tabla con búsqueda y paginación
- Botones: Copiar, Editar, Eliminar, Ver QR
- Stats básicas por URL
- Responsive (mobile-first)

---

## Referencias

### Proyectos Open Source Inspiración:

| Proyecto | URL | Destacado |
|----------|-----|-----------|
| **Dub** | github.com/dubinc/dub | Analytics, affiliate tracking, API-first, Next.js |
| **Shlink** | github.com/shlinkio/shlink | Self-hosted PHP, REST API completa, QR built-in |
| **Kutt** | github.com/thedevs-network/kutt | Node.js + React, OIDC, simple setup |
| **Sink** | github.com/ccbikai/Sink | Cloudflare Workers + D1 + Drizzle (misma tech stack) |

### Documentación:

| Recurso | URL |
|---------|-----|
| Better Auth Docs | https://better-auth.com/docs |
| Better Auth Google | https://better-auth.com/docs/authentication/google |
| Better Auth Astro | https://better-auth.com/docs/installation (sección Astro) |
| Better Auth Drizzle | https://better-auth.com/docs/adapters/drizzle |
| Cloudflare D1 | https://developers.cloudflare.com/d1/ |
| Drizzle ORM | https://orm.drizzle.team/ |

### Skills del proyecto:

- `.agents/skills/better-auth-best-practices/SKILL.md` - Guía de integración
- `.agents/skills/create-auth/SKILL.md` - Scaffolding de auth
- `.agents/skills/better-auth-security-best-practices/SKILL.md` - Seguridad

### Features estándar en acortadores modernos (2026):

1. Custom domains (NO implementar)
2. Link expiration (por fecha o clicks)
3. Password protection
4. QR codes auto-generados
5. Bulk import/export (JSON/CSV)
6. Tags y colecciones
7. Analytics: geo, device, referrer, time-series
8. Bot detection
9. API REST con OpenAPI
10. Webhooks (NO implementar)

### Configuración Cloudflare (capa gratuita):

- Workers: Handler HTTP
- D1: SQLite serverless (base de datos)
- **NO usar** KV cache
- **NO usar** R2 storage
- `nodejs_compat` flag habilitado en wrangler.jsonc
