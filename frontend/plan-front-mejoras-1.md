# Plan de mejoras frontend — versión 1

Objetivo: implementar mejoras profesionales y arquitectónicas en el frontend para reducir llamadas innecesarias al backend, mejorar rendimiento, robustez y UX. Este documento contiene un plan detallado, paso a paso, para realizar las tareas en orden seguro y minimizar riesgos. Incluye la integración de TanStack Query (Vue Query) como capa de datos.

Ruta del archivo: frontend/plan-front-mejoras-1.md

---

Resumen rápido de prioridades

1. Crear cliente HTTP singleton (axios) y centralizar lógica HTTP.
2. Persistir cache de lista pública (localStorage/IndexedDB) con TTL.
3. Evitar N requests por owner en Admin (batch owners / incluir owner en payload).
4. Integrar TanStack Query (Vue Query) de forma incremental para caching/dedupe/retries.
5. Añadir cancelación de peticiones (AbortController) y debouncing seguro.
6. Optimistic updates para crear/eliminar URLs (con Vue Query o manualmente).
7. Soporte ETag / If-None-Match (colaboración con backend) y 304 handling.
8. Opcional avanzado: SSE/WebSockets para actualizaciones en tiempo real.
9. Observabilidad, tests e2e y security review (API keys, CORS).

Cada paso incluye: descripción, archivos sugeridos, comandos, checklist de QA, rollback y tiempo estimado.

---

GUÍA PASO A PASO (1 a 1)

NOTA: Ejecuta cada paso, verifica criterios de aceptación antes de proceder al siguiente.

Paso 1 — Cliente HTTP singleton

- Descripción
  Reemplazar la función que crea una nueva instancia axios en cada llamada por un único cliente axios exportado como singleton. Centralizar headers, interceptores (401 handling, logging), y habilitar soporte para AbortController.

- Archivos a crear/modificar
  - Crear: frontend/src/api/client.ts
  - Modificar: frontend/src/api/http.ts (usar el nuevo client en vez de getAxiosInstance)
  - Modificar: frontend/src/api/admin.ts (importar client)
  - Buscar y reemplazar llamadas que usan getAxiosInstance() o axios.create()

- Implementación (sugerida)
  - frontend/src/api/client.ts (ejemplo):

    import axios from 'axios';
    import { getApiBaseUrl } from './http';

    const API_KEY = import.meta.env.VITE_API_KEY || '';

    const client = axios.create({
      baseURL: getApiBaseUrl(),
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
    });

    // Interceptor request/response básico
    client.interceptors.response.use(
      (res) => res,
      (err) => {
        // Manejar 401 globalmente si es necesario
        return Promise.reject(err);
      },
    );

    export default client;

- Comandos para desarrollo
  - Ejecutar linters/tests y levantar dev: `bun install --cwd frontend && bun run dev:front` (o el flujo que usen localmente).

- Checklist QA
  - Todas las llamadas a la API usan client (buscar `axios.create(` después de migrar debe ser 0).
  - No romper funciones existentes: acortar URL, listar URLs públicas, login, ver admin.
  - Interceptores no introducen errores 500.

- Rollback
  - Revertir commit que introdujo client.ts y restaurar llamadas previas.

- Estimación: 0.5–1 día

---

Paso 2 — Persistir cache de lista pública con TTL

- Descripción
  Guardar la lista pública (response) en localStorage o IndexedDB con metadata (fetchedAt, version). Evitar re-fetch si TTL no expiró.

- Archivos a cambiar
  - frontend/src/stores/urlStore.ts
  - frontend/src/components/features/urls/UrlsList.vue (loadUrls)

- Estrategia
  - KEY: `publicList_v1`
  - TTL por defecto: 5 minutos (configurable)
  - Implementar funciones loadPublicCache(), savePublicCache(), clearPublicCache() en urlStore.

- Ejemplo (pseudocódigo)
  function loadPublicCache() {
    const raw = localStorage.getItem('publicList_v1');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - new Date(parsed.fetchedAt).getTime() > TTL) return null;
    return parsed.data;
  }

- Checklist QA
  - Tras reload de la app dentro del TTL no se hace petición a /v1/urls/public.
  - LocalStorage tiene key publicList_v1 con fetchedAt.

- Rollback
  - Revertir commit que introduce persistencia de cache.

- Estimación: 0.5–1 día

---

Paso 3 — Evitar N requests por owner en Admin (batch owners)

- Descripción
  Evitar que AdminUrlsView haga una petición por cada owner id. Implementar:
  a) Backend: endpoint batch (recomendado), p. ej. GET /v1/admin/users?ids=id1,id2
  b) Frontend: consumir endpoint batch y popular ownerNames Map en una petición.

- Archivos frontend a cambiar
  - frontend/src/views/admin/AdminUrlsView.vue
  - frontend/src/api/admin.ts (añadir getUsersByIds)

- Estado: COMPLETADO — Se implementó un endpoint batch en backend (/v1/admin/users?ids=...) y el frontend consume getUsersByIds para poblar ownerNames en una sola petición. (Fecha: 2026-06-09)

- Flujo recomendado
  1. Backend: exponer endpoint batch o incluir ownerName en getAdminUrls.
  2. Frontend: al obtener adminStore.urls.data extraer ids únicos y llamar getUsersByIds(ids).
  3. Rellenar ownerNames.

- Checklist QA
  - Carga inicial de AdminUrls realiza 1 petición para owners en vez de N.
  - ownerNames se muestran correctamente en la tabla.

- Rollback
  - Revertir la parte frontend y coordinado backend si se cambia.

- Estimación: 1–2 días (depende backend)

---

Paso 4 — Integrar TanStack Query (Vue Query) incrementalmente

- Estado: EN PROGRESO — migraciones aplicadas:
  - Lista pública: migrada a useQuery en frontend/src/components/features/urls/UrlsList.vue (clave ['publicUrls']).
  - User URLs (my list): migrada a useQuery en frontend/src/components/features/urls/UrlsList.vue (clave ['userUrls', userId]).
  - Admin URLs: migrada a useQuery en frontend/src/views/admin/AdminUrlsView.vue (clave ['adminUrls', page, pageSize, search]).

  Estas migraciones usan staleTime/ cacheTime de 5 minutos y persisten la lista pública en localStorage. También se añadió QueryClient en main.ts.

- Descripción
  Añadir @tanstack/vue-query para centralizar caching, deduplicación, retries, cancelación y manejo de mutaciones (optimistic updates). Migrar endpoints críticos poco a poco: lista pública, user urls, admin urls.

- Instalación
  - Usando bun: `bun add --cwd frontend @tanstack/vue-query`
  - Alternativa npm/yarn: `npm install @tanstack/vue-query --workspace frontend`

- Configuración inicial (main.ts)
  // frontend/src/main.ts
  import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query';
  const queryClient = new QueryClient();
  app.use(VueQueryPlugin, { queryClient });

- Migración incremental recomendada (completado parcialmente)
  1. Migrar `getPublicUrlsRequest` -> hecho (UrlsList.vue).
  2. Migrar `getUrlsRequest` (user urls) -> hecho (UrlsList.vue).
  3. Migrar `getAdminUrls` (admin urls) -> hecho (AdminUrlsView.vue).
  4. Próximo: migrar endpoints de admin adicionales (users, stats) y convertir operaciones mutación (ban, delete) a useMutation con optimistic updates.

- Ejemplo de useMutation con optimistic update (crear URL)
  const mutation = useMutation(createUrlFn, {
    onMutate: async (newUrl) => {
      await queryClient.cancelQueries(['userUrls']);
      const previous = queryClient.getQueryData(['userUrls']);
      queryClient.setQueryData(['userUrls'], (old) => [newUrl, ...old]);
      return { previous };
    },
    onError: (err, newUrl, context) => {
      queryClient.setQueryData(['userUrls'], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries(['userUrls']);
    },
  });

- Beneficios
  - Deduplicación de requests por key.
  - Control de staleTime y re-fetching.
  - Cancelación/rollback y retries controlados.

- Checklist QA (aplicado a las migraciones realizadas)
  - Public URLs: useQuery retorna datos y respeta staleTime; localStorage contiene publicList_v1.
  - User URLs: useQuery rellena myUrls y setea urlLimit.
  - Admin URLs: useQuery rellena adminStore.urls y se hicieron batch owners.

- Rollback
  - Revertir la introducción de vue-query y restaurar fetch manual (commit atomic).

- Estimación: 2–4 días (migración incremental)


---

Paso 5 — Cancelación de peticiones y debouncing seguro

- Descripción
  Implementar AbortController para cancelar peticiones previas (búsqueda, paginación). Si usamos Vue Query, aprovechar su cancelación integrada.

- Archivos a cambiar
  - frontend/src/views/admin/AdminUrlsView.vue (onSearch/goToPage)
  - frontend/src/components/features/urls/UrlsList.vue (watch/search)

- Ejemplo de patrón (sin Vue Query)
  let controller = null;
  async function search(q) {
    controller?.abort();
    controller = new AbortController();
    try {
      const res = await client.get('/v1/admin/urls', { params: { search: q }, signal: controller.signal });
    } catch (e) {
      if (e.name === 'CanceledError') return; // ignore
    }
  }

- Checklist QA
  - Ejecutar búsquedas rápidas y verificar que no se producen race conditions.
  - Responses cancelados no actualizan UI.

- Rollback
  - Revertir cambios y usar debounce simple si hay problemas.

- Estimación: 0.5–1 día

---

Paso 6 — Optimistic updates para crear/eliminar URLs

- Descripción
  Usar useMutation (Vue Query) o patrón manual para actualizar UI inmediatamente y sincronizar con backend en background.

- Archivos a cambiar
  - frontend/src/composables/useUrlShortener.ts
  - frontend/src/stores/urlStore.ts
  - Componentes que crean/eliminan URLs

- Ejemplo con Vue Query (ver Paso 4)
  - onMutate: guardar snapshot, update cache local
  - onError: revert snapshot
  - onSettled: invalidate queries

- Checklist QA
  - Crear URL muestra nuevo elemento inmediatamente.
  - Si backend falla, elemento desaparece y se notifica error.

- Rollback
  - Revertir cambio o cambiar a sync-after-success si optimistic causa problemas.

- Estimación: 1 día

---

Paso 7 — ETag / If-None-Match (colaboración backend necesaria)

- Descripción
  Implementar caching condicional para recursos (lista pública y endpoints grandes). Backend debe devolver ETag; frontend guarda ETag y usa If-None-Match.

- Acciones
  - Backend: responder con header ETag y soportar 304 Not Modified.
  - Frontend: almacenar ETag por recurso (localStorage o IndexedDB) y enviar If-None-Match en solicitudes subsecuentes.

- Checklist QA
  - Cuando no hay cambios, backend responde 304 y cliente reutiliza cache sin descargar payload.

- Estimación: 3–7 días (dependiendo backend)

---

Paso 8 — Opcional: SSE/WebSocket para updates en tiempo real

- Descripción
  Si los casos de uso requieren, implementar SSE o WebSockets para pushes (newUrl/updateUrl/deleteUrl) y evitar polling.

- Dependencias
  - Soporte backend (SSE or WS)
  - Infra/scale considerations

- Estimación: 3–7 días

---

Paso 9 — Observabilidad, tests y revisión de seguridad

- Observabilidad
  - Instrumentar axios interceptors para medir latencias.
  - Integrar Sentry/LogRocket si procede.

- Tests
  - Unit tests para stores y composables.
  - E2E para flujos críticos (creación, borrado, búsqueda, admin).

- Security
  - Revisar VITE_API_KEY; si es secreto, mover a server. Documentar uso si es key pública.

- Estimación: 2–5 días

---

Estrategia de rollout segura (sugerida)

1. Crear branch por feature (ej.: feat/api-client, feat/cache-public, feat/admin-batch, feat/vue-query).
2. Paso 1: implementar client singleton y pruebas manuales.
3. Paso 2: persistir cache (localStorage) y pruebas (Network tab).
4. Paso 3: coordinar con backend y cambiar admin view.
5. Paso 4: integrar Vue Query incremental (primero lista pública).
6. Paso 5–6: añadir cancelación y optimistic updates.
7. Validar E2E, performance y revertir si hay regressions.

Pruebas de validación / métricas

- Antes/Después: contar requests por operación (Network tab o proxy).
- Tiempos de carga (TTFB, FCP) en devtools.
- Latencia percibida en creación/eliminación.
- Número de toasts y errores en logs.

Notas finales

- Mantén commits atómicos y PRs pequeños (1 funcionalidad por PR).
- Documenta en README del frontend los cambios de arquitectura (client, cache, uso de Vue Query).

¿Deseas que aplique el Paso 1 creando el cliente singleton (commit y cambios) o prefieres que prepare el código sugerido en un branch propuesto para revisión primero?  

---

(archivo generado automáticamente por la herramienta de soporte)
