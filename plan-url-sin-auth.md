# Plan: URLs Anónimas Temporales

## Resumen

| Decisión | Valor |
|----------|-------|
| URL expirada → pantalla | Opción B: `/url-expirada/{shortCode}` |
| Post-auth redirect | Opción 1: redirect a `/app/dashboard` |
| Max URLs anónimas | 1 por navegador |
| Duración | 7 días |
| Rate limiting | WAF free tier (1 regla, IP, 10s) |
| Costo Cloudflare | $0 |

---

## FASE 1 — Backend: Schema + Entidad

### 1.1 `backend/src/db/schema.ts`

Agregar 2 columnas a `urlsTable`:

```typescript
claimToken: text("claim_token"),          // nullable
expiresAt: text("expires_at"),            // nullable
```

- `claimToken`: UUID generado al crear anónimamente. Se limpia al reclamar.
- `expiresAt`: ISO timestamp (ahora + 7 días). Se limpia al reclamar.
- Agregar index: `index("claim_token_idx").on(table.claimToken)`

### 1.2 `backend/src/domain/url/url.entity.ts`

Extender `UrlEntity`:
```typescript
claimToken: string | null;
expiresAt: string | null;
```

Extender `CreateUrlInput`:
```typescript
claimToken?: string | null;
expiresAt?: string | null;
```

### 1.3 Migración

```bash
bun run db:generate     # Genera SQL
bun run db:migrate:local  # Aplica local
```

---

## FASE 2 — Backend: Repository

### 2.1 `backend/src/domain/url/url.repository.port.ts`

Agregar 3 métodos:

```typescript
findByClaimToken(token: string): Promise<UrlEntity | null>;
claimUrl(claimToken: string, userId: string): Promise<UrlEntity | null>;
findExpiredAnonymousUrls(params: {
  page: number;
  pageSize: number;
  search?: string;
}): Promise<PaginatedResult<UrlEntity>>;
```

### 2.2 `backend/src/infrastructure/persistence/url.repository.impl.ts`

Implementar:

**`findByClaimToken(token)`**
```sql
SELECT * FROM urls WHERE claim_token = ?1
```

**`claimUrl(claimToken, userId)`**
```sql
UPDATE urls
SET user_id = ?1, claim_token = NULL, expires_at = NULL
WHERE claim_token = ?2
RETURNING *
```

**`findExpiredAnonymousUrls({ page, pageSize, search })`**
```sql
-- count
SELECT count(*) FROM urls
WHERE user_id IS NULL
  AND expires_at IS NOT NULL
  AND expires_at < datetime('now')
  AND (search IS NULL OR short_code LIKE '%?%' OR original_url LIKE '%?%')

-- data
SELECT * FROM urls
WHERE user_id IS NULL
  AND expires_at IS NOT NULL
  AND expires_at < datetime('now')
  AND (search IS NULL OR short_code LIKE '%?%' OR original_url LIKE '%?%')
ORDER BY expires_at ASC
LIMIT ? OFFSET ?
```

### 2.3 `backend/tests/__mocks__/url.repository.mock.ts`

Agregar al `MockedRepository`:
```typescript
findByClaimToken: Mock<(token: string) => Promise<UrlEntity | null>>;
claimUrl: Mock<(claimToken: string, userId: string) => Promise<UrlEntity | null>>;
findExpiredAnonymousUrls: Mock<(params: {...}) => Promise<PaginatedResult<UrlEntity>>>;
```

Agregar defaults en `createMockRepository()`.

Actualizar `urlFixture`:
```typescript
claimToken: null,
expiresAt: null,
```

---

## FASE 3 — Backend: Errores de Dominio

### 3.1 `backend/src/domain/url/url.errors.ts`

Agregar:
```typescript
export class UrlExpiredError extends AppError {
  constructor() {
    super("Esta URL ha expirado", "URL_EXPIRED");
  }
}

export class UrlAlreadyClaimedError extends AppError {
  constructor() {
    super("Esta URL ya fue reclamada por otro usuario", "URL_ALREADY_CLAIMED");
  }
}
```

### 3.2 `backend/src/infrastructure/http/error-handler.ts`

Agregar al `STATUS_CODE_MAP`:
```typescript
"URL_EXPIRED": 410,
"URL_ALREADY_CLAIMED": 409,
```

---

## FASE 4 — Backend: Casos de Uso

### 4.1 `backend/src/application/url/create-anonymous-url.usecase.ts` (NUEVO)

```typescript
import type { UrlRepositoryPort } from "@/domain/url/url.repository.port";
import type { UrlEntity } from "@/domain/url/url.entity";

interface CreateAnonymousUrlInput {
  originalUrl: string;
  anonymousId: string;
}

export class CreateAnonymousUrlUseCase {
  constructor(private readonly urlRepository: UrlRepositoryPort) {}

  async execute(input: CreateAnonymousUrlInput): Promise<UrlEntity> {
    // 1. Verificar que no tenga URL anónima activa (misma anonymousId)
    const existing = await this.urlRepository.findActiveAnonymousByAnonymousId(
      input.anonymousId,
    );
    if (existing) {
      throw new UrlLimitReachedError(
        "Ya tienes una URL anónima activa. Inicia sesión para crear más.",
      );
    }

    // 2. Generar claim token
    const claimToken = crypto.randomUUID();

    // 3. Calcular expiración (7 días)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // 4. Crear URL sin userId
    return this.urlRepository.create({
      originalUrl: input.originalUrl,
      claimToken,
      expiresAt,
    });
  }
}
```

> **Nota:** Se necesita agregar `anonymousId` al schema (columna `anonymous_id`) para poder rastrear qué navegador creó la URL, O se puede simplificar y solo usar el `claimToken` como identificador único. La segunda opción es más limpia — el frontend guarda el `claimToken` en localStorage y el backend no necesita `anonymousId`. Ver FASE 5 para la decisión.

### 4.2 `backend/src/application/url/claim-url.usecase.ts` (NUEVO)

```typescript
interface ClaimUrlInput {
  claimToken: string;
  userId: string;
}

export class ClaimUrlUseCase {
  constructor(private readonly urlRepository: UrlRepositoryPort) {}

  async execute(input: ClaimUrlInput): Promise<UrlEntity> {
    // 1. Buscar por claimToken
    const url = await this.urlRepository.findByClaimToken(input.claimToken);
    if (!url) {
      throw new NotFoundError("URL no encontrada o token inválido");
    }

    // 2. Verificar que no esté expirada
    if (url.expiresAt && new Date(url.expiresAt) < new Date()) {
      throw new UrlExpiredError();
    }

    // 3. Verificar que no haya sido reclamada ya
    if (url.userId) {
      throw new UrlAlreadyClaimedError();
    }

    // 4. Reclamar: asignar userId, limpiar claimToken y expiresAt
    const claimed = await this.urlRepository.claimUrl(input.claimToken, input.userId);
    if (!claimed) {
      throw new NotFoundError("Error al reclamar la URL");
    }

    return claimed;
  }
}
```

### 4.3 `backend/src/application/url/find-expired-urls.usecase.ts` (NUEVO)

```typescript
export class FindExpiredAnonymousUrlsUseCase {
  constructor(private readonly urlRepository: UrlRepositoryPort) {}

  async execute(params: { page: number; pageSize: number; search?: string }) {
    return this.urlRepository.findExpiredAnonymousUrls(params);
  }
}
```

---

## FASE 5 — Backend: Decision de `anonymousId`

**Opción A (recomendada):** NO agregar columna `anonymous_id` al schema.

El `claimToken` en localStorage es suficiente para:
1. Saber si el usuario ya tiene una URL anónima pendiente (check localStorage en frontend)
2. Reclamar la URL (claimToken como identificador)

El backend NO necesita saber quién creó la URL anónima. Solo necesita:
- Saber si una URL está expirada (`expires_at < now AND user_id IS NULL`)
- Reclaim por claimToken

**Opción B:** Agregar `anonymous_id` al schema para poder limitar server-side.

Esto requiere: schema change + columna extra + query adicional por cada creación.

**Decisión:** Opción A. El check "max 1 URL por navegador" se hace en el frontend (localStorage). El backend solo valida claimToken.

---

## FASE 6 — Backend: Rutas

### 6.1 `backend/src/presentation/http/v1/url.routes.ts` — Modificar POST

Cambiar el handler de `POST /v1/urls`:

```typescript
// Lógica actual:
// if (!user) throw UnauthorizedError

// Nueva lógica:
if (!user) {
  // Creación anónima
  const { originalUrl } = c.req.valid("json");
  const useCase = new CreateAnonymousUrlUseCase(urlRepo);
  const url = await useCase.execute({ originalUrl });
  return c.json(url, 201);
}
// ... flujo autenticado existente (sin cambios)
```

### 6.2 `backend/src/presentation/http/v1/url.routes.ts` — Nuevo endpoint claim

```typescript
// POST /v1/urls/claim
// Requiere: sesión autenticada
// Body: { claimToken: string }
// Retorna: UrlEntity reclamada

adminRoutes.post(
  "/urls/claim",
  zValidator("json", z.object({
    claimToken: z.string().uuid(),
  }), validationHook),
  async (c) => {
    const user = c.get("user");
    if (!user) throw new UnauthorizedError();
    const { claimToken } = c.req.valid("json");
    const useCase = new ClaimUrlUseCase(urlRepo);
    const url = await useCase.execute({ claimToken, userId: user.id });
    return c.json(url);
  },
);
```

### 6.3 `backend/src/presentation/http/v1/index.ts` — Sesión middleware

El middleware de sesión ya setea `user` a `null` si no hay sesión. El endpoint `POST /v1/urls` ya no debe verificar `!user` para lanzar error — ahora lo maneja internamente.

El endpoint `POST /v1/urls/claim` SÍ requiere auth — verificar `!user` y lanzar `UnauthorizedError`.

### 6.4 `backend/src/presentation/http/v1/admin.routes.ts` — Endpoint expiradas

```typescript
// GET /v1/admin/urls/expired
// Query: ?page=1&pageSize=20&search=
// Retorna: PaginatedResult<UrlEntity>

adminRoutes.get("/urls/expired", async (c) => {
  const page = Number(c.req.query("page") ?? "1");
  const pageSize = Number(c.req.query("pageSize") ?? "20");
  const search = c.req.query("search") ?? undefined;
  const urlRepo = c.get("urlRepo");
  const useCase = new FindExpiredAnonymousUrlsUseCase(urlRepo);
  const result = await useCase.execute({ page, pageSize, search });

  // ETag handling
  const etag = await computeETag(result);
  const ifNone = c.req.header("if-none-match") || c.req.header("If-None-Match");
  if (ifNone && ifNone === etag) {
    c.header("ETag", etag);
    return c.body(null, 304);
  }
  c.header("ETag", etag);
  return c.json(result);
});
```

### 6.5 `backend/src/presentation/http/redirect/index.ts` — Expiración

```typescript
redirectRoutes.get(
  "/:shortCode",
  zValidator("param", shortCodeSchema, redirectValidationHook),
  async (c) => {
    const { shortCode } = c.req.valid("param");
    const db = createDb(c.env.DB);
    const repo = new UrlRepository(db);
    const useCase = new RedirectUrlUseCase(repo);
    const url = await useCase.execute(shortCode);
    if (!url) {
      return c.redirect("/", 302);
    }
    // NUEVO: Verificar expiración
    if (url.expiresAt && new Date(url.expiresAt) < new Date()) {
      return c.redirect(`/url-expirada/${url.shortCode}`, 302);
    }
    return c.redirect(url.originalUrl, 302);
  },
);
```

---

## FASE 7 — Backend: Tests

### 7.1 `tests/unit/application/url/create-anonymous-url.usecase.test.ts` (NUEVO)

Tests:
- Crea URL anónima con claimToken y expiresAt correctos
- No asigna userId
- Retorna la URL creada

### 7.2 `tests/unit/application/url/claim-url.usecase.test.ts` (NUEVO)

Tests:
- Reclama URL exitosamente (claimToken → userId, limpia campos)
- Lanza NotFoundError si claimToken no existe
- Lanza UrlExpiredError si la URL está expirada
- Lanza UrlAlreadyClaimedError si ya tiene userId

### 7.3 `tests/unit/application/url/redirect-url.usecase.test.ts` — Modificar

Tests existentes siguen funcionando. La verificación de expiración es en la ruta, no en el use case.

### 7.4 Actualizar mock

Agregar los 3 métodos nuevos al `MockedRepository` y defaults en `createMockRepository()`.

---

## FASE 8 — Frontend: API Layer

### 8.1 `frontend/src/api/http.ts` — Nueva función

```typescript
// Creación anónima (sin auth)
export async function anonymousShortenUrlRequest(
  originalUrl: string,
  signal?: AbortSignal,
) {
  const axiosInstance = getAxiosInstance();
  const response = await axiosInstance.post(
    "/v1/urls",
    { originalUrl },
    { signal },
  );
  return response.data;
}

// Reclaim de URL
export async function claimUrlRequest(
  claimToken: string,
  signal?: AbortSignal,
) {
  const axiosInstance = getAxiosInstance();
  const response = await axiosInstance.post(
    "/v1/urls/claim",
    { claimToken },
    { signal },
  );
  return response.data;
}
```

### 8.2 `frontend/src/api/admin.ts` — Nueva función

```typescript
// URLs anónimas expiradas
export async function getExpiredAnonymousUrls(
  page = 1,
  pageSize = 20,
  search?: string,
  signal?: AbortSignal,
): Promise<PaginatedResult<AdminUrl>> {
  const axios = getAxiosInstance();
  const params: Record<string, string | number> = { page, pageSize };
  if (search) params.search = search;
  const { data } = await axios.get("/v1/admin/urls/expired", { params, signal });
  return data;
}
```

### 8.3 `frontend/src/types/url.ts` — Nuevo tipo

```typescript
// Respuesta de creación anónima
export interface AnonymousUrlResponse {
  id: number;
  originalUrl: string;
  shortCode: string;
  createdAt: string;
  visits: number;
  userId: null;
  claimToken: string;
  expiresAt: string;
}
```

### 8.4 `frontend/src/types/admin.ts` — Extender AdminUrl

```typescript
export interface AdminUrl {
  // ... existente
  expiresAt: string | null;    // NUEVO
  claimToken: string | null;   // NUEVO
}
```

---

## FASE 9 — Frontend: `useUrlShortener` Composable

### 9.1 `frontend/src/composables/useUrlShortener.ts`

Modificar `shortenUrl()`:

```typescript
const shortenUrl = async (originalUrl: string, customHash?: string) => {
  // ... validaciones existentes de hash ...

  // NUEVO: Si no está autenticado, crear anónimamente
  if (!authStore.isAuthenticated) {
    // 1. Verificar si ya hay pending_claim en localStorage
    const pending = localStorage.getItem("pending_claim");
    if (pending) {
      toast.error("Ya tienes una URL activa", {
        description: "Inicia sesión para administrarla o espera a que expire.",
      });
      return { success: false };
    }

    // 2. Llamar endpoint anónimo
    try {
      const data: AnonymousUrlResponse = await anonymousShortenUrlRequest(originalUrl);

      // 3. Guardar claimToken en localStorage
      localStorage.setItem("pending_claim", JSON.stringify({
        claimToken: data.claimToken,
        shortCode: data.shortCode,
        originalUrl: data.originalUrl,
        expiresAt: data.expiresAt,
        createdAt: data.createdAt,
      }));

      return {
        success: true,
        shortCode: data.shortCode,
        shortUrl: `${getAppBaseUrl()}/${data.shortCode}`,
        originalUrl: data.originalUrl,
      };
    } catch (error) {
      // ... manejo de error existente
    }
  }

  // ... flujo autenticado existente (sin cambios)
};
```

---

## FASE 10 — Frontend: HomeView

### 10.1 `frontend/src/views/HomeView.vue` — Modificar sección no autenticada

Reemplazar el bloque actual (líneas 162-173) que solo muestra "Inicia sesión para comenzar":

```vue
<div v-if="!authStore.isAuthenticated" class="text-center py-4">
  <!-- Si ya tiene URL pendiente, mostrar info -->
  <div v-if="pendingClaim" class="mb-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
    <p class="text-sm font-medium text-foreground mb-1">
      Tienes una URL activa
    </p>
    <p class="text-xs text-muted-foreground mb-2">
      <code class="font-mono">/{{ pendingClaim.shortCode }}</code> expira el {{ formatDate(pendingClaim.expiresAt) }}
    </p>
    <Button
      variant="outline"
      size="sm"
      class="border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
      :disabled="authStore.isLoading"
      @click="authStore.signIn"
    >
      <Google class="w-4 h-4" />
      Iniciar sesión para administrar
    </Button>
  </div>

  <!-- Si no tiene URL pendiente, mostrar form anónimo -->
  <template v-else>
    <p class="text-sm text-muted-foreground mb-3">
      Acorta tu URL sin cuenta. <span class="text-muted-foreground/60">Dura 7 días.</span>
    </p>
    <!-- El form de shortener ya funciona aquí (se ve en template v-else) -->
  </template>
</div>
```

---

## FASE 11 — Frontend: Auth Claim Flow

### 11.1 `frontend/src/stores/authStore.ts` — Claim automático post-login

Modificar `initialize()`:

```typescript
async function initialize() {
  if (isInitialized.value) return;
  try {
    await fetchSession();
  } catch {
    // Silenciar errores
  } finally {
    isInitialized.value = true;
    const urlStore = useUrlStore();
    urlStore.setUrlLimitFromRole(user.value?.role as string | undefined);

    // NUEVO: Auto-claim de URL anónima pendiente
    if (user.value) {
      await tryClaimPendingUrl();
    }
  }
}
```

Agregar nueva función:

```typescript
async function tryClaimPendingUrl() {
  const pending = localStorage.getItem("pending_claim");
  if (!pending) return;

  try {
    const { claimToken } = JSON.parse(pending);
    await claimUrlRequest(claimToken);
    localStorage.removeItem("pending_claim");
    toast.success("URL reclamada", {
      description: "Tu URL anónima ahora está vinculada a tu cuenta.",
    });
  } catch (error: unknown) {
    const errObj = error as { response?: { data?: { error?: { code?: string } } } };
    const code = errObj?.response?.data?.error?.code;

    if (code === "URL_EXPIRED") {
      toast.error("Tu URL anónima expiró", {
        description: "Crea una nueva desde el inicio.",
      });
    } else if (code === "URL_ALREADY_CLAIMED") {
      // Ya fue reclamada, limpiar silenciosamente
    } else {
      toast.error("No se pudo reclamar la URL");
    }
    localStorage.removeItem("pending_claim");
  }
}
```

### 11.2 `frontend/src/composables/useAuth.ts` — Limpiar localStorage en sign-out

Agregar en `signOutUser()`:

```typescript
localStorage.removeItem("pending_claim");
```

---

## FASE 12 — Frontend: Vista URL Expirada

### 12.1 `frontend/src/router/index.ts` — Nueva ruta

```typescript
{
  path: "/url-expirada/:shortCode",
  name: "url-expired",
  component: () => import("@/views/ExpiredUrlView.vue"),
},
```

Esta ruta NO requiere auth (cualquiera puede verla).

### 12.2 `frontend/src/views/ExpiredUrlView.vue` (NUEVO)

Componente completo con:

```vue
<template>
  <div class="min-h-screen flex items-center justify-center bg-background p-4">
    <div class="w-full max-w-md text-center space-y-6">
      <!-- Logo / Back link -->
      <a href="/" class="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft class="w-4 h-4" />
        roly.top
      </a>

      <!-- Card principal -->
      <div class="rounded-2xl border bg-card p-8 space-y-5">
        <!-- Icono -->
        <div class="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
          <TimerOff class="w-8 h-8 text-destructive" />
        </div>

        <!-- Titulo -->
        <div>
          <h1 class="font-display text-xl font-bold">URL expirada</h1>
          <p class="text-sm text-muted-foreground mt-1">
            {{ isCreator ? 'Tu URL ha expirado.' : 'Esta URL ha expirado.' }}
          </p>
        </div>

        <!-- Info de la URL -->
        <div class="p-3 rounded-lg bg-muted/50 border border-border/50 text-left">
          <code class="font-mono text-sm font-semibold text-primary">
            /{{ shortCode }}
          </code>
          <p class="text-xs text-muted-foreground mt-1 truncate">
            {{ originalUrl || 'Cargando...' }}
          </p>
          <p class="text-xs text-muted-foreground/60 mt-1">
            Expiró: {{ formattedDate }}
          </p>
        </div>

        <!-- Mensaje -->
        <p class="text-sm text-muted-foreground">
          {{ isCreator
            ? 'Inicia sesión para reactivarla. Cuenta como 1 de tus URLs.'
            : 'El creador debe iniciar sesión para reactivarla.'
          }}
        </p>

        <!-- Botón sign-in -->
        <Button
          class="w-full"
          :disabled="authStore.isLoading"
          @click="handleSignIn"
        >
          <Google class="w-4 h-4 mr-2" />
          Iniciar sesión con Google
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { ArrowLeft, TimerOff } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Google } from "@/components/ui/icons";
import { useAuthStore } from "@/stores/authStore";
import { getUrlInfoRequest } from "@/api/http";

const route = useRoute();
const authStore = useAuthStore();

const shortCode = computed(() => route.params.shortCode as string);
const originalUrl = ref("");
const expiresAt = ref("");
const isCreator = ref(false);

const formattedDate = computed(() => {
  if (!expiresAt.value) return "";
  return new Date(expiresAt.value).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
});

onMounted(async () => {
  // 1. Cargar info de la URL (para mostrar originalUrl)
  try {
    const info = await getUrlInfoRequest(shortCode.value);
    originalUrl.value = info.originalUrl;
  } catch {
    // La URL puede no existir o estar expirada
  }

  // 2. Verificar si es el creador (localStorage check)
  const pending = localStorage.getItem("pending_claim");
  if (pending) {
    const parsed = JSON.parse(pending);
    if (parsed.shortCode === shortCode.value) {
      isCreator.value = true;
      expiresAt.value = parsed.expiresAt;
    }
  }
});

async function handleSignIn() {
  await authStore.signIn();
  // Después del OAuth callback, initialize() → tryClaimPendingUrl() → claim automático
  // El usuario será redirigido a /app/dashboard
}
</script>
```

---

## FASE 13 — Frontend: Admin URLs Expiradas

### 13.1 `frontend/src/views/admin/AdminUrlsView.vue` — Agregar filtro

Agregar tabs/toggle debajo del título:

```vue
<div class="flex items-center gap-2">
  <Button
    :variant="urlFilter === 'all' ? 'default' : 'outline'"
    size="sm"
    class="rounded-lg"
    @click="urlFilter = 'all'"
  >
    Todas
  </Button>
  <Button
    :variant="urlFilter === 'expired' ? 'default' : 'outline'"
    size="sm"
    class="rounded-lg"
    @click="urlFilter = 'expired'"
  >
    Expiradas
  </Button>
</div>
```

Cuando `urlFilter === 'expired'`:
- Cambiar query key a `["adminExpiredUrls", page, pageSize, search]`
- Llamar a `getExpiredAnonymousUrls()` en vez de `getAdminUrls()`
- Columna "Propietario" se reemplaza por "Expira el"
- Agregar badge "Anónima" en la columna de shortCode

---

## FASE 14 — Seguridad

### 14.1 WAF Rate Limiting (Cloudflare Dashboard)

Crear 1 regla en Security → WAF → Rate limiting rules:

| Campo | Valor |
|-------|-------|
| Rule name | Anonymous URL creation |
| Expression | `(http.request.uri.path eq "/v1/urls" and http.request.method eq "POST" and not http.cookie contains "better-auth")` |
| Counting expression | `ip.src` |
| Period | 10 seconds |
| Requests per period | 2 |
| Action | Block |
| Mitigation timeout | 60 seconds |

### 14.2 Headers de Seguridad — `backend/src/index.ts`

Agregar al middleware de seguridad existente:

```typescript
c.header("Cross-Origin-Opener-Policy", "same-origin");
c.header("Cross-Origin-Resource-Policy", "same-origin");
```

No agregar CSP todavía — puede romper funcionalidad existente. CSP se puede agregar en un futuro con una configuración cuidadosa.

### 14.3 Limpieza en sign-out

Ya cubierto en FASE 11.2 — `localStorage.removeItem("pending_claim")`.

---

## FASE 15 — Tests Actualizados

### 15.1 Mock repository

Actualizar `url.repository.mock.ts`:
- Agregar 3 métodos nuevos al tipo `MockedRepository`
- Agregar defaults en `createMockRepository()`
- Actualizar `urlFixture` con `claimToken: null, expiresAt: null`

### 15.2 Tests existentes

Los tests de `create-url.usecase.test.ts` deben seguir pasando (el caso de uso existente no se modifica, solo se agrega uno nuevo).

### 15.3 Tests nuevos

- `create-anonymous-url.usecase.test.ts` — 3-4 tests
- `claim-url.usecase.test.ts` — 5-6 tests (éxito, no encontrado, expirada, ya reclamada)

---

## Archivos Modificados vs Nuevos

| Archivo | Acción |
|---------|--------|
| `backend/src/db/schema.ts` | MODIFICAR (+2 columnas, +1 index) |
| `backend/src/domain/url/url.entity.ts` | MODIFICAR (+2 campos) |
| `backend/src/domain/url/url.repository.port.ts` | MODIFICAR (+3 métodos) |
| `backend/src/infrastructure/persistence/url.repository.impl.ts` | MODIFICAR (+3 implementaciones) |
| `backend/src/domain/url/url.errors.ts` | MODIFICAR (+2 clases) |
| `backend/src/infrastructure/http/error-handler.ts` | MODIFICAR (+2 mapeos) |
| `backend/src/application/url/create-anonymous-url.usecase.ts` | **NUEVO** |
| `backend/src/application/url/claim-url.usecase.ts` | **NUEVO** |
| `backend/src/application/url/find-expired-urls.usecase.ts` | **NUEVO** |
| `backend/src/presentation/http/v1/url.routes.ts` | MODIFICAR (POST + nuevo endpoint claim) |
| `backend/src/presentation/http/v1/index.ts` | MODIFICAR (sesión middleware) |
| `backend/src/presentation/http/v1/admin.routes.ts` | MODIFICAR (+1 endpoint) |
| `backend/src/presentation/http/redirect/index.ts` | MODIFICAR (+check expiración) |
| `backend/src/index.ts` | MODIFICAR (+2 headers) |
| `backend/tests/__mocks__/url.repository.mock.ts` | MODIFICAR (+3 métodos, +fixture) |
| `backend/tests/unit/application/url/create-anonymous-url.usecase.test.ts` | **NUEVO** |
| `backend/tests/unit/application/url/claim-url.usecase.test.ts` | **NUEVO** |
| `frontend/src/api/http.ts` | MODIFICAR (+2 funciones) |
| `frontend/src/api/admin.ts` | MODIFICAR (+1 función) |
| `frontend/src/types/url.ts` | MODIFICAR (+1 tipo) |
| `frontend/src/types/admin.ts` | MODIFICAR (+2 campos) |
| `frontend/src/composables/useUrlShortener.ts` | MODIFICAR (rama anónima) |
| `frontend/src/stores/authStore.ts` | MODIFICAR (+tryClaimPendingUrl) |
| `frontend/src/composables/useAuth.ts` | MODIFICAR (limpiar localStorage) |
| `frontend/src/views/HomeView.vue` | MODIFICAR (banner anónimo) |
| `frontend/src/router/index.ts` | MODIFICAR (+1 ruta) |
| `frontend/src/views/ExpiredUrlView.vue` | **NUEVO** |
| `frontend/src/views/admin/AdminUrlsView.vue` | MODIFICAR (+filtro expiradas) |

**Total: 21 archivos modificados, 6 archivos nuevos = 27 archivos**

---

## Orden de Implementación

| Paso | Descripción | Dependencias |
|------|-------------|--------------|
| 1 | Schema + migración | Ninguna |
| 2 | Entity + Repository port | Paso 1 |
| 3 | Repository impl | Paso 2 |
| 4 | Errores de dominio | Ninguna |
| 5 | Use cases (3 nuevos) | Pasos 2, 3, 4 |
| 6 | Mock repository | Paso 2 |
| 7 | Tests backend | Pasos 5, 6 |
| 8 | Rutas backend (url.routes, admin.routes, redirect) | Paso 5 |
| 9 | Headers seguridad (index.ts) | Ninguna |
| 10 | WAF rate limiting (dashboard Cloudflare) | Ninguna |
| 11 | Tipos frontend | Ninguna |
| 12 | API frontend (http.ts, admin.ts) | Paso 11 |
| 13 | useUrlShortener | Paso 12 |
| 14 | HomeView (banner anónimo) | Paso 13 |
| 15 | Auth claim flow (authStore, useAuth) | Paso 12 |
| 16 | Router + ExpiredUrlView | Paso 12 |
| 17 | Admin URLs expiradas (AdminUrlsView) | Paso 12 |

---

## Diagrama de Flujo

```
USUARIO NO AUTENTICADO:
  HomeView → handleShorten()
    → localStorage check (pending_claim existe?)
      → SÍ: toast "ya tienes URL pendiente"
      → NO: POST /v1/urls { originalUrl }
        → Backend genera claimToken + expiresAt (7d)
        → Retorna { shortCode, claimToken, expiresAt }
        → Frontend guarda en localStorage.pending_claim
        → URL funciona inmediatamente (/:shortCode redirect)

USUARIO INICIA SESIÓN:
  authStore.initialize()
    → fetchSession() → usuario autenticado
    → localStorage.pending_claim existe?
      → SÍ: POST /v1/urls/claim { claimToken }
        → Backend: UPDATE userId, limpiar claimToken + expiresAt
        → localStorage.removeItem("pending_claim")
        → toast "URL reclamada"
      → NO: nada

REDIRECT:
  GET /:shortCode
    → Busca URL
    → Tiene expiresAt y ya pasó?
      → SÍ: redirect a /url-expirada/{shortCode}
      → NO: redirect a originalUrl + incrementar visitas

URL EXPIRADA:
  /url-expirada/:shortCode
    → Muestra pantalla "URL expirada"
    → Si es el creador (localStorage match): "Tu URL expiró"
    → Si es visitante: "El creador debe reactivarla"
    → Botón Google Sign-In
    → Después de auth → claim automático → redirect a dashboard

ADMIN:
  AdminUrlsView → tab "Expiradas"
    → GET /v1/admin/urls/expired
    → Lista URLs anónimas vencidas
    → Botón delete individual o bulk
```
