# PLAN DE MEJORAS — roly.top

**Fecha de auditoría:** 18 de junio de 2026
**Tipo de proyecto:** URL Shortener (acortador de URLs)
**Arquitectura:** Monorepo (Bun) — Cloudflare Workers + Vue 3 SPA
**Runtime:** Cloudflare Workers (Hono) + D1 (SQLite serverless)
**Frontend:** Vue 3 SPA (Vite, Tailwind CSS v4, Shadcn-VUE)

---

## Diagnóstico Ejecutivo

**Estado actual:** Funcional pero con **3 vulnerabilidades CRÍTICAS** y **4 problemas ALTO** que requieren acción inmediata antes de producción.

### Resumen de Severidad

| Severidad | Hallazgos | Items |
|-----------|-----------|-------|
| 🔴 CRÍTICO | 3 | Secrets en git, sin security headers, sin rate limiting |
| 🟠 ALTO | 4 | 2 queries por redirect, findAll sin paginación, API key expuesta, session en todas las rutas |
| 🟡 MEDIO | 11 | CORS no env-driven, CI sin lint, getStats secuencial, delete no atómico, etc. |
| 🟢 BAJO | 8 | Fonts TTF, singletons, checkEnv por request, lazy loading dashboard, etc. |

---

## 1. ARQUITECTURA Y FLUJO DE ENTREGA

### Flujo actual

```
Navegador → Cloudflare Edge (CDN/SSL) → Workers Assets (static files)
                                         ↓ (no es estático)
                                       Worker Hono
                                         ├── /api/auth/* → Better Auth (Google OAuth)
                                         ├── /v1/* → API (URLs, Admin, User)
                                         ├── /:shortCode → 302 redirect
                                         └── GET * (text/html) → SPA fallback → index.html
```

### Hallazgos

| # | Problema | Impacto | Motivo | Solución | Complejidad | Ganancia | Prioridad |
|---|----------|---------|--------|----------|-------------|----------|-----------|
| 1.1 | **Cloudflare Workers Assets sirve estáticos ANTES del Worker** — los archivos en `frontend/dist` se sirven directamente desde el edge sin ejecutar código Hono. Esto es óptimo. | ✅ OK | Arquitectura correcta | No requiere cambio | — | — | — |
| 1.2 | **SPA fallback manual** en `backend/src/index.ts:48-63` — verifica `Accept: text/html` antes de servir `index.html`. Correcto para evitar interceptar `/:shortCode`. | ✅ OK | Patrón adecuado | No requiere cambio | — | — | — |
| 1.3 | **Acoplamiento innecesario: session middleware se ejecuta en TODAS las rutas v1**, incluyendo públicas como `GET /v1/urls/public/stats` | Alto | `v1Router.use("*", ...)` ejecuta `auth.api.getSession()` en cada request, incluso cuando no se necesita auth | Mover la resolución de sesión a rutas que la requieran, o agregar condición por path | Baja | Elimina overhead de auth en endpoints públicos | **1** |
| 1.4 | **Doble verificación de duplicados en creación de URLs** — `url.routes.ts:115` verifica `findByOriginalUrl`, y luego `CreateUrlUseCase:19` lo verifica de nuevo | Medio | Query redundante en cada creación | Eliminar la verificación del route handler y confiar en el use case | Baja | Reduce 1 query por creación | **3** |

---

## 2. RENDIMIENTO (PERFORMANCE)

### 2.1 Cuellos de botella en la ruta crítica (redirect)

| # | Problema | Impacto | Motivo | Solución | Complejidad | Ganancia | Prioridad |
|---|----------|---------|--------|----------|-------------|----------|-----------|
| 2.1 | **2 queries secuenciales por cada redirect** — `findByShortCode()` + `incrementVisits()` en `redirect-url.usecase.ts:8-14` | **ALTO** | Cada click en un link corto hace 2 round-trips a D1. Con tráfico alto, esto duplica la latencia | Combinar en un solo query: `UPDATE urls SET visits = visits + 1 WHERE short_code = ? RETURNING *` | Media | **50% reducción latencia en la ruta más crítica** | **1** |
| 2.2 | **`findAll()` sin paginación en `url.repository.impl.ts:37`** — carga TODAS las URLs a memoria | **ALTO** | En Workers con 128MB de memoria, tablas grandes causan OOM | Agregar paginación (LIMIT/OFFSET) o migrar a SQL `WHERE userId IN (...)` | Media | Previene crashes en producción | **2** |
| 2.3 | **`get-public-urls.usecase.ts` carga TODAS las URLs y filtra en JS** | **ALTO** | Full table scan + filtrado en JavaScript. Degradación lineal con crecimiento | Reemplazar con query SQL: `WHERE userId IN (adminIds)` | Baja | Elimina OOM risk + mejora latencia | **2** |

### 2.2 Queries paralelizables

| # | Problema | Impacto | Motivo | Solución | Complejidad | Ganancia | Prioridad |
|---|----------|---------|--------|----------|-------------|----------|-----------|
| 2.4 | **5 queries secuenciales en `admin.repository.impl.ts:getStats()`** — count users, count urls, sum visits, count admins, count banned | Medio | 5 round-trips secuenciales cuando son independientes | `Promise.all([query1, query2, query3, query4, query5])` | Baja | 80% reducción latencia en stats | **3** |
| 2.5 | **3 queries secuenciales en creación con custom shortCode** — `findByOriginalUrl` + `findByShortCode` + `create` | Medio | Queries 1 y 2 son independientes | `Promise.all` para las dos primeras | Baja | 33% reducción latencia | **4** |

### 2.3 Caché y compresión

| # | Problema | Impacto | Motivo | Solución | Complejidad | Ganancia | Prioridad |
|---|----------|---------|--------|----------|-------------|----------|-----------|
| 2.6 | **Compresión manejada por Cloudflare Edge** (Brotli/gzip automático) | ✅ OK | Workers Assets comprime automáticamente | No requiere cambio | — | — | — |
| 2.7 | **ETag implementado correctamente** — SHA-256 en respuestas GET, soporte 304 | ✅ OK | Patrón adecuado | No requiere cambio | — | — | — |
| 2.8 | **Frontend localStorage cache sin TTL ni eviction** — `http.ts:78-81` almacena todas las respuestas GET sin límite | Medio | `localStorage` tiene límite de ~5MB. Sin eviction, el cache deja de funcionar silenciosamente | Agregar TTL (5min para listas), LRU eviction, o usar `sessionStorage` | Media | Previene `QuotaExceededError` | **4** |
| 2.9 | **Synchronous `localStorage.getItem()` en cada GET request** — `http.ts:52` | Bajo | Bloquea el event loop durante microsegundos. Negligible para pocas requests | Usar cache en memoria con `localStorage` como fallback | Baja | Mejora marginal | **5** |

### 2.4 Optimización de assets

| # | Problema | Impacto | Motivo | Solución | Complejidad | Ganancia | Prioridad |
|---|----------|---------|--------|----------|-------------|----------|-----------|
| 2.10 | **Fonts servidas como TTF** — podrían ser WOFF2 para mejor compresión | Bajo | TTF no está optimizado para web. WOFF2 reduce ~30% el tamaño | Convertir a WOFF2 con `fonttools` | Baja | ~30% menor tamaño de fonts | **5** |
| 2.11 | **Sin bundle analyzer** — no hay `rollup-plugin-visualizer` | Bajo | Imposible monitorear composición del bundle | Agregar `rollup-plugin-visualizer` | Baja | Visibilidad del bundle | **5** |
| 2.12 | **`vite-plugin-css-injected-by-js` en devDeps pero no usado** | Bajo | Dependencia muerta | Eliminar del `package.json` | Trivial | Limpieza | **5** |

---

## 3. INFRAESTRUCTURA Y DESPLIEGUE

| # | Problema | Impacto | Motivo | Solución | Complejidad | Ganancia | Prioridad |
|---|----------|---------|--------|----------|-------------|----------|-----------|
| 3.1 | **Deploy a Cloudflare Workers es correcto** — serverless edge, auto-escalado, CDN integrado | ✅ OK | Arquitectura adecuada para el caso de uso | No requiere cambio | — | — | — |
| 3.2 | **CI/CD sin paso de lint/check** — `deploy.yaml` no ejecuta `bun run check` antes del build | Medio | Código sin formatear puede llegar a producción | Agregar `bun run check` antes de `bun run build:front` | Trivial | Consistencia de código | **3** |
| 3.3 | **CI/CD sin security scanning** — no hay `bun audit`, Snyk, o CodeQL | Medio | Dependencias con vulnerabilidades pueden pasar desapercibidas | Agregar `bun audit --audit-level=high` en el pipeline | Baja | Detección temprana de CVEs | **4** |
| 3.4 | **Sin health check endpoint** — no existe `GET /health` | Medio | Monitores no pueden verificar si la app está operativa | Agregar `GET /health` antes del SPA fallback | Trivial | Observabilidad básica | **3** |
| 3.5 | **CI/CD sed-based secret injection es frágil** — secrets se incrustan en `wrangler.jsonc` en plaintext en el runner | Medio | Runner comprometido puede exfiltrar secrets | Usar `wrangler secret put` o variables de entorno del Worker | Media | Seguridad del pipeline | **4** |

---

## 4. OBSERVABILIDAD Y OPERACIÓN

| # | Problema | Impacto | Motivo | Solución | Complejidad | Ganancia | Prioridad |
|---|----------|---------|--------|----------|-------------|----------|-----------|
| 4.1 | **Logging básico con `console.log/warn`** — sin estructura, sin niveles | Medio | Imposible filtrar/parsear logs en producción | Usar `console.log` con formato JSON estructurado (`{level, msg, ...}`) | Baja | Filtrado y análisis de logs | **3** |
| 4.2 | **Observability middleware en `v1/index.ts:25-37`** loguea method, path, status, duration, ETag | ✅ OK | Good start | Agregar request ID para trazabilidad | Baja | Correlación de requests | **4** |
| 4.3 | **`checkEnvMiddleware` ejecuta en cada request** — `context.ts:39-47` itera 7 env keys y loguea warnings | Bajo | Overhead innecesario en producción donde todos los vars están setteados | Ejecutar una vez al inicio del isolate, no por request | Trivial | Elimina overhead | **5** |
| 4.4 | **Sin métricas ni monitoreo** — no hay Prometheus, DataDog, ni Cloudflare Analytics configurado | Medio | Imposible detectar degradación, picos, o errores | Habilitar Cloudflare Analytics + Web Analytics en dashboard | Baja | Visibilidad operativa | **4** |
| 4.5 | **Sin distributed tracing** — no hay request correlation IDs | Bajo | Debugging de requests cross-service es difícil | Agregar `X-Request-ID` header en middleware | Baja | Trazabilidad | **5** |

---

## 5. SEGURIDAD Y ROBUSTEZ

### 5.1 Vulnerabilidades CRÍTICAS

| # | Problema | Impacto | Motivo | Solución | Complejidad | Ganancia | Prioridad |
|---|----------|---------|--------|----------|-------------|----------|-----------|
| 5.1 | **🔴 SECRETS COMMITTEADOS EN GIT** — `backend/.env` y `frontend/.env` contienen tokens reales (Cloudflare API, Google OAuth, Better Auth secret, Service Admin API Key) | **CRÍTICO** | Cualquiera con acceso al repo tiene credenciales de producción | 1) Rotar TODOS los secrets inmediatamente. 2) Limpiar historial con BFG Repo Cleaner. 3) Verificar `git ls-files` no liste `.env` | Alta | Protección del sistema | **0 (URGENTE)** |
| 5.2 | **🔴 Sin security headers** — No CSP, HSTS, X-Frame-Options, X-Content-Type-Options | **CRÍTICO** | Sitio vulnerable a clickjacking, MIME sniffing, downgrade attacks | Agregar middleware `hono/secure-heads` o headers manuales en `index.ts` | Baja | Protección contra ataques comunes | **0 (URGENTE)** |
| 5.3 | **🔴 Sin rate limiting** — Ningún endpoint tiene protección contra abuso | **CRÍTICO** | DDoS amplification en `/:shortCode`, brute force en auth, spam en creación de URLs | 1) Habilitar Cloudflare Rate Limiting en dashboard. 2) O usar `rateLimit` binding en wrangler | Baja | Protección contra abuso | **0 (URGENTE)** |

### 5.2 Vulnerabilidades ALTAS

| # | Problema | Impacto | Motivo | Solución | Complejidad | Ganancia | Prioridad |
|---|----------|---------|--------|----------|-------------|----------|-----------|
| 5.4 | **`VITE_API_KEY` expuesta en bundle del frontend** — enviada como `x-api-key` pero el backend NUNCA la valida | Alto | Security theater — la key es visible en DevTools pero no protege nada | O eliminar la key del frontend, o implementar validación en backend | Baja | Seguridad real | **1** |
| 5.5 | **CORS middleware no usa `TRUSTED_ORIGINS` env var** — solo permite localhost en defaults | Alto | En producción, CORS bloquea requests cross-origin (si los hubiera) | Conectar CORS middleware con `TRUSTED_ORIGINS` env var | Baja | CORS funcional en prod | **3** |
| 5.6 | **`make-admin` endpoint usa comparación no timing-safe** — `authHeader !== Bearer ${apiKey}` | Medio | Ataque de inferencia de caracteres por timing | Usar `crypto.subtle.timingSafeEqual` | Baja | Seguridad de la API key | **4** |

### 5.3 Controles existentes (correctos)

| Control | Estado | Detalle |
|---------|--------|---------|
| Input validation (Zod) | ✅ | Todos los endpoints validan con `@hono/zod-validator` |
| SQL injection prevention | ✅ | Drizzle ORM con parameterized queries |
| Cookie security | ✅ | `httpOnly`, `secure` (en prod), `sameSite: "lax"` |
| Auth por sesión | ✅ | Better Auth con Google OAuth |
| RBAC | ✅ | Roles `user`/`admin` verificados en middleware |
| Propiedad de URLs | ✅ | Usuarios solo ven/borran sus propias URLs |
| CORS | ⚠️ | Funcional en dev, pero no configurado para prod |

---

## 6. ESCALABILIDAD Y MANTENIBILIDAD

| # | Problema | Impacto | Motivo | Solución | Complejidad | Ganancia | Prioridad |
|---|----------|---------|--------|----------|-------------|----------|-----------|
| 6.1 | **Arquitectura hexagonal bien implementada** — domain/application/infrastructure/presentation separados | ✅ | Código mantenible y testeable | No requiere cambio | — | — | — |
| 6.2 | **Repository singletons innecesarios** — `UrlRepository.getInstance(db)` es redundante con el cache de `createDb` | Bajo | Complejidad sin beneficio en Workers (isolates son efímeros) | Eliminar singletons, crear instancias directamente | Trivial | Menos complejidad | **5** |
| 6.3 | **`deleteUser` no es atómico** — borra URLs primero, luego usuario. Si falla en medio, quedan URLs huérfanas | Medio | Inconsistencia de datos bajo fallo | Usar transacción D1 o FK cascade delete | Media | Consistencia de datos | **4** |
| 6.4 | **DashboardView carga todos los paneles con `defineAsyncComponent`** — aunque son lazy, se importan en el top-level del componente | Bajo | Vite fetcha los chunks aunque el panel no se renderice (por `v-if`) | Mover imports dinámicos al handler de navegación del panel | Baja | Reduce bundle inicial del dashboard | **5** |
| 6.5 | **Sin bundle analyzer** — imposible medir impacto de cambios en bundle size | Bajo | No hay visibilidad | Agregar `rollup-plugin-visualizer` | Trivial | Monitoreo | **5** |

---

## 7. PLAN DE MEJORAS PRIORIZADO

### 🔴 FASE 0 — ACCIÓN INMEDIATA (antes de cualquier despliegue)

| # | Acción | Esfuerzo | Impacto |
|---|--------|----------|---------|
| 0.1 | **Rotar TODOS los secrets** expuestos en git (Cloudflare tokens, Google OAuth, Better Auth secret, Service Admin API Key) | 30 min | Crítico |
| 0.2 | **Limpiar historial de git** con BFG Repo Cleaner para eliminar `.env` del historial | 1 hora | Crítico |
| 0.3 | **Verificar `.gitignore`** excluye `.env` efectivamente (`git ls-files --cached` no debe listarlos) | 5 min | Crítico |

### ⚡ FASE 1 — QUICK WINS (1-2 días)

| # | Acción | Esfuerzo | Impacto |
|---|--------|----------|---------|
| 1.1 | Agregar security headers middleware (`hono/secure-heads`) | 1 hora | Alto |
| 1.2 | Habilitar Cloudflare Rate Limiting en dashboard | 30 min | Alto |
| 1.3 | Merge redirect a 1 solo query (`UPDATE ... RETURNING`) | 2 horas | Alto |
| 1.4 | Mover filtrado de URLs públicas a SQL (`WHERE userId IN`) | 1 hora | Alto |
| 1.5 | Agregar `GET /health` endpoint | 15 min | Medio |
| 1.6 | Ejecutar `Promise.all` en `admin.getStats()` (5 queries paralelas) | 30 min | Medio |
| 1.7 | Eliminar doble verificación en `url.routes.ts` (redundante con use case) | 15 min | Medio |
| 1.8 | Agregar `bun run check` al pipeline CI/CD | 15 min | Medio |
| 1.9 | Conectar CORS middleware con `TRUSTED_ORIGINS` env var | 30 min | Medio |

### 🔧 FASE 2 — MEDIANO PLAZO (1-2 semanas)

| # | Acción | Esfuerzo | Impacto |
|---|--------|----------|---------|
| 2.1 | Mover session middleware solo a rutas que requieran auth | 2 horas | Alto |
| 2.2 | Agregar paginación a `findAll()` en URLs | 2 horas | Alto |
| 2.3 | Implementar TTL + eviction en frontend localStorage cache | 3 horas | Medio |
| 2.4 | Convertir fonts TTF → WOFF2 | 1 hora | Bajo |
| 2.5 | Agregar `rollup-plugin-visualizer` | 30 min | Bajo |
| 2.6 | Eliminar dependencia muerta `vite-plugin-css-injected-by-js` | 5 min | Bajo |
| 2.7 | Agregar `bun audit` al pipeline CI/CD | 30 min | Medio |
| 2.8 | Logging estructurado JSON | 2 horas | Medio |
| 2.9 | Agregar request ID para trazabilidad | 1 hora | Bajo |
| 2.10 | Usar `timingSafeEqual` en `make-admin` | 30 min | Medio |
| 2.11 | Atomicidad en `deleteUser` con transacción D1 | 2 horas | Medio |

### 🏗️ FASE 3 — LARGO PLAZO (1-3 meses)

| # | Acción | Esfuerzo | Impacto |
|---|--------|----------|---------|
| 3.1 | Evaluar migración a SSR (Nuxt/Nitro) para SEO real | Alta | Medio |
| 3.2 | Implementar Cloudflare Web Analytics o integración DataDog | Media | Medio |
| 3.3 | Agregar distributed tracing con request correlation | Media | Bajo |
| 3.4 | Eliminar singletons de repositories | Trivial | Bajo |
| 3.5 | Optimizar lazy loading de paneles del Dashboard | Media | Bajo |
| 3.6 | Implementar CI/CD con Cloudflare Workers secrets (no sed injection) | Media | Alto |

---

## 8. ARQUITECTURA OBJETIVO PARA PRODUCCIÓN

```
                    ┌─────────────────────────────────────────┐
                    │           Cloudflare Edge               │
                    │  ┌─────────┐  ┌──────────────────────┐ │
  Browser ──────────┤  │  CDN    │  │  Rate Limiting       │ │
                    │  │ (Assets)│  │  (Dashboard config)  │ │
                    │  └────┬────┘  └──────────┬───────────┘ │
                    │       │                  │              │
                    │       ▼                  ▼              │
                    │  ┌─────────────────────────────────┐   │
                    │  │     Cloudflare Worker (Hono)     │   │
                    │  │                                  │   │
                    │  │  [Security Headers Middleware]   │   │
                    │  │  [CORS Middleware]               │   │
                    │  │  [Session Middleware (v1 only)]  │   │
                    │  │                                  │   │
                    │  │  /api/auth/* → Better Auth       │   │
                    │  │  /v1/*      → API Routes         │   │
                    │  │  /:shortCode → 302 (1 query)     │   │
                    │  │  GET *      → SPA fallback       │   │
                    │  │  /health    → { status: "ok" }   │   │
                    │  │                                  │   │
                    │  │  [Structured JSON Logging]       │   │
                    │  │  [Request ID Correlation]        │   │
                    │  └──────────┬──────────────────────┘   │
                    │             │                           │
                    │  ┌──────────▼──────────────────────┐   │
                    │  │     Cloudflare D1 (SQLite)       │   │
                    │  │  - urls (paginated queries)      │   │
                    │  │  - users, sessions, accounts     │   │
                    │  │  - FK cascade deletes            │   │
                    │  └─────────────────────────────────┘   │
                    └─────────────────────────────────────────┘
```

### Justificación técnica

1. **Cloudflare Workers + D1** es ideal para este caso de uso: URLs cortas requieren latencia mínima, y Workers ejecuta en el edge más cercano al usuario
2. **Workers Assets** sirve el SPA sin necesidad de CDN separado
3. **Rate Limiting en edge** protege antes de que el request llegue al Worker
4. **Security headers en middleware** protege contra ataques comunes
5. **Session middleware condicional** reduce overhead en endpoints públicos
6. **Queries optimizadas** (1 query por redirect, SQL filtering) maximizan rendimiento de D1
7. **Health check** permite monitoreo externo

---

## 9. SECRETS QUE REQUIEREN ROTACIÓN INMEDIATA

Los siguientes secrets fueron encontrados en los archivos `.env` del proyecto y **deben ser rotados inmediatamente**:

| Secret | Ubicación | Acción requerida |
|--------|-----------|------------------|
| `SERVICE_ADMIN_API_KEY` | `backend/.env` | Regenerar en Cloudflare Dashboard o generar nuevo UUID |
| `CLOUDFLARE_API_TOKEN` | `backend/.env` y `frontend/.env` | Revocar en Cloudflare Dashboard → My Profile → API Tokens |
| `BETTER_AUTH_SECRET` | `backend/.env` | Generar nuevo con `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | `backend/.env` | Regenerar en Google Cloud Console → Credentials |
| `GOOGLE_CLIENT_SECRET` | `backend/.env` | Regenerar en Google Cloud Console → Credentials |
| `CLOUDFLARE_ACCOUNT_ID` | `backend/.env` | Visible en Cloudflare Dashboard (no es secret, pero no debería estar en git) |
| `CLOUDFLARE_DATABASE_ID` | `backend/.env` y `wrangler.jsonc` | Visible en Cloudflare Dashboard → D1 |

### Pasos para rotación

1. **Cloudflare API Token:**
   - Ir a https://dash.cloudflare.com/profile/api-tokens
   - Eliminar el token expuesto
   - Crear nuevo con permisos: `Account > Workers Scripts > Edit`, `Account > D1 > Edit`
   - Actualizar en GitHub Secrets (`CF_API_TOKEN`)

2. **Better Auth Secret:**
   - Ejecutar: `openssl rand -base64 32`
   - Actualizar en GitHub Secrets (`BETTER_AUTH_SECRET`)
   - Eliminar de `backend/.env`

3. **Google OAuth:**
   - Ir a https://console.cloud.google.com/apis/credentials
   - Eliminar el Client ID/Secret expuesto
   - Crear nuevas credenciales OAuth 2.0
   - Actualizar en GitHub Secrets (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`)

4. **Service Admin API Key:**
   - Generar nuevo UUID: `crypto.randomUUID()` o `uuidgen`
   - Actualizar en GitHub Secrets (`SERVICE_ADMIN_API_KEY`)

5. **Después de rotar:**
   - Eliminar todos los valores reales de `backend/.env` y `frontend/.env`
   - Confirmar que `.gitignore` excluye estos archivos
   - Hacer deploy con los nuevos secrets

---

*Documento generado el 18 de junio de 2026 durante auditoría de producción de roly.top*
