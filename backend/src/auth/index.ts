import { betterAuth } from "better-auth";
import { withCloudflare } from "better-auth-cloudflare";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { drizzle } from "drizzle-orm/d1";
import { admin } from "better-auth/plugins";
import * as appSchema from "@/db/schema";
import * as authSchema from "@/db/auth-schema";

type CloudflareBindings = {
	DB: D1Database;
	BETTER_AUTH_SECRET: string;
	BETTER_AUTH_URL: string;
	GOOGLE_CLIENT_ID: string;
	GOOGLE_CLIENT_SECRET: string;
};

export function createAuth(env?: CloudflareBindings) {
	if (!env) {
		return betterAuth({
			database: drizzleAdapter({} as D1Database, {
				provider: "sqlite",
				usePlural: true,
				schema: { ...appSchema, ...authSchema },
			}),
			socialProviders: {
				google: {
					clientId: "placeholder",
					clientSecret: "placeholder",
				},
			},
		});
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
		trustedOrigins: ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:8787"],
		account: {
			skipStateCookieCheck: true,
		},
		plugins: [
			admin(),
		],
		advanced: {
			defaultCookieAttributes: {
				sameSite: "lax",
				secure: false,
				httpOnly: true,
				path: "/",
			},
		},
	});
}

export type Auth = ReturnType<typeof createAuth>;
