import { z } from "zod";

/** Longitud máxima de una URL original (límite práctico de navegadores/servidores). */
const MAX_URL_LENGTH = 2048;

/**
 * Sufijos de dominio reservados que nunca deberían acortarse: solo existen
 * dentro de redes o máquinas locales (RFC 6761, RFC 6762, RFC 7720).
 */
const BLOCKED_TLDS = new Set(["localhost", "local", "internal", "invalid", "test"]);

/**
 * Detecta hostnames que apuntan a la propia infraestructura: localhost,
 * IPs privadas/de loopback o dominios internos.
 *
 * NOTA: `z.httpUrl()` ya rechaza de por sí los literales IP (127.0.0.1,
 * 10.x, etc. fallan con "Invalid hostname"), así que este refine es una
 * segunda capa de defensa para los casos que sí pasan esa validación:
 * nombres como `localhost`, `algo.local` o `127.0.0.1.nip.io`. Aceptar este
 * tipo de URLs permitiría ataques SSRF (usar el worker para sondear
 * servicios internos) o enlaces que solo funcionan en la máquina de quien
 * los creó.
 */
function isBlockedHostname(hostname: string): boolean {
	const host = hostname.toLowerCase().replace(/\.$/, "");

	if (host === "localhost" || host.endsWith(".localhost")) return true;
	if (host === "::1" || host === "[::1]" || host === "0.0.0.0" || host === "[::]") {
		return true;
	}

	// IPv4: bloquear loopback (127.x), privadas (10.x, 172.16-31.x,
	// 192.168.x), link-local (169.254.x) y rangos de documentación/test.
	const v4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
	if (v4) {
		const [, a, b] = v4.map(Number);
		if (a === 10 || a === 127 || (a === 172 && b >= 16 && b <= 31)) {
			return true;
		}
		if (a === 192 && b === 168) return true;
		if (a === 169 && b === 254) return true;
		if (a === 0) return true;
		return false;
	}

	// Dominios internos por TLD reservado (p. ej. `intranet.local`).
	const labels = host.replace(/^\[|\]$/g, "").split(".");
	if (labels.length > 1 && BLOCKED_TLDS.has(labels[labels.length - 1]!)) {
		return true;
	}

	return false;
}

export const originalUrlSchema = z
	.httpUrl()
	.refine((url) => url.length <= MAX_URL_LENGTH, {
		message: "La URL no puede superar los 2048 caracteres",
	})
	.refine(
		(url) => {
			try {
				return !isBlockedHostname(new URL(url).hostname);
			} catch {
				// Si ni siquiera parsea como URL, `z.httpUrl()` ya la rechazó;
				// este refine no debe duplicar ese error.
				return true;
			}
		},
		{ message: "No se permiten URLs locales o internas" },
	);

export const customAliasSchema = z
	.string()
	.optional()
	.refine((val) => !val || /^[a-z0-9]{1,9}$/.test(val), {
		message:
			"El alias solo puede contener letras minúsculas y números (1-9 caracteres)",
	});

export const shortCodeSchema = z
	.string()
	.regex(/^[a-z0-9]{1,9}$/, "Short code inválido");

export const createUrlBodySchema = z.object({
	originalUrl: originalUrlSchema,
	customAlias: customAliasSchema,
});

export const updateUrlBodySchema = z.object({
	originalUrl: originalUrlSchema.optional(),
	title: z.string().max(200).nullable().optional(),
	isActive: z.boolean().optional(),
	// Opt-in al catálogo público (default privado, solo el dueño lo cambia).
	isPublic: z.boolean().optional(),
});

export const listUrlsQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Catálogo público: límite más bajo (lectura anónima, anti-scrape).
export const publicLinksQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(20).default(12),
});

export type CreateUrlBody = z.infer<typeof createUrlBodySchema>;
export type UpdateUrlBody = z.infer<typeof updateUrlBodySchema>;
export type ListUrlsQuery = z.infer<typeof listUrlsQuerySchema>;
