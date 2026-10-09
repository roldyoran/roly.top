/**
 * Cliente HTTP centralizado para las llamadas `fetch` del frontend.
 *
 * PROBLEMA QUE RESUELVE: cada panel (`LinksPanel`, `AdminPanel`,
 * `UrlShortenerCard`, `AnalyticsCard`) hacía `fetch` a mano con su propio
 * manejo de errores (o ninguno). Este wrapper unifica:
 * - `credentials: "include"` siempre (las cookies de sesión/auth viajan).
 * - Parseo defensivo del JSON (un 500 HTML no debe romper con un
 *   `Unexpected token <` críptico).
 * - Errores tipados `ApiError` con `code`/`status` para que la UI decida
 *   qué mostrar (p. ej. toast distinto para 429 vs 500).
 *
 * Las respuestas de la API siguen el formato `{ success, data, ... }`;
 * `apiFetch` devuelve el cuerpo completo tipado y cada llamada elige qué
 * campo usar (`data`, `pagination`, ...).
 */

/** Cuerpo de error estándar que devuelven las rutas `toErrorResponse`. */
export interface ApiErrorBody {
	success: false;
	error: {
		code: string;
		message: string;
		statusCode: number;
	};
}

/** Error lanzado cuando la respuesta HTTP no es 2xx o no es JSON válido. */
export class ApiError extends Error {
	readonly code: string;
	readonly status: number;

	constructor(message: string, code: string, status: number) {
		super(message);
		this.name = "ApiError";
		this.code = code;
		this.status = status;
	}
}

export interface ApiFetchOptions extends RequestInit {
	/** Query params que se añaden a la URL (`{ rangeDays: 7 }`). */
	query?: Record<string, string | number | boolean>;
}

/**
 * `fetch` tipado contra las APIs internas (`/api/...`).
 *
 * @example
 * const body = await apiFetch<{ success: boolean; data: DashboardSummary }>(
 *   "/api/v1/dashboard/summary",
 *   { query: { rangeDays: 30 } },
 * );
 */
export async function apiFetch<T>(
	path: string,
	options: ApiFetchOptions = {},
): Promise<T> {
	const { query, headers, ...init } = options;

	const url =
		query && Object.keys(query).length > 0
			? `${path}?${new URLSearchParams(
					Object.fromEntries(
						Object.entries(query).map(([k, v]) => [k, String(v)]),
					),
				)}`
			: path;

	let res: Response;
	try {
		res = await fetch(url, {
			credentials: "include",
			...init,
			headers: { "Content-Type": "application/json", ...headers },
		});
	} catch {
		// Sin conexión o el servidor caído: ni siquiera hubo respuesta HTTP.
		throw new ApiError("Sin conexión con el servidor", "NETWORK_ERROR", 0);
	}

	let json: unknown = null;
	try {
		json = await res.json();
	} catch {
		// p. ej. un 500 que devuelve HTML en lugar de JSON.
		throw new ApiError(
			"Respuesta inesperada del servidor",
			"INVALID_RESPONSE",
			res.status,
		);
	}

	if (!res.ok) {
		const body = json as Partial<ApiErrorBody>;
		throw new ApiError(
			body?.error?.message ?? `Error ${res.status}`,
			body?.error?.code ?? "UNKNOWN_ERROR",
			res.status,
		);
	}

	return json as T;
}
