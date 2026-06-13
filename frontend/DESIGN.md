# roly.top — Design System

> Guía visual y técnica del sistema de diseño. Basado en **shadcn-vue** (new-york) + **Tailwind CSS v4**.

---

## 1. Stack

| Capa | Tecnología |
|------|-----------|
| UI Primitives | shadcn-vue (new-york) + reka-ui |
| CSS Framework | Tailwind CSS v4 (`@tailwindcss/vite`) |
| Class Utils | `clsx` + `tailwind-merge` → `cn()` |
| Variantes | `class-variance-authority` (cva) |
| Iconos | lucide-vue-next (ÚNICO sistema permitido) |
| Animaciones | CSS keyframes + `motion-v` (Framer Motion para Vue) |
| Toast | vue-sonner |
| Tema | `@vueuse/core` → `useColorMode()` |

---

## 2. Fuentes

| Familia | Uso | Pesos | Archivo |
|---------|-----|-------|---------|
| **Syne** | Display / Headings / Números grandes | 600, 700, 800 | `/public/fonts/Syne-*.ttf` |
| **Inter** | Body / Texto general | 400, 500, 600, 700 | `/public/fonts/Inter-*.ttf` |
| **Space Mono** | Monospace / Labels técnicos / Códigos | 400, 700 | `/public/fonts/SpaceMono-*.ttf` |

### Clases Tailwind

```html
<!-- Display (Syne) -->
<span class="font-display">...</span>

<!-- Body (Inter) — default del body, no necesita clase -->
<span>...</span>

<!-- Mono (Space Mono) -->
<span class="font-mono">...</span>
```

### Pesos disponibles

```css
.font-600 { font-weight: 600 }  /* SemiBold */
.font-700 { font-weight: 700 }  /* Bold */
.font-800 { font-weight: 800 }  /* ExtraBold */
```

### Regla de uso

- **Números grandes / títulos** → `font-display font-800`
- **Labels técnicos / timestamps / códigos** → `font-mono`
- **Texto de cuerpo** → sin clase (Inter es el default)

---

## 3. Paleta de Colores

### Light Mode

| Token | Valor | Uso |
|-------|-------|-----|
| `--background` | `#ebebef` | Fondo de página |
| `--foreground` | `#09090b` | Texto principal |
| `--card` | `#f5f5f7` | Fondo de cards/paneles |
| `--card-foreground` | `#09090b` | Texto en cards |
| `--primary` | `#65a30d` | Acento principal (lime-600) |
| `--primary-foreground` | `#ffffff` | Texto sobre primary |
| `--secondary` | `#e2e2e6` | Fondo secundario |
| `--secondary-foreground` | `#52525b` | Texto secundario |
| `--muted` | `#d8d8dc` | Fondo muted |
| `--muted-foreground` | `#a1a1aa` | Texto muted |
| `--destructive` | `#ef4444` | Eliminar / Error (red-500) |
| `--border` | `rgba(132, 204, 22, 0.2)` | Bordes con tinte lime |
| `--ring` | `#65a30d` | Focus ring |

### Dark Mode

| Token | Valor | Uso |
|-------|-------|-----|
| `--background` | `#060606` | Fondo de página |
| `--foreground` | `#f4f4f5` | Texto principal |
| `--card` | `#0e0e10` | Fondo de cards/paneles |
| `--primary` | `#a3e635` | Acento principal (lime-400) |
| `--primary-foreground` | `#09090b` | Texto sobre primary |
| `--muted` | `#151517` | Fondo muted |
| `--muted-foreground` | `#a1a1aa` | Texto muted |
| `--destructive` | `#f87171` | Eliminar / Error (red-400) |
| `--border` | `rgba(163, 230, 53, 0.14)` | Bordes con tinte lime |
| `--ring` | `#a3e635` | Focus ring |

### Semantic Lime

| Variable | Light | Dark |
|----------|-------|------|
| `--lime` | `#65a30d` | `#a3e635` |
| `--lime-bright` | `#84cc16` | `#bef264` |
| `--lime-dim` | `#4d7c0f` | `#84cc16` |
| `--lime-glow` | `rgba(101,163,13,0.15)` | `rgba(163,230,53,0.18)` |
| `--lime-soft` | `rgba(101,163,13,0.07)` | `rgba(163,230,53,0.07)` |

### Semantic Status

| Variable | Light | Dark |
|----------|-------|------|
| `--success` | `#16a34a` | `#4ade80` |
| `--danger` | `#dc2626` | `#f87171` |
| `--warning` | `#d97706` | `#fbbf24` |

### Uso en clases

```html
<!-- Colores de Tailwind mapeados a CSS vars -->
<span class="text-primary">...</span>
<span class="bg-card">...</span>
<span class="text-muted-foreground">...</span>
<span class="border-border">...</span>

<!-- Colores semánticos lime (custom) -->
<span class="text-[var(--lime)]">...</span>
<span class="bg-[var(--lime-soft)]">...</span>
<span class="shadow-[0_0_12px_var(--lime-glow)]">...</span>
```

---

## 4. Border Radius

| Token | Valor | Clase Tailwind |
|-------|-------|---------------|
| `--radius` | `0.75rem` (12px) | `rounded-xl` |
| `--radius-sm` | `8px` | `rounded-lg` |
| `--radius-md` | `10px` | `rounded-[10px]` |
| `--radius-lg` | `12px` | `rounded-xl` |
| `--radius-xl` | `16px` | `rounded-2xl` |

---

## 5. Componentes shadcn-vue

### Button

```html
<!-- Variantes -->
<Button variant="default">Primary</Button>
<Button variant="destructive">Eliminar</Button>
<Button variant="outline">Secundario</Button>
<Button variant="secondary">Secundario</Button>
<Button variant="ghost">Fantasma</Button>
<Button variant="link">Link</Button>

<!-- Tamaños -->
<Button size="sm">Pequeño (h-8)</Button>
<Button size="default">Normal (h-9)</Button>
<Button size="lg">Grande (h-10)</Button>
<Button size="icon">Icono (size-9)</Button>
```

### Badge

```html
<Badge variant="default">Primary</Badge>
<Badge variant="secondary">Secundario</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Outline</Badge>
```

### Card

```html
<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
    <CardDescription>Descripción</CardDescription>
  </CardHeader>
  <CardContent>Contenido</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>
```

### Input

```html
<Input placeholder="Buscar..." class="h-9" />
```

### Dialog

```html
<Dialog v-model:open="isOpen">
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Título</DialogTitle>
      <DialogDescription>Descripción</DialogDescription>
    </DialogHeader>
    <!-- contenido -->
    <DialogFooter>
      <Button variant="outline">Cancelar</Button>
      <Button>Aceptar</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Skeleton

```html
<Skeleton class="h-4 w-20" />
<Skeleton class="h-8 w-16" />
```

### Separator

```html
<Separator />
<Separator orientation="vertical" class="h-8" />
```

### Progress

```html
<Progress :model-value="75" class="h-2" />
```

### Empty

```html
<Empty>
  <EmptyHeader>
    <EmptyMedia variant="icon">
      <IconComponent />
    </EmptyMedia>
    <EmptyTitle>Título</EmptyTitle>
    <EmptyDescription>Descripción del empty state</EmptyDescription>
  </EmptyHeader>
  <Button>Acción CTA</Button>
</Empty>
```

---

## 6. Reglas de Uso de shadcn-vue

> **REGLA PRINCIPAL:** Siempre usar componentes shadcn-vue en vez de markup personalizado. Si un componente no está instalado, instalarlo con `bunx --bun shadcn-vue@latest add <componente>`.

### Tabla de sustitución

| En vez de | Usar |
|-----------|------|
| `<div class="border-t ...">` o `<hr>` | `<Separator />` |
| `<div class="animate-pulse ...">` | `<Skeleton class="h-4 w-3/4" />` |
| `<span class="rounded-full bg-...">` | `<Badge variant="secondary">` |
| `<input class="...">` | `<Input />` |
| `<button class="...">` | `<Button variant="..." size="..." />` |
| `<div class="rounded-xl border ... bg-card">` | `<Card><CardContent>...</CardContent></Card>` |
| Empty state custom | `<Empty>` + sub-componentes |
| Progress bar custom | `<Progress :model-value="75" />` |
| Divisores custom | `<Separator />` |

### Convención de imports

```typescript
// Siempre importar desde @/components/ui/<componente>
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
```

### Convención de iconos en Button

```html
<!-- Usar data-icon para iconos dentro de Button -->
<Button>
  <Plus class="size-3.5" data-icon="inline-start" />
  Label
</Button>

<!-- No usar clases de tamaño en iconos dentro de Button -->
<!-- ❌ <Plus class="w-3 h-3" /> -->
<!-- ✅ <Plus class="size-3.5" data-icon="inline-start" /> -->
```

### Convención de spacing

```html
<!-- ❌ space-y-4 (no usar) -->
<div class="space-y-4">...</div>

<!-- ✅ flex flex-col gap-4 -->
<div class="flex flex-col gap-4">...</div>
```

### Convención de tamaño igual

```html
<!-- ❌ w-10 h-10 -->
<div class="w-10 h-10">...</div>

<!-- ✅ size-10 -->
<div class="size-10">...</div>
```

### Componentes instalados (28)

```
alert, badge, button, card, checkbox, collapsible, dialog, drawer,
dropdown-menu, empty, form, input, label, navigation-menu, pagination,
popover, progress, select, separator, sheet, sidebar, skeleton, sonner,
switch, table, tabs, textarea, tooltip
```

### Instalar componente faltante

```bash
bunx --bun shadcn-vue@latest add <componente>
```

---

## 7. Patrón de Stat Cards (Dashboard)

```html
<Card class="relative overflow-hidden border-border/60">
  <CardContent class="p-4">
    <!-- Header con label + icono -->
    <div class="flex items-center justify-between mb-3">
      <span class="text-[10px] font-mono font-700 tracking-widest uppercase text-muted-foreground">
        Label
      </span>
      <div class="flex size-7 items-center justify-center rounded-lg bg-primary/10">
        <IconComponent class="size-3.5 text-primary" />
      </div>
    </div>

    <!-- Número grande -->
    <p class="text-3xl font-display font-800 tracking-tight leading-none">
      123
    </p>

    <!-- Badge debajo -->
    <div class="mt-2.5">
      <Badge variant="default" class="gap-1">
        <span class="size-1.5 rounded-full bg-primary-foreground animate-pulse" />
        Activo
      </Badge>
    </div>
  </CardContent>

  <!-- Accent line superior (decorativa) -->
  <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
</Card>
```

---

## 8. Patrón de Quick Actions (Dashboard)

```html
<Card class="border-border/60">
  <CardContent class="p-5">
    <!-- Header -->
    <div class="flex items-center gap-2 mb-3">
      <div class="flex size-6 items-center justify-center rounded-md bg-primary/10">
        <Zap class="size-3.5 text-primary" />
      </div>
      <span class="text-xs font-mono font-700 tracking-wider uppercase text-muted-foreground">
        Acciones Rápidas
      </span>
    </div>

    <!-- Grid de acciones -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
      <Button
        variant="outline"
        class="flex flex-col items-center gap-2 h-auto py-3.5 border-border/60 hover:border-primary/30 hover:bg-primary/5"
      >
        <div class="flex size-9 items-center justify-center rounded-lg bg-primary/10">
          <Plus class="size-4 text-primary" />
        </div>
        <span class="text-[11px] font-mono font-600">Label</span>
      </Button>
    </div>
  </CardContent>
</Card>
```

---

## 9. Patrón de Link Card (Mis Enlaces)

```html
<Card class="border-border/60 relative overflow-hidden">
  <CardContent class="p-4">
    <div class="flex items-center gap-4">
      <!-- Short URL -->
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2 mb-1.5">
          <span class="font-mono text-sm font-700 text-primary truncate">
            roly.top/codigo
          </span>
          <Button variant="ghost" size="icon" class="size-5 text-muted-foreground hover:text-foreground">
            <Copy class="size-3" />
          </Button>
        </div>
        <p class="text-[11px] font-mono text-muted-foreground truncate max-w-md">
          https://url-larga.com/path/to/page
        </p>
      </div>

      <!-- Stats + Actions -->
      <div class="flex items-center gap-4 flex-shrink-0">
        <div class="text-right">
          <div class="flex items-center gap-1.5">
            <MousePointerClick class="size-3 text-muted-foreground" />
            <span class="text-sm font-display font-800">42</span>
          </div>
          <p class="text-[10px] font-mono text-muted-foreground">clics</p>
        </div>
        <Separator orientation="vertical" class="h-8" />
        <div class="flex items-center gap-1">
          <Button variant="outline" size="sm" class="h-auto px-2.5 py-1.5 text-[11px] font-mono font-600 border-border/60">
            <Copy class="size-3" data-icon="inline-start" />
            Copiar
          </Button>
          <Button variant="outline" size="sm" class="h-auto px-2.5 py-1.5 text-[11px] font-mono font-600 text-destructive border-border/60 hover:bg-destructive/5">
            <Trash2 class="size-3" data-icon="inline-start" />
            Eliminar
          </Button>
        </div>
      </div>
    </div>

    <!-- Accent line -->
    <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
  </CardContent>
</Card>
```

---

## 9. Patrón de Welcome Banner

```html
<Card class="relative overflow-hidden border-border/60">
  <CardContent class="p-5 sm:p-6">
    <div class="relative z-10 flex items-center justify-between">
      <div>
        <p class="text-xs font-mono tracking-wider text-muted-foreground mb-1">
          Buenos días
        </p>
        <h1 class="text-xl sm:text-2xl font-display font-800 tracking-tight">
          Nombre
        </h1>
        <p class="text-xs text-muted-foreground mt-1.5 font-mono">
          Descripción contextual
        </p>
      </div>
      <div class="hidden sm:flex size-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
        <Icon class="size-6 text-primary" />
      </div>
    </div>

    <!-- Decorative blurs -->
    <div class="pointer-events-none absolute -top-12 -right-12 size-40 rounded-full bg-primary/5 blur-3xl" />
    <div class="pointer-events-none absolute -bottom-8 -left-8 size-32 rounded-full bg-primary/3 blur-2xl" />
  </CardContent>
</Card>
```

---

## 10. Patrón de Empty State

```html
<Empty>
  <EmptyHeader>
    <EmptyMedia variant="icon">
      <IconComponent />
    </EmptyMedia>
    <EmptyTitle class="font-display">Título del empty state</EmptyTitle>
    <EmptyDescription class="font-mono">
      Descripción breve
    </EmptyDescription>
  </EmptyHeader>
  <Button size="sm" class="bg-primary text-primary-foreground font-mono font-700">
    <Plus class="size-3.5" data-icon="inline-start" />
    Acción CTA
  </Button>
</Empty>
```

---

## 11. Patrón de Botón CTA

```html
<!-- Siempre usar Button de shadcn-vue -->
<Button
  size="sm"
  class="bg-primary text-primary-foreground font-mono font-700"
>
  <Plus class="size-3.5" data-icon="inline-start" />
  Label
</Button>
```

---

## 12. Search Input

```html
<!-- Usar Input de shadcn-vue -->
<div class="relative max-w-sm">
  <Search class="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
  <Input
    placeholder="Buscar..."
    class="pl-9 h-9 text-xs font-mono"
  />
</div>
```

---

## 13. Efectos Visuales

### Convención: Shadows y Hovers

> **REGLA:** Los efectos de hover (shadow glow, cambio de borde, cambio de color) solo se aplican a elementos con **funcionalidad interactiva** (botones, links, inputs). Los elementos estáticos (stat cards, banners decorativos, labels) NO llevan hover effects.

| Elemento | Hover permitido | Ejemplo |
|----------|----------------|---------|
| Botón CTA | `hover:brightness-110` | Nuevo Enlace, Crear |
| Botón de acción | `hover:border-primary/30 hover:bg-primary/5` | Copiar, Eliminar |
| Input de búsqueda | `focus:border-primary/40 focus:shadow-[...]` | Search |
| Stat card | **NO** | Total links, clicks, etc. |
| Welcome banner | **NO** | Banner de saludo |
| Link card | **NO** | Cards de enlaces |
| Quick action button | `hover:border-primary/30 hover:bg-primary/5` | Acciones rápidas |

### Glow hover (solo elementos interactivos)

```html
hover:shadow-[0_0_12px_var(--lime-glow)]
```

### Accent line (gradiente superior, decorativa)

```html
<div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
```

### Decorative blurs (fondos, decorativos)

```html
<div class="pointer-events-none absolute -top-12 -right-12 size-40 rounded-full bg-primary/5 blur-3xl" />
```

### Focus glow (inputs, interactivos)

```html
focus:shadow-[0_0_0_3px_var(--lime-glow)]
```

### Pulsing dot

```html
<span class="size-1.5 rounded-full bg-primary animate-pulse" />
```

---

## 14. Animaciones

| Clase | Efecto | Duración |
|-------|--------|----------|
| `animate-slide-up` | Fade + slide up 40px | 0.7s ease-out |
| `animate-fade-in` | Fade in | 1.2s ease-out |
| `animate-fade-in-up` | Fade + slide up 12px | 0.6s ease-out |
| `animate-pulse-slow` | Pulse lento (opacity) | 2.5s infinite |
| `animate-pulse` | Pulse estándar (Tailwind) | 2s infinite |

Todas las animaciones se desactivan con `prefers-reduced-motion: reduce`.

---

## 15. Sidebar

### Logo Pattern

```html
<router-link class="flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-sidebar-accent transition-colors">
  <div class="w-8 h-8 rounded-[9px] bg-primary flex items-center justify-center flex-shrink-0 shadow-[0_0_16px_oklch(0.7 0.2 130/0.3)]">
    <Link class="w-4 h-4 text-primary-foreground" />
  </div>
  <div>
    <span class="font-display font-800 text-[17px] tracking-tight">
      roly<span class="text-primary">.</span>top
    </span>
    <span class="block font-mono text-[11px] tracking-wider text-muted-foreground leading-none -mt-0.5">
      by roldyoran
    </span>
  </div>
</router-link>
```

### Menu Item Active

```html
class="bg-[rgba(163,230,53,0.12)]! text-[var(--lime)]! border border-[rgba(163,230,53,0.25)]! rounded-[0.625rem]! shadow-[0_0_12px_var(--lime-glow),inset_0_1px_1px_var(--lime-soft)]! font-medium! [&>svg]:text-[var(--lime)]! [&>svg]:drop-shadow-[0_0_4px_var(--lime-glow)]"
```

### Menu Item Default

```html
class="text-[#a1a1aa]! hover:text-[#f4f4f5]! [&>svg]:text-[#a1a1aa]! [&>svg]:hover:text-[#f4f4f5]!"
```

---

## 16. Layout Dashboard

```
┌─────────────────────────────────────────────┐
│ Header (h-14)                               │
│ [SidebarTrigger] [Logo] / [Panel Name]      │
│                              [Theme] [CTA]   │
├──────────┬──────────────────────────────────┤
│ Sidebar  │ Main Content (p-7)               │
│ 248px    │ ┌──────────────────────────────┐ │
│          │ │ Welcome Banner               │ │
│ [Logo]   │ ├──────────────────────────────┤ │
│          │ │ Stat Cards (4-col grid)      │ │
│ Resumen  │ ├──────────────────────────────┤ │
│ · Panel  │ │ Quick Actions + Account      │ │
│ · Enlaces│ └──────────────────────────────┘ │
│ · Stats  │                                  │
│──────────│                                  │
│Herramien │                                  │
│ · Crear  │                                  │
│ · QR     │                                  │
│ · Público│                                  │
│──────────│                                  │
│ Cuenta   │                                  │
│ · Config │                                  │
│──────────│                                  │
│ Admin    │                                  │
│          │                                  │
│ [Salir]  │                                  │
└──────────┴──────────────────────────────────┘
```

### Grid breakpoints

- Desktop: sidebar fijo + contenido fluido
- `< 1100px`: dashboard grid colapsa a 1 columna
- Mobile: sidebar collapsible (icon mode)

---

## 17. Responsive

| Breakpoint | Comportamiento |
|-----------|---------------|
| `< 640px` (sm) | Stat cards 1 col, actions stacked, stats hidden |
| `≥ 640px` (sm) | Stat cards 2 col, actions 4-col grid |
| `≥ 1024px` (lg) | Stat cards 4 col, bottom row 3:2 |
| `≥ 1100px` | Dashboard grid 2 col (1fr + 300px) |

---

## 18. Convenciones de Código

### Clases Tailwind

- Usar `!important` con precaución (solo para overrides de componentes shadcn)
- Unidades arbitrarias: `text-[17px]`, `rounded-[9px]`, `gap-2.5`
- Colores con opacidad: `bg-primary/10`, `border-border/60`
- Transiciones: `transition-all duration-200` o `duration-300`

### Componentes

- Siempre usar `cn()` para combinar clases
- No modificar componentes en `/components/ui/`
- Crear componentes feature en `/components/features/`
- Layout components en `/components/layout/`

### Iconos

- Siempre desde `lucide-vue-next`
- Tamaños: `size-3` (12px), `size-3.5` (14px), `size-4` (16px), `size-6` (24px)
- Color: heredar del padre o `text-primary`, `text-muted-foreground`

### Espaciado

- Grid gap: `gap-2` (8px), `gap-3` (12px), `gap-5` (20px)
- Card padding: `p-4` (16px), `p-5` (20px)
- Section spacing: `space-y-5` (20px entre secciones)

---

## 19. Variables CSS custom (no Tailwind)

Para valores que necesitan ser usados en `style.css` o en clases dinámicas:

```css
/* Sidebar */
--sidebar: #ffffff / #111112
--sidebar-foreground: #09090b / #f4f4f5
--sidebar-accent: rgba(101,163,13,0.07) / rgba(163,230,53,0.07)

/* Elevated backgrounds */
--bg-elevated: #fafafa / #1a1a1c
--bg-overlay: #f0f0f0 / #232325
--bg-subtle: #e4e4e7 / #2a2a2d

/* Text hierarchy */
--text-primary: #09090b / #f4f4f5
--text-secondary: #52525b / #a1a1aa
--text-muted: #a1a1aa / #52525b
```

---

## 20. Dark Mode

- Toggle via `useColorMode()` de `@vueuse/core`
- Clase `.dark` en `<html>`
- Custom variant: `@custom-variant dark (&:is(.dark *))`
- View Transition API para animación radial al cambiar tema
- Todos los componentes shadcn soportan dark mode automáticamente via CSS vars

---

*Última actualización: Junio 2026*
