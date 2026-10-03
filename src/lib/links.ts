/**
 * Helpers de presentación para enlaces (usados por LinksPanel y DashboardIndex).
 *
 * Viven aquí (y no en el frontmatter de un `.astro`) para poder cubrirlos
 * con tests unitarios: son lógica pura sin dependencias del runtime.
 */

/** Extrae el hostname de una URL; si no parsea, devuelve el texto tal cual. */
export function safeHostname(raw: string): string {
	try {
		return new URL(raw).hostname;
	} catch {
		return raw;
	}
}

/**
 * Tiempo relativo compacto ("5m", "3h", "12d", "2mo", "1y").
 * `now` inyectable para tests deterministas.
 */
export function timeAgo(iso: string, now: number = Date.now()): string {
	const then = new Date(iso).getTime();
	if (Number.isNaN(then)) return "";
	const diff = Math.max(0, now - then);
	const minute = 60_000;
	const hour = 60 * minute;
	const day = 24 * hour;
	if (diff < hour) return `${Math.max(1, Math.floor(diff / minute))}m`;
	if (diff < day) return `${Math.floor(diff / hour)}h`;
	const days = Math.floor(diff / day);
	if (days < 30) return `${days}d`;
	const months = Math.floor(days / 30);
	if (months < 12) return `${months}mo`;
	const years = Math.floor(days / 365);
	return `${years}y`;
}

/** Construye la URL corta completa (`{origin}/{shortCode}`). */
export function buildShortUrl(origin: string, shortCode: string): string {
	return `${origin.replace(/\/$/, "")}/${shortCode}`;
}
