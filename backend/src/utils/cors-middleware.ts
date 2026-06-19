/**
 * Middleware para configurar CORS
 * Permite solicitudes desde cualquier origen
 */
import { Context, Next } from "hono";

/**
 * Middleware para configurar CORS de forma segura y personalizable
 *
 * @param options Opciones de configuración para CORS
 * @returns Middleware de CORS configurado
 */
export const corsMiddleware = (options?: {
	origin?: string | string[];
	methods?: string[];
	allowedHeaders?: string[];
	maxAge?: number;
}) => {
	return async (c: Context, next: Next): Promise<Response | void> => {
		const defaultOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];

		const envOrigins = c.env?.TRUSTED_ORIGINS
			? c.env.TRUSTED_ORIGINS.split(",").map((o: string) => o.trim()).filter(Boolean)
			: [];

		const allOrigins = [...new Set([...envOrigins, ...defaultOrigins])];

		const config = {
			origin: options?.origin ?? allOrigins,
			methods: options?.methods ?? ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
			allowedHeaders: options?.allowedHeaders ?? ["Content-Type", "x-api-key", "Authorization"],
			maxAge: options?.maxAge ?? 86400,
		};

		// Echo individual del origin (no unir con coma)
		const requestOrigin = c.req.header("Origin");
		const allowedOrigins = Array.isArray(config.origin)
			? config.origin
			: [config.origin];

		if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
			c.header("Access-Control-Allow-Origin", requestOrigin);
			c.header("Vary", "Origin");
		} else if (!Array.isArray(config.origin)) {
			c.header("Access-Control-Allow-Origin", config.origin);
		}

		c.header("Access-Control-Allow-Methods", config.methods.join(", "));
		c.header("Access-Control-Allow-Headers", config.allowedHeaders.join(", "));
		c.header("Access-Control-Max-Age", config.maxAge.toString());

		// Para credenciales (si no es wildcard '*')
		if (config.origin !== "*") {
			c.header("Access-Control-Allow-Credentials", "true");
		}

		// Manejar solicitud OPTIONS (preflight)
		if (c.req.method === "OPTIONS") {
			c.status(204); // No Content
			return c.body(null);
		}

		await next();
	};
};
