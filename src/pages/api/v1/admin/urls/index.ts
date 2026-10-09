import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { createDb } from "@/server/db";
import { UrlRepository } from "@/server/infrastructure/persistence/url.repository.impl";
import { toErrorResponse } from "@/server/infrastructure/http/errors";
import { listUrlsQuerySchema } from "@/server/utils/schemas";
import { requireAdmin } from "@/server/utils/guards";

export const GET = (async ({ request, locals }) => {
	const authError = requireAdmin(locals);
	if (authError) return authError;

	try {
		const url = new URL(request.url);
		const query = Object.fromEntries(url.searchParams);
		const { page, limit } = listUrlsQuerySchema.parse(query);

		const repository = new UrlRepository(createDb(env.DB));
		const data = await repository.findAll(page, limit);

		return Response.json({
			success: true,
			data,
			pagination: { page, limit },
		});
	} catch (error) {
		return toErrorResponse(error);
	}
}) satisfies APIRoute;