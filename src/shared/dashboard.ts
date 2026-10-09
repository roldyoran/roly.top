/**
 * Tipos compartidos del dashboard — única fuente de verdad.
 *
 * PROBLEMA QUE RESUELVE: `UrlEntity`, el resumen del dashboard y los puntos
 * de las gráficas estaban copiados a mano en `DashboardIndex.astro`,
 * `LinksPanel.astro`, `AnalyticsCard.svelte` y `TopLinksCard.svelte`. Si el
 * backend añadía un campo, había que editar 4 archivos y era fácil que se
 * desincronizaran sin que TypeScript avisara.
 *
 * Estas son re-exportaciones (solo tipos, cero JS en el bundle) de las
 * entidades del dominio en `src/server/`. Si cambia la API, el error de
 * tipos aparece aquí y en cada consumidor automáticamente.
 */
import type {
	DashboardClicksByDay,
	DashboardPagination,
	DashboardRangeDays,
	DashboardSummary,
	DashboardTopLink,
} from "@/server/domain/dashboard/dashboard.entity";
import type { PublicLink, UrlEntity } from "@/server/domain/url/url.entity";

export type {
	DashboardClicksByDay,
	DashboardPagination,
	DashboardRangeDays,
	DashboardSummary,
	DashboardTopLink,
	PublicLink,
	UrlEntity,
};
