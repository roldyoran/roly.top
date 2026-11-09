/**
 * Helpers puros del diálogo de analíticas por enlace (`LinksPanel`).
 *
 * PROBLEMA QUE RESUELVE: el breakdown país/dispositivo/navegador que
 * devuelve `GET /api/v1/analytics/[urlId]` hay que ordenarlo, cortarlo al
 * top-N y pintarlo con barras de progreso escapando el HTML. Esa lógica
 * vive aquí (testeada en `tests/unit/link-analytics.test.ts`) en vez de
 * copiada en el `<script>` del panel, donde TypeScript no la cubriría.
 */

/** Fila `{ label, count }` tal como la devuelve la API de analíticas. */
export interface AnalyticsEntry {
  label: string;
  count: number;
}

/** Escapa texto para interpolarlo en HTML sin romper el markup. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Porcentaje (0-100, entero) que `count` representa de `total`.
 * Con total 0 no hay nada que repartir; por encima de 100 se recorta.
 */
export function sharePercent(count: number, total: number): number {
  if (!Number.isFinite(count) || !Number.isFinite(total)) return 0;
  if (total <= 0 || count <= 0) return 0;
  return Math.min(100, Math.round((count / total) * 100));
}

/**
 * Top-N entradas ordenadas de mayor a menor `count`, sin mutar el array
 * original. Límite por defecto 5; con límite <= 0 devuelve vacío.
 */
export function topEntries<T extends { count: number }>(
  entries: readonly T[],
  limit = 5,
): T[] {
  if (limit <= 0) return [];
  return [...entries].sort((a, b) => b.count - a.count).slice(0, limit);
}
