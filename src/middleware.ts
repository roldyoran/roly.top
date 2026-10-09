import { defineMiddleware } from "astro:middleware";
import { env } from "cloudflare:workers";
import { createAuth } from "@/lib/auth";
import { getAuthEnv } from "@/server/config/env";
import { createDb } from "@/server/db";
import { ClaimAnonymousUrlsUseCase } from "@/server/application/url/claim-anonymous-urls.usecase";
import { UrlRepository } from "@/server/infrastructure/persistence/url.repository.impl";
import {
	clearAnonymousCookie,
	getAnonymousId,
} from "@/server/utils/anonymous";
import { isAdmin } from "@/server/config/admin";

const STATIC_PREFIXES = ["/_astro/", "/_image", "/fonts/", "/favicon.ico"];

export const onRequest = defineMiddleware(async (context, next) => {
	const pathname = context.url.pathname;

	if (pathname.startsWith("/api/auth")) {
		return next();
	}

	// Los assets estáticos no necesitan sesión ni claim de URLs.
	if (STATIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
		return next();
	}

	const workerEnv = env as unknown as Record<string, unknown>;
	const authEnv = getAuthEnv(workerEnv);

	try {
		const auth = createAuth(env.DB, authEnv);
		const session = await auth.api.getSession({
			headers: context.request.headers,
		});

		context.locals.user = session?.user ?? null;
		context.locals.session = session?.session ?? null;
	} catch {
		context.locals.user = null;
		context.locals.session = null;
	}

	context.locals.isAdmin = isAdmin(
		context.locals.user,
		authEnv.adminEmailsRaw,
	);

	let claimed = false;
	if (context.locals.session?.userId) {
		const cookieHeader = context.request.headers.get("cookie");
		const anonymousId = getAnonymousId(cookieHeader);
		if (anonymousId) {
			try {
				const useCase = new ClaimAnonymousUrlsUseCase(
					new UrlRepository(createDb(env.DB)),
				);
				await useCase.execute({
					userId: context.locals.session.userId,
					anonymousId,
				});
				claimed = true;
			} catch (error) {
				console.error("[middleware] claimAnonymousUrls failed", error);
			}
		}
	}

	const response = await next();
	// Reclamar una sola vez: limpiar la cookie para no escribir en D1
	// en cada request posterior del mismo usuario.
	if (claimed) {
		clearAnonymousCookie(response.headers);
	}
	return response;
});
