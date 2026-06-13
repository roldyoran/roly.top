# AGENTS.md — roly.top Backend

Guía de arquitectura y estructura del backend para agentes de IA y desarrolladores.

---

## Descripción del Proyecto

API REST de acortador de URLs construida con **Hono** sobre **Cloudflare Workers**.
Permite crear URLs cortas con un `shortCode` de máximo 9 caracteres alfanuméricos en minúsculas (auto-generado o personalizado), listar todas las URLs, buscar por código corto, redirigir a la URL original (incrementando el contador de visitas) y administrar registros mediante endpoints protegidos por autenticación.
La base de datos es **Cloudflare D1** (SQLite serverless), gestionada con **Drizzle ORM**.
Autenticación con **Better Auth** (Google OAuth + sesiones cookie).

---

## Stack Tecnológico

| Capa | Tecnología | Versión |
|------|------------|---------|
| Runtime | Cloudflare Workers | - |
| Framework HTTP | Hono | ^4.12.3 |
| Base de datos | Cloudflare D1 (SQLite) | - |
| ORM | Drizzle ORM | ^0.45.1 |
| Autenticación | Better Auth (Google OAuth) | ^1.6.15 |
| Adaptador Cloudflare | better-auth-cloudflare | ^0.3.0 |
| Adaptador Drizzle | @better-auth/drizzle-adapter | ^1.6.15 |
| Validación | Zod + @hono/zod-validator | ^4.3.6 / ^0.7.6 |
| Lenguaje | TypeScript (ESNext, Bundler) | ^5.8.3 |
| Gestor de paquetes | Bun | ≥1.0 |
| CLI despliegue | Wrangler | ^4.69.0 |
| Linter/Formateador | Biome | 2.4.5 |
| Testing | Bun test runner (built-in) | - |

---

## Dependencias de Producción

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `hono` | ^4.12.3 | Framework HTTP |
| `drizzle-orm` | ^0.45.1 | ORM para D1/SQLite |
| `better-auth` | ^1.6.15 | Autenticación (Google OAuth) |
| `better-auth-cloudflare` | ^0.3.0 | Adaptador Better Auth para Cloudflare |
| `@better-auth/drizzle-adapter` | ^1.6.15 | Adaptador Drizzle para Better Auth |
| `@hono/zod-validator` | ^0.7.6 | Middleware de validación Zod |
| `@hono/swagger-ui` | ^0.6.1 | Swagger UI (registrado, no montado) |
| `zod` | ^4.3.6 | Validación de esquemas |

---

## Scripts Disponibles

```bash
# Desarrollo
bun dev                          # Servidor local con wrangler dev
bun deploy                       # Deploy a Cloudflare Workers (minificado)

# Base de datos
bun run db:generate              # Genera SQL de migración desde el schema
bun run db:migrate:local         # Aplica migraciones en D1 local (.wrangler/state)
bun run db:migrate:remote        # Aplica migraciones en D1 remoto (producción)
bun run db:push                  # Push directo del schema al D1 remoto
bun run db:studio                # Drizzle Studio GUI

# Tests
bun test                         # Todos los tests
bun run test:watch               # Modo watch
bun run test:unit                # Solo tests/unit/
bun run test:app                 # Solo tests de application/
bun run test:utils               # Solo tests de utils/
bun run test:coverage            # Con reporte de cobertura
bun run test:bail                # Aborta al primer fallo (útil en CI)

# Formato
bun run format                   # Formatea el código con Biome

# Tipos
bun run cf-typegen               # Genera tipos de Workers
```

---

## Arquitectura: Hexagonal (Ports & Adapters)

El proyecto sigue **Arquitectura Hexagonal**, separando el núcleo de negocio de los detalles de infraestructura y transporte. El dominio no importa nada de Hono, Drizzle ni Workers.

```
src/
├── domain/                          ← Núcleo (sin dependencias externas)
│   ├── app-error.ts                 ← AppError base + errores genéricos reutilizables
│   └── url/
│       ├── url.entity.ts            ← Entidad UrlEntity + CreateUrlInput
│       └── url.repository.port.ts   ← Puerto (interfaz del repositorio)
│
├── application/                     ← Casos de uso
│   ├── url/
│   │   ├── create-url.usecase.ts            ← Crear URL + ShortCodeAlreadyExistsError
│   │   ├── get-all-urls.usecase.ts
│   │   ├── get-public-urls.usecase.ts       ← Filtrar URLs por usuario admin
│   │   ├── get-url-by-shortcode.usecase.ts
│   │   ├── redirect-url.usecase.ts          ← Redirigir + incrementar visitas
│   │   ├── delete-url.usecase.ts            ← Eliminar por shortCode + UrlNotFoundError
│   │   └── delete-all-urls.usecase.ts       ← Eliminar todas las URLs
│   └── admin/
│       └── set-admin-role.usecase.ts        ← Asignar rol admin por email
│
├── infrastructure/                  ← Adaptadores secundarios
│   ├── persistence/
│   │   ├── url.repository.impl.ts   ← Implementación Drizzle + D1
│   │   └── admin.repository.impl.ts ← Implementación admin (usuarios, stats)
│   └── http/
│       ├── error-handler.ts         ← onError global + errorResponse() + validationHook
│       └── cors-middleware.ts        ← CORS unificado con echo de origin
│
├── presentation/                    ← Adaptadores primarios (HTTP)
│   └── http/
│       ├── redirect/                ← Redirección directa por shortCode
│       │   └── index.ts             ← GET /:shortCode → redirect 302
│       └── v1/                      ← Versión 1 de la API REST
│           ├── index.ts             ← Router agregador de v1 + middleware sesión + urlRepo
│           ├── url.routes.ts        ← Rutas públicas + autenticadas
│           ├── admin.routes.ts      ← Rutas protegidas (make-admin, delete URLs)
│           └── user.routes.ts       ← Rutas de usuario (perfil, sesión)
│
├── auth/
│   └── index.ts                     ← Better Auth config (admin plugin, cookies, trustedOrigins)
│
├── db/
│   ├── index.ts                     ← createDb(d1Binding) → instancia Drizzle
│   ├── schema.ts                    ← Definición de tabla `urls` (con userId)
│   └── auth-schema.ts               ← Better Auth tables (users, sessions, accounts, verifications)
│
├── utils/
│   ├── context.ts                   ← Tipo Bindings + Variables (urlRepo) + checkEnvMiddleware
│   └── schemas.ts                   ← Esquemas Zod (shortCodeSchema, createUrlSchema)
│
└── index.ts                          ← Bootstrap: app Hono + CORS unificado + rutas + onError

tests/
├── tsconfig.json                     ← Extiende tsconfig raíz, añade bun-types
├── __mocks__/
│   └── url.repository.mock.ts       ← MockedRepository + urlFixture
└── unit/
    ├── application/
    │   ├── url/
    │   │   ├── create-url.usecase.test.ts
    │   │   ├── get-all-urls.usecase.test.ts
    │   │   ├── get-url-by-shortcode.usecase.test.ts
    │   │   ├── redirect-url.usecase.test.ts
    │   │   ├── delete-url.usecase.test.ts
    │   │   └── delete-all-urls.usecase.test.ts
    │   └── admin/
    │       └── set-admin-role.usecase.test.ts
    ├── infrastructure/http/
    │   └── error-handler.test.ts
    └── utils/
        ├── app-error.test.ts
        ├── schemas.test.ts
        └── cors-middleware.test.ts
```

---

## Capas en Detalle

### `domain/` — Dominio
- **`app-error.ts`**: clase base `AppError` (con `message` y `code` de negocio). Los errores **nunca** deben incluir `statusCode` — ese es un detalle de infraestructura. Subclases genéricas:
  - `UnauthorizedError` — `UNAUTHORIZED`
  - `NotFoundError` — `NOT_FOUND`
  - `ValidationError` — `VALIDATION_ERROR`
  - `UrlLimitReachedError` — `URL_LIMIT_REACHED`
- **`url.entity.ts`**: interfaz `UrlEntity` (`id`, `originalUrl`, `shortCode`, `createdAt`, `visits`) e interfaz `CreateUrlInput`. No depende de ningún framework.
- **`url.repository.port.ts`**: interfaz `UrlRepositoryPort` con los métodos:
  - `findAll()` → `UrlEntity[]`
  - `findByShortCode(shortCode)` → `UrlEntity | null`
  - `findByOriginalUrl(originalUrl)` → `UrlEntity | null`
  - `create(input)` → `UrlEntity`
  - `deleteByShortCode(shortCode)` → `UrlEntity | null`
  - `deleteAll()` → `void`
  - `incrementVisits(shortCode)` → `UrlEntity | null`

### `application/` — Casos de uso
Orquestan la lógica de negocio recibiendo el puerto como dependencia (inyección de dependencias manual). **Nunca** importan Hono, Drizzle ni D1.

- **`CreateUrlUseCase`**: primero verifica si `originalUrl` ya existe (devuelve la existente si es así). Si se provee `shortCode`, verifica que no esté en uso — lanza `ShortCodeAlreadyExistsError` si ya existe. Si no, genera uno automáticamente. Verifica límite de URLs por usuario.
- **`GetAllUrlsUseCase`**: retorna todas las URLs.
- **`GetPublicUrlsUseCase`**: retorna URLs filtradas por usuario admin (requiere `userId` del usuario autenticado).
- **`GetUrlByShortCodeUseCase`**: busca por código corto, retorna `null` si no existe.
- **`RedirectUrlUseCase`**: busca la URL por `shortCode`; si existe, llama a `incrementVisits` y retorna la entidad actualizada. Retorna `null` si no existe.
- **`DeleteUrlUseCase`**: elimina por `shortCode` — lanza `UrlNotFoundError` si no existe.
- **`DeleteAllUrlsUseCase`**: elimina todos los registros de la tabla.
- **`SetAdminRoleUseCase`**: asigna rol `admin` a usuario por email usando Better Auth admin plugin.

### `infrastructure/` — Adaptadores secundarios
- **`UrlRepository`**: implementa `UrlRepositoryPort` usando Drizzle ORM sobre D1. Contiene `generateShortCode()` para crear códigos aleatorios de 9 chars `[a-z0-9]` con eliminación de sesgo de módulo. Implementa `incrementVisits` con un `UPDATE ... SET visits = visits + 1 ... RETURNING` atómico.
- **`AdminRepository`**: implementa operaciones de administración (usuarios, stats, paginación).
- **`http/error-handler.ts`**: **punto único de control de errores**.
  - `ApiErrorResponse` — tipo del formato estándar de respuesta de error.
  - `errorResponse(c, error)` — construye la respuesta JSON con el formato estándar.
  - `onError(error, c)` — handler global registrado en `app.onError()`. Los `AppError` se formatean con `errorResponse`; cualquier otro error se convierte en 500.
  - `validationHook` — hook para `zValidator` que estandariza errores de Zod al mismo formato.
  - `redirectValidationHook` — para `/:shortCode` param validation failure → 302 a `/` (SPA).
  - Mapeo de `code` → `statusCode` HTTP (ej: `UNAUTHORIZED` → 401, `SHORT_CODE_ALREADY_EXISTS` → 409).

### `presentation/` — Adaptadores primarios
- **`redirect/index.ts`**: router de redirección montado en `/` (raíz). `GET /:shortCode` valida el param con `shortCodeSchema`, ejecuta `RedirectUrlUseCase` y responde con `302` a `originalUrl`. Lanza `NotFoundError` si el código no existe.
- **`v1/index.ts`**: router agregador de la versión 1. Incluye middleware de sesión Better Auth y middleware `injectUrlRepo`. Monta `urlRoutes`, `adminRoutes` y `userRoutes`.
- **`v1/url.routes.ts`**: rutas públicas y autenticadas. `GET /public` (solo admins), `GET /` (auth), `POST /` (auth), `GET /:shortCode`.
- **`v1/admin.routes.ts`**: rutas protegidas por Better Auth admin plugin. `POST /setup/make-admin` (SERVICE_ADMIN_API_KEY), `DELETE /urls/:shortCode`, `DELETE /urls`.
- **`v1/user.routes.ts`**: rutas de usuario con Better Auth sessions.

### `auth/` — Better Auth
- **`index.ts`**: configuración de Better Auth con admin plugin, Google OAuth, cookies (secure conditional on DEV_MODE), trustedOrigins desde env var. Usa `WeakMap` para cachear instancias de Better Auth por request.

### `utils/` — Utilidades transversales
- **`context.ts`**: tipo `Bindings`, tipo `Variables` (con `urlRepo`), middleware `checkEnvMiddleware` y middleware `injectUrlRepo`.
- **`schemas.ts`**: `shortCodeSchema`, `createUrlSchema` (con validación http/https).

**Formato estándar de errores:**
```json
{
  "success": false,
  "error": {
    "code": "SHORT_CODE_ALREADY_EXISTS",
    "message": "El shortCode \"ggl\" ya está en uso",
    "statusCode": 409
  }
}
```
Para cambiar el formato de todos los errores de la API, modificar únicamente `ApiErrorResponse` y `errorResponse()` en `src/infrastructure/http/error-handler.ts`.

### `index.ts` — Entry point
Bootstrap: instancia Hono, registra `checkEnvMiddleware`, `corsMiddleware` (unificado), Better Auth handler (`/api/auth/*`), el router `/v1`, el router de redirección `/` y `app.onError(onError)`. El router de redirección se monta **después** de `/v1` para evitar colisiones.

---

## Esquema Completo de Base de Datos

### Tabla `urls` (`src/db/schema.ts`)

| Columna | Tipo | Restricciones | Notas |
|---------|------|---------------|-------|
| `id` | INTEGER | PK, autoincrement | |
| `original_url` | TEXT | NOT NULL | URL destino |
| `short_code` | TEXT | NOT NULL, UNIQUE | Máx 9 chars, `[a-z0-9]` |
| `created_at` | TEXT | NOT NULL | ISO string, auto-generado |
| `visits` | INTEGER | NOT NULL, default 0 | Incremento atómico |
| `user_id` | TEXT | nullable, indexed | FK a Better Auth users |

### Tabla `users` (`src/db/auth-schema.ts`)

| Columna | Tipo | Restricciones | Notas |
|---------|------|---------------|-------|
| `id` | TEXT | PK | Better Auth generated |
| `name` | TEXT | NOT NULL | |
| `email` | TEXT | NOT NULL, UNIQUE | |
| `email_verified` | INTEGER (boolean) | NOT NULL, default false | |
| `image` | TEXT | nullable | |
| `created_at` | INTEGER (timestamp_ms) | NOT NULL | |
| `updated_at` | INTEGER (timestamp_ms) | NOT NULL, auto-update | |
| `role` | TEXT | default "user" | Admin plugin field |
| `banned` | INTEGER (boolean) | default false | Admin plugin field |
| `ban_reason` | TEXT | nullable | |
| `ban_expires` | INTEGER (timestamp_ms) | nullable | |
| `url_limit` | INTEGER | default 2 | Límite de URLs por usuario |

### Tabla `sessions`

| Columna | Tipo | Restricciones |
|---------|------|---------------|
| `id` | TEXT | PK |
| `expires_at` | INTEGER (timestamp_ms) | NOT NULL |
| `token` | TEXT | NOT NULL, UNIQUE |
| `created_at` | INTEGER (timestamp_ms) | NOT NULL |
| `updated_at` | INTEGER (timestamp_ms) | NOT NULL, auto-update |
| `ip_address` | TEXT | nullable |
| `user_agent` | TEXT | nullable |
| `user_id` | TEXT | NOT NULL, FK → users (cascade), indexed |
| `impersonated_by` | TEXT | nullable (admin plugin) |

### Tabla `accounts`

| Columna | Tipo | Restricciones |
|---------|------|---------------|
| `id` | TEXT | PK |
| `account_id` | TEXT | NOT NULL |
| `provider_id` | TEXT | NOT NULL |
| `user_id` | TEXT | NOT NULL, FK → users (cascade), indexed |
| `access_token` | TEXT | nullable |
| `refresh_token` | TEXT | nullable |
| `id_token` | TEXT | nullable |
| `access_token_expires_at` | INTEGER (timestamp_ms) | nullable |
| `refresh_token_expires_at` | INTEGER (timestamp_ms) | nullable |
| `scope` | TEXT | nullable |
| `password` | TEXT | nullable |
| `created_at` | INTEGER (timestamp_ms) | NOT NULL |
| `updated_at` | INTEGER (timestamp_ms) | NOT NULL, auto-update |

### Tabla `verifications`

| Columna | Tipo | Restricciones |
|---------|------|---------------|
| `id` | TEXT | PK |
| `identifier` | TEXT | NOT NULL, indexed |
| `value` | TEXT | NOT NULL |
| `expires_at` | INTEGER (timestamp_ms) | NOT NULL |
| `created_at` | INTEGER (timestamp_ms) | NOT NULL |
| `updated_at` | INTEGER (timestamp_ms) | NOT NULL, auto-update |

### Relaciones
- `users` → tiene muchos `sessions`, `accounts`
- `sessions` → pertenece a `users`
- `accounts` → pertenece a `users`

---

## Endpoints

### Redirección (raíz)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/:shortCode` | Redirige (302) a la URL original e incrementa el contador de visitas |

### Better Auth (`/api/auth/*`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/auth/sign-in/social` | Iniciar sesión con Google |
| `GET` | `/api/auth/callback/google` | Callback de Google OAuth |
| `POST` | `/api/auth/sign-out` | Cerrar sesión |
| `GET` | `/api/auth/get-session` | Obtener sesión actual |

### Rutas de Usuario (`/v1/user`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/v1/user/session` | Sesión | Retorna `{ authenticated, user }` |
| `GET` | `/v1/user/urls` | Sesión | URLs del usuario actual |
| `DELETE` | `/v1/user/urls/:shortCode` | Sesión | Eliminar URL propia |

### Rutas de URLs (`/v1/urls`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/v1/urls/public/stats` | Ninguna | Estadísticas públicas (count, redirects) |
| `GET` | `/v1/urls/public` | Ninguna | URLs públicas (solo admins) |
| `GET` | `/v1/urls` | Sesión | URLs del usuario + urlLimit |
| `POST` | `/v1/urls` | Sesión | Crear URL corta (body: `{ originalUrl, shortCode? }`) |
| `GET` | `/v1/urls/:shortCode` | Sesión | Obtener URL por shortCode |
| `DELETE` | `/v1/urls/:shortCode` | Sesión | Eliminar URL por shortCode |

### Rutas de Administración (`/v1/admin`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/v1/admin/stats` | Rol Admin | Estadísticas del dashboard |
| `GET` | `/v1/admin/users` | Rol Admin | Usuarios paginados (`?page,pageSize,search,ids`) |
| `GET` | `/v1/admin/users/:userId` | Rol Admin | Detalles de usuario |
| `POST` | `/v1/admin/users/:userId/ban` | Rol Admin | Banear usuario (`{ reason?, expiresAt? }`) |
| `POST` | `/v1/admin/users/:userId/unban` | Rol Admin | Desbanear usuario |
| `PATCH` | `/v1/admin/users/:userId/url-limit` | Rol Admin | Actualizar límite de URLs (`{ limit }`) |
| `DELETE` | `/v1/admin/users/:userId` | Rol Admin | Eliminar usuario + sus URLs |
| `GET` | `/v1/admin/urls` | Rol Admin | URLs paginadas (`?page,pageSize,search`) |
| `DELETE` | `/v1/admin/urls/:shortCode` | Rol Admin | Eliminar cualquier URL |
| `DELETE` | `/v1/admin/urls` | Rol Admin | Eliminar TODAS las URLs |
| `POST` | `/v1/admin/setup/make-admin` | `SERVICE_ADMIN_API_KEY` | Asignar rol admin (`{ email }`) |

### SPA Fallback

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `*` | Si `Accept: text/html`, sirve `index.html` via ASSETS binding |

---

## Mapeo de Errores

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

## Flujo de una Request

```
HTTP GET /c04jzv
  → redirect/index.ts             (valida param con shortCodeSchema + validationHook)
  → RedirectUrlUseCase.execute("c04jzv")
      → UrlRepository.findByShortCode()     → null si no existe → NotFoundError
      → UrlRepository.incrementVisits()     → UPDATE visits + 1 RETURNING
  → Drizzle → D1 SQLite
  ← UrlEntity actualizada
  ← 302 Location: https://www.epicgames.com | 404

HTTP POST /v1/urls  { originalUrl, shortCode? }  (requiere sesión)
  → v1/index.ts                   (session middleware → injectUrlRepo)
  → v1/url.routes.ts              (valida body con Zod + validationHook)
  → CreateUrlUseCase.execute()
      → UrlRepository.findByOriginalUrl()   → devuelve existente si ya existe
      → UrlRepository.findByShortCode()     → solo si shortCode fue provisto
      → UrlRepository.create()
  → Drizzle → D1 SQLite
  ← UrlEntity
  ← JSON 200 (existente) | 201 (nueva) | 400 | 409

HTTP GET /v1/urls/public  (requiere sesión admin)
  → v1/index.ts                   (session middleware → admin check → injectUrlRepo)
  → GetPublicUrlsUseCase.execute(userId)
      → UrlRepository.findAll()    → filtradas por userId
  ← JSON 200 con URLs del admin

HTTP POST /v1/admin/setup/make-admin  (requiere SERVICE_ADMIN_API_KEY)
  → adminRoutes middleware       (verifica Authorization header)
  → SetAdminRoleUseCase.execute(email)
      → betterAuth.api.updateUser()
  ← JSON 200 | 401 | 404
```

Todos los errores no capturados en rutas llegan a `app.onError(onError)` en `index.ts`.

---

## Características Avanzadas

### ETag Support
Todos los endpoints GET implementan ETags basados en SHA-256. El servidor retorna `304 Not Modified` cuando el cliente envía un `If-None-Match` válido, optimizando el uso de ancho de banda.

### URL Deduplication
`POST /v1/urls` verifica si `originalUrl` ya existe para el usuario. Si existe, retorna la URL existente (200) en lugar de crear un duplicado.

### Per-User URL Limits
Límite predeterminado de 2 URLs para usuarios no admin, 999 para admins. Solo se verifica al crear (no al retornar URLs existentes).

### Unbiased ShortCode Generation
`generateShortCode()` usa `crypto.getRandomValues` con eliminación de sesgo de módulo (rechaza valores ≥ 252) para garantizar distribución uniforme.

### Observability Middleware
Logs de método, path, status, duración e info de ETag para cada request v1.

### Auth Cache
`WeakMap<object, Auth>` keyada en `c.env` para evitar recrear Better Auth por cada request.

---

## Tests Unitarios

Los tests están en `tests/unit/` y usan el **test runner built-in de Bun** (API compatible con Jest).

### Archivos de Test

```
tests/unit/
├── application/url/
│   ├── create-url.usecase.test.ts
│   ├── get-all-urls.usecase.test.ts
│   ├── get-url-by-shortcode.usecase.test.ts
│   ├── redirect-url.usecase.test.ts
│   ├── delete-url.usecase.test.ts
│   └── delete-all-urls.usecase.test.ts
├── application/admin/
│   └── set-admin-role.usecase.test.ts
├── infrastructure/http/
│   └── error-handler.test.ts
└── utils/
    ├── app-error.test.ts
    ├── schemas.test.ts
    └── cors-middleware.test.ts
```

### Convenciones
- Los mocks del repositorio están en `tests/__mocks__/url.repository.mock.ts` y exportan `createMockRepository()` y el fixture `urlFixture`.
- El tipo `MockedRepository` usa `Mock<FunctionType>` explícito por cada método para preservar inferencia de tipos en `toHaveBeenCalledWith`.
- Los tests son completamente unitarios — no tocan D1, Wrangler ni red.
- La configuración del runner está en `bunfig.toml`.
- `tests/tsconfig.json` extiende el raíz y añade `bun-types` para que VS Code resuelva `bun:test` sin errores.
- Descripciones de tests en español.

---

## Archivos de Configuración

| Archivo | Propósito |
|---------|-----------|
| `wrangler.jsonc` | Binding D1, nombre del Worker, fecha de compatibilidad, observabilidad |
| `drizzle.config.ts` | Config de drizzle-kit para generar y aplicar migraciones |
| `tsconfig.json` | Target ESNext, alias `@/*` → `src/*`, types Workers + Node |
| `bunfig.toml` | Configuración del test runner de Bun (timeout, retry, coverageDir) |
| `biome.json` | Formatter (tabs, comillas dobles) / linter |
| `.env` | Variables locales (D1, API keys, BETTER_AUTH_SECRET, Google OAuth) |
| `drizzle/` | Migraciones SQL generadas por drizzle-kit |

---

## Variables de Entorno

### Requeridas (.env)

| Variable | Propósito |
|----------|-----------|
| `SERVICE_ADMIN_API_KEY` | API key para operaciones admin (make-admin) |
| `BETTER_AUTH_SECRET` | Secreto para Better Auth (generar con `openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | URL base (`https://roly.top`) |
| `GOOGLE_CLIENT_ID` | Client ID de Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Client Secret de Google OAuth |
| `TRUSTED_ORIGINS` | Orígenes permitidos (separados por coma) |
| `DEV_MODE` | `"true"` para desarrollo (afecta cookie secure flag) |
| `CLOUDFLARE_ACCOUNT_ID` | Para operaciones drizzle-kit remotas |
| `CLOUDFLARE_DATABASE_ID` | Para operaciones drizzle-kit remotas |
| `CLOUDFLARE_D1_TOKEN` | Para operaciones drizzle-kit remotas |

### Cloudflare Workers Variables

Las variables de entorno de runtime van en **Cloudflare Dashboard → Workers → roly.top → Settings → Variables and Secrets**:

| Variable | Descripción |
|----------|-------------|
| `BETTER_AUTH_SECRET` | Generar con `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | `https://roly.top` |
| `GOOGLE_CLIENT_ID` | Client ID de Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Client Secret de Google OAuth |
| `SERVICE_ADMIN_API_KEY` | API key para operaciones admin |
| `TRUSTED_ORIGINS` | `https://roly.top` |
| `DEV_MODE` | `false` en producción |

### Google OAuth Redirect URI

Agregar en Google Cloud Console → Credentials → OAuth Client:

```
https://roly.top/api/auth/callback/google
```

---

## Convenciones para Agentes

- **Nuevas entidades de dominio**: crear en `src/domain/<entidad>/`.
- **Nuevos casos de uso**: crear en `src/application/<entidad>/`, inyectar el puerto en el constructor. Los errores del caso de uso deben extender `AppError` de `src/domain/app-error.ts`. **Nunca** incluir `statusCode` en los errores de dominio — el mapeo a HTTP es responsabilidad de infraestructura.
- **Nueva tabla**: añadir en `src/db/schema.ts` (urls) o `src/db/auth-schema.ts` (auth), luego `bun run db:generate` y `bun run db:migrate:local`.
- **Nuevas rutas autenticadas**: añadir a `src/presentation/http/v1/url.routes.ts` — el middleware de sesión ya está en el router padre.
- **Nuevas rutas admin**: añadir a `src/presentation/http/v1/admin.routes.ts` — requieren Better Auth admin plugin (role check).
- **Nueva versión de API**: crear carpeta `src/presentation/http/v2/` con su propio `index.ts` y montarla en `src/index.ts` con `app.route("/v2", v2Router)`.
- **Validaciones Zod**: definir en `src/utils/schemas.ts` y aplicar con `zValidator(target, schema, validationHook)`. Siempre pasar `validationHook` como tercer argumento.
- **Manejo de errores en rutas**: las rutas no usan `try/catch`. Hacer `throw` de un `AppError`; el handler global `onError` lo captura y formatea.
- **Nuevos tests**: crear en `tests/unit/<capa>/<entidad>/`. Usar `createMockRepository()` del mock existente.
- **Nuevo método en el puerto**: añadirlo a `UrlRepositoryPort`, implementarlo en `UrlRepository`, añadirlo al tipo `MockedRepository` y a `createMockRepository()` en el mock.
- **Rutas de redirección** (no versionadas): añadirlas en `src/presentation/http/redirect/index.ts` y montarlas en `src/index.ts` con `app.route("/", redirectRoutes)` **después** de las rutas versionadas.
- **Nunca** importar Drizzle, D1 o Hono desde `domain/` ni `application/`.
- **Nunca** importar desde `infrastructure/` o `presentation/` hacia `application/` o `domain/` — las capas inferiores no pueden depender de las superiores.
- El alias `@/` apunta a `src/` (definido en `tsconfig.json` `paths`).
- **Better Auth**: la configuración está en `src/auth/index.ts`. El admin plugin se usa en rutas admin. Las sesiones se manejan via cookie `better-auth.session_token`.
- **Cookies**: el flag `secure` se condiciona a `DEV_MODE`. El dominio se configura automáticamente por el browser.
- **CORS**: usar `corsMiddleware` de `src/utils/cors-middleware.ts`. Configurar `TRUSTED_ORIGINS` en `.env`.
