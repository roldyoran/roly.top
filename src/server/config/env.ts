import { z } from "zod";

/**
 * Variables de entorno necesarias para auth/admin.
 *
 * En Cloudflare Workers `process.env` no existe: los valores llegan en el
 * binding `env` (`cloudflare:workers`). Este helper lee primero del objeto
 * `source` (el `env` del worker) y usa `process.env` solo como fallback
 * para dev local con Node y tests Vitest.
 */

const rawAuthEnvSchema = z.object({
	GOOGLE_CLIENT_ID: z.string().min(1).optional(),
	GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
	BETTER_AUTH_SECRET: z.string().min(1).optional(),
	BETTER_AUTH_URL: z.string().min(1).optional(),
	ADMIN_EMAILS: z.string().optional(),
	NODE_ENV: z.string().optional(),
});

export interface AuthEnv {
	googleClientId: string;
	googleClientSecret: string;
	betterAuthSecret: string | undefined;
	betterAuthUrl: string | undefined;
	adminEmailsRaw: string;
	useSecureCookies: boolean;
}

function readKey(
	source: Record<string, unknown> | undefined,
	key: string,
): unknown {
	if (source) {
		try {
			const value = source[key];
			if (value !== undefined && value !== null) return value;
		} catch {
			// `env` puede ser un proxy restringido; ignorar y probar fallback.
		}
	}
	try {
		const fallback = (globalThis as { process?: { env?: unknown } }).process
			?.env as Record<string, unknown> | undefined;
		return fallback?.[key];
	} catch {
		return undefined;
	}
}

export function getAuthEnv(
	source?: Record<string, unknown>,
): AuthEnv {
	const raw = rawAuthEnvSchema.parse({
		GOOGLE_CLIENT_ID: readKey(source, "GOOGLE_CLIENT_ID"),
		GOOGLE_CLIENT_SECRET: readKey(source, "GOOGLE_CLIENT_SECRET"),
		BETTER_AUTH_SECRET: readKey(source, "BETTER_AUTH_SECRET"),
		BETTER_AUTH_URL: readKey(source, "BETTER_AUTH_URL"),
		ADMIN_EMAILS: readKey(source, "ADMIN_EMAILS"),
		NODE_ENV: readKey(source, "NODE_ENV"),
	});

	const betterAuthUrl = raw.BETTER_AUTH_URL;
	const useSecureCookies =
		betterAuthUrl?.startsWith("https://") === true ||
		raw.NODE_ENV === "production";

	return {
		googleClientId: raw.GOOGLE_CLIENT_ID ?? "",
		googleClientSecret: raw.GOOGLE_CLIENT_SECRET ?? "",
		betterAuthSecret: raw.BETTER_AUTH_SECRET,
		betterAuthUrl,
		adminEmailsRaw: raw.ADMIN_EMAILS ?? "",
		useSecureCookies,
	};
}
