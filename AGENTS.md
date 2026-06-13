# AGENTS.md — roly.top

Monorepo con **bun** — shortener de URLs. Lee las guías específicas por área antes de editar código.

## Áreas

| Área | Guía |
|------|------|
| Backend | [backend/AGENTS.md](backend/AGENTS.md) |
| Frontend | [frontend/AGENTS.md](frontend/AGENTS.md) |

## Documentación adicional
- **Backend**: [backend/README.md](backend/README.md) — setup, API, deploy, comandos
- **Frontend**: [frontend/README.md](frontend/README.md) — stack, features, configuración

## OpenCode

- `opencode.json` — MCP habilitado para shadcn-vue (`bunx shadcn-vue@latest mcp`)

---

## Comandos del Monorepo

> **IMPORTANTE**: Este es un monorepo con **bun** como package manager. Todos los comandos deben ejecutarse desde la raíz o especificar el workspace.

### Scripts disponibles

```bash
# Desarrollo
bun run dev:front     # Inicia servidor frontend
bun run dev:back      # Inicia servidor backend

# Build
bun run build:front   # Build del frontend
bun run build:back    # Build del backend

# Verificación de código (frontend)
bun run check         # Verifica código con Biome (no hace build)
bun run format        # Formatea código con Biome
bun run lint          # Lint y auto-fix con Biome
```

### Instalar dependencias

```bash
# Desde la raíz (instala todos los workspaces)
bun install

# Opcional: instalar solo un workspace
bun install --cwd frontend
bun install --cwd backend
```
