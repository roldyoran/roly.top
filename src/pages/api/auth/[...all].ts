import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { createAuth } from "@/lib/auth";
import { getAuthEnv } from "@/server/config/env";

function getAuth() {
	return createAuth(
		env.DB,
		getAuthEnv(env as unknown as Record<string, unknown>),
	);
}

export const GET: APIRoute = async (ctx) => {
	const auth = getAuth();
	return auth.handler(ctx.request);
};

export const POST: APIRoute = async (ctx) => {
	const auth = getAuth();
	return auth.handler(ctx.request);
};
