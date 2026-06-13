import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { AppError, ValidationError } from "@/domain/app-error";

/**
 * Mapeo de códigos de error de negocio a status HTTP.
 * La infraestructura decide qué status usar basándose en el code del dominio.
 */
const STATUS_CODE_MAP: Record<string, number> = {
	UNAUTHORIZED: 401,
	NOT_FOUND: 404,
	VALIDATION_ERROR: 400,
	SHORT_CODE_ALREADY_EXISTS: 409,
	URL_NOT_FOUND: 404,
	URL_LIMIT_REACHED: 409,
	INTERNAL_SERVER_ERROR: 500,
};

/**
 * Formato estándar de respuesta de error.
 * Para cambiar la estructura de todos los errores de la API, modifica solo este tipo.
 */
export type ApiErrorResponse = {
	success: false;
	error: {
		code: string;
		message: string;
		statusCode: number;
	};
};

/**
 * Obtiene el status HTTP basado en el código de error de negocio.
 */
function getStatusCode(code: string): number {
	return STATUS_CODE_MAP[code] ?? 500;
}

/**
 * Genera una respuesta HTTP de error estandarizada.
 * Usado tanto por el onError global como por middleware que necesita responder antes de lanzar.
 */
export function errorResponse(c: Context, error: AppError): Response {
	const statusCode = getStatusCode(error.code);
	// Log error for easier debugging in dev (shows in wrangler / console)
	console.warn(
		`[API ERROR] code=${error.code} status=${statusCode} message=${error.message}`,
	);
	return c.json<ApiErrorResponse>(
		{
			success: false,
			error: {
				code: error.code,
				message: error.message,
				statusCode,
			},
		},
		statusCode,
	);
}

/**
 * Manejador global de errores para Hono (app.onError).
 * Todos los errores no capturados en rutas o middleware llegan aquí.
 * - AppError → se formatea con errorResponse (código de dominio → status HTTP).
 * - HTTPException → se reformatea al estándar de la API (ej: "Malformed JSON in request body"
 *   lanzado por el body parser de Hono deja de ser un 500 genérico y pasa a ser 400).
 * - Cualquier otro error → se convierte en 500.
 */
// biome-ignore lint/suspicious/noExplicitAny: Hono onError acepta any
export function onError(error: Error, c: Context): Response {
	if (error instanceof AppError) {
		// Log and return a structured API error so the frontend can show the message
		console.warn(
			`[HANDLED APP ERROR] code=${error.code} message=${error.message}`,
		);
		return errorResponse(c, error);
	}

	if (error instanceof HTTPException) {
		const status = error.status;
		const code =
			status === 400
				? "VALIDATION_ERROR"
				: status === 401
					? "UNAUTHORIZED"
					: status === 404
						? "NOT_FOUND"
						: "INTERNAL_SERVER_ERROR";
		return c.json<ApiErrorResponse>(
			{
				success: false,
				error: {
					code,
					message: error.message,
					statusCode: status,
				},
			},
			status as ContentfulStatusCode,
		);
	}

	console.error("[UNHANDLED ERROR]", error);

	return c.json<ApiErrorResponse>(
		{
			success: false,
			error: {
				code: "INTERNAL_SERVER_ERROR",
				message: "Error interno del servidor",
				statusCode: 500,
			},
		},
		500,
	);
}

/**
 * Hook de validación para zValidator.
 * Uso: zValidator("json", schema, validationHook)
 * Estandariza los errores de validación de Zod con el mismo formato que el resto de la API.
 */
// biome-ignore lint/suspicious/noExplicitAny: zValidator hook acepta tipos genéricos
export function validationHook(result: any, c: Context): Response | void {
	if (!result.success) {
		const messages = result.error.issues
			// biome-ignore lint/suspicious/noExplicitAny: Zod issue type
			.map((i: any) => i.message)
			.join("; ");
		return errorResponse(c, new ValidationError(messages));
	}
}

/**
 * Variante de validationHook usada por el router de redirección (/:shortCode).
 * En lugar de devolver 400 JSON cuando el shortCode no cumple el formato
 * (por ejemplo: contiene guiones, mayúsculas, o más de 9 caracteres),
 * redirige al index (/) para que el SPA cargue.
 *
 * Esto preserva el contrato "toda ruta no-API devuelve HTML" sin necesidad
 * de un catch-all en Hono.
 */
// biome-ignore lint/suspicious/noExplicitAny: zValidator hook acepta tipos genéricos
export function redirectValidationHook(
	result: any,
	c: Context,
): Response | void {
	if (!result.success) {
		return c.redirect("/", 302);
	}
}
