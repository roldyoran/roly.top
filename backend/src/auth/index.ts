import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { withCloudflare } from "better-auth-cloudflare";
import { drizzle } from "drizzle-orm/d1";
import * as authSchema from "@/db/auth-schema";
import * as appSchema from "@/db/schema";

type CloudflareBindings = {
	DB: D1Database;
	BETTER_AUTH_SECRET: string;
	BETTER_AUTH_URL: string;
	GOOGLE_CLIENT_ID: string;
	GOOGLE_CLIENT_SECRET: string;
	DEV_MODE: string;
	TRUSTED_ORIGINS?: string;
};

export function createAuth(env?: CloudflareBindings) {
	if (!env) {
		throw new Error(
			"Auth requires environment bindings. Cannot create placeholder auth instance.",
		);
	}

	const db = drizzle(env.DB, { schema: { ...appSchema, ...authSchema } });

	return betterAuth({
		...withCloudflare(
			{
				autoDetectIpAddress: true,
				geolocationTracking: true,
				cf: {},
				d1: {
					db,
					options: {
						usePlural: true,
					},
				},
			},
			{
				socialProviders: {
					google: {
						clientId: env.GOOGLE_CLIENT_ID,
						clientSecret: env.GOOGLE_CLIENT_SECRET,
					},
				},
			},
		),
		baseURL: env.BETTER_AUTH_URL,
		trustedOrigins: env.TRUSTED_ORIGINS
			? env.TRUSTED_ORIGINS.split(",").map((o) => o.trim())
			: [
					"http://localhost:5173",
					"http://127.0.0.1:5173",
					"http://localhost:8787",
				],
		account: {
			skipStateCookieCheck: true,
		},
		plugins: [admin()],
		onAPIError: {
			errorURL: env.DEV_MODE
				? "http://localhost:5173/auth/error"
				: "/auth/error",
		},
		advanced: {
			defaultCookieAttributes: {
				sameSite: "lax",
				secure: !env.DEV_MODE,
				httpOnly: true,
				path: "/",
			},
		},
	});
}

export type Auth = ReturnType<typeof createAuth>;
