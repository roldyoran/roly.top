# @roly.top/frontend

Vue 3 SPA for the roly.top URL shortener.

## Stack

- **Vue 3** — Composition API + `<script setup>`
- **Pinia** — State management
- **TanStack Vue Query** — Server state
- **Shadcn-VUE** — UI components
- **Tailwind CSS v4** — Styling
- **Vite** — Build tool

## Commands

```bash
bun install          # Install dependencies
bun run dev          # Dev server (http://localhost:5173)
bun run build        # Production build
bun run check        # Biome check
bun run lint         # Biome lint --write
bun run format       # Biome format --write
```

## Structure

```
src/
├── api/            # Axios client, API functions
├── types/          # Centralized TypeScript types
├── lib/            # Better Auth client
├── stores/         # Pinia stores (auth, urls, admin)
├── composables/    # useAuth, useUrlShortener, useSeo
├── components/
│   ├── ui/         # Shadcn-VUE components (do not modify)
│   ├── layout/     # AppSidebar, DashboardLayout, ThemeToggle
│   ├── shared/     # AuthRequired, SignInModal, UrlResultCard
│   └── features/   # url-shortener, urls, qr-generator, admin, dashboard
├── views/          # HomeView, DashboardView, admin views
└── style.css       # Global styles + Tailwind
```

## Conventions

- Use `lucide-vue-next` for icons (only allowed system)
- Use `vue-sonner` for toasts (no `alert()`)
- Do not modify `components/ui/` (Shadcn-VUE)
- Biome: tabs, double quotes
- See [frontend/AGENTS.md](./AGENTS.md) for full guidelines
