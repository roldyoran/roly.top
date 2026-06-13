# AGENTS.md — shorturl

Guía de arquitectura y estructura del proyecto para agentes de IA y desarrolladores.

---

## ¿Qué hace este proyecto?

API REST de acortador de URLs construida con **Hono** sobre **Cloudflare Workers**.
Permite crear URLs cortas con un `shortCode` de máximo 9 caracteres alfanuméricos en minúsculas (auto-generado o personalizado), listar todas las URLs, buscar por código corto, redirigir a la URL original (incrementando el contador de visitas) y administrar registros mediante endpoints protegidos por autenticación.
La base de datos es **Cloudflare D1** (SQLite serverless), gestionada con **Drizzle ORM**.
Autenticación con **Better Auth** (Google OAuth + sesiones cookie).

---

## Stack tecnológico

| Capa               | Tecnología                        |
|--------------------|-----------------------------------|
| Runtime            | Cloudflare Workers                |
| Framework HTTP     | Hono v4                           |
| Base de datos      | Cloudflare D1 (SQLite)            |
| ORM                | Drizzle ORM                       |
| Autenticación      | Better Auth (Google OAuth)        |
| Validación         | Zod + @hono/zod-validator         |
| Lenguaje           | TypeScript (ESNext, Bundler)      |
| Gestor de paquetes | Bun                               |
| CLI despliegue     | Wrangler                          |
| Testing            | Bun test runner (built-in)        |

---

## Arquitectura: Hexagonal (Ports & Adapters)

El proyecto sigue **Arquitectura Hexagonal**, separando el núcleo de negocio de los detalles de infraestructura y transporte. El dominio no importa nada de Hono, Drizzle ni Workers.

```
src/
├── domain/                          ← Núcleo (sin dependencias externas)
│   ├── app-error.ts                 ← AppError base + errores genéricos reutilizables
│   └── url/
│       ├── url.entity.ts            ← Entidad UrlEntity + CreateUrlInput
│       └── url.repository.port.ts  ← Puerto (interfaz del repositorio)
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
│   │   └── url.repository.impl.ts  ← Implementación Drizzle + D1
│   └── http/
│       ├── error-handler.ts        ← onError global + errorResponse() + validationHook + mapeo code→status
│       └── cors-middleware.ts       ← CORS unificado con echo de origin
│
├── presentation/                    ← Adaptadores primarios (HTTP)
│   └── http/
│       ├── redirect/               ← Redirección directa por shortCode
│       │   └── index.ts            ← GET /:shortCode → redirect 302
│       └── v1/                     ← Versión 1 de la API REST
│           ├── index.ts            ← Router agregador de v1 + middleware sesión + urlRepo
│           ├── url.routes.ts       ← Rutas públicas + autenticadas
│           ├── admin.routes.ts     ← Rutas protegidas (make-admin, delete URLs)
│           └── user.routes.ts      ← Rutas de usuario (perfil, sesión)
│
├── auth/
│   └── index.ts                    ← Better Auth config (admin plugin, cookies, trustedOrigins)
│
├── db/
│   ├── index.ts                    ← createDb(d1Binding) → instancia Drizzle
│   ├── schema.ts                   ← Definición de tabla `urls` (con userId)
│   └── auth-schema.ts              ← Better Auth tables (users, sessions, accounts, verifications)
│
├── utils/
│   ├── context.ts                  ← Tipo Bindings + Variables (urlRepo) + checkEnvMiddleware
│   └── schemas.ts                  ← Esquemas Zod (shortCodeSchema, createUrlSchema)
│
└── index.ts                         ← Bootstrap: app Hono + CORS unificado + rutas + onError

tests/
├── tsconfig.json                    ← Extiende tsconfig raíz, añade bun-types
├── __mocks__/
│   └── url.repository.mock.ts      ← MockedRepository + urlFixture
└── unit/
    ├── application/url/
    │   ├── create-url.usecase.test.ts
    │   ├── get-all-urls.usecase.test.ts
    │   ├── get-url-by-shortcode.usecase.test.ts
    │   ├── redirect-url.usecase.test.ts
    │   ├── delete-url.usecase.test.ts
    │   └── delete-all-urls.usecase.test.ts
    └── utils/
        ├── app-error.test.ts
        └── schemas.test.ts
```

---

## Capas en detalle

### `domain/` — Dominio
- **`app-error.ts`**: clase base `AppError` (con `message` y `code` de negocio). Los errores **nunca** deben incluir `statusCode` — ese es un detalle de infraestructura. Subclases genéricas:
  - `UnauthorizedError` — `UNAUTHORIZED`
  - `NotFoundError` — `NOT_FOUND`
  - `ValidationError` — `VALIDATION_ERROR`
  - Los errores de dominio (`ShortCodeAlreadyExistsError`, `UrlNotFoundError`) también extienden `AppError`.
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

- **`CreateUrlUseCase`**: primero verifica si `originalUrl` ya existe (devuelve la existente si es así). Si se provee `shortCode`, verifica que no esté en uso — lanza `ShortCodeAlreadyExistsError` si ya existe. Si no, genera uno automáticamente.
- **`GetAllUrlsUseCase`**: retorna todas las URLs.
- **`GetPublicUrlsUseCase`**: retorna URLs filtradas por usuario admin (requiere `userId` del usuario autenticado).
- **`GetUrlByShortCodeUseCase`**: busca por código corto, retorna `null` si no existe.
- **`RedirectUrlUseCase`**: busca la URL por `shortCode`; si existe, llama a `incrementVisits` y retorna la entidad actualizada. Retorna `null` si no existe.
- **`DeleteUrlUseCase`**: elimina por `shortCode` — lanza `UrlNotFoundError` si no existe.
- **`DeleteAllUrlsUseCase`**: elimina todos los registros de la tabla.
- **`SetAdminRoleUseCase`**: asigna rol `admin` a usuario por email usando Better Auth admin plugin.

### `infrastructure/` — Adaptadores secundarios
- **`UrlRepository`**: implementa `UrlRepositoryPort` usando Drizzle ORM sobre D1. Contiene `generateShortCode()` para crear códigos aleatorios de 9 chars `[a-z0-9]`. Implementa `incrementVisits` con un `UPDATE ... SET visits = visits + 1 ... RETURNING` atómico.
- **`http/error-handler.ts`**: **punto único de control de errores**.
  - `ApiErrorResponse` — tipo del formato estándar de respuesta de error.
  - `errorResponse(c, error)` — construye la respuesta JSON con el formato estándar.
  - `onError(error, c)` — handler global registrado en `app.onError()`. Los `AppError` se formatean con `errorResponse`; cualquier otro error se convierte en 500.
  - `validationHook` — hook para `zValidator` que estandariza errores de Zod al mismo formato.
  - Mapeo de `code` → `statusCode` HTTP (ej: `UNAUTHORIZED` → 401, `SHORT_CODE_ALREADY_EXISTS` → 409).

### `presentation/` — Adaptadores primarios
- **`redirect/index.ts`**: router de redirección montado en `/` (raíz). `GET /:shortCode` valida el param con `shortCodeSchema`, ejecuta `RedirectUrlUseCase` y responde con `302` a `originalUrl`. Lanza `NotFoundError` si el código no existe.
- **`v1/index.ts`**: router agregador de la versión 1. Incluye middleware de sesión Better Auth y middleware `injectUrlRepo`. Monta `urlRoutes`, `adminRoutes` y `userRoutes`.
- **`v1/url.routes.ts`**: rutas públicas y autenticadas. `GET /public` (solo admins), `GET /` (auth), `POST /` (auth), `GET /:shortCode`.
- **`v1/admin.routes.ts`**: rutas protegidas por Better Auth admin plugin. `POST /setup/make-admin` (SERVICE_ADMIN_API_KEY), `DELETE /urls/:shortCode`, `DELETE /urls`.
- **`v1/user.routes.ts`**: rutas de usuario con Better Auth sessions.

### `auth/` — Better Auth
- **`index.ts`**: configuración de Better Auth con admin plugin, Google OAuth, cookies (secure conditional on DEV_MODE), trustedOrigins desde env var.

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

## Endpoints

### Redirección (raíz)

| Método | Ruta           | Descripción                                                     |
|--------|----------------|-----------------------------------------------------------------|
| GET    | `/:shortCode`  | Redirige (302) a la URL original e incrementa el contador de visitas |

### Rutas v1

| Método | Ruta                        | Auth       | Descripción                                     |
|--------|-----------------------------|------------|-------------------------------------------------|
| GET    | `/v1/urls/public`           | Admin      | Lista URLs del usuario admin autenticado        |
| GET    | `/v1/urls`                  | User       | Lista todas las URLs del usuario                |
| POST   | `/v1/urls`                  | User       | Crea una URL corta (shortCode opcional)         |
| GET    | `/v1/urls/:shortCode`       | User       | Obtiene una URL por su código corto             |

### Rutas de administración

| Método | Ruta                         | Auth              | Descripción                         |
|--------|------------------------------|-------------------|-------------------------------------|
| POST   | `/v1/admin/setup/make-admin` | SERVICE_ADMIN_KEY | Asigna rol admin a usuario por email |
| DELETE | `/v1/admin/urls/:shortCode`  | Better Auth Admin | Elimina una URL por su código corto |
| DELETE | `/v1/admin/urls`             | Better Auth Admin | Elimina todas las URLs              |

### Better Auth (bajo /api/auth/*)

| Método | Ruta                          | Descripción                    |
|--------|-------------------------------|--------------------------------|
| POST   | `/api/auth/sign-in/social`    | Iniciar sesión con Google      |
| GET    | `/api/auth/callback/google`   | Callback de Google OAuth       |
| POST   | `/api/auth/sign-out`          | Cerrar sesión                  |
| GET    | `/api/auth/get-session`       | Obtener sesión actual          |

**Autenticación:**
- Rutas `/v1/urls/*`: requieren sesión Better Auth (cookie `better-auth.session_token`)
- Rutas `/v1/admin/*`: requieren Better Auth admin plugin (role = "admin")
- `POST /v1/admin/setup/make-admin`: requiere header `Authorization: Bearer <SERVICE_ADMIN_API_KEY>`

---

## Flujo de una request

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

## Tests unitarios

Los tests están en `tests/unit/` y usan el **test runner built-in de Bun** (API compatible con Jest).

```bash
bun test                  # todos los tests
bun run test:watch        # modo watch
bun run test:unit         # solo tests/unit/
bun run test:app          # solo tests de application/
bun run test:utils        # solo tests de utils/
bun run test:coverage     # con reporte de cobertura
bun run test:bail         # aborta al primer fallo (útil en CI)

bun test -t "CreateUrl"   # filtrar por nombre de test
bun test usecase          # filtrar por nombre de archivo
```

**Convenciones:**
- Los mocks del repositorio están en `tests/__mocks__/url.repository.mock.ts` y exportan `createMockRepository()` y el fixture `urlFixture`.
- El tipo `MockedRepository` usa `Mock<FunctionType>` explícito por cada método para preservar inferencia de tipos en `toHaveBeenCalledWith`.
- Los tests son completamente unitarios — no tocan D1, Wrangler ni red.
- La configuración del runner está en `bunfig.toml`.
- `tests/tsconfig.json` extiende el raíz y añade `bun-types` para que VS Code resuelva `bun:test` sin errores.

---

## Archivos de configuración raíz

| Archivo             | Propósito                                                         |
|---------------------|-------------------------------------------------------------------|
| `wrangler.jsonc`    | Binding D1, nombre del Worker, fecha de compatibilidad            |
| `drizzle.config.ts` | Config de drizzle-kit para generar y aplicar migraciones          |
| `tsconfig.json`     | Target ESNext, alias `@/*` → `src/*`, types Workers + Node. Solo incluye `src/` |
| `bunfig.toml`       | Configuración del test runner de Bun (timeout, retry, coverageDir) |
| `biome.json`        | Formatter/linter                                                  |
| `.env`              | Variables locales (D1, API keys, BETTER_AUTH_SECRET, Google OAuth) |
| `drizzle/`          | Migraciones SQL generadas por drizzle-kit                         |

**Variables de entorno requeridas (.env):**
- `SERVICE_ADMIN_API_KEY` — API key para operaciones admin (make-admin)
- `BETTER_AUTH_SECRET` — Secreto para Better Auth (generar con `openssl rand -base64 32`)
- `GOOGLE_CLIENT_ID` — Client ID de Google OAuth
- `GOOGLE_CLIENT_SECRET` — Client Secret de Google OAuth
- `TRUSTED_ORIGINS` — Orígenes permitidos (separados por coma, ej: `http://localhost:5173,http://localhost:8787`)
- `DEV_MODE` — Modo desarrollo (afecta cookie secure flag)

---

## Comandos principales

```bash
# Desarrollo
bun dev                    # Servidor local con wrangler dev
bun deploy                 # Deploy a Cloudflare Workers

# Base de datos
bun run db:generate        # Genera SQL de migración desde el schema
bun run db:migrate:local   # Aplica migraciones en D1 local (.wrangler/state)
bun run db:migrate:remote  # Aplica migraciones en D1 remoto (producción)
bun run db:push            # Push directo del schema al D1 remoto vía drizzle-kit

# Migración completa (cuando hay drift en el schema remoto)
bun --env-file=.env ./node_modules/.bin/wrangler.exe d1 execute DB --remote --config wrangler.jsonc --file drizzle/full_migration.sql

# Tests
bun test                   # Todos los tests
bun run test:watch         # Modo watch
bun run test:coverage      # Con cobertura

# Formato
bun format                 # Formatea el código con Biome
```

### Cloudflare Workers Variables

Las variables de entorno de runtime van en **Cloudflare Dashboard → Workers → shorturl → Settings → Variables and Secrets** (no en GitHub Actions):

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

## Convenciones para agentes

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
