# Análisis y Plan de Migración: roly.top → Astro 6

---

## Tabla de Contenidos

1. [Análisis de Viabilidad](#análisis-de-viabilidad)
2. [Stack Actual vs Stack Objetivo](#stack-actual-vs-stack-objetivo)
3. [Recomendaciones de Tecnologías](#recomendaciones-de-tecnologías)
4. [Estructura del Proyecto Migrado](#estructura-del-proyecto-migrado)
5. [Fase 1: Setup del Proyecto Astro](#fase-1-setup-del-proyecto-astro)
6. [Fase 2: Domain + Application + Infrastructure](#fase-2-domain--application--infrastructure)
7. [Fase 3: API Routes de Astro](#fase-3-api-routes-de-astro)
8. [Fase 4: Better Auth en Astro](#fase-4-better-auth-en-astro)
9. [Fase 5: Landing Page (SSG/SSR)](#fase-5-landing-page-ssgssr)
10. [Fase 6: Dashboard y Admin (Vue SPA)](#fase-6-dashboard-y-admin-vue-spa)
11. [Fase 7: Redirect Handler](#fase-7-redirect-handler)
12. [Fase 8: Estilos y Tailwind](#fase-8-estilos-y-tailwind)
13. [Fase 9: Migración de Tests](#fase-9-migración-de-tests)
14. [Fase 10: CI/CD y Deploy](#fase-10-cicd-y-deploy)
15. [Análisis de Riesgos](#análisis-de-riesgos)
16. [Timeline Estimado](#timeline-estimado)
17. [Checklist de Migración](#checklist-de-migración)

---

## Análisis de Viabilidad

### Viabilidad General: **ALTA**

Astro 6 + `@astrojs/cloudflare` v13 soporta nativamente todo lo que se necesita. La migración es técnicamente factible y Cloudflare es ahora la compañía padre de Astro (adquisición enero 2026).

### Compatibilidad del Stack Actual con Astro 6

| Tecnología | Soporte en Astro | Paquete | Estado |
|---|---|---|---|
| **Vue 3** | ✅ Oficial | `@astrojs/vue@6.0.1` | Funciona con `<script setup>`, Composition API |
| **Tailwind CSS v4** | ✅ Nativo (Vite plugin) | `@tailwindcss/vite` | Ya se usa, solo cambia config |
| **Better Auth** | ✅ Soporte first-class | `better-auth` | Integración oficial con Astro |
| **Cloudflare Workers** | ✅ Nativo | `@astrojs/cloudflare@13` | Dev corre en workerd (mismo runtime prod) |
| **D1 + Drizzle** | ✅ Via bindings | `drizzle-orm` + `@astrojs/cloudflare` | Funciona con `env` de Cloudflare |
| **Shadcn-VUE** | ✅ Funciona | `reka-ui` + `class-variance-authority` | Componentes se usan como Vue components |
| **TanStack Query** | ✅ Funciona | `@tanstack/vue-query` | Via `client:only` o `client:load` |
| **Zod** | ✅ Funciona | `zod` | Validación en API routes |
| **Biome** | ✅ Soporte experimental | `@biomejs/biome` | Soporta `.astro` desde v2.3.0 |

### Ventajas de Migrar a Astro

1. **Un solo runtime**: `astro dev` corre en workerd = mismo comportamiento dev/prod
2. **Menos JavaScript**: Astro genera 0 JS por defecto, solo components con `client:*`
3. **Mejor SEO**: Server-side rendering nativo para landing page
4. **Simplificación**: Un solo `package.json`, un solo build command, un solo dev server
5. **Mejor performance**: Assets estáticos + lazy loading de Vue components
6. **Cloudflare first-class**: Astro está dentro de Cloudflare, soporte premium

### Cambios Principales Requeridos

| Cambio | Descripción | Complejidad |
|--------|-------------|-------------|
| Backend → API routes | Hono routers se convierten en archivos `.ts` en `src/pages/api/` | Media |
| Vue Router → Astro routing | Navegación basada en archivos | Media |
| Pinia → Nanostores | State management más ligero y framework-agnostic | Baja |
| Axios → fetch nativo | Eliminar dependencia, usar API nativa | Baja |
| qrcode-generator → lean-qr | QR más ligero con Vue component | Baja |
| SPA fallback automático | Astro maneja esto nativamente | Baja |

---

## Stack Actual vs Stack Objetivo

| Capa | Actual | Objetivo | Cambio |
|------|--------|----------|--------|
| **Framework** | Hono (backend) + Vue SPA (frontend) | Astro 6 | Unificado |
| **Runtime** | Cloudflare Workers | Cloudflare Workers | Sin cambio |
| **Vue** | Vue 3.5 + Composition API | Vue 3.5 + `@astrojs/vue` | Se mantiene |
| **Routing Backend** | Hono routers | Astro API routes (`src/pages/api/`) | Cambiado |
| **Routing Frontend** | Vue Router | Astro file-based routing | Cambiado |
| **State Management** | Pinia | Nanostores | Ver sección 3 |
| **UI Components** | Shadcn-VUE (28 componentes) | Shadcn-VUE (se mantiene) | Sin cambio |
| **Tailwind** | Tailwind v4 + `@tailwindcss/vite` | Tailwind v4 + `@tailwindcss/vite` | Sin cambio |
| **Linter/Formatter** | Biome 2.4.5 | Biome 2.4.5+ (soporte Astro) | Sin cambio |
| **Auth** | Better Auth (server + client) | Better Auth (via Astro middleware + API route) | Adaptado |
| **ORM** | Drizzle ORM + D1 | Drizzle ORM + D1 | Sin cambio |
| **Data Fetching** | TanStack Query + Axios | TanStack Query + fetch nativo | Ver sección 3 |
| **Confetti** | canvas-confetti (~6KB) | canvas-confetti (se mantiene) | Sin cambio |
| **QR Code** | qrcode-generator (~7KB) | lean-qr (~4KB, Vue component) | Ver sección 3 |
| **SEO** | @vueuse/head | Astro `<head>` nativo | Mejorado |

---

## Recomendaciones de Tecnologías

### 3.1 State Management: Nanostores (reemplaza a Pinia)

**Recomendación: Nanostores** para state compartido entre Astro islands + Vue components.

| Característica | Pinia | Nanostores |
|---|---|---|
| Tamaño | ~1.5KB | ~286 bytes |
| Dependencies | 1 (vue) | 0 |
| Astro integration | Via `client:only` (pierde SSR) | Nativo (funciona en server + client) |
| Framework-agnostic | No (solo Vue) | Si (Vue, React, Svelte, vanilla) |
| DevTools | Vue Devtools | Vue Devtools (via plugin) |
| Tree-shaking | Parcial | Completo |

```bash
bun add nanostores @nanostores/vue
```

### 3.2 Data Fetching: fetch nativo (reemplaza a Axios)

**Recomendación: Fetch API nativo** (ya disponible en Cloudflare Workers y browsers modernos).

| Característica | Axios | Fetch API |
|---|---|---|
| Tamaño | ~13KB | 0 (built-in) |
| ETag caching | Custom interceptor | Implementable con middleware |
| TypeScript | Excelente | Nativo |
| Cloudflare Workers | Requiere polyfill | Nativo |

### 3.3 Confetti: canvas-confetti (se mantiene)

| Característica | canvas-confetti | lite-confetti |
|---|---|---|
| Tamaño | ~6KB | <4KB |
| Stars | 9K | 22 weekly downloads |
| API | Estable, probada | Nueva, menos documentada |
| Reduced motion | No | Si (auto) |

`canvas-confetti` es suficiente. La alternativa `lite-confetti` es más moderna pero con menos comunidad.

### 3.4 QR Code: lean-qr (reemplaza a qrcode-generator)

| Característica | qrcode-generator | lean-qr |
|---|---|---|
| Tamaño | ~7KB | <4KB |
| Dependencies | 0 | 0 |
| Vue component | No | Si (`lean-qr/vue`) |
| TypeScript | Typings | Nativo |
| Formatos output | Canvas, SVG | Canvas, SVG, data URI |
| ISO compliant | Si | Si |

### 3.5 Linter/Formatter: Biome (se mantiene)

Biome 2.4.5+ soporta archivos `.astro` de forma experimental.

```json
{
  "overrides": [
    {
      "includes": ["**/*.astro"],
      "linter": {
        "rules": {
          "style": { "useConst": "off", "useImportType": "off" },
          "correctness": { "noUnusedVariables": "off", "noUnusedImports": "off" }
        }
      }
    }
  ]
}
```

### 3.6 Resumen de Cambios de Dependencias

```diff
# Eliminar
- hono                          # Reemplazado por Astro API routes
- @hono/zod-validator           # Reemplazado por validación manual con Zod
- @hono/swagger-ui              # No necesario en Astro
- axios                         # Reemplazado por fetch nativo
- vue-router                    # Reemplazado por Astro file-based routing
- pinia                         # Reemplazado por nanostores
- @vueuse/head                  # Reemplazado por Astro <head> nativo
- qrcode-generator              # Reemplazado por lean-qr

# Agregar
+ astro                         # Framework core
+ @astrojs/cloudflare           # Adapter Cloudflare Workers
+ @astrojs/vue                  # Vue integration
+ nanostores + @nanostores/vue  # State management
+ lean-qr                       # QR codes

# Mantener
= vue                           # Vue 3.5
= tailwindcss + @tailwindcss/vite  # Tailwind v4
= @tanstack/vue-query           # Server state
= reka-ui                       # Shadcn-VUE primitives
= better-auth                   # Auth
= better-auth-cloudflare        # Cloudflare adapter
= @better-auth/drizzle-adapter  # Drizzle adapter
= drizzle-orm                   # ORM
= zod                           # Validation
= lucide-vue-next               # Icons
= vue-sonner                    # Toasts
= class-variance-authority       # Component variants
= clsx + tailwind-merge         # CSS utilities
= @biomejs/biome                # Linter/formatter
= canvas-confetti               # Confetti
```

### 3.7 Nota sobre Animaciones (motion-v)

`motion-v` funciona con `client:only="vue"` pero agrega ~12KB. Alternativas:

1. **CSS animations** (recomendado): Ya hay animaciones CSS en `style.css` (`slide-up`, `fade-in`, etc.). Para la landing page, las transiciones CSS son suficientes y no hidratan JS.
2. **`motion-v` con `client:only="vue"`**: Funciona pero pierde SSR para esa isla.
3. **View Transitions de Astro**: Para transiciones entre páginas, usar `<ClientRouter>` de Astro.

**Decision:** Usar CSS animations para la landing page (ya existentes) y `client:only="vue"` con `motion-v` solo en el dashboard donde se necesita interactividad compleja.

---

## Estructura del Proyecto Migrado

```
roly.top/
├── astro.config.mjs              # Configuración de Astro
├── wrangler.jsonc                 # Cloudflare Workers config
├── drizzle.config.ts              # Drizzle Kit config
├── package.json                   # Un solo package.json
├── tsconfig.json                  # TypeScript config
├── biome.json                     # Linter/formatter
├── .env                           # Variables de entorno
├── .env.example
├── drizzle/                       # Migraciones SQL (mismo que ahora)
│
├── src/
│   ├── pages/                     # ASTRO PAGES (file-based routing)
│   │   ├── index.astro            # Landing page (SSG)
│   │   ├── [...shortCode].astro   # Redirect handler
│   │   ├── auth/
│   │   │   └── error.astro        # Error de auth
│   │   ├── app/
│   │   │   ├── dashboard.astro    # Dashboard (Vue: client:only)
│   │   │   └── admin/
│   │   │       ├── index.astro    # Redirect a /admin/dashboard
│   │   │       ├── dashboard.astro
│   │   │       ├── users.astro
│   │   │       └── urls.astro
│   │   └── api/                   # API ROUTES (reemplazan Hono)
│   │       ├── auth/
│   │       │   └── [...all].ts    # Better Auth catch-all
│   │       ├── health.ts          # GET /api/health
│   │       ├── v1/
│   │       │   ├── urls.ts        # /api/v1/urls/*
│   │       │   ├── admin.ts       # /api/v1/admin/*
│   │       │   └── user.ts        # /api/v1/user/*
│   │       └── [...redirect].ts   # Redirect handler alternativo
│   │
│   ├── components/                # VUE COMPONENTS (mismos que ahora)
│   │   ├── ui/                    # Shadcn-VUE (28 directorios)
│   │   ├── layout/                # AppSidebar, DashboardLayout, ThemeToggle
│   │   ├── shared/                # AuthRequired, SignInModal, UrlResultCard
│   │   └── features/              # url-shortener, url-info, urls, qr, admin, dashboard
│   │
│   ├── layouts/
│   │   ├── Base.astro             # Layout base (HTML shell, <head>, global CSS)
│   │   ├── DashboardLayout.astro  # Layout con sidebar para dashboard
│   │   └── AdminLayout.astro      # Layout admin
│   │
│   ├── lib/
│   │   ├── auth.ts                # Better Auth server config (createAuth)
│   │   ├── auth-client.ts         # Better Auth client
│   │   ├── db.ts                  # createDb() factory
│   │   ├── utils.ts               # cn(), formatDate(), etc.
│   │   ├── etag.ts                # computeETag() helper
│   │   └── cors.ts                # getCorsHeaders() helper
│   │
│   ├── stores/                    # NANOSTORES (reemplazan Pinia)
│   │   ├── auth.ts                # Auth state (user, session, isAuthenticated)
│   │   ├── url.ts                 # URL state (savedUrls, urlLimit, etc.)
│   │   └── admin.ts               # Admin state
│   │
│   ├── composables/               # VUE COMPOSABLES (mismos, adaptados)
│   │   ├── useAuth.ts             # Better Auth composable (usa nanostores)
│   │   ├── useUrlShortener.ts     # URL shortener (usa nanostores + TanStack)
│   │   └── useCopyToClipboard.ts  # Clipboard utility
│   │
│   ├── api/                       # CLIENT-SIDE API (fetch nativo)
│   │   ├── http.ts                # fetch wrapper + ETag caching
│   │   ├── types.ts               # TypeScript types
│   │   └── admin.ts               # Admin API functions
│   │
│   ├── domain/                    # DOMAIN LAYER (copia intacta del backend)
│   │   ├── app-error.ts
│   │   ├── url/
│   │   │   ├── url.entity.ts
│   │   │   └── url.repository.port.ts
│   │   ├── user/
│   │   │   └── user.repository.port.ts
│   │   └── admin/
│   │       ├── admin.entity.ts
│   │       └── admin.repository.port.ts
│   │
│   ├── application/               # APPLICATION LAYER (copia intacta del backend)
│   │   ├── url/
│   │   │   ├── create-url.usecase.ts
│   │   │   ├── redirect-url.usecase.ts
│   │   │   ├── get-all-urls.usecase.ts
│   │   │   ├── get-public-urls.usecase.ts
│   │   │   ├── get-url-by-shortcode.usecase.ts
│   │   │   ├── delete-url.usecase.ts
│   │   │   └── delete-all-urls.usecase.ts
│   │   └── admin/
│   │       ├── set-admin-role.usecase.ts
│   │       ├── list-users.usecase.ts
│   │       ├── get-user-details.usecase.ts
│   │       ├── get-users-by-ids.usecase.ts
│   │       ├── get-admin-stats.usecase.ts
│   │       ├── ban-user.usecase.ts
│   │       ├── unban-user.usecase.ts
│   │       ├── update-user-url-limit.usecase.ts
│   │       ├── delete-user.usecase.ts
│   │       ├── admin-list-urls.usecase.ts
│   │       └── admin-delete-url.usecase.ts
│   │
│   ├── infrastructure/            # INFRASTRUCTURE LAYER (adaptado de Hono a Astro)
│   │   ├── persistence/           # Mismo que antes (Drizzle + D1)
│   │   │   ├── url.repository.impl.ts
│   │   │   ├── user.repository.impl.ts
│   │   │   └── admin.repository.impl.ts
│   │   └── http/
│   │       ├── error-handler.ts   # Adaptado: respuesta JSON sin Hono Context
│   │       └── cors.ts            # CORS headers helper
│   │
│   ├── middleware.ts              # ASTRO MIDDLEWARE (auth session injection)
│   │
│   ├── styles/
│   │   ├── global.css             # @import "tailwindcss" + estilos globales
│   │   └── fonts.css              # Fuentes auto-hospedadas
│   │
│   ├── assets/
│   │   └── fonts/                 # Fuentes (Syne, Inter, Space Mono)
│   │
│   └── env.d.ts                   # Tipos de Astro locals (user, session)
│
├── public/                        # Archivos estáticos
│   ├── shorturl.svg               # Logo/OG image
│   └── favicon.ico
│
└── tests/                         # TESTS (copiados del backend)
    ├── __mocks__/
    │   └── url.repository.mock.ts
    └── unit/
        ├── application/
        │   ├── url/
        │   └── admin/
        ├── infrastructure/
        │   └── http/
        └── utils/
```

---

## Fase 1: Setup del Proyecto Astro

### 1.1 Crear rama de git

```bash
git checkout -b feat/migration-astro
```

### 1.2 Inicializar proyecto Astro en carpeta nueva

```bash
# Crear proyecto Astro con adapter Cloudflare
npm create astro@latest roly-top-astro -- --template minimal
cd roly-top-astro

# Agregar integraciones
npx astro add vue
npx astro add cloudflare
```

### 1.3 Instalar dependencias core

```bash
bun add nanostores @nanostores/vue lean-qr canvas-confetti
bun add -D @tailwindcss/vite tailwindcss tw-animate-css
```

### 1.4 Configurar `astro.config.mjs`

```js
import { defineConfig } from "astro/config";
import vue from "@astrojs/vue";
import cloudflare from "@astrojs/cloudflare";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  output: "server",
  adapter: cloudflare(),
  integrations: [vue()],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": "/src",
      },
    },
  },
});
```

### 1.5 Configurar `wrangler.jsonc`

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "shorturl",
  "compatibility_date": "2026-03-03",
  "compatibility_flags": ["nodejs_compat"],
  "observability": { "enabled": true },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "shorturl-db",
      "database_id": "TU_DATABASE_ID",
      "migrations_dir": "drizzle"
    }
  ]
}
```

### 1.6 Configurar TypeScript (`tsconfig.json`)

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },
    "types": ["@cloudflare/workers-types"]
  }
}
```

### 1.7 Copiar archivos del proyecto actual

```bash
# Copiar capas del dominio (sin cambios)
cp -r ../backend/src/domain src/domain
cp -r ../backend/src/application src/application

# Copiar infraestructura (adaptar imports)
cp -r ../backend/src/infrastructure/persistence src/infrastructure/persistence

# Copiar schema de DB
cp ../backend/src/db/schema.ts src/lib/db-schema.ts
cp ../backend/src/db/auth-schema.ts src/lib/db-auth-schema.ts

# Copiar tests
cp -r ../backend/tests tests

# Copiar componentes Vue del frontend
cp -r ../frontend/src/components src/components
cp -r ../frontend/src/composables src/composables
cp -r ../frontend/src/api/types.ts src/api/types.ts

# Copiar estilos
cp ../frontend/src/style.css src/styles/global.css
cp ../frontend/src/fonts.css src/styles/fonts.css

# Copiar assets
cp -r ../frontend/src/assets/fonts src/assets/fonts
cp -r ../frontend/public/* public/
```

---

## Fase 2: Domain + Application + Infrastructure

### 2.1 Domain Layer — Sin cambios

Los archivos de `domain/` no importan nada de Hono, Drizzle ni Workers. Se copian tal cual:

- `src/domain/app-error.ts`
- `src/domain/url/url.entity.ts`
- `src/domain/url/url.repository.port.ts`
- `src/domain/user/user.repository.port.ts`
- `src/domain/admin/admin.entity.ts`
- `src/domain/admin/admin.repository.port.ts`

### 2.2 Application Layer — Sin cambios

Los casos de uso solo dependen de domain. Se copian tal cual:

- `src/application/url/*.ts` (7 archivos)
- `src/application/admin/*.ts` (11 archivos)

### 2.3 Infrastructure Layer — Adaptaciones menores

**`src/infrastructure/persistence/`** — Sin cambios (Drizzle + D1 funciona igual).

**`src/infrastructure/http/error-handler.ts`** — Adaptar para no depender de Hono `Context`:

```typescript
import { AppError, ValidationError } from "@/domain/app-error";

const STATUS_CODE_MAP: Record<string, number> = {
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 400,
  SHORT_CODE_ALREADY_EXISTS: 409,
  URL_NOT_FOUND: 404,
  URL_LIMIT_REACHED: 409,
  INTERNAL_SERVER_ERROR: 500,
};

export type ApiErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
  };
};

function getStatusCode(code: string): number {
  return STATUS_CODE_MAP[code] ?? 500;
}

export function errorResponse(error: AppError): Response {
  const statusCode = getStatusCode(error.code);
  console.warn(`[API ERROR] code=${error.code} status=${statusCode} message=${error.message}`);
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        statusCode,
      },
    } satisfies ApiErrorResponse),
    {
      status: statusCode,
      headers: { "Content-Type": "application/json" },
    }
  );
}

export function jsonError(
  message: string,
  code: string,
  status: number
): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: { code, message, statusCode: status },
    } satisfies ApiErrorResponse),
    {
      status,
      headers: { "Content-Type": "application/json" },
    }
  );
}
```

**`src/infrastructure/http/cors.ts`** — Helper simple de CORS:

```typescript
export function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigins = [
    "https://roly.top",
    "http://localhost:4321", // Astro dev
    "http://localhost:8787",
  ];

  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-api-key, Authorization",
    "Access-Control-Max-Age": "86400",
    "Access-Control-Allow-Credentials": "true",
  };

  if (origin && allowedOrigins.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Vary"] = "Origin";
  }

  return headers;
}
```

### 2.4 Database — Adaptaciones menores

**`src/lib/db.ts`** — Factory de Drizzle (adaptado para Astro):

```typescript
import { drizzle } from "drizzle-orm/d1";
import * as appSchema from "./db-schema";
import * as authSchema from "./db-auth-schema";

const combinedSchema = { ...appSchema, ...authSchema };

let cachedDb: ReturnType<typeof drizzle> | null = null;

export function createDb(d1Binding: D1Database) {
  if (!cachedDb) {
    cachedDb = drizzle(d1Binding, { schema: combinedSchema });
  }
  return cachedDb;
}

export type DrizzleDB = ReturnType<typeof createDb>;
```

---

## Fase 3: API Routes de Astro

Las API routes de Astro reemplazan los Hono routers. Cada archivo en `src/pages/api/` expone un endpoint.

### 3.1 Auth Handler — `src/pages/api/auth/[...all].ts`

```typescript
import type { APIRoute } from "astro";
import { createAuth } from "@/lib/auth";

export const ALL: APIRoute = async (ctx) => {
  const env = ctx.locals.runtime.env;
  const auth = createAuth(env);
  return auth.handler(ctx.request);
};
```

### 3.2 Health Check — `src/pages/api/health.ts`

```typescript
import type { APIRoute } from "astro";

export const GET: APIRoute = () => {
  return new Response(JSON.stringify({ status: "ok" }), {
    headers: { "Content-Type": "application/json" },
  });
};
```

### 3.3 URL Routes — `src/pages/api/v1/urls.ts`

```typescript
import type { APIRoute } from "astro";
import { z } from "zod";
import { createDb } from "@/lib/db";
import { createAuth } from "@/lib/auth";
import { UrlRepository } from "@/infrastructure/persistence/url.repository.impl";
import { UserRepository } from "@/infrastructure/persistence/user.repository.impl";
import { CreateUrlUseCase } from "@/application/url/create-url.usecase";
import { GetPublicUrlsUseCase } from "@/application/url/get-public-urls.usecase";
import { computeETag } from "@/lib/etag";
import { getCorsHeaders } from "@/infrastructure/http/cors";

const createUrlSchema = z.object({
  originalUrl: z.string().url().refine(
    (val) => val.startsWith("http://") || val.startsWith("https://"),
    { message: "La URL debe comenzar con http:// o https://" }
  ),
  shortCode: z.string().min(1).max(9).regex(/^[a-z0-9]+$/).optional(),
});

function json(data: unknown, status: number, extraHeaders?: Record<string, string>) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}

export const GET: APIRoute = async (ctx) => {
  const env = ctx.locals.runtime.env;
  const url = new URL(ctx.request.url);
  const origin = ctx.request.headers.get("Origin");
  const cors = getCorsHeaders(origin);

  // GET /v1/urls/public/stats
  if (url.pathname.endsWith("/public/stats")) {
    const db = createDb(env.DB);
    const urlRepo = new UrlRepository(db);
    const userRepo = new UserRepository(db);
    const useCase = new GetPublicUrlsUseCase(urlRepo, userRepo);
    const urls = await useCase.execute();
    const stats = {
      publicUrls: urls.length,
      totalRedirects: urls.reduce((sum, u) => sum + (u.visits ?? 0), 0),
    };
    const etag = await computeETag(stats);
    const ifNone = ctx.request.headers.get("if-none-match");
    if (ifNone === etag) return new Response(null, { status: 304, headers: { ETag: etag, ...cors } });
    return json(stats, 200, { ETag: etag, ...cors });
  }

  // GET /v1/urls/public
  if (url.pathname.endsWith("/public")) {
    const db = createDb(env.DB);
    const urlRepo = new UrlRepository(db);
    const userRepo = new UserRepository(db);
    const useCase = new GetPublicUrlsUseCase(urlRepo, userRepo);
    const urls = await useCase.execute();
    const etag = await computeETag(urls);
    const ifNone = ctx.request.headers.get("if-none-match");
    if (ifNone === etag) return new Response(null, { status: 304, headers: { ETag: etag, ...cors } });
    return json(urls, 200, { ETag: etag, ...cors });
  }

  // GET /v1/urls (authenticated)
  const auth = createAuth(env);
  const session = await auth.api.getSession({ headers: ctx.request.headers });
  if (!session?.user) {
    return json(
      { success: false, error: { code: "UNAUTHORIZED", message: "No autorizado", statusCode: 401 } },
      401, cors
    );
  }

  const db = createDb(env.DB);
  const urlRepo = new UrlRepository(db);
  const userRepo = new UserRepository(db);
  const urls = await urlRepo.findByUserId(session.user.id);
  const dbUser = await userRepo.findLimitAndRoleById(session.user.id);
  const payload = {
    urls,
    urlLimit: dbUser?.role === "admin" ? 999 : (dbUser?.urlLimit ?? 2),
  };
  const etag = await computeETag(payload);
  const ifNone = ctx.request.headers.get("if-none-match");
  if (ifNone === etag) return new Response(null, { status: 304, headers: { ETag: etag, ...cors } });
  return json(payload, 200, { ETag: etag, ...cors });
};

export const POST: APIRoute = async (ctx) => {
  const env = ctx.locals.runtime.env;
  const origin = ctx.request.headers.get("Origin");
  const cors = getCorsHeaders(origin);

  const auth = createAuth(env);
  const session = await auth.api.getSession({ headers: ctx.request.headers });
  if (!session?.user) {
    return json(
      { success: false, error: { code: "UNAUTHORIZED", message: "No autorizado", statusCode: 401 } },
      401, cors
    );
  }

  const body = await ctx.request.json();
  const parsed = createUrlSchema.safeParse(body);
  if (!parsed.success) {
    return json(
      { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.issues.map(i => i.message).join("; "), statusCode: 400 } },
      400, cors
    );
  }

  const db = createDb(env.DB);
  const urlRepo = new UrlRepository(db);
  const userRepo = new UserRepository(db);
  const dbUser = await userRepo.findLimitAndRoleById(session.user.id);
  const limit = dbUser?.role === "admin" ? 999 : (dbUser?.urlLimit ?? 2);
  const urlCount = await urlRepo.countByUserId(session.user.id);
  if (urlCount >= limit) {
    return json(
      { success: false, error: { code: "URL_LIMIT_REACHED", message: `Límite de ${limit} URLs alcanzado`, statusCode: 409 } },
      409, cors
    );
  }

  const useCase = new CreateUrlUseCase(urlRepo);
  const created = await useCase.execute({
    originalUrl: parsed.data.originalUrl,
    shortCode: parsed.data.shortCode,
    userId: session.user.id,
  });

  return json(created, 201, cors);
};

export const OPTIONS: APIRoute = () => {
  return new Response(null, { status: 204, headers: getCorsHeaders(null) });
};
```

### 3.4 Admin Routes — `src/pages/api/v1/admin.ts`

Siguiendo el mismo patrón, migrar las rutas admin:
- `GET /v1/admin/stats`
- `GET /v1/admin/users` (con paginación y búsqueda)
- `GET /v1/admin/users/:userId`
- `POST /v1/admin/users/:userId/ban`
- `POST /v1/admin/users/:userId/unban`
- `PATCH /v1/admin/users/:userId/url-limit`
- `DELETE /v1/admin/users/:userId`
- `GET /v1/admin/urls`
- `DELETE /v1/admin/urls/:shortCode`
- `DELETE /v1/admin/urls`
- `POST /v1/admin/setup/make-admin`

### 3.5 User Routes — `src/pages/api/v1/user.ts`

- `GET /v1/user/session`
- `GET /v1/user/urls`
- `DELETE /v1/user/urls/:shortCode`

---

## Fase 4: Better Auth en Astro

### 4.1 Server Config — `src/lib/auth.ts`

```typescript
import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { withCloudflare } from "better-auth-cloudflare";
import { createDb } from "./db";

type Env = {
  DB: D1Database;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  DEV_MODE: string;
  TRUSTED_ORIGINS?: string;
};

const authCache = new WeakMap<object, ReturnType<typeof createAuth>>();

function createAuthInstance(env: Env) {
  const db = createDb(env.DB);

  return betterAuth({
    ...withCloudflare(
      {
        autoDetectIpAddress: true,
        geolocationTracking: true,
        cf: {},
        d1: { db, options: { usePlural: true } },
      },
      {
        socialProviders: {
          google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          },
        },
      }
    ),
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: env.TRUSTED_ORIGINS
      ? env.TRUSTED_ORIGINS.split(",").map((o) => o.trim())
      : ["http://localhost:4321", "https://roly.top"],
    account: { skipStateCookieCheck: true },
    plugins: [admin()],
    onAPIError: {
      errorURL: env.DEV_MODE === "true" ? "http://localhost:4321/auth/error" : "/auth/error",
    },
    advanced: {
      defaultCookieAttributes: {
        sameSite: "lax",
        secure: env.DEV_MODE !== "true",
        httpOnly: true,
        path: "/",
      },
    },
  });
}

export function createAuth(env: Env) {
  let auth = authCache.get(env);
  if (!auth) {
    auth = createAuthInstance(env);
    authCache.set(env, auth);
  }
  return auth;
}

export type Auth = ReturnType<typeof createAuth>;
```

### 4.2 Client Config — `src/lib/auth-client.ts`

```typescript
import { createAuthClient } from "better-auth/client";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: "", // Mismo origen (Astro sirve todo)
  plugins: [adminClient()],
});

export const { signIn, signOut, useSession } = authClient;
```

### 4.3 Astro Middleware — `src/middleware.ts`

```typescript
import { defineMiddleware } from "astro:middleware";
import { createAuth } from "@/lib/auth";

export const onRequest = defineMiddleware(async (context, next) => {
  const path = context.url.pathname;
  const needsSession = path.startsWith("/app/") || path.startsWith("/api/v1/");

  if (needsSession) {
    const env = context.locals.runtime.env;
    const auth = createAuth(env);
    const session = await auth.api.getSession({
      headers: context.request.headers,
    });
    context.locals.user = session?.user ?? null;
    context.locals.session = session?.session ?? null;
  } else {
    context.locals.user = null;
    context.locals.session = null;
  }

  return next();
});
```

### 4.4 Tipos — `src/env.d.ts`

```typescript
/// <reference types="astro/client" />

interface Locals {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    role: string;
    banned: boolean;
    banReason: string | null;
    banExpires: Date | null;
  } | null;
  session: {
    id: string;
    expiresAt: Date;
    token: string;
  } | null;
  runtime: {
    env: {
      DB: D1Database;
      BETTER_AUTH_SECRET: string;
      BETTER_AUTH_URL: string;
      GOOGLE_CLIENT_ID: string;
      GOOGLE_CLIENT_SECRET: string;
      SERVICE_ADMIN_API_KEY: string;
      TRUSTED_ORIGINS?: string;
      DEV_MODE: string;
    };
    cf: unknown;
    ctx: unknown;
  };
}
```

---

## Fase 5: Landing Page (SSG/SSR)

### 5.1 Layout Base — `src/layouts/Base.astro`

```astro
---
interface Props {
  title?: string;
  description?: string;
  robots?: string;
}

const {
  title = "roly.top — Acortador de URLs",
  description = "Simple · Rápido · Gratis · Construido sobre infraestructura Edge",
  robots = "index, follow"
} = Astro.props;
---
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <meta name="robots" content={robots} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:image" content="/shorturl.svg" />
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
  </head>
  <body class="min-h-screen bg-background text-foreground">
    <slot />
  </body>
</html>

<style>
  @import "../styles/global.css";
  @import "../styles/fonts.css";
</style>
```

### 5.2 Landing Page — `src/pages/index.astro`

```astro
---
import BaseLayout from "@/layouts/Base.astro";
import ThemeToggle from "@/components/layout/ThemeToggle.vue";
import HomeContent from "@/components/features/home/HomeContent.vue";
---

<BaseLayout title="roly.top — Acortador de URLs">
  <header class="sticky top-0 z-50 h-[62px] flex items-center justify-between px-7 border-b border-border/50 bg-background/88 backdrop-blur-[16px]">
    <div class="flex items-center gap-2.5">
      <div class="w-8 h-8 rounded-[9px] bg-primary flex items-center justify-center">
        <span class="text-primary-foreground text-sm">🔗</span>
      </div>
      <div>
        <span class="font-display font-800 text-[17px] tracking-tight">roly<span class="text-primary">.</span>top</span>
        <span class="block font-mono text-[11px] tracking-wider text-muted-foreground leading-none -mt-0.5">by roldyoran</span>
      </div>
    </div>
    <ThemeToggle client:load />
  </header>

  <main class="flex-grow relative z-10">
    <HomeContent client:load />
  </main>
</BaseLayout>
```

### 5.3 Vue Component para Home — `src/components/features/home/HomeContent.vue`

Este componente contiene el hero, el formulario de acortamiento, las tabs, stats strip, etc. Se hidrata con `client:load` para mantener SSR inicial y luego hidratar interactividad.

---

## Fase 6: Dashboard y Admin (Vue SPA)

### 6.1 Dashboard Page — `src/pages/app/dashboard.astro`

```astro
---
import BaseLayout from "@/layouts/Base.astro";
import DashboardApp from "@/components/features/dashboard/DashboardApp.vue";

if (!Astro.locals.user) {
  return Astro.redirect("/");
}
---

<BaseLayout title="Dashboard — roly.top" robots="noindex, nofollow">
  <DashboardApp client:only="vue" user={Astro.locals.user} />
</BaseLayout>
```

### 6.2 Dashboard Vue Component — `src/components/features/dashboard/DashboardApp.vue`

```vue
<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useUrlStore } from "@/stores/url";
import DashboardLayout from "@/components/layout/DashboardLayout.vue";
import AppSidebar from "@/components/layout/AppSidebar.vue";

const props = defineProps<{
  user: { id: string; name: string; email: string; image: string | null; role: string };
}>();

const authStore = useAuthStore();
const urlStore = useUrlStore();
const activePanel = ref("overview");

onMounted(() => {
  authStore.setUser(props.user);
  urlStore.initialize(props.user.id);
});
</script>

<template>
  <DashboardLayout>
    <template #sidebar>
      <AppSidebar :active-panel="activePanel" @navigate="activePanel = $event" />
    </template>
    <template #content>
      <!-- Paneles del dashboard -->
    </template>
  </DashboardLayout>
</template>
```

### 6.3 Admin Pages — `src/pages/app/admin/*.astro`

Cada página admin sigue el mismo patrón:

```astro
---
import BaseLayout from "@/layouts/Base.astro";
import AdminApp from "@/components/features/admin/AdminApp.vue";

if (!Astro.locals.user || Astro.locals.user.role !== "admin") {
  return Astro.redirect("/");
}
---

<BaseLayout title="Admin — roly.top" robots="noindex, nofollow">
  <AdminApp client:only="vue" user={Astro.locals.user} panel="dashboard" />
</BaseLayout>
```

---

## Fase 7: Redirect Handler

### `src/pages/[...shortCode].astro`

```astro
---
const shortCode = Astro.params.shortCode;

if (!shortCode) {
  return Astro.redirect("/");
}

if (!/^[a-z0-9]{1,9}$/.test(shortCode)) {
  return Astro.redirect("/");
}

const env = Astro.locals.runtime.env;
const { createDb } = await import("@/lib/db");
const { UrlRepository } = await import("@/infrastructure/persistence/url.repository.impl");
const { RedirectUrlUseCase } = await import("@/application/url/redirect-url.usecase");

const db = createDb(env.DB);
const repo = new UrlRepository(db);
const useCase = new RedirectUrlUseCase(repo);
const url = await useCase.execute(shortCode);

if (!url) {
  return Astro.redirect("/");
}

return Response.redirect(url.originalUrl, 302);
---
```

Astro prioriza rutas más específicas. `src/pages/api/v1/urls.ts` se ejecuta antes que `src/pages/[...shortCode].astro`.

---

## Fase 8: Estilos y Tailwind

### 8.1 `src/styles/global.css`

Mover el contenido actual de `frontend/src/style.css` tal cual:

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

/* ... todo el contenido existente de style.css (1108 líneas) ... */
```

### 8.2 Fuentes

Copiar `frontend/src/fonts.css` a `src/styles/fonts.css` y los archivos de fuentes a `src/assets/fonts/`.

---

## Fase 9: Migración de Tests

### 9.1 Adaptar imports

Los tests del backend usan `@/` alias que ahora apunta a `src/`. Solo cambiar los tests de `infrastructure/http/error-handler.ts` para quitar la dependencia de Hono `Context`.

### 9.2 Ejecutar tests

```bash
bun test
```

---

## Fase 10: CI/CD y Deploy

### 10.1 GitHub Actions — `.github/workflows/deploy.yaml`

```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest
      - run: bun install
      - run: bun run check
      - run: bun test
      - run: bun run build
      - name: Configure wrangler.jsonc
        run: |
          sed -i 's/YOUR_BETTER_AUTH_SECRET/'"${{ secrets.BETTER_AUTH_SECRET }}"'/g' wrangler.jsonc
          sed -i 's/YOUR_BETTER_AUTH_URL/'"${{ secrets.BETTER_AUTH_URL }}"'/g' wrangler.jsonc
          sed -i 's/YOUR_GOOGLE_CLIENT_ID/'"${{ secrets.GOOGLE_CLIENT_ID }}"'/g' wrangler.jsonc
          sed -i 's/YOUR_GOOGLE_CLIENT_SECRET/'"${{ secrets.GOOGLE_CLIENT_SECRET }}"'/g' wrangler.jsonc
          sed -i 's/YOUR_SERVICE_ADMIN_API_KEY/'"${{ secrets.SERVICE_ADMIN_API_KEY }}"'/g' wrangler.jsonc
          sed -i 's/YOUR_TRUSTED_ORIGINS/'"${{ secrets.TRUSTED_ORIGINS }}"'/g' wrangler.jsonc
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy --minify
```

### 10.2 Scripts en `package.json`

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "biome check .",
    "lint": "biome lint --write .",
    "format": "biome format --write .",
    "test": "bun test",
    "db:generate": "drizzle-kit generate",
    "db:migrate:local": "wrangler d1 migrations apply DB --local",
    "db:migrate:remote": "wrangler d1 migrations apply DB --remote"
  }
}
```

---

## Análisis de Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| `client:only` pierde SSR para dashboard | Media | Bajo | Dashboard ya es SPA, no necesita SSR |
| CSS scoped pierde estilos en `client:only` | Baja | Alto | Bug conocido de Astro v6, usar `client:load` cuando sea posible |
| View Transitions rompe CSS Grid layouts | Baja | Medio | No usar `<ClientRouter>` inicialmente |
| Better Auth cookies cross-origin | Baja | Alto | Astro sirve todo desde mismo origen, no hay cross-origin |
| Performance API routes vs Hono | Baja | Bajo | Astro API routes usan Workers runtime, rendimiento similar |
| Nanostores sin DevTools como Pinia | Baja | Bajo | `@nanostores/vue` tiene plugin de Vue Devtools |

---

## Timeline Estimado

| Fase | Descripción | Horas |
|------|-------------|-------|
| 1 | Setup proyecto Astro + config | 2-3h |
| 2 | Copiar domain/application/infrastructure | 1-2h |
| 3 | API routes (auth, urls, admin, user) | 4-6h |
| 4 | Better Auth en Astro | 2-3h |
| 5 | Landing page (index.astro + HomeContent.vue) | 3-4h |
| 6 | Dashboard + Admin (client:only) | 4-6h |
| 7 | Redirect handler | 1h |
| 8 | Estilos + Tailwind + fonts | 1-2h |
| 9 | Tests unitarios | 2-3h |
| 10 | CI/CD + deploy | 1-2h |
| 11 | Testing completo + fix bugs | 3-4h |
| **Total** | | **~24-35h** |

---

## Checklist de Migración

- [ ] Crear rama `feat/migration-astro`
- [ ] Setup proyecto Astro con adapter Cloudflare
- [ ] Copiar domain layer (sin cambios)
- [ ] Copiar application layer (sin cambios)
- [ ] Adaptar infrastructure layer (sin Hono)
- [ ] Crear database factory (`src/lib/db.ts`)
- [ ] Migrar Better Auth config
- [ ] Crear Astro middleware para auth
- [ ] Crear API routes (auth, health, urls, admin, user)
- [ ] Crear redirect handler
- [ ] Crear landing page (index.astro)
- [ ] Crear dashboard page (client:only)
- [ ] Crear admin pages (client:only)
- [ ] Migrar estilos Tailwind
- [ ] Migrar fuentes
- [ ] Migrar componentes Vue
- [ ] Migrar a nanostores (reemplazar Pinia)
- [ ] Migrar API client a fetch nativo
- [ ] Migrar tests unitarios
- [ ] Configurar CI/CD
- [ ] Deploy a Cloudflare Workers
- [ ] Testing completo
- [ ] Eliminar carpetas `backend/` y `frontend/` anteriores
