# Arquitectura del Backend — shorturl

## Vision general

**shorturl** es un acortador de URLs construido con **Hono** sobre **Cloudflare Workers**, usando **Cloudflare D1** (SQLite serverless) como base de datos y **Better Auth** para autenticacion con Google OAuth.

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Vue 3)                         │
│                   http://localhost:5173                          │
│                                                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ authClient   │  │ axios client │  │ Pinia stores           │ │
│  │ (Better Auth)│  │ (API calls)  │  │ (authStore, urlStore)  │ │
│  └──────┬───────┘  └──────┬───────┘  └────────────────────────┘ │
│         │                 │                                      │
└─────────┼─────────────────┼──────────────────────────────────────┘
          │                 │
          │  Vite Proxy     │  (same-origin: localhost:5173)
          │  /api/* → :8787 │  /v1/* → :8787
          │                 │
┌─────────┼─────────────────┼──────────────────────────────────────┐
│         ▼                 ▼         BACKEND (Hono + Workers)     │
│                      http://localhost:8787                        │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    CORS + Auth Middleware                  │   │
│  │  - CORS: origins especificos, credentials: true           │   │
│  │  - Auth: inyecta session de Better Auth en contexto       │   │
│  └──────────────────────────┬───────────────────────────────┘   │
│                              │                                    │
│  ┌───────────────────────────┼───────────────────────────────┐   │
│  │                           │                                │   │
│  │  ┌────────────────────────▼─────────────────────────┐    │   │
│  │  │         Better Auth Handler (/api/auth/*)         │    │   │
│  │  │  - POST /api/auth/sign-in/social (Google OAuth)   │    │   │
│  │  │  - GET  /api/auth/callback/google                 │    │   │
│  │  │  - GET  /api/auth/get-session                     │    │   │
│  │  │  - POST /api/auth/sign-out                        │    │   │
│  │  │  - POST /api/auth/admin/* (admin endpoints)       │    │   │
│  │  └──────────────────────────────────────────────────┘    │   │
│  │                                                           │   │
│  │  ┌──────────────────────────────────────────────────┐    │   │
│  │  │              API Routes (/v1/*)                    │    │   │
│  │  │                                                    │    │   │
│  │  │  Publicas:                                         │    │   │
│  │  │    GET  /v1/urls/public    (URLs de admin users)   │    │   │
│  │  │                                                    │    │   │
│  │  │  Autenticadas:                                    │    │   │
│  │  │    GET    /v1/urls          (mis URLs)             │    │   │
│  │  │    POST   /v1/urls          (crear URL)            │    │   │
│  │  │    GET    /v1/urls/:code    (buscar por code)      │    │   │
│  │  │                                                    │    │   │
│  │  │  Admin (API key):                                 │    │   │
│  │  │    DELETE /v1/admin/urls/:code                     │    │   │
│  │  │    DELETE /v1/admin/urls                           │    │   │
│  │  │    POST   /v1/admin/setup/make-admin               │    │   │
│  │  └──────────────────────────────────────────────────┘    │   │
│  │                                                           │   │
│  │  ┌──────────────────────────────────────────────────┐    │   │
│  │  │           Redirect Routes (/:shortCode)            │    │   │
│  │  │  GET /:shortCode → 302 a originalUrl               │    │   │
│  │  └──────────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                    │
│                              ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Cloudflare D1 (SQLite)                 │   │
│  │                                                            │   │
│  │  Tablas: urls, users, sessions, accounts, verifications    │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Stack tecnologico

| Capa               | Tecnologia                        |
|--------------------|-----------------------------------|
| Runtime            | Cloudflare Workers                |
| Framework HTTP     | Hono v4                           |
| Base de datos      | Cloudflare D1 (SQLite serverless) |
| ORM                | Drizzle ORM                       |
| Autenticacion      | Better Auth + Google OAuth         |
| Plugin Admin       | Better Auth Admin Plugin          |
| Validacion         | Zod + @hono/zod-validator         |
| Lenguaje           | TypeScript                        |
| Gestor de paquetes | Bun                               |
| CLI despliegue     | Wrangler                          |

---

## Arquitectura: Hexagonal (Ports & Adapters)

```
backend/src/
├── domain/                          ← Nucleo (sin dependencias externas)
│   ├── app-error.ts                 ← AppError + errores genericos
│   └── url/
│       ├── url.entity.ts            ← Entidad UrlEntity + CreateUrlInput
│       └── url.repository.port.ts   ← Puerto (interfaz del repositorio)
│
├── application/                     ← Casos de uso
│   └── url/
│       ├── create-url.usecase.ts
│       ├── get-all-urls.usecase.ts
│       ├── get-url-by-shortcode.usecase.ts
│       ├── redirect-url.usecase.ts
│       ├── delete-url.usecase.ts
│       └── delete-all-urls.usecase.ts
│
├── infrastructure/                  ← Adaptadores secundarios
│   ├── persistence/
│   │   └── url.repository.impl.ts   ← Implementacion Drizzle + D1
│   └── http/
│       └── error-handler.ts         ← onError global + errorResponse()
│
├── presentation/                    ← Adaptadores primarios (HTTP)
│   └── http/
│       ├── redirect/
│       │   └── index.ts             ← GET /:shortCode → redirect 302
│       └── v1/
│           ├── index.ts             ← Router agregador de v1
│           ├── url.routes.ts        ← Rutas de URLs (publicas + auth)
│           ├── admin.routes.ts      ← Rutas admin (API key)
│           └── user.routes.ts       ← Rutas de usuario
│
├── auth/
│   └── index.ts                     ← Configuracion de Better Auth
│
├── db/
│   ├── index.ts                     ← createDb() → instancia Drizzle
│   ├── schema.ts                    ← Tabla urls
│   └── auth-schema.ts               ← Tablas auth (users, sessions, etc.)
│
├── utils/
│   ├── context.ts                   ← Tipo Bindings + checkEnvMiddleware
│   ├── schemas.ts                   ← Esquemas Zod
│   └── cors-middleware.ts           ← CORS con origins especificos
│
└── index.ts                         ← Bootstrap: app Hono + middlewares + rutas
```

---

## Sistema de autenticacion (Better Auth)

### Como funciona el flujo OAuth con Google

```
1. Usuario hace clic en "Sign In" (frontend)
         │
         ▼
2. authClient.signIn.social({ provider: "google" })
   → POST /api/auth/sign-in/social (al backend)
         │
         ▼
3. Backend genera URL de Google OAuth
   → Redirige al usuario a Google
         │
         ▼
4. Google autentica al usuario
   → Redirige a GET /api/auth/callback/google
         │
         ▼
5. Backend procesa callback
   → Crea/actualiza usuario en tabla "users"
   → Crea cuenta en tabla "accounts"
   → Crea sesion en tabla "sessions"
   → Setea cookie de sesion (httpOnly, sameSite: lax)
   → Redirige a callbackURL (http://localhost:5173)
         │
         ▼
6. Frontend carga, authStore.initialize()
   → GET /api/auth/get-session (con cookie)
   → Retorna usuario + sesion
   → UI muestra usuario autenticado
```

### Configuracion de Better Auth

**Archivo**: `backend/src/auth/index.ts`

```typescript
betterAuth({
  // Base de datos via Drizzle + D1
  database: drizzleAdapter(db, { provider: "sqlite", usePlural: true }),

  // Google OAuth
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },

  // URLs permitidas para CORS
  trustedOrigins: ["http://localhost:5173", "http://localhost:8787"],

  // Plugin de administracion
  plugins: [admin()],

  // Cookies de sesion
  advanced: {
    defaultCookieAttributes: {
      sameSite: "lax",    // Enviamos en top-level navigations
      secure: false,      // HTTP en desarrollo
      httpOnly: true,     // No accesible via JavaScript
      path: "/",
    },
  },
})
```

### Variables de entorno requeridas

| Variable              | Descripcion                           |
|-----------------------|---------------------------------------|
| `BETTER_AUTH_SECRET`  | Clave secreta para encriptar sesiones |
| `BETTER_AUTH_URL`     | URL base del backend                  |
| `GOOGLE_CLIENT_ID`    | Client ID de Google OAuth             |
| `GOOGLE_CLIENT_SECRET`| Client Secret de Google OAuth         |

---

## Plugin Admin

### Roles

| Role   | Permisos                                        |
|--------|------------------------------------------------|
| `user` | Crear URLs propias, verlas                      |
| `admin`| Todo lo de user + gestionar usuarios, URLs publicas |

### Campos agregados por el admin plugin

**Tabla users:**
- `role` (text, default "user") — rol del usuario
- `banned` (boolean) — si esta baneado
- `ban_reason` (text) — razon del ban
- `ban_expires` (integer) — fecha de expiracion del ban

**Tabla sessions:**
- `impersonated_by` (text) — ID del admin que esta impersonando

### Como hacer admin a un usuario

```bash
# 1. Iniciar sesion con Google (crea el usuario con role "user")
# 2. Ejecutar el endpoint de setup:
curl -X POST http://localhost:8787/v1/admin/setup/make-admin \
  -H "Authorization: Bearer SERVICE_ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email": "tu-email@gmail.com"}'

# 3. Reiniciar el backend
# 4. Volver a iniciar sesion con Google
# 5. Ahora el usuario tiene role "admin"
```

---

## Base de datos (Cloudflare D1)

### Esquema de tablas

```sql
-- Tabla principal de URLs
CREATE TABLE urls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  original_url TEXT NOT NULL,
  short_code TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  visits INTEGER DEFAULT 0 NOT NULL,
  user_id TEXT  -- ID del usuario admin que la creo
);

-- Tabla de usuarios (Better Auth)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  email_verified INTEGER DEFAULT false NOT NULL,
  image TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  role TEXT DEFAULT 'user',        -- admin plugin
  banned INTEGER DEFAULT false,    -- admin plugin
  ban_reason TEXT,                 -- admin plugin
  ban_expires INTEGER              -- admin plugin
);

-- Tablas de sesiones y cuentas (Better Auth)
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  expires_at INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  user_id TEXT NOT NULL REFERENCES users(id),
  impersonated_by TEXT             -- admin plugin
);

CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id),
  access_token TEXT,
  refresh_token TEXT,
  id_token TEXT,
  -- ... otros campos de OAuth
);

CREATE TABLE verifications (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

### Migraciones

Las migraciones SQL estan en `backend/drizzle/`:

| Archivo                         | Descripcion                              |
|--------------------------------|------------------------------------------|
| `0000_light_electro.sql`       | Tabla urls + tablas auth iniciales        |
| `0001_add_auth_tables.sql`     | Tablas accounts, sessions, users, verif.  |
| `0001_common_ender_wiggin.sql` | Campos admin (role, banned, etc.)         |
| `0002_add_user_id_to_urls.sql` | Columna user_id en tabla urls             |

Para aplicar migraciones:
```bash
bun run db:migrate:local    # Base de datos local
bun run db:migrate:remote   # Base de datos remota (produccion)
```

---

## Endpoints

### Autenticacion (Better Auth)

| Metodo | Ruta                            | Descripcion                    |
|--------|--------------------------------|--------------------------------|
| POST   | `/api/auth/sign-in/social`     | Iniciar sesion con Google      |
| GET    | `/api/auth/callback/google`    | Callback de Google OAuth       |
| GET    | `/api/auth/get-session`        | Obtener sesion actual          |
| POST   | `/api/auth/sign-out`           | Cerrar sesion                  |
| POST   | `/api/auth/admin/create-user`  | Crear usuario (admin)          |
| POST   | `/api/auth/admin/set-role`     | Cambiar rol de usuario (admin) |
| GET    | `/api/auth/admin/list-users`   | Listar usuarios (admin)        |

### API REST v1

| Metodo | Ruta                      | Auth     | Descripcion                     |
|--------|--------------------------|----------|---------------------------------|
| GET    | `/v1/urls/public`        | No       | URLs de usuarios admin          |
| GET    | `/v1/urls`               | Si       | URLs del usuario autenticado    |
| POST   | `/v1/urls`               | Si       | Crear URL corta                 |
| GET    | `/v1/urls/:shortCode`    | Si       | Buscar URL por codigo corto     |
| DELETE | `/v1/admin/urls/:shortCode` | API Key | Eliminar URL por codigo corto |
| DELETE | `/v1/admin/urls`         | API Key  | Eliminar todas las URLs          |
| POST   | `/v1/admin/setup/make-admin` | API Key | Hacer admin a un usuario      |

### Redireccion

| Metodo | Ruta            | Descripcion                                    |
|--------|----------------|------------------------------------------------|
| GET    | `/:shortCode`  | Redirige (302) a URL original + incrementa visitas |

---

## Flujo de una request (ejemplo: crear URL)

```
1. Frontend: POST /v1/urls { originalUrl: "https://..." }
   → Cookie de sesion incluida (via withCredentials: true)
   → Vite Proxy redirige a http://localhost:8787/v1/urls

2. Backend: Middleware CORS
   → Verifica origin: localhost:5173 (esta en trustedOrigins)
   → Permite credentials: true

3. Backend: Middleware de auth
   → Lee cookie de Better Auth
   → Valida sesion con auth.api.getSession()
   → Inyecta user + session en contexto Hono

4. Backend: urlRoutes.post("/")
   → Verifica que user exista (no null)
   → Valida body con Zod (createUrlSchema)
   → Ejecuta CreateUrlUseCase

5. CreateUrlUseCase
   → Verifica si originalUrl ya existe (devuelve existente)
   → Genera shortCode aleatorio (9 chars) o usa el personalizado
   → UrlRepository.createForUser(userId, input)
   → INSERT en tabla urls con user_id

6. Respuesta: 201 { id, originalUrl, shortCode, createdAt, visits, userId }
```

---

## CORS y Cookies

### CORS Middleware

```typescript
// Headers configurados para todas las rutas /v1/*
Access-Control-Allow-Origin: http://localhost:5173, http://127.0.0.1:5173
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
Access-Control-Allow-Headers: Content-Type, x-api-key, Authorization
Access-Control-Allow-Credentials: true
```

### Configuracion de Cookies (Better Auth)

```typescript
{
  sameSite: "lax",      // Solo se envian en top-level navigations
  secure: false,         // HTTP en desarrollo
  httpOnly: true,        // No accesible via document.cookie
  path: "/",             // Disponible en todas las rutas
}
```

### Vite Proxy (Desarrollo)

```typescript
// vite.config.ts
proxy: {
  "/api": {
    target: "http://localhost:8787",  // Better Auth endpoints
    changeOrigin: true,
    configure: (proxy) => {
      proxy.on("proxyReq", (_proxyReq, req) => {
        if (req.headers.cookie) {
          _proxyReq.setHeader("Cookie", req.headers.cookie);
        }
      });
    },
  },
  "/v1": {
    target: "http://localhost:8787",  // API endpoints
    changeOrigin: true,
    configure: (proxy) => {
      proxy.on("proxyReq", (_proxyReq, req) => {
        if (req.headers.cookie) {
          _proxyReq.setHeader("Cookie", req.headers.cookie);
        }
      });
    },
  },
},
```

**Por que se necesita el proxy?**

Sin `VITE_API_BASE_URL` en `.env`, el frontend hace requests al mismo origen (`localhost:5173`). El proxy de Vite las redirige al backend (`localhost:8787`). Esto mantiene las requests como **same-origin**, permitiendo que las cookies de sesion se envien automaticamente.

---

## Comandos principales

```bash
# Desarrollo
bun run dev:back      # Backend en http://localhost:8787
bun run dev:front     # Frontend en http://localhost:5173

# Base de datos
bun run db:generate           # Generar migracion desde schema
bun run db:migrate:local      # Aplicar migracion en D1 local
bun run db:migrate:remote     # Aplicar migracion en D1 remoto

# Tests
bun test                      # Todos los tests del backend
```

---

## Troubleshooting

### "no such column: urls.user_id"
La migracion no se ejecuto. Ejecuta:
```bash
bun run db:migrate:local
```

### "UnauthorizedError: Debes iniciar sesion"
La cookie de sesion no se esta enviando. Verifica:
1. Que `VITE_API_BASE_URL` NO este en `frontend/.env`
2. Que el proxy de Vite este configurado para `/api` y `/v1`
3. Que `withCredentials: true` este en axios

### "CORS error"
Los origenes no coinciden. Verifica que `trustedOrigins` en `backend/src/auth/index.ts` incluya `http://localhost:5173`.

### URLs publicas vacias
No hay usuarios con `role: "admin"`. Ejecuta el endpoint de setup:
```bash
curl -X POST http://localhost:8787/v1/admin/setup/make-admin \
  -H "Authorization: Bearer 0b29d4e4-b9cb-4ab9-95ce-1888dfae046a" \
  -H "Content-Type: application/json" \
  -d '{"email": "tu-email@gmail.com"}'
```
