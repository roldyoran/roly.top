<p align="center">
  <img src="../frontend/public/url-icon.svg" alt="roly.top logo" width="100" height="100">
</p>

<h1 align="center">roly.top</h1>

<p align="center">Acortador de URLs profesional</p>

<p align="center">
  <a href="https://roly.top">Sitio Web</a> ·
  <a href="https://github.com/roldyoran/roly.top">GitHub</a> ·
  <a href="./README.md">English</a>
</p>

---

## Descripción

**roly.top** es una plataforma completa de acortamiento de URLs construida con arquitectura moderna y escalable. Permite crear enlaces cortos personalizados o auto-generados, generar códigos QR, obtener estadísticas de visitas y gestionar URLs mediante un panel de administración completo.

### Características Principales

- **Acortamiento de URLs** con códigos personalizados o auto-generados (máximo 9 caracteres)
- **Códigos QR** personalizados con soporte de colores, degradados y logos
- **Autenticación** completa con Google OAuth (Better Auth)
- **Panel de administración** para gestión de usuarios y URLs
- **Sistema de roles** con permisos diferenciados (user/admin)
- **Sistema de baneo** de usuarios con razón y expiración
- **Límites de URLs** por usuario (configurable por admin)
- **Estadísticas** de visitas y métricas públicas
- **API REST** completa con documentación integrada
- **Diseño responsive** mobile-first con temas claro/oscuro

---

## Tabla de Contenidos

- [Características del Stack](#características-del-stack)
- [Prerrequisitos](#prerrequisitos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Desarrollo Local](#desarrollo-local)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [API](#api)
- [Autenticación](#autenticación)
- [Base de Datos](#base-de-datos)
- [Tests](#tests)
- [Despliegue](#despliegue)
- [Comandos Útiles](#comandos-útiles)
- [Arquitectura](#arquitectura)

---

## Características del Stack

### Backend

| Capa | Tecnología | Versión |
|------|------------|---------|
| Runtime | Cloudflare Workers | - |
| Framework HTTP | Hono | ^4.12.3 |
| Base de datos | Cloudflare D1 (SQLite) | - |
| ORM | Drizzle ORM | ^0.45.1 |
| Autenticación | Better Auth | ^1.6.15 |
| Validación | Zod | ^4.3.6 |
| Lenguaje | TypeScript | ^5.8.3 |
| Testing | Bun test runner | - |

### Frontend

| Capa | Tecnología | Versión |
|------|------------|---------|
| Framework | Vue 3 (Composition API) | ^3.5.24 |
| Router | Vue Router | 4 |
| Estado | Pinia | ^3.0.4 |
| UI | Shadcn-VUE + Radix Vue | - |
| Estilos | Tailwind CSS | ^4.1.17 |
| HTTP Client | Axios | ^1.13.2 |
| Build Tool | Vite | ^6.4.1 |
| Linter | Biome | 2.4.5 |

---

## Prerrequisitos

- [Bun](https://bun.sh) ≥ 1.0
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) ≥ 4.0 (incluido como devDependency)
- Cuenta de Cloudflare con una base de datos D1 creada
- Proyecto de Google Cloud con credenciales OAuth 2.0

---

## Instalación

```bash
# 1. Clonar el repositorio
git clone git@github.com:roldyoran/roly.top.git
cd roly.top

# 2. Instalar dependencias
bun install
```

---

## Configuración

### 1. Variables de entorno del backend

Crear `backend/.env`:

```env
# Cloudflare D1
DEV_MODE=true
SERVICE_ADMIN_API_KEY=tu_api_key_secreta

# Better Auth
BETTER_AUTH_SECRET=tu_secreto_de_32_caracteres
BETTER_AUTH_URL=http://localhost:8787
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret

# Orígenes permitidos (producción)
TRUSTED_ORIGINS=https://roly.top
```

### 2. Variables de entorno del frontend

Crear `frontend/.env`:

```env
# Dejar vacío para usar proxy de Vite en desarrollo
VITE_API_KEY=tu_service_admin_api_key
```

> **Importante**: NO configurar `VITE_API_BASE_URL` en desarrollo. El proxy de Vite maneja el enrutamiento al backend.

### 3. Configuración de Google OAuth

1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Crear credenciales OAuth 2.0
3. Agregar `http://localhost:8787/api/auth/callback/google` como URI de redirección autorizada
4. Copiar Client ID y Client Secret a `backend/.env`

### 4. Wrangler — Binding D1

Editar `backend/wrangler.jsonc` y reemplazar el `database_id` con el ID de tu base de datos D1:

```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "roly-top-db",
      "database_id": "<tu-database-id>"
    }
  ]
}
```

### 5. Migraciones de base de datos

```bash
# Aplicar migraciones a D1 local (desarrollo)
bun run db:migrate:local

# Aplicar migraciones a D1 remoto (producción)
bun run db:migrate:remote
```

### 6. Sincronización completa del schema (D1 remoto)

Si el schema de la base de datos remota está desincronizado o necesitas empezar desde cero, ejecuta la migración completa:

```bash
cd backend
bun --env-file=.env ./node_modules/.bin/wrangler.exe d1 execute DB --remote --config wrangler.jsonc --file drizzle/full_migration.sql
```

> **Advertencia**: Esto elimina y recrea todas las tablas. Usar solo al configurar una nueva base de datos o corregir desviaciones del schema.

La migración completa crea estas tablas:
- `users` — Usuarios Better Auth (con `role`, `banned`, `url_limit`)
- `sessions` — Sesiones Better Auth (con `impersonated_by`)
- `accounts` — Cuentas Better Auth (proveedores OAuth)
- `verifications` — Verificaciones de email Better Auth
- `urls` — URLs cortas (con `user_id`)

### 7. Variables de Cloudflare Workers

Configurar estos **Secrets** en Cloudflare Dashboard → Workers → roly.top → Settings → Variables and Secrets:

| Secret | Descripción |
|--------|-------------|
| `BETTER_AUTH_SECRET` | Generar con `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | `https://roly.top` |
| `GOOGLE_CLIENT_ID` | Client ID de Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Client Secret de Google OAuth |
| `SERVICE_ADMIN_API_KEY` | Tu API key de administrador |
| `TRUSTED_ORIGINS` | `https://roly.top` |
| `DEV_MODE` | `false` |

### 8. URI de redirección de Google OAuth

Agregar esta URI en [Google Cloud Console](https://console.cloud.google.com/) → Credentials → OAuth Client ID → Authorized redirect URIs:

```
https://roly.top/api/auth/callback/google
```

---

## Desarrollo Local

```bash
# Desde la raíz del repo — ejecuta ambos frontend y backend:
bun run dev:back       # Backend en http://localhost:8787
bun run dev:front      # Frontend en http://localhost:5173
```

El servidor de desarrollo Vite proxea las requests `/api/*` y `/v1/*` al backend, manteniendo mismo origen para las cookies.

---

## Estructura del Proyecto

```
roly.top/
├── backend/                  # Hono + Cloudflare Workers + Better Auth
│   ├── src/
│   │   ├── domain/           # Entidades y puertos del repositorio
│   │   ├── application/      # Casos de uso
│   │   ├── infrastructure/   # Implementaciones del repositorio
│   │   ├── presentation/     # Rutas HTTP (v1, redirect)
│   │   ├── auth/             # Configuración Better Auth
│   │   ├── db/               # Schema Drizzle (urls + auth tables)
│   │   └── utils/            # CORS, context, schemas
│   ├── tests/                # Tests unitarios (bun:test)
│   ├── drizzle/              # Migraciones SQL
│   └── wrangler.jsonc        # Config del Worker (D1, Assets, env)
├── frontend/                 # Vue 3 + Vite SPA
│   ├── src/
│   │   ├── api/              # Cliente Axios, funciones API
│   │   ├── lib/              # Cliente Better Auth
│   │   ├── stores/           # Stores Pinia (auth, urls)
│   │   ├── composables/      # useAuth, useUrlShortener
│   │   ├── components/       # Componentes UI
│   │   └── views/            # Vistas de páginas
│   └── dist/                 # Assets estáticos construidos
├── docs/                     # Traducciones y documentación adicional
└── package.json              # Scripts raíz (workspaces)
```

---

## API

### Reglas del shortCode

- 1 a 9 caracteres
- Solo alfanuméricos en minúsculas: `[a-z0-9]+`
- Auto-generado si no se proporciona al crear
- Generado con `crypto.getRandomValues()` (criptográficamente seguro)

### Endpoints Públicos (sin auth)

#### Estadísticas públicas

```bash
curl http://localhost:8787/v1/urls/public/stats
```

#### Listar URLs públicas (solo usuarios admin)

```bash
curl http://localhost:8787/v1/urls/public
```

Retorna URLs creadas por usuarios con `role: "admin"`.

### Endpoints Autenticados (requieren cookie de sesión)

#### Crear una URL corta

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
  "visits": 0,
  "userId": "user_id_here"
}
```

#### Listar mis URLs

```bash
curl http://localhost:8787/v1/urls
```

#### Obtener una URL por shortCode

```bash
curl http://localhost:8787/v1/urls/c04jzv
```

#### Eliminar una URL

```bash
curl -X DELETE http://localhost:8787/v1/urls/c04jzv
```

### Endpoints de Administración (requieren rol admin)

#### Obtener estadísticas del dashboard

```bash
curl http://localhost:8787/v1/admin/stats
```

#### Listar usuarios paginados

```bash
curl "http://localhost:8787/v1/admin/users?page=1&pageSize=10&search=example"
```

#### Obtener detalles de usuario

```bash
curl http://localhost:8787/v1/admin/users/:userId
```

#### Banear usuario

```bash
curl -X POST http://localhost:8787/v1/admin/users/:userId/ban \
  -H "Content-Type: application/json" \
  -d '{"reason": "Spam", "expiresAt": "2026-12-31T23:59:59.000Z"}'
```

#### Desbanear usuario

```bash
curl -X POST http://localhost:8787/v1/admin/users/:userId/unban
```

#### Actualizar límite de URLs

```bash
curl -X PATCH http://localhost:8787/v1/admin/users/:userId/url-limit \
  -H "Content-Type: application/json" \
  -d '{"limit": 10}'
```

#### Eliminar usuario

```bash
curl -X DELETE http://localhost:8787/v1/admin/users/:userId
```

#### Listar todas las URLs (paginadas)

```bash
curl "http://localhost:8787/v1/admin/urls?page=1&pageSize=10&search=example"
```

#### Eliminar una URL específica

```bash
curl -X DELETE http://localhost:8787/v1/admin/urls/c04jzv
```

#### Eliminar todas las URLs

```bash
curl -X DELETE http://localhost:8787/v1/admin/urls
```

#### Hacer usuario admin

```bash
curl -X POST http://localhost:8787/v1/admin/setup/make-admin \
  -H "Authorization: Bearer tu_service_admin_api_key" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

### Redirección

```bash
curl -i http://localhost:8787/c04jzv
```

Responde con `302 Location: https://www.epicgames.com` e incrementa el contador de visitas.

---

## Autenticación

El proyecto usa **Better Auth** con Google OAuth para autenticación y el **Admin plugin** para control de acceso basado en roles.

### Flujo de Autenticación

1. El usuario hace clic en "Iniciar Sesión" en el frontend
2. El frontend llama a `POST /api/auth/sign-in/social` → el backend redirige a Google
3. Google autentica → redirige de vuelta a `GET /api/auth/callback/google`
4. El backend crea/actualiza el usuario en la tabla `users`, establece la cookie de sesión
5. El frontend obtiene la sesión via `GET /api/auth/get-session`

### Roles

| Rol | Permisos |
|-----|----------|
| `user` | Crear URLs propias, ver URLs propias, eliminar URLs propias |
| `admin` | Todos los permisos de user + listar URLs públicas + endpoints admin |

### Hacer usuario admin

Después de que un usuario inicie sesión con Google por primera vez:

```bash
curl -X POST http://localhost:8787/v1/admin/setup/make-admin \
  -H "Authorization: Bearer tu_service_admin_api_key" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

Luego el usuario debe **cerrar sesión y volver a iniciar** para obtener el rol actualizado en su sesión.

### Endpoints del Admin plugin

Gestionados por Better Auth en `/api/auth/admin/*`:

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/admin/create-user` | Crear nuevo usuario |
| POST | `/api/auth/admin/set-role` | Cambiar rol de usuario |
| GET | `/api/auth/admin/list-users` | Listar todos los usuarios |
| POST | `/api/auth/admin/ban-user` | Banear usuario |
| POST | `/api/auth/admin/unban-user` | Desbanear usuario |

---

## Base de Datos

### Esquema Completo

#### Tabla `urls`

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | INTEGER | PK, autoincrement | Identificador único |
| `original_url` | TEXT | NOT NULL | URL destino |
| `short_code` | TEXT | NOT NULL, UNIQUE | Código corto (máx 9 chars) |
| `created_at` | TEXT | NOT NULL | Fecha de creación (ISO) |
| `visits` | INTEGER | NOT NULL, default 0 | Contador de visitas |
| `user_id` | TEXT | nullable, indexed | FK a usuario propietario |

#### Tabla `users`

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | TEXT | PK | ID de Better Auth |
| `name` | TEXT | NOT NULL | Nombre del usuario |
| `email` | TEXT | NOT NULL, UNIQUE | Email del usuario |
| `email_verified` | INTEGER | NOT NULL, default false | Email verificado |
| `image` | TEXT | nullable | URL de imagen de perfil |
| `created_at` | INTEGER | NOT NULL | Timestamp de creación |
| `updated_at` | INTEGER | NOT NULL | Timestamp de actualización |
| `role` | TEXT | default "user" | Rol (user/admin) |
| `banned` | INTEGER | default false | Estado de baneo |
| `ban_reason` | TEXT | nullable | Razón del baneo |
| `ban_expires` | INTEGER | nullable | Expiración del baneo |
| `url_limit` | INTEGER | default 2 | Límite de URLs |

#### Tablas de Better Auth

- `sessions` — Sesiones de usuario (con `impersonated_by` para admin)
- `accounts` — Cuentas OAuth (Google)
- `verifications` — Verificaciones de email

### Relaciones

- `users` → tiene muchos `sessions`, `accounts`
- `sessions` → pertenece a `users`
- `accounts` → pertenece a `users`

---

## Formato de Errores

Todos los errores de la API siguen este formato:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "La URL debe comenzar con http:// o https://",
    "statusCode": 400
  }
}
```

### Mapeo de Códigos

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

## Tests

```bash
# Backend
bun --cwd backend test                  # Todos los tests
bun --cwd backend run test:watch        # Modo watch
bun --cwd backend run test:coverage     # Con reporte de cobertura

# Todos los tests del monorepo
bun test
```

### Convenciones de Tests

- Los mocks están en `tests/__mocks__/url.repository.mock.ts`
- Tests completamente unitarios (sin D1, Wrangler ni red)
- Descripciones en español
- Organización por capa → entidad → caso de uso

---

## Despliegue

```bash
# Construir frontend
bun run build:front

# Desplegar backend + assets del frontend
bun run deploy
```

Antes de desplegar, asegúrese de haber configurado:

- `database_id` en `wrangler.jsonc` (D1 de producción)
- `BETTER_AUTH_SECRET` como secret
- `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` como secrets
- `SERVICE_ADMIN_API_KEY` como secret
- `TRUSTED_ORIGINS` con su dominio de producción

```bash
bunx wrangler secret put BETTER_AUTH_SECRET
bunx wrangler secret put GOOGLE_CLIENT_ID
bunx wrangler secret put GOOGLE_CLIENT_SECRET
bunx wrangler secret put SERVICE_ADMIN_API_KEY
```

---

## Comandos Útiles

### Monorepo (raíz)

```bash
bun install              # Instalar dependencias de todos los workspaces
bun run dev:back         # Ejecutar wrangler dev
bun run dev:front        # Ejecutar Vite dev server
bun run build:front      # Construir frontend
bun run build:back       # Construir backend
bun run check            # Verificar código con Biome
bun run format           # Formatear con Biome
bun run lint             # Lint con Biome
```

### Backend

```bash
bun --cwd backend test                  # Tests unitarios
bun --cwd backend dev                   # wrangler dev
bun --cwd backend deploy                # wrangler deploy --minify
bun --cwd backend run db:generate       # Generar migración SQL
bun --cwd backend run db:migrate:local  # Aplicar a D1 local
bun --cwd backend run db:migrate:remote # Aplicar a D1 remoto
bun --cwd backend run db:studio         # Drizzle Studio GUI
```

### Frontend

```bash
bun --cwd frontend dev                  # Servidor de desarrollo
bun --cwd frontend build                # Build para producción
bun --cwd frontend check                # Verificar código
bun --cwd frontend format               # Formatear código
bun --cwd frontend lint                 # Lint y auto-fix
```

---

## Arquitectura

### Backend (Arquitectura Hexagonal)

```
domain/          → Entidades, puertos del repositorio (sin dependencias externas)
application/     → Casos de uso (orquestan lógica de negocio)
infrastructure/  → Implementaciones del repositorio (Drizzle + D1)
presentation/    → Rutas HTTP (handlers Hono)
auth/            → Configuración Better Auth
db/              → Schema Drizzle (urls + auth tables)
```

**Regla de dependencia**: las capas externas dependen de las internas, nunca al revés.

### Frontend

```
lib/             → Configuración del cliente Better Auth
stores/          → Stores Pinia (authStore, urlStore)
composables/     → Lógica reutilizable (useAuth, useUrlShortener)
api/             → Instancia Axios, funciones API
components/      → Componentes Vue (features, layout, ui)
views/           → Componentes de nivel de página
```

### Decisiones de Diseño Clave

1. **Proxy de Vite**: en desarrollo, las requests del frontend van por el proxy de Vite (mismo origen) para que las cookies funcionen sin problemas de CORS
2. **Auth basada en sesiones**: Better Auth maneja sesiones via cookies httpOnly (no tokens)
3. **Acceso basado en roles**: el plugin admin proporciona roles `user`/`admin` con diferentes permisos
4. **URLs públicas**: solo las URLs creadas por usuarios admin se muestran en la lista pública
5. **Inyección de repositorio**: `UrlRepository` se inyecta via middleware de contexto Hono (no se instancia por ruta)
6. **ETag caching**: todos los endpoints GET implementan ETags para optimizar el uso de ancho de banda
7. **Deduplicación de URLs**: `POST /v1/urls` retorna la URL existente si ya existe para el usuario
8. **Límites por usuario**: configurable por admin, verificado solo al crear

---

## Licencia

Este proyecto está licenciado bajo la [GNU General Public License v3.0](https://www.gnu.org/licenses/gpl-3.0.html).

Copyright (C) 2026 [roldyoran](https://github.com/roldyoran)
