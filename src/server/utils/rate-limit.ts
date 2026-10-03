/**
 * Rate limiting en memoria (ventana fija por clave).
 *
 * POR QUÉ EXISTE: sin límite, cualquiera puede crear miles de URLs y llenar
 * D1 o usar el servicio para spam. Este freno barato protege sobre todo el
 * `POST /api/v1/urls`, que escribe en base de datos.
 *
 * LIMITACIÓN CONOCIDA (Cloudflare Workers): cada isolate del worker tiene su
 * propio `Map`, así que el conteo es aproximado bajo mucho tráfico
 * distribuido. Es suficiente contra abuso casual y contra bugs de clientes
 * que reintentan en bucle. Si algún día necesitas un límite global exacto,
 * migra este módulo a KV o a Durable Objects manteniendo la misma firma.
 */

interface Bucket {
	/** Requests consumidos dentro de la ventana actual. */
	count: number;
	/** Timestamp (ms) en que la ventana actual expira y el conteo se reinicia. */
	resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitVerdict {
	allowed: boolean;
	/** Milisegundos hasta que la ventana se reinicia (0 si `allowed`). */
	retryAfterMs: number;
}

/**
 * Registra un intento para `key` y dice si pasa o no.
 *
 * @param key Identificador del sujeto limitado, p. ej. `create-url:1.2.3.4`.
 * @param limit Máximo de intentos por ventana.
 * @param windowMs Duración de la ventana en milisegundos.
 * @param now Permite inyectar el reloj en tests (por defecto `Date.now()`).
 */
export function checkRateLimit(
	key: string,
	limit: number,
	windowMs: number,
	now: number = Date.now(),
): RateLimitVerdict {
	const bucket = buckets.get(key);

	if (!bucket || now >= bucket.resetAt) {
		buckets.set(key, { count: 1, resetAt: now + windowMs });
		return { allowed: true, retryAfterMs: 0 };
	}

	if (bucket.count < limit) {
		bucket.count += 1;
		return { allowed: true, retryAfterMs: 0 };
	}

	return { allowed: false, retryAfterMs: Math.max(0, bucket.resetAt - now) };
}

/**
 * Respuesta 429 estándar cuando se supera el límite. Incluye el header
 * `Retry-After` (en segundos) para que los clientes sepan cuándo reintentar.
 */
export function rateLimitExceededResponse(retryAfterMs: number): Response {
	return Response.json(
		{
			success: false,
			error: {
				code: "RATE_LIMITED",
				message: "Demasiadas peticiones, inténtalo de nuevo en unos segundos",
				statusCode: 429,
			},
		},
		{
			status: 429,
			headers: {
				"Retry-After": String(Math.ceil(retryAfterMs / 1000)),
			},
		},
	);
}

/** Solo para tests: vacía todos los contadores. */
export function clearRateLimits(): void {
	buckets.clear();
}
