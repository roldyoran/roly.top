## Development

Only use PNPM or PNPX

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Diseño

Todo debe ser 'MOBILE FIRST' y despues 'DESKTOP Version' porfavor

**Obligatorio**: Usar los componentes de Starwind en `@/components/starwind` para todo lo posible. Siempre revisar `@starwind.config.json` para ver los componentes disponibles antes de crear uno nuevo. Si se necesitan mas componentes de starwind se pueden instalar con autorizacion.

Evitar el uso de '-[400px]' en las clases de tailwind, usar directamente la clase de tailwind mas cercana a menos que se necesite un pixelperfect por el usuario

## Testing

Unit tests use Vitest. E2E tests hit the running dev server via fetch.

```
pnpm test              # run unit tests once
pnpm test:watch        # watch mode
pnpm test:coverage     # coverage report
pnpm test:e2e          # E2E tests (requires dev server running)
```

Test files live in `tests/unit/` and `tests/e2e/`. When adding new server-side logic, always add a corresponding unit test. When modifying API endpoints, update E2E tests.

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
