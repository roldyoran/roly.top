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
		// Las rutas /api/auth/* ya tienen su propio CORS con credentials
		if (c.req.path.startsWith("/api/auth/")) {
			await next();
			return;
		}

		// Configuración por defecto
		const defaultOptions = {
			origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
			methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
			allowedHeaders: ["Content-Type", "x-api-key", "Authorization"],
			maxAge: 86400, // 24 horas
		};

		// Fusionar opciones personalizadas con las predeterminadas
		const config = { ...defaultOptions, ...options };

		// Configurar cabeceras CORS
		c.header(
			"Access-Control-Allow-Origin",
			Array.isArray(config.origin) ? config.origin.join(", ") : config.origin,
		);

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
