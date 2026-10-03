import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createDb } from "../server/db";
import { getAuthEnv, type AuthEnv } from "../server/config/env";

export function createAuth(d1: D1Database, authEnv?: AuthEnv) {
	const db = createDb(d1);
	const resolved = authEnv ?? getAuthEnv();

	const auth = betterAuth({
		...(resolved.betterAuthSecret
			? { secret: resolved.betterAuthSecret }
			: {}),
		...(resolved.betterAuthUrl ? { baseURL: resolved.betterAuthUrl } : {}),
		database: drizzleAdapter(db, {
			provider: "sqlite",
		}),
		socialProviders: {
			google: {
				clientId: resolved.googleClientId,
				clientSecret: resolved.googleClientSecret,
				prompt: "select_account",
			},
		},
		session: {
			expiresIn: 60 * 60 * 24 * 7,
			updateAge: 60 * 60 * 24,
			cookieCache: {
				enabled: true,
				maxAge: 5 * 60,
			},
		},
		advanced: {
			useSecureCookies: resolved.useSecureCookies,
		},
	});

	return auth;
}

export type Auth = ReturnType<typeof createAuth>;
