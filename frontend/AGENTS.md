# AGENTS.md - Guía para Agentes de IA

Este documento proporciona información esencial para agentes de IA (como Cursor AI, GitHub Copilot, etc.) que trabajan en el frontend de shorturl.

## 📋 Resumen del Proyecto

**shorturl Frontend** es una aplicación web construida con Vue 3 que permite:
- Acortar URLs largas
- Ver información de URLs acortadas
- Gestionar URLs guardadas del usuario
- Ver lista pública de URLs acortadas
- Autenticación con Google OAuth (Better Auth)

## 🛠️ Stack Tecnológico

### Core
- **Vue 3** (Composition API con `<script setup>`)
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **Pinia** - Gestión de estado global

### UI/Estilos
- **Tailwind CSS v4** - Framework de utilidades CSS
- **Shadcn-VUE** - Componentes UI reutilizables
- **Radix Vue** - Componentes primitivos accesibles
- **Lucide Vue Next** - Iconos (ÚNICO sistema de iconos permitido)
- **Vue Sonner** - Sistema de notificaciones toast

### Validación y Formularios
- **Vee-Validate** - Validación de formularios
- **Zod** - Schema validation

### Autenticación
- **Better Auth** - Client con admin plugin (Google OAuth, sesiones cookie)

### Utilidades
- **Axios** - Cliente HTTP
- **VueUse** - Colección de composables Vue
- **QRCode Generator** - Generación de códigos QR

### Herramientas de Desarrollo
- **Biome** - Linter y formateador (reemplaza ESLint/Prettier)
- **Vue TSC** - Type checking

## 📁 Estructura del Proyecto

```
frontend/
├── src/
│   ├── api/                    # Servicios HTTP y tipos compartidos
│   │   ├── http.ts             # Instancia de Axios (sin VITE_API_BASE_URL, usa proxy)
│   │   └── types.ts            # Tipos TypeScript (UrlInfoResponse, SavedUrlItem, etc.)
│   │
│   ├── views/                  # Componentes de página (rutas/vistas)
│   │   └── HomeView.vue        # Vista principal (hero + form de acortar)
│   │
│   ├── components/
│   │   ├── shared/             # Componentes reutilizables no-UI
│   │   │   ├── UrlResultCard.vue    # Card de resultado de URL acortada
│   │   │   └── AttemptsBadge.vue    # Badge de intentos restantes
│   │   │
│   │   ├── config/             # Componentes de configuración/debug
│   │   │   └── ApiConfigDialog.vue  # Dialog de info de API
│   │   │
│   │   ├── features/           # Componentes de funcionalidad
│   │   │   ├── url-shortener/        # Acortamiento de URLs
│   │   │   │   └── ShortenUrlForm.vue
│   │   │   ├── url-info/              # Información de URLs
│   │   │   │   └── UrlInfoForm.vue
│   │   │   └── urls/                  # Lista de URLs
│   │   │       └── UrlsList.vue      # Soporta modo "my" y "public"
│   │   │
│   │   ├── layout/             # Componentes de layout
│   │   │   ├── NavbarHeader.vue     # Incluye botón auth y badge admin
│   │   │   ├── FooterComponent.vue
│   │   │   └── ThemeToggle.vue
│   │   │
│   │   └── ui/                # Componentes Shadcn-VUE (NO modificar estilos)
│   │       ├── button/
│   │       ├── card/
│   │       ├── dialog/
│   │       ├── form/
│   │       ├── tabs/
│   │       └── ... (más componentes)
│   │
│   ├── composables/            # Composables reutilizables
│   │   ├── useUrlShortener.ts       # Lógica de negocio para acortar URLs
│   │   ├── useCopyToClipboard.ts    # Utilidad para copiar al portapapeles
│   │   └── useAuth.ts              # Better Auth (signIn, signOut, session, isAdmin)
│   │
│   ├── stores/                  # Stores de Pinia
│   │   ├── index.ts            # Configuración de Pinia
│   │   ├── urlStore.ts         # Store principal de URLs
│   │   └── authStore.ts        # Store de autenticación (Better Auth)
│   │
│   ├── lib/                    # Utilidades
│   │   ├── utils.ts            # Funciones helper (cn, formatDate, etc.)
│   │   └── auth-client.ts      # Better Auth client (con adminClient plugin)
│   │
│   ├── App.vue                 # Componente raíz
│   ├── main.ts                 # Punto de entrada
│   └── style.css               # Estilos globales
│
├── public/                     # Archivos estáticos
├── package.json
├── vite.config.ts              # Proxy para /api y /v1
├── tsconfig.json
└── biome.json                  # Configuración de Biome
```

## 🎯 Convenciones y Reglas Importantes

### ⚠️ REGLAS CRÍTICAS (NO VIOLAR)

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

## 🔧 Configuración de API

### Variables de Entorno
- `VITE_API_BASE_URL` - No se usa (eliminado). El frontend usa proxy de Vite para mismo origen.

### Proxy (vite.config.ts)
- `/api` → `http://localhost:8787` (Better Auth)
- `/v1` → `http://localhost:8787` (API routes)

### Autenticación (Better Auth)
- Cliente configurado en `src/lib/auth-client.ts` con `adminClient` plugin
- Composable `src/composables/useAuth.ts` para signIn, signOut, session, isAdmin
- Store `src/stores/authStore.ts` para estado de sesión
- Sesiones via cookie `better-auth.session_token` (same-origin via proxy)

### Instancia de Axios
- Usar `getAxiosInstance()` de `/src/api/http.ts`
- Sin headers de API key (usar Better Auth sessions)

## 📝 Patrones de Código

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

## 🚀 Tareas Comunes

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

## 🐛 Debugging

### Información de Debug
El store `urlStore` incluye una función `getDebugInfo()` que retorna:
- Estado de la sesión
- Conteo de URLs
- Si puede usar el servicio
- Si necesita reset

El store `authStore` incluye:
- `user` - Usuario actual de Better Auth
- `isAdmin` - Si el usuario tiene rol admin
- `isAuthenticated` - Si hay sesión activa

### Herramientas
- **Vue DevTools** - Para inspeccionar componentes y stores
- **Browser DevTools** - Para inspeccionar localStorage y network
- **TypeScript** - Para verificar tipos en tiempo de desarrollo

## 📦 Scripts Disponibles

> **IMPORTANTE**: NO ejecutar `build` para verificar que el código funcione. Usar solo para generar archivos de producción.

```bash
# Desarrollo
bun dev               # Inicia servidor de desarrollo

# Verificación de código (NO build)
bun check             # Verifica código con Biome (tipo-check + lint)
bun format            # Formatea código con Biome
bun lint              # Lint y auto-fix con Biome

# Preview (solo cuando sea necesario)
bun preview           # Previsualiza build de producción

# Build (solo para generar archivos de producción)
bun build             # Construye para producción
```

### En el root del monorepo

Todos los comandos deben especificar explícitamente si son para `front` o `back`:

```bash
# Incorrecto (no hacer esto)
bun run dev
bun run build
bun run check

# Correcto (siempre especificar)
bun run dev:front     # Inicia servidor frontend
bun run dev:back      # Inicia servidor backend
bun run build:front  # Build del frontend
bun run build:back   # Build del backend
bun run check        # Check del frontend (asumir frontend por defecto)
```

## 🔍 Búsqueda de Código

### Archivos Clave para Entender el Proyecto

1. **`src/App.vue`** - Componente raíz, estructura principal
2. **`src/stores/urlStore.ts`** - Lógica de negocio principal
3. **`src/stores/authStore.ts`** - Estado de autenticación (Better Auth)
4. **`src/composables/useAuth.ts`** - Funciones de auth (signIn, signOut, session)
5. **`src/lib/auth-client.ts`** - Better Auth client config
6. **`src/api/http.ts`** - Configuración de API (proxy via Vite)
7. **`src/components/features/`** - Funcionalidades principales
8. **`package.json`** - Dependencias del proyecto

### Cómo Buscar Funcionalidad

- **Acortar URL**: `ShortenUrlForm.vue` + `useUrlShortener.ts`
- **Información de URL**: `UrlInfoForm.vue`
- **URLs guardadas**: `MyUrlsList.vue` + `urlStore.ts`
- **Lista pública**: `PublicUrlsList.vue` (solo admins)
- **Autenticación**: `useAuth.ts` + `authStore.ts` + `auth-client.ts`
- **Admin badge**: `NavbarHeader.vue` (usa `isAdmin` del authStore)
- **Notificaciones**: Vue Sonner (`toast`)
- **Temas**: `ThemeToggle.vue` + `@vueuse/core`

## ⚡ Mejores Prácticas para Agentes de IA

1. **Leer primero, modificar después**
   - Siempre leer archivos relevantes antes de hacer cambios
   - Entender la estructura existente

2. **Seguir convenciones existentes**
   - Usar el mismo estilo de código que ya existe
   - Seguir los patrones establecidos

3. **No romper funcionalidad existente**
   - Verificar que los cambios no afecten otras partes
   - Mantener compatibilidad con stores y composables existentes

4. **Usar TypeScript correctamente**
   - Definir tipos para props, emits, y funciones
   - No usar `any` a menos que sea absolutamente necesario

5. **Manejar errores apropiadamente**
   - Usar try/catch en funciones async
   - Mostrar mensajes de error al usuario con `toast`

6. **Optimizar imports**
   - Importar solo lo necesario
   - Usar alias `@/` para imports desde `src/`

7. **Comentarios cuando sea necesario**
   - Agregar comentarios para lógica compleja
   - Documentar funciones no obvias

## 🎨 Sistema de Diseño

### Colores y Temas
- Los componentes Shadcn-VUE usan variables CSS de Tailwind
- Los temas (claro/oscuro) se manejan automáticamente
- NO crear paletas de colores personalizadas

### Espaciado
- Usar sistema de espaciado de Tailwind (4px base)
- `p-4` = 16px, `p-2` = 8px, etc.

### Tipografía
- Usar clases de Tailwind para tipografía
- `text-sm`, `text-base`, `text-lg`, etc.

## 📚 Recursos Adicionales

- **Vue 3 Docs**: https://vuejs.org/
- **Shadcn-VUE**: https://www.shadcn-vue.com/
- **Tailwind CSS**: https://tailwindcss.com/
- **Pinia**: https://pinia.vuejs.org/
- **VueUse**: https://vueuse.org/
- **Lucide Icons**: https://lucide.dev/

## ⚠️ Errores Comunes a Evitar

1. ❌ Modificar estilos de componentes Shadcn-VUE
2. ❌ Usar iconos que no sean de `lucide-vue-next`
3. ❌ Crear estilos personalizados para temas
4. ❌ Usar `alert()` o `confirm()` en lugar de Sonner
5. ❌ Crear stores duplicados cuando ya existe uno
6. ❌ No manejar errores en funciones async
7. ❌ Usar `any` en TypeScript sin justificación
8. ❌ Importar todo el módulo cuando solo se necesita una función

---

**Última actualización**: Este documento refleja el estado del proyecto después de la migración completa a Shadcn-VUE con soporte de temas.

