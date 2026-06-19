import type { MiddlewareHandler } from "hono";
import type { UrlRepositoryPort } from "@/domain/url/url.repository.port";
import type { UserRepositoryPort } from "@/domain/user/user.repository.port";

// Bindings defines the environment variables/bindings available in Cloudflare Workers
export type Bindings = {
	// D1 database binding (nombre definido en wrangler.jsonc -> binding: "DB")
	DB: D1Database;
	CLOUDFLARE_D1_DATABASES_BINDING: string;
	CLOUDFLARE_DATABASE_ID: string;
	SERVICE_ADMIN_API_KEY: string;
	// Workers Assets binding (declarado en wrangler.jsonc -> assets.binding: "ASSETS")
	ASSETS: Fetcher;
	// Better Auth
	BETTER_AUTH_SECRET: string;
	BETTER_AUTH_URL: string;
	GOOGLE_CLIENT_ID: string;
	GOOGLE_CLIENT_SECRET: string;
	TRUSTED_ORIGINS?: string;
};

export type Variables = {
	urlRepo: UrlRepositoryPort;
	userRepo: UserRepositoryPort;
	requestId: string;
};

const ENV_KEYS: (keyof Bindings)[] = [
	"CLOUDFLARE_D1_DATABASES_BINDING",
	"CLOUDFLARE_DATABASE_ID",
	"SERVICE_ADMIN_API_KEY",
	"BETTER_AUTH_SECRET",
	"BETTER_AUTH_URL",
	"GOOGLE_CLIENT_ID",
	"GOOGLE_CLIENT_SECRET",
];

/**
 * Middleware que emite un warning por cada variable de entorno no encontrada
 */
export const checkEnvMiddleware: MiddlewareHandler<{
	Bindings: Bindings;
}> = async (c, next) => {
	for (const key of ENV_KEYS) {
		if (!c.env[key]) {
			console.warn(`[WARNING] Variable de entorno no encontrada: ${key}`);
		}
	}
	await next();
};
