# AGENTS.md — roly.top Frontend

Guía de arquitectura y estructura del frontend para agentes de IA y desarrolladores.

---

## Descripción del Proyecto

**roly.top Frontend** es una aplicación web SPA construida con **Vue 3** que permite:
- Acortar URLs largas con códigos personalizados o auto-generados
- Visualizar información detallada de URLs acortadas
- Gestionar URLs propias (crear, listar, eliminar)
- Generar códigos QR personalizados para URLs acortadas
- Navegar la lista pública de URLs (solo usuarios admin)
- Autenticación completa con Google OAuth (Better Auth)
- Panel de administración para gestión de usuarios y URLs

---

## Stack Tecnológico

### Core
| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `vue` | ^3.5.24 | Framework (Composition API + `<script setup>`) |
| `vue-router` | 4 | Enrutamiento SPA |
| `pinia` | ^3.0.4 | Gestión de estado global |
| `typescript` | ~5.8.3 | Tipado estático |
| `vite` | ^6.4.1 | Build tool + dev server |

### UI/Estilos
| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `tailwindcss` | ^4.1.17 | Framework de utilidades CSS |
| `@tailwindcss/vite` | ^4.1.17 | Plugin Vite para Tailwind |
| `reka-ui` | ^2.9.0 | Primitivas UI headless (Radix Vue) |
| `class-variance-authority` | ^0.7.1 | Gestión de variantes de componentes |
| `clsx` | ^2.1.1 | Clases condicionales |
| `tailwind-merge` | ^3.4.0 | Deduplicación de clases Tailwind |
| `tw-animate-css` | ^1.4.0 | Utilidades de animación Tailwind |
| `lucide-vue-next` | ^0.511.0 | Iconos (ÚNICO sistema permitido) |
| `vue-sonner` | ^2.0.9 | Notificaciones toast |
| `motion-v` | ^2.3.0 | Animaciones Vue (Motion One) |
| `vaul-vue` | ^0.4.1 | Componente drawer |

### Datos y Formularios
| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `@tanstack/vue-query` | ^5.101.0 | Server state / data fetching |
| `@tanstack/vue-table` | ^8.21.3 | Tabla headless (paneles admin) |
| `vee-validate` | ^4.15.1 | Validación de formularios |
| `@vee-validate/zod` | ^4.15.1 | Adaptador Zod para VeeValidate |
| `zod` | ^4.1.12 | Validación de esquemas |
| `axios` | ^1.13.2 | Cliente HTTP |

### Autenticación
| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `better-auth` | ^1.6.15 | Cliente auth (Google OAuth) |

### Utilidades
| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `@vueuse/core` | ^13.9.0 | Composables Vue |
| `@vueuse/head` | ^2.0.0 | Gestión de meta tags |
| `canvas-confetti` | ^1.9.4 | Efecto confetti |
| `qrcode-generator` | ^1.5.2 | Generación de códigos QR |

### Herramientas de Desarrollo
| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `@biomejs/biome` | 2.4.5 | Linter + formateador |
| `vue-tsc` | ^2.2.12 | Type checking Vue |
| `@vitejs/plugin-vue` | ^5.2.4 | Soporte SFC Vue |

---

## Scripts Disponibles

```bash
# Desarrollo
bun dev                           # Servidor de desarrollo con HMR

# Verificación de código (NO build)
bun check                         # Verifica código con Biome (tipo-check + lint)
bun format                        # Formatea código con Biome
bun lint                          # Lint y auto-fix con Biome

# Preview
bun preview                       # Previsualiza build de producción

# Build (solo para generar archivos de producción)
bun build                         # Type-check + build para producción
```

**Comandos del monorepo (desde la raíz):**
```bash
bun run dev:front                 # Inicia servidor frontend
bun run build:front               # Build del frontend
bun run check                     # Check del frontend
```

---

## Configuración de TypeScript

- **Strict mode**: habilitado (`strict: true`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`)
- **Project references**: `tsconfig.app.json` (código de la app) + `tsconfig.node.json` (config de Vite)
- **Path alias**: `@/*` → `./src/*`
- **Incluye**: `src/**/*.ts`, `src/**/*.tsx`, `src/**/*.vue`

---

## Configuración de Biome

- **Formatter**: tabs, comillas dobles para JS
- **Linter**: reglas recomendadas habilitadas
- **Vue overrides**: `useConst`, `useImportType`, `noUnusedVariables`, `noUnusedImports` deshabilitados (compatibilidad Vue SFC)
- **CSS**: `tailwindDirectives: true`
- **Assist**: auto-organize imports habilitado
- **VCS**: git-aware, usa `.gitignore`

---

## Estructura del Proyecto

```
frontend/
├── src/
│   ├── main.ts                              # Bootstrap de la app
│   ├── App.vue                              # Componente raíz: tema, auth, SEO, overlay baneado
│   ├── router/index.ts                      # 4 rutas + guards de autenticación
│   ├── style.css                            # Estilos globales (~1108 líneas)
│   │
│   ├── views/
│   │   ├── HomeView.vue                     # Landing público (hero + shortener + tabs)
│   │   ├── DashboardView.vue                # Dashboard autenticado (sidebar + paneles)
│   │   ├── BannedView.vue                   # Pantalla de usuario baneado
│   │   └── admin/
│   │       ├── AdminDashboardView.vue       # Dashboard admin
│   │       ├── AdminUsersView.vue           # Gestión de usuarios admin
│   │       └── AdminUrlsView.vue            # Gestión de URLs admin
│   │
│   ├── components/
│   │   ├── ui/                              # 28 directorios de componentes Shadcn-VUE
│   │   │   ├── alert/  badge/  button/  card/  checkbox/
│   │   │   ├── collapsible/  dialog/  drawer/  dropdown-menu/
│   │   │   ├── empty/  form/  input/  label/  navigation-menu/
│   │   │   ├── pagination/  popover/  progress/  select/
│   │   │   ├── separator/  sheet/  sidebar/  skeleton/
│   │   │   ├── sonner/  switch/  table/  tabs/  textarea/  tooltip/
│   │   │
│   │   ├── layout/
│   │   │   ├── AppSidebar.vue               # Sidebar del dashboard (paneles + items admin)
│   │   │   ├── DashboardLayout.vue          # SidebarProvider + header + main slot
│   │   │   ├── NavbarHeader.vue             # (legacy) componente header
│   │   │   ├── FooterComponent.vue          # (legacy) componente footer
│   │   │   └── ThemeToggle.vue              # Claro/oscuro con View Transitions API
│   │   │
│   │   ├── shared/
│   │   │   ├── AuthRequired.vue             # Gate de autenticación con Google sign-in
│   │   │   ├── SignInModal.vue              # Modal de inicio de sesión
│   │   │   └── UrlResultCard.vue            # Card de resultado de URL
│   │   │
│   │   └── features/
│   │       ├── url-shortener/
│   │       │   └── ShortenUrlForm.vue       # Formulario de acortamiento de URLs
│   │       ├── url-info/
│   │       │   └── UrlInfoForm.vue          # Formulario de consulta de URLs
│   │       ├── urls/
│   │       │   └── UrlsList.vue             # Lista unificada de URLs (paginada, búsqueda, QR, delete)
│   │       ├── qr-generator/
│   │       │   └── QrGenerator.vue          # Generador de códigos QR con personalización
│   │       ├── admin/
│   │       │   └── AdminLayout.vue          # Layout de páginas admin (sidebar + router-view)
│   │       └── dashboard/
│   │           ├── OverviewPanel.vue        # Banner de bienvenida + stat cards + quick actions
│   │           ├── MyLinksPanel.vue         # Gestión de links del usuario
│   │           ├── AnalyticsPanel.vue       # Panel de analíticas
│   │           ├── CreateLinkPanel.vue      # Formulario crear nuevo link
│   │           ├── QRDashPanel.vue          # Panel de QR codes en dashboard
│   │           ├── PublicListDashPanel.vue  # Lista de URLs públicas en dashboard
│   │           ├── SettingsPanel.vue        # Configuración de usuario
│   │           ├── AdminUsersPanel.vue      # Admin: gestión de usuarios
│   │           └── AdminUrlsPanel.vue       # Admin: gestión de URLs
│   │
│   ├── composables/
│   │   ├── useAuth.ts                       # Better Auth (signIn, signOut, session, isAdmin)
│   │   ├── useUrlShortener.ts               # Lógica de negocio para acortar URLs
│   │   ├── useCopyToClipboard.ts            # Utilidad para copiar al portapapeles
│   │   └── useSeo.ts                        # Gestión de SEO y meta tags
│   │
│   ├── stores/
│   │   ├── index.ts                         # Configuración de Pinia
│   │   ├── urlStore.ts                      # Store principal de URLs
│   │   └── authStore.ts                     # Store de autenticación (Better Auth)
│   │
│   ├── api/
│   │   ├── http.ts                          # Instancia de Axios (proxy via Vite)
│   │   └── types.ts                         # Tipos TypeScript (UrlInfoResponse, SavedUrlItem, etc.)
│   │
│   ├── lib/
│   │   ├── utils.ts                         # Funciones helper (cn, formatDate, etc.)
│   │   └── auth-client.ts                   # Better Auth client (con adminClient plugin)
│   │
│   └── assets/
│       └── fonts/
│           └── fonts.css                    # Fuentes auto-hospedadas (Syne, Inter, Space Mono)
│
├── public/                                  # Archivos estáticos
├── package.json
├── vite.config.ts                           # Proxy para /api y /v1
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
└── biome.json                               # Configuración de Biome
```

---

## Enrutamiento

| Ruta | Nombre | Componente | Auth | Notas |
|------|--------|------------|------|-------|
| `/` | `home` | `HomeView.vue` | No | Landing público |
| `/auth/error` | `auth-error` | `BannedView.vue` | No | Error de autenticación/baneo |
| `/dashboard` | `dashboard` | `DashboardView.vue` | Sí | Dashboard de usuario |
| `/admin` | — | `AdminLayout.vue` | Sí + Admin | Redirige a `/admin/dashboard` |
| `/admin/dashboard` | `admin-dashboard` | `AdminDashboardView.vue` | Sí + Admin | |
| `/admin/users` | `admin-users` | `AdminUsersView.vue` | Sí + Admin | |
| `/admin/urls` | `admin-urls` | `AdminUrlsView.vue` | Sí + Admin | |

### Navigation Guard (`router.beforeEach`)
1. Si la ruta requiere auth/admin, verifica `authStore.isInitialized`
2. Si no está inicializado, llama a `authStore.initialize()` (obtiene sesión)
3. Si no está autenticado → redirige a home
4. Si requiere admin y no es admin → redirige a home

---

## Gestión de Estado (Pinia Stores)

### `urlStore.ts` — Estado de URLs
- **State**: `savedUrls[]`, `isLoading`, `currentTab`, `urlLimit` (default 2), `currentUserId`
- **Computed**: `urlCount`, `canUseService` (count < limit)
- **Persistencia**: localStorage por usuario (`savedUrls_{userId}`), máximo 50 items
- **Deduplicación**: por campo `original`
- **Cache de lista pública**: localStorage `publicList_v1` con TTL de 5 minutos
- **Límites por rol**: admin = 999, usuario normal = 2

### `authStore.ts` — Estado de Autenticación
- **Envuelve** el composable `useAuth()`
- **Computed**: `currentUser`, `userId`, `userName`, `userEmail`, `userImage`, `isAdmin`, `isBanned`, `banReason`, `banExpires`
- **Watch**: cambios en `userId` → reinicializa `urlStore` con nuevo usuario
- **`initialize()`**: obtiene sesión, luego establece límite de URLs según rol
- **`resetAuth()`**: limpia URLs del usuario, reinicia límites, anula user/session

---

## Composables

### `useAuth.ts`
- **Estado global** (refs a nivel de módulo, compartidos entre consumidores): `user`, `session`, `isLoading`
- `signInWithGoogle()` → `authClient.signIn.social({ provider: "google" })`
- `signOutUser()` → `authClient.signOut()` + limpia localStorage
- `fetchSession()` → `authClient.getSession()`

### `useUrlShortener.ts`
- Usa `@tanstack/vue-query` `useMutation` con actualizaciones optimistas
- **Optimista**: agrega entrada temporal en `onMutate`, restaura en error
- **Éxito**: reemplaza entrada temporal con shortCode real
- **Settled**: invalida keys `userUrls` y `publicUrls`
- Valida hash personalizado: `/^[a-z0-9]+$/`, máximo 9 chars
- Retorna `{ shortenUrl, isLoading }`

### `useCopyToClipboard.ts`
- `navigator.clipboard.writeText()` con notificaciones toast
- Toasts de éxito/error via `vue-sonner`

### `useSeo.ts`
- Envuelve `@vueuse/head` `useHead()`
- Soporta: `title`, `description`, `ogTitle`, `ogDescription`, `ogImage`, `canonical`, `robots`, `jsonLd`
- Auto-genera canonical desde `window.location.origin + route.path`
- Imagen OG predeterminada: `/shorturl.svg`
- Nombre del sitio: `roly.top`

---

## Integración API

### Cliente HTTP (`http.ts`)
- Instancia singleton de Axios con `withCredentials: true`
- **Resolución de base URL**: `VITE_API_BASE_URL` env → `localStorage.apiUrl` → vacío (proxy)
- **ETag caching**: interceptor de request adjunta `If-None-Match`, interceptor de response almacena ETag + body; 304 retorna payload cacheado
- **API key header**: `x-api-key` desde env `VITE_API_KEY`

### Funciones API

| Función | Método | Endpoint | Auth |
|---------|--------|----------|------|
| `shortenUrlRequest(url, shortCode?)` | POST | `/v1/urls` | Cookie |
| `getUrlInfoRequest(shortCode)` | GET | `/v1/urls/{shortCode}` | Cookie |
| `getUrlsRequest()` | GET | `/v1/urls` | Cookie |
| `getPublicUrlsRequest()` | GET | `/v1/urls/public` | No |
| `getPublicStatsRequest()` | GET | `/v1/urls/public/stats` | No |
| `deleteUrlRequest(shortCode)` | DELETE | `/v1/urls/{shortCode}` | Cookie |

### Tipos (`types.ts`)
- `UrlInfoResponse`: `{ id, shortCode, originalUrl, visits, createdAt }`
- `SavedUrlItem`: `{ original, short, date }`
- `ShortenResult`: `{ success, shortCode?, shortUrl?, originalUrl? }`
- `UserUrlsResponse`: `{ urls: UrlInfoResponse[], urlLimit: number }`

---

## Flujo de Autenticación

1. **Cliente**: `auth-client.ts` crea Better Auth client con plugin `adminClient()`
2. **Sign-in**: `authClient.signIn.social({ provider: "google", callbackURL: origin })` → redirige a Google OAuth
3. **Callback**: Google redirige de vuelta, Better Auth establece cookie de sesión `better-auth.session_token`
4. **Obtención de sesión**: `authClient.getSession()` → popula refs `user` y `session`
5. **Route guard**: `router.beforeEach` verifica estado de auth antes de rutas protegidas
6. **Sistema de baneo**: `authStore.isBanned` → muestra overlay `BannedView`, bloquea todo el contenido
7. **Rol admin**: `user.role === "admin"` → habilita panel admin, URLs ilimitadas (límite 999)

---

## Sistema de Estilos

### Tailwind CSS v4
- **Import**: `@import "tailwindcss"` + `@import "tw-animate-css"`
- **Dark mode**: basado en clase (`@custom-variant dark (&:is(.dark *))`)
- **Tema**: variables CSS inline vía bloque `@theme inline`
- **Fuentes personalizadas**: Syne (display), Inter (body), Space Mono (mono) — auto-hospedadas via `fonts.css`

### Sistema de Diseño
- **Variables CSS**: 80+ tokens semánticos para colores, bordes, espaciado
- **Modo claro**: primario lime/green (`#65a30d`), fondos gris claro
- **Modo oscuro**: primario lime brillante (`#a3e635`), fondos casi negros
- **Tokens semánticos**: `--lime`, `--lime-bright`, `--lime-glow`, `--success`, `--danger`, `--warning`
- **Jerarquía de texto**: `--text-primary`, `--text-secondary`, `--text-muted`, `--text-disabled`

### Estilos de Componentes
- **Shadcn-VUE** en `components/ui/` (28 directorios) — usando `class-variance-authority` para variantes
- **Utilidad**: función `cn()` de `lib/utils.ts` (clsx + tailwind-merge)
- **Clases CSS personalizadas**: `shortener-card`, `terminal-row`, `terminal-prompt`, `stats-strip`, `status-pill`, `dash-grid`, `panel-card`, `url-table`, `chip`, `activity-*`, etc.
- **Animaciones**: `animate-slide-up`, `animate-fade-in`, `animate-fade-in-up`, `animate-pulse-slow` + `motion-v` para animaciones de scroll/enter
- **Reduced motion**: `@media (prefers-reduced-motion: reduce)` desactiva todas las animaciones
- **View Transitions API**: `ThemeToggle` usa `document.startViewTransition` con animación circular de clip-path para cambio de tema

### Scrollbar Personalizado
- Firefox: `scrollbar-width: thin`
- WebKit: 12px personalizado, redondeado, con temas de variables CSS
- Móvil: 8px en `max-width: 640px`

---

## SEO y Meta Tags

- **`@vueuse/head`** integrado en `main.ts` via `createHead()`
- **`useSeo()`** composable usado en `App.vue` y `HomeView.vue`
- **App.vue**: título dinámico según ruta (Admin → "Admin", auth-error → "Error de autenticación", default → "Acortador de URLs")
- **Robots**: `noindex, nofollow` para rutas admin/auth-error
- **HomeView**: JSON-LD structured data (`WebApplication` schema)
- **OG tags**: title, description, image, url — todos computed reactivamente
- **Twitter cards**: twitter:title, twitter:description

---

## Características Destacadas

### Actualizaciones Optimistas UI
- `useUrlShortener` agrega entradas temporalmente, revierte en error
- `UrlsList` delete mutation con eliminación optimista y rollback

### ETag HTTP Caching
- Interceptores de Axios implementan cache ETag del lado del cliente en localStorage
- Requests GET adjuntan `If-None-Match`, responses 304 retornan bodies cacheados

### Generador de Códigos QR
- Renderizado QR personalizado en canvas: selector de color, soporte de degradado, módulos redondeados, overlay de logo
- Preview en vivo: las opciones auto-regeneran QR con debounce de 150ms
- Copiar al portapapeles como PNG blob, descargar como archivo

### Efecto Confetti
- `canvas-confetti` dispara 3 ráfagas (izquierda, derecha, centro) en acortamiento exitoso de URL

### Arquitectura de Paneles Dashboard
- `DashboardView` usa `defineAsyncComponent` para los 9 paneles (lazy loading)
- Cambio de panel vía ref `activePanel`, sin cambios de ruta — navegación puramente del lado del cliente
- `DashboardLayout` envuelve sidebar + header + patrón de slot de contenido

### Sistema de Rol Admin
- Panel admin accesible tanto como rutas `/admin/*` como items del sidebar del dashboard
- Items admin renderizados condicionalmente vía `authStore.isAdmin`
- Límite URLs: admin = 999, usuario regular = 2

### Mobile-First Responsive
- Menú móvil en `HomeView` con hamburger toggle
- Admin layout usa `Sheet` (drawer) para sidebar en móvil
- Dashboard sidebar usa `SidebarProvider` con modo icono colapsable
- Scrollbar se reduce en móvil, stats strip se envuelve

### Accesibilidad
- Skip link (`.skip-link`) para navegación por teclado
- `focus-visible` outlines, `touch-action: manipulation` para botones/enlaces
- `aria-label`, `aria-hidden`, `aria-live` regions
- Media query reduced motion desactiva todas las animaciones
- Estructura HTML semántica

### Sistema de Baneo
- `authStore.isBanned` computed desde datos de sesión
- `App.vue` renderiza `BannedView` como overlay completo cuando está baneado
- Ruta de error auth (`/auth/error`) bypass del overlay de baneo para mostrar info del error
- Razón de baneo y expiración mostrados al usuario

### Estrategia localStorage
- Storage por usuario: `savedUrls_{userId}`
- Cache de lista pública: `publicList_v1` con TTL de 5 minutos
- Cache ETag: keys `etag:{url}` y `cache:{url}`
- Override de URL API: key `apiUrl`

---

## Convenciones y Reglas Importantes

### Reglas Críticas (No Violar)

1. **NO modificar estilos de componentes Shadcn-VUE**
   - Los componentes en `/src/components/ui/` deben usarse tal cual
   - NO agregar estilos personalizados, degradados o customizaciones
   - Usar solo las variantes y props que proporcionan

2. **Sistema de Iconos ÚNICO**
   - **SOLO usar `lucide-vue-next`** para iconos
   - NO usar otros sistemas de iconos (FontAwesome, Heroicons, etc.)
   - Importar desde: `import { IconName } from "lucide-vue-next"`

3. **Sistema de Temas**
   - La app soporta modo claro y oscuro
   - Usar `@vueuse/core` con `useColorMode()` para manejar temas
   - Los componentes Shadcn-VUE ya soportan temas automáticamente
   - NO crear estilos personalizados para temas

4. **Estructura de Componentes**
   - Componentes de funcionalidad → `/src/components/features/`
   - Componentes UI reutilizables → `/src/components/ui/` (Shadcn-VUE)
   - Componentes de layout → `/src/components/layout/`

5. **Gestión de Estado**
   - Usar Pinia stores para estado global
   - NO usar `provide/inject` para estado compartido
   - El store principal es `urlStore.ts`

6. **Notificaciones**
   - Usar **Vue Sonner** para todas las notificaciones
   - NO usar `alert()`, `confirm()`, o sistemas de notificación personalizados
   - Importar: `import { toast } from "vue-sonner"`

---

## Patrones de Código

### Componentes Vue
```vue
<script setup lang="ts">
// 1. Imports
import { ref, computed, onMounted } from "vue";
import { useUrlStore } from "@/stores/urlStore";
import { Button } from "@/components/ui/button";
import { toast } from "vue-sonner";

// 2. Props/Emits
const props = defineProps<{ /* ... */ }>();
const emit = defineEmits<{ /* ... */ }>();

// 3. Stores
const urlStore = useUrlStore();

// 4. Estado local
const isLoading = ref(false);

// 5. Computed
const canSubmit = computed(() => !isLoading.value);

// 6. Funciones
async function handleSubmit() {
  // ...
}

// 7. Lifecycle
onMounted(() => {
  // ...
});
</script>

<template>
  <!-- Usar componentes Shadcn-VUE -->
  <Button @click="handleSubmit">Submit</Button>
</template>
```

### Composables
- Crear composables en `/src/composables/` para lógica reutilizable
- Usar el prefijo `use` (ej: `useUrlShortener.ts`)
- Retornar objetos reactivos y funciones

### Stores de Pinia
- Usar Composition API style (`defineStore` con función)
- Separar estado, getters y acciones claramente
- Persistir en localStorage cuando sea necesario

---

## Variables de Entorno

| Variable | Propósito |
|----------|-----------|
| `VITE_API_BASE_URL` | No se usa (eliminado). El frontend usa proxy de Vite para mismo origen. |
| `VITE_API_KEY` | API key para header `x-api-key` |

### Proxy (vite.config.ts)
- `/api` → `http://localhost:8787` (Better Auth)
- `/v1` → `http://localhost:8787` (API routes)

---

## Tareas Comunes

### Agregar un Nuevo Componente de Funcionalidad
1. Crear carpeta en `/src/components/features/[feature-name]/`
2. Crear componente Vue con `<script setup lang="ts">`
3. Usar componentes Shadcn-VUE para UI
4. Usar stores de Pinia para estado
5. Usar composables para lógica reutilizable
6. Agregar a `App.vue` si es necesario

### Agregar una Nueva Petición API
1. Agregar función en `/src/api/http.ts`
2. Usar `getAxiosInstance()` para obtener instancia de Axios
3. Definir tipos en `/src/api/types.ts` si es necesario
4. Manejar errores con try/catch
5. Usar `toast` para notificar errores al usuario

### Agregar un Nuevo Store
1. Crear archivo en `/src/stores/[storeName].ts`
2. Usar `defineStore` con Composition API
3. Exportar el store
4. Importar en componentes que lo necesiten

### Modificar Estilos
1. **NO modificar componentes UI** (Shadcn-VUE)
2. Usar clases de Tailwind CSS directamente en componentes de features
3. Agregar estilos globales en `style.css` solo si es absolutamente necesario
4. Usar variables CSS de Tailwind para temas

---

## Errores Comunes a Evitar

1. Modificar estilos de componentes Shadcn-VUE
2. Usar iconos que no sean de `lucide-vue-next`
3. Crear estilos personalizados para temas
4. Usar `alert()` o `confirm()` en lugar de Sonner
5. Crear stores duplicados cuando ya existe uno
6. No manejar errores en funciones async
7. Usar `any` en TypeScript sin justificación
8. Importar todo el módulo cuando solo se necesita una función

---

## Recursos Adicionales

- **Vue 3 Docs**: https://vuejs.org/
- **Shadcn-VUE**: https://www.shadcn-vue.com/
- **Tailwind CSS**: https://tailwindcss.com/
- **Pinia**: https://pinia.vuejs.org/
- **VueUse**: https://vueuse.org/
- **Lucide Icons**: https://lucide.dev/
