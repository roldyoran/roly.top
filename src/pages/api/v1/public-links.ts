import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { GetPublicLinksUseCase } from "@/server/application/url/get-public-links.usecase";
import { createDb } from "@/server/db";
import { UrlRepository } from "@/server/infrastructure/persistence/url.repository.impl";
import { toErrorResponse } from "@/server/infrastructure/http/errors";
import { publicLinksQuerySchema } from "@/server/utils/schemas";
import { getClientIp } from "@/server/utils/client-ip";
import {
	checkRateLimit,
	rateLimitExceededResponse,
} from "@/server/utils/rate-limit";

// Lectura anónima: límite generoso pero con freno anti-scrape (60/min/IP).
// El payload no incluye owners (ver `PublicLink`).
const PUBLIC_LINKS_RATE_LIMIT = 60;
const PUBLIC_LINKS_RATE_WINDOW_MS = 60_000;

export const GET = (async ({ request }) => {
	const verdict = checkRateLimit(
		`public-links:${getClientIp(request)}`,
		PUBLIC_LINKS_RATE_LIMIT,
		PUBLIC_LINKS_RATE_WINDOW_MS,
	);
	if (!verdict.allowed) {
		return rateLimitExceededResponse(verdict.retryAfterMs);
	}

	try {
		const url = new URL(request.url);
		const query = Object.fromEntries(url.searchParams);
		const { page, limit } = publicLinksQuerySchema.parse(query);

		const repository = new UrlRepository(createDb(env.DB));
		const result = await new GetPublicLinksUseCase(repository).execute(
			page,
			limit,
		);

		return Response.json(
			{
				success: true,
				data: result.data,
				pagination: result.pagination,
			},
			{
				// Catálogo público sin PII: caché de borde corta para que el
				// index (carga diferida en cliente) repita visitas al instante
				// y el D1 no reciba un read por cada lector.
				headers: {
					"Cache-Control":
						"public, max-age=60, stale-while-revalidate=300",
				},
			},
		);
	} catch (error) {
		return toErrorResponse(error);
	}
}) satisfies APIRoute;
