/**
 * URL base pública del sitio (`PUBLIC_SITE_URL` del `.env`).
 *
 * Única fuente de verdad para la base en contextos sin request: SEO
 * (canonical/OG del Layout), páginas prerenderizadas y valor por defecto
 * del generador QR. En el dashboard SSR se prefiere `Astro.url.origin`
 * (sigue al dominio real de cada despliegue); esto es el fallback global.
 *
 * Viven aquí (y no en el frontmatter de un `.astro`) para poder cubrirlos
 * con tests unitarios: son lógica pura sin dependencias del runtime.
 */

export const DEFAULT_SITE_URL = "https://roly.top";

/** URL base limpia (sin `/` final). Si el `.env` no la trae o es inválida, usa el default. */
export function getSiteUrl(raw?: string): string {
	const value = (raw ?? import.meta.env.PUBLIC_SITE_URL ?? "").trim().replace(/\/+$/, "");
	if (!/^https?:\/\/.+/.test(value)) return DEFAULT_SITE_URL;
	return value;
}

/** Host sin protocolo (`roly.top`), para mostrar junto al código corto. */
export function siteHost(url?: string): string {
	return getSiteUrl(url).replace(/^https?:\/\//, "");
}
